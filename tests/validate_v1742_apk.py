#!/usr/bin/env python3
"""Validate the complete, content-preserving Aetherion v1.74.2 replacement APK."""

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
from tools.build_v1742_payload import (
    BUILD,
    NEW_GAME_FILES,
    REMOVED_DIRECTORIES,
    REMOVED_PERSON_FILES,
    RETIRED_TECHNICAL,
    VERSION,
    patch_manifest,
)


EXPECTED_CERT = "5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77"
MUTABLE = {"AndroidManifest.xml", "assets/game/index.html", "assets/game/asset-manifest.js"}


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
        base_infos = {info.filename: info for info in base.infolist() if not info.filename.upper().startswith("META-INF/")}
        infos = archive.infolist()
        current = {info.filename: info for info in infos}
        assert len(current) == len(infos), "duplicate live APK entries"
        assert archive.testzip() is None, "APK CRC failure"

        removed = {
            name for name in base_infos
            if any(name.startswith(f"assets/game/{prefix}") for prefix in REMOVED_DIRECTORIES)
        }
        removed.update(f"assets/game/{name}" for name in REMOVED_PERSON_FILES)
        retired = {f"assets/game/{name}" for name in RETIRED_TECHNICAL}
        assert len(removed) == 163, f"portrait-removal scope drifted: {len(removed)}"
        assert len(retired) == 3

        unexpected_removed: list[str] = []
        unexpected_changed: list[str] = []
        for name, old in base_infos.items():
            if name in removed or name in retired:
                assert name not in current, f"excluded file remained: {name}"
                continue
            if name in MUTABLE:
                continue
            if name not in current:
                unexpected_removed.append(name)
                continue
            now = current[name]
            if (old.file_size, old.CRC) != (now.file_size, now.CRC):
                unexpected_changed.append(name)
        assert not unexpected_removed, f"game content was removed: {unexpected_removed[:12]}"
        assert not unexpected_changed, f"game content changed unexpectedly: {unexpected_changed[:12]}"

        expected_new = {f"assets/game/{name}" for name in NEW_GAME_FILES}
        actual_new = set(current) - set(base_infos) - {name for name in current if name.upper().startswith("META-INF/")}
        assert actual_new == expected_new, f"unexpected new APK files: {sorted(actual_new ^ expected_new)}"

        base_manifest = base.read("AndroidManifest.xml")
        manifest = archive.read("AndroidManifest.xml")
        assert manifest == patch_manifest(base_manifest), "binary manifest changed beyond version name/code"
        assert VERSION.encode("utf-16le") in manifest
        assert "com.dominus.aetherionreforgey".encode("utf-16le") in manifest

        index = archive.read("assets/game/index.html").decode("utf-8")
        assert 'patches/v1.74.2-safe-updater.js?v=1.74.2' in index
        assert 'patches/v1.74.2-update-center.js?v=1.74.2' in index
        assert 'systems-v81-dominus-blood-dial.js?v=1.74.2' in index
        assert 'systems-v81-fullbody-integrity.js?v=1.74.2' in index
        assert 'patches/v1.74.0-safe-updater.js?v=1.74.0' not in index
        assert 'patches/v1.74.0-update-center.js?v=1.74.0' not in index
        assert index.rfind("systems-v81-fullbody-integrity.js") > index.rfind("v1.74.0-stable-bundle.js")
        refs = local_references(index)
        missing_refs = []
        for ref in refs:
            plain = re.split(r"[?#]", ref, maxsplit=1)[0]
            target = str(PurePosixPath("assets/game") / plain)
            if target not in current:
                missing_refs.append((ref, target))
        assert not missing_refs, missing_refs

        asset_source = archive.read("assets/game/asset-manifest.js").decode("utf-8")
        assets = json.loads(asset_source.split("=", 1)[1].strip().removesuffix(";"))
        assert all(path in assets for path in NEW_GAME_FILES)
        assert not any(path.startswith(REMOVED_DIRECTORIES) for path in assets)
        assert not set(REMOVED_PERSON_FILES).intersection(assets)
        assert not set(RETIRED_TECHNICAL).intersection(assets)

        marker = json.loads(archive.read("assets/game/assets/v1742/native-build-197.json"))
        assert marker["version"] == VERSION and marker["build"] == BUILD
        assert marker["package"] == "com.dominus.aetherionreforgey"
        assert marker["saveFormatChanged"] is False and marker["gameplayContentRemoved"] is False
        assert marker["obsoletePortraitAssetsRemoved"] == 163 and marker["voiceSystem"] == "preserved"

        integrity = archive.read("assets/game/systems-v81-fullbody-integrity.js").decode("utf-8")
        assert "replace-known-head-and-placeholder-art;preserve-existing-full-body-art" in integrity
        assert "v1742FullBodyIntegrity" in integrity and "gameContentRemoved" in integrity
        dial = archive.read("assets/game/systems-v81-dominus-blood-dial.js").decode("utf-8")
        assert "dominusBloodDial" in dial and "WAIT UNTIL DAWN" in dial and "SLEEP UNTIL DAWN" in dial
        with archive.open("assets/game/custom/ui/dominus-time/dominus-blood-dial-base.webp") as source, Image.open(source) as image:
            assert image.size == (512, 512)
            image.verify()

        updater = archive.read("assets/game/patches/v1.74.2-safe-updater.js").decode("utf-8")
        center = archive.read("assets/game/patches/v1.74.2-update-center.js").decode("utf-8")
        assert VERSION in updater and "androidBuild:197" in updater
        assert "deletePaths" in updater and "aetherion_safe_update_state_v1" in updater
        assert "aetherion_exiled_v03_autosave" not in updater
        assert "A full APK install can replace code and physically remove obsolete packaged files" in center
        assert "CLEAN DOWNLOADED WEB UPDATES" in center and "Do not uninstall" in center

        fullbody_names = sorted(
            name for name in current
            if re.fullmatch(r"assets/game/custom/npc-portraits/v1731?/[^/]+\.webp", name)
        )
        assert len(fullbody_names) == 280
        for name in fullbody_names:
            with archive.open(name) as source, Image.open(source) as image:
                assert image.size == (512, 768), f"wrong full-body dimensions: {name} {image.size}"
                image.verify()

        scene_names = sorted(
            name for name in current
            if name.startswith("assets/game/custom/camp-scenes/v1732/") and name.endswith((".mp4", ".webp"))
        )
        assert len(scene_names) == 10, "camp films or posters were removed"

        base_voice = {
            name: (info.file_size, info.CRC)
            for name, info in base_infos.items()
            if name.startswith("assets/neural/") or name in {
                "lib/arm64-v8a/libonnxruntime.so",
                "lib/arm64-v8a/libsherpa-onnx-jni.so",
            }
        }
        assert len(base_voice) > 200, "offline Piper neural voice payload was not found"
        assert all(name in current for name in base_voice), "offline Piper neural voice payload was removed"
        assert all((current[name].file_size, current[name].CRC) == signature for name, signature in base_voice.items()), "offline Piper neural voice payload changed"

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
        f"v1.74.2 APK passed: {len(refs)} startup references, 163 obsolete portrait assets removed, "
        f"all other game/model/film/Piper content byte-identical, matching signer, SHA-256 {digest}"
    )


if __name__ == "__main__":
    main()
