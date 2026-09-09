#!/usr/bin/env python3
"""Validate the install-compatible v1.72.5 modular-equipment APK."""

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
from tools.build_signed_apk import verify_v2


EXPECTED_CERT = "5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77"
EXPECTED_MODEL = "7c6006efb6b2966b78c3d65ae10605f63bb9fe2c1fa674b569d8dc52b1dffee5"
GOOD_LAYER = bytes.fromhex("54341a0012226e3046002401")
BAD_LAYER = bytes.fromhex("54341a0012016e3046002401")


def data_offset(apk: Path, info: zipfile.ZipInfo) -> int:
    with apk.open("rb") as stream:
        stream.seek(info.header_offset + 26)
        name_size, extra_size = struct.unpack("<HH", stream.read(4))
    return info.header_offset + 30 + name_size + extra_size


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("apk", type=Path)
    args = parser.parse_args()
    apk = args.apk
    with zipfile.ZipFile(apk) as archive:
        infos = archive.infolist()
        names = {info.filename for info in infos}
        assert len(names) == len(infos), "duplicate live APK entries"
        assert archive.testzip() is None, "APK CRC failure"

        manifest = archive.read("AndroidManifest.xml")
        assert "1.72.5".encode("utf-16le") in manifest
        assert "1.72.4".encode("utf-16le") not in manifest

        dex = archive.read("classes.dex")
        assert struct.unpack_from("<I", dex, 8)[0] == zlib.adler32(dex[12:]) & 0xFFFFFFFF
        assert dex[12:32] == hashlib.sha1(dex[32:]).digest()
        assert dex.count(GOOD_LAYER) == 1, "startup-safe hardware-layer instruction missing"
        assert BAD_LAYER not in dex, "startup-crashing layer instruction returned"

        index = archive.read("assets/game/index.html").decode("utf-8")
        assert "AETHERION REFORGED v1.72.5" in index
        for name in ("safe-updater", "character-models", "update-center"):
            assert f'patches/v1.72.5-{name}.js?v=1.72.5' in index
            assert f'patches/v1.72.4-{name}.js?v=1.72.4' not in index
        refs = re.findall(r"<(?:script|link)\b[^>]*(?:src|href)=[\"']([^\"']+)", index, re.I)
        local = [ref for ref in refs if not re.match(r"^[a-z]+://|^data:", ref, re.I)]
        missing = []
        for ref in local:
            plain = re.split(r"[?#]", ref, maxsplit=1)[0]
            target = str(PurePosixPath("assets/game") / plain)
            if target not in names:
                missing.append((ref, target))
        assert not missing, missing

        marker = json.loads(archive.read("assets/game/assets/v175/native-build-194.json"))
        assert marker == {"version": "1.72.5", "build": 194, "feature": "modular-equipment", "model": "assets/v109/valkorion_final.glb", "slots": 17}
        model = archive.read("assets/game/assets/v109/valkorion_final.glb")
        assert hashlib.sha256(model).hexdigest() == EXPECTED_MODEL
        controller = archive.read("assets/game/patches/v1.72.5-character-models.js").decode("utf-8")
        assert "assets/v109/valkorion_final.glb" in controller
        assert "mixed armor and court" not in controller.lower()
        assert "baked or partial models are rejected" in controller
        assert "AetherionModularModelsV175" in controller
        updater = archive.read("assets/game/patches/v1.72.5-safe-updater.js").decode("utf-8")
        assert "const BUNDLED_VERSION='1.72.5'" in updater and "const ANDROID_BUILD=194" in updater
        center = archive.read("assets/game/patches/v1.72.5-update-center.js").decode("utf-8")
        assert "Aetherion_Reforged_v1.72.5_MODULAR_EQUIPMENT_UPDATE.apk" in center

        for info in infos:
            if info.filename.startswith("lib/") and info.filename.endswith(".so") and info.compress_type == zipfile.ZIP_STORED:
                assert data_offset(apk, info) % 4096 == 0, f"native library is not page aligned: {info.filename}"

        certs = load_der_pkcs7_certificates(archive.read("META-INF/AETHERIO.RSA"))
        assert len(certs) == 1
        cert_digest = hashlib.sha256(certs[0].public_bytes(serialization.Encoding.DER)).hexdigest()
        assert cert_digest == EXPECTED_CERT, "APK was signed by a different identity"

    verify_v2(apk)
    print(f"v1.72.5 APK: {len(local)} startup references, 17-slot model, startup-safe DEX, aligned native libraries, and update-compatible signature passed")


if __name__ == "__main__":
    main()
