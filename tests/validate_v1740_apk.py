#!/usr/bin/env python3
"""Validate the content-preserving v1.74.0 maintenance APK."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import struct
import sys
import zipfile

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization.pkcs7 import load_der_pkcs7_certificates
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tools.build_signed_apk import verify_manifest, verify_v2


VERSION = "1.74.0"
BUILD = 196
EXPECTED_CERT = "5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77"
MUTABLE = {"AndroidManifest.xml", "assets/game/index.html"}
OLD_MARKERS = {
    "assets/game/assets/v173/native-build-192.json",
    "assets/game/assets/v174/native-build-193.json",
    "assets/game/assets/v175/native-build-194.json",
    "assets/game/assets/v176/native-build-195.json",
}
NEW_FILES = {
    "assets/game/patches/v1.74.0-safe-updater.js",
    "assets/game/patches/v1.74.0-update-center.js",
    "assets/game/patches/v1.74.0-stable-bundle.js",
    "assets/game/assets/v1740/native-build-196.json",
}


def data_offset(apk: Path, info: zipfile.ZipInfo) -> int:
    with apk.open("rb") as stream:
        stream.seek(info.header_offset + 26)
        name_size, extra_size = struct.unpack("<HH", stream.read(4))
    return info.header_offset + 30 + name_size + extra_size


def local_references(index: str) -> list[str]:
    refs = re.findall(r"<(?:script|link)\b[^>]*(?:src|href)=[\"']([^\"']+)", index, re.I)
    return [ref for ref in refs if not re.match(r"^[a-z]+://|^data:", ref, re.I)]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("apk", type=Path)
    parser.add_argument("--base-apk", type=Path, required=True)
    args = parser.parse_args()
    apk, base_apk = args.apk, args.base_apk

    with zipfile.ZipFile(base_apk) as base, zipfile.ZipFile(apk) as archive:
        base_infos = {
            info.filename: info
            for info in base.infolist()
            if not info.filename.upper().startswith("META-INF/")
        }
        infos = archive.infolist()
        current = {info.filename: info for info in infos}
        assert len(current) == len(infos), "duplicate live APK entries"
        assert archive.testzip() is None, "APK CRC failure"

        index = archive.read("assets/game/index.html").decode("utf-8")
        refs = local_references(index)
        referenced_patches = {
            "assets/game/" + re.split(r"[?#]", ref, maxsplit=1)[0]
            for ref in refs
            if ref.startswith("patches/")
        }
        old_patch_files = {
            name for name in base_infos
            if name.startswith("assets/game/patches/") and name.endswith(".js")
        }
        retired = (old_patch_files - referenced_patches) | OLD_MARKERS

        unexpected_removed: list[str] = []
        unexpected_changed: list[str] = []
        for name, old in base_infos.items():
            if name in retired:
                assert name not in current, f"retired technical file remained: {name}"
                continue
            if name in MUTABLE:
                continue
            if name not in current:
                unexpected_removed.append(name)
                continue
            now = current[name]
            if (old.file_size, old.CRC) != (now.file_size, now.CRC):
                unexpected_changed.append(name)
        assert not unexpected_removed, f"game content was removed: {unexpected_removed[:8]}"
        assert not unexpected_changed, f"game content changed unexpectedly: {unexpected_changed[:8]}"
        assert len(retired) == 35, f"cleanup scope drifted: {len(retired)} technical files"

        base_manifest = base.read("AndroidManifest.xml")
        manifest = archive.read("AndroidManifest.xml")
        assert VERSION.encode("utf-16le") in manifest
        assert "1.72.6".encode("utf-16le") not in manifest
        assert "com.dominus.aetherionreforgey".encode("utf-16le") in manifest
        expected_manifest = base_manifest.replace("1.72.6".encode("utf-16le"), VERSION.encode("utf-16le"))
        expected_manifest = expected_manifest.replace((195).to_bytes(4, "little"), BUILD.to_bytes(4, "little"))
        assert manifest == expected_manifest, "binary manifest changed beyond version name/code"

        for required in NEW_FILES:
            assert required in current, f"missing maintenance payload: {required}"
        assert 'patches/v1.74.0-safe-updater.js?v=1.74.0' in index
        assert 'patches/v1.74.0-update-center.js?v=1.74.0' in index
        assert 'patches/v1.74.0-stable-bundle.js?v=1.74.0' in index
        assert "v1.72.6-safe-updater.js" not in index
        assert "v1.72.6-update-center.js" not in index
        assert index.rfind("v1.74.0-stable-bundle.js") > index.rfind("v1.72.6-gameplay-repair.js")

        missing_refs = []
        for ref in refs:
            plain = re.split(r"[?#]", ref, maxsplit=1)[0]
            target = str(PurePosixPath("assets/game") / plain)
            if target not in current:
                missing_refs.append((ref, target))
        assert not missing_refs, missing_refs

        marker = json.loads(archive.read("assets/game/assets/v1740/native-build-196.json"))
        assert marker["version"] == VERSION and marker["build"] == BUILD
        assert marker["package"] == "com.dominus.aetherionreforgey"
        assert marker["maintenance"] == "content-preserving"

        updater = archive.read("assets/game/patches/v1.74.0-safe-updater.js").decode("utf-8")
        assert "aetherion-reforged" in updater and VERSION in updater
        assert "deletePaths" in updater and "aetherion_safe_update_state_v1" in updater
        assert "aetherion_exiled_v03_autosave" not in updater
        world = archive.read("assets/game/patches/v1.74.0-stable-bundle.js").decode("utf-8")
        assert "AetherionV1738PortraitResilience" in world and VERSION in world
        assert "raw.githubusercontent.com" not in world
        assert "top:160px" not in world
        assert ".aethTimeHeader>.aethSkyClock{position:relative!important;order:1;flex:0 0 82px" in world

        portrait_names = sorted(
            name for name in current
            if re.fullmatch(r"assets/game/custom/npc-portraits/v1731?/[^/]+\.webp", name)
        )
        assert len(portrait_names) == 280, f"expected 280 new full-body portraits, found {len(portrait_names)}"
        for name in portrait_names:
            with archive.open(name) as source, Image.open(source) as picture:
                assert picture.size == (512, 768), f"wrong portrait dimensions: {name} {picture.size}"
                picture.verify()

        scene_names = sorted(
            name for name in current
            if name.startswith("assets/game/custom/camp-scenes/v1732/")
            and name.endswith((".mp4", ".webp"))
        )
        assert len(scene_names) == 10, f"expected five camp films and posters, found {len(scene_names)}"

        base_voice = {
            name: (info.file_size, info.CRC)
            for name, info in base_infos.items()
            if name.startswith("assets/neural/") or name in {
                "lib/arm64-v8a/libonnxruntime.so",
                "lib/arm64-v8a/libsherpa-onnx-jni.so",
            }
        }
        assert len(base_voice) > 200, "offline neural voice payload was not found in the base"
        assert all(name in current for name in base_voice), "offline neural voice payload was removed"
        assert all((current[name].file_size, current[name].CRC) == signature for name, signature in base_voice.items()), "offline neural voice payload changed"

        for info in infos:
            if info.filename.startswith("lib/") and info.filename.endswith(".so") and info.compress_type == zipfile.ZIP_STORED:
                assert data_offset(apk, info) % 4096 == 0, f"native library is not page aligned: {info.filename}"

        certs = load_der_pkcs7_certificates(archive.read("META-INF/AETHERIO.RSA"))
        assert len(certs) == 1
        cert_digest = hashlib.sha256(certs[0].public_bytes(serialization.Encoding.DER)).hexdigest()
        assert cert_digest == EXPECTED_CERT, "APK signing identity changed"

    verify_manifest(apk)
    verify_v2(apk)
    digest = hashlib.sha256(apk.read_bytes()).hexdigest()
    print(
        f"v1.74.0 APK passed: {len(refs)} startup references, 280 full-body portraits, "
        f"five camp films, all voice/model/game content preserved, 35 dead technical files retired, "
        f"matching signer, SHA-256 {digest}"
    )


if __name__ == "__main__":
    main()
