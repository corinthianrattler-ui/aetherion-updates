#!/usr/bin/env python3
"""Validate the full-size, update-compatible v1.72.6 gameplay-repair APK."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import struct
import sys
import zipfile
import zlib

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization.pkcs7 import load_der_pkcs7_certificates

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tools.build_signed_apk import verify_manifest, verify_v2


EXPECTED_CERT = "5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77"
EXPECTED_ALEXUS = "6a5dbb1b0de94e327a5e853292989e747fb20931c9cd7dea34992f0181e00988"
EXPECTED_VALKORION = "7c6006efb6b2966b78c3d65ae10605f63bb9fe2c1fa674b569d8dc52b1dffee5"
GOOD_LAYER = bytes.fromhex("54341a0012226e3046002401")
BAD_LAYER = bytes.fromhex("54341a0012016e3046002401")
MUTABLE = {"AndroidManifest.xml", "assets/game/index.html"}


def data_offset(apk: Path, info: zipfile.ZipInfo) -> int:
    with apk.open("rb") as stream:
        stream.seek(info.header_offset + 26)
        name_size, extra_size = struct.unpack("<HH", stream.read(4))
    return info.header_offset + 30 + name_size + extra_size


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("apk", type=Path)
    parser.add_argument("--base-apk", type=Path, required=True)
    args = parser.parse_args()
    apk, base_apk = args.apk, args.base_apk
    assert apk.stat().st_size >= base_apk.stat().st_size, "the full build was unexpectedly shrunk"

    with zipfile.ZipFile(base_apk) as base, zipfile.ZipFile(apk) as archive:
        base_infos = {info.filename: info for info in base.infolist() if not info.filename.upper().startswith("META-INF/")}
        infos = archive.infolist()
        current = {info.filename: info for info in infos}
        assert len(current) == len(infos), "duplicate live APK entries"
        assert archive.testzip() is None, "APK CRC failure"
        missing = sorted(set(base_infos) - set(current))
        assert not missing, f"base files were removed: {missing[:8]}"
        changed = []
        for name, info in base_infos.items():
            if name in MUTABLE:
                continue
            now = current[name]
            if (info.file_size, info.CRC) != (now.file_size, now.CRC):
                changed.append(name)
        assert not changed, f"unrelated base files changed: {changed[:8]}"

        manifest = archive.read("AndroidManifest.xml")
        assert "1.72.6".encode("utf-16le") in manifest
        assert "1.72.5".encode("utf-16le") not in manifest
        assert "com.dominus.aetherionreforgey".encode("utf-16le") in manifest

        dex = archive.read("classes.dex")
        assert struct.unpack_from("<I", dex, 8)[0] == zlib.adler32(dex[12:]) & 0xFFFFFFFF
        assert dex[12:32] == hashlib.sha1(dex[32:]).digest()
        assert dex.count(GOOD_LAYER) == 1, "startup-safe hardware-layer instruction missing"
        assert BAD_LAYER not in dex, "startup-crashing hardware-layer instruction returned"
        assert (len(dex), zlib.crc32(dex)) == (base_infos["classes.dex"].file_size, base_infos["classes.dex"].CRC)

        index = archive.read("assets/game/index.html").decode("utf-8")
        assert "AETHERION REFORGED v1.72.6" in index
        assert 'patches/v1.72.6-safe-updater.js?v=1.72.6' in index
        assert 'patches/v1.72.6-update-center.js?v=1.72.6' in index
        assert 'patches/v1.72.5-character-models.js?v=1.72.5' in index
        assert 'patches/v1.72.6-gameplay-repair.js?v=1.72.6' in index
        assert index.rfind("v1.72.6-gameplay-repair.js") > index.rfind("v1.72.4-performance.js")
        refs = re.findall(r"<(?:script|link)\b[^>]*(?:src|href)=[\"']([^\"']+)", index, re.I)
        local = [ref for ref in refs if not re.match(r"^[a-z]+://|^data:", ref, re.I)]
        absent = []
        for ref in local:
            plain = re.split(r"[?#]", ref, maxsplit=1)[0]
            target = str(PurePosixPath("assets/game") / plain)
            if target not in current:
                absent.append((ref, target))
        assert not absent, absent

        marker = json.loads(archive.read("assets/game/assets/v176/native-build-195.json"))
        assert marker["version"] == "1.72.6" and marker["build"] == 195
        assert marker["alexus_mesh_nodes"] == 28 and marker["alexus_fitted_slots"] == 12
        assert marker["alexus_card_only_slots"] == 5 and marker["portrait_phone_layout"] is True
        assert marker["personal_purchase_destination"] == "Carried Inventory"

        alexus_model = archive.read("assets/game/assets/v172/alexus-gothic-gown.glb")
        valkorion_model = archive.read("assets/game/assets/v109/valkorion_final.glb")
        assert hashlib.sha256(alexus_model).hexdigest() == EXPECTED_ALEXUS
        assert hashlib.sha256(valkorion_model).hexdigest() == EXPECTED_VALKORION
        repair = archive.read("assets/game/patches/v1.72.6-gameplay-repair.js").decode("utf-8")
        for required in ("ALEXUS_FITTED", "ALEXUS_CARD_ONLY", "quartermasterDestination", "Carried Inventory", "@media (orientation:portrait)"):
            assert required in repair
        assert repair.count("BODY_tripo_part_") + repair.count("GOWN_tripo_part_") >= 28
        updater = archive.read("assets/game/patches/v1.72.6-safe-updater.js").decode("utf-8")
        center = archive.read("assets/game/patches/v1.72.6-update-center.js").decode("utf-8")
        assert "const BUNDLED_VERSION='1.72.6'" in updater and "const ANDROID_BUILD=195" in updater
        assert "Aetherion_Reforged_v1.72.6_GAMEPLAY_REPAIR_FULL.apk" in center
        assert "assets/v176/native-build-195.json" in center

        for info in infos:
            if info.filename.startswith("lib/") and info.filename.endswith(".so") and info.compress_type == zipfile.ZIP_STORED:
                assert data_offset(apk, info) % 4096 == 0, f"native library is not page aligned: {info.filename}"

        certs = load_der_pkcs7_certificates(archive.read("META-INF/AETHERIO.RSA"))
        assert len(certs) == 1
        cert_digest = hashlib.sha256(certs[0].public_bytes(serialization.Encoding.DER)).hexdigest()
        assert cert_digest == EXPECTED_CERT, "APK was signed by a different identity"

    verify_manifest(apk)
    verify_v2(apk)
    print(
        f"v1.72.6 APK: {len(local)} startup references, all base assets retained, "
        "Alexus 28-node/12-slot model, portrait layout, trade routing, startup-safe DEX, "
        "aligned native libraries, and update-compatible signature passed"
    )


if __name__ == "__main__":
    main()
