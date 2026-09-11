#!/usr/bin/env python3
"""Validate the signed, content-preserving Aetherion v1.74.3 replacement APK."""

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

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tools.build_signed_apk import verify_manifest, verify_v2
from tools.build_v1743_payload import (
    BUILD,
    EXCLUDED_FILES,
    NEW_GAME_FILES,
    PACKAGE,
    REPAIRED_BASE_GAME_FILES,
    VERSION,
    patch_manifest,
)


EXPECTED_CERT = "5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77"
GAME_MUTABLE = {
    "assets/game/index.html",
    "assets/game/asset-manifest.js",
    *(f"assets/game/{name}" for name in REPAIRED_BASE_GAME_FILES),
}
MEDIA_SUFFIXES = {".mp3", ".mp4", ".wav", ".ogg", ".m4a", ".webm"}


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
    parser.add_argument("--expected-sha256")
    args = parser.parse_args()
    apk, base_apk = args.apk, args.base_apk

    with zipfile.ZipFile(base_apk) as base, zipfile.ZipFile(apk) as archive:
        base_infos = {info.filename: info for info in base.infolist() if not info.filename.upper().startswith("META-INF/")}
        infos = archive.infolist()
        current = {info.filename: info for info in infos}
        current_unsigned = {name: info for name, info in current.items() if not name.upper().startswith("META-INF/")}
        assert len(current) == len(infos), "duplicate live APK entries"
        assert archive.testzip() is None, "APK CRC failure"

        excluded = {f"assets/game/{name}" for name in EXCLUDED_FILES}
        assert len(excluded) == 21, f"exclusion scope drifted: {len(excluded)}"
        for name in excluded:
            assert name in base_infos, f"declared exclusion was not in v1.74.2: {name}"
            assert name not in current, f"excluded file remained: {name}"

        missing, changed = [], []
        for name, old in base_infos.items():
            if name in excluded or name == "AndroidManifest.xml" or name in GAME_MUTABLE:
                continue
            if name not in current:
                missing.append(name)
            elif (old.file_size, old.CRC) != (current[name].file_size, current[name].CRC):
                changed.append(name)
        assert not missing, f"game/app content was removed: {missing[:12]}"
        assert not changed, f"game/app content changed unexpectedly: {changed[:12]}"

        expected_new = {f"assets/game/{name}" for name in NEW_GAME_FILES}
        actual_new = set(current_unsigned) - set(base_infos)
        assert actual_new == expected_new, f"unexpected new APK files: {sorted(actual_new ^ expected_new)}"

        manifest = archive.read("AndroidManifest.xml")
        assert manifest == patch_manifest(base.read("AndroidManifest.xml")), "manifest changed beyond version name/code"
        assert VERSION.encode("utf-16le") in manifest and PACKAGE.encode("utf-16le") in manifest

        index = archive.read("assets/game/index.html").decode("utf-8")
        refs = local_references(index)
        assert len(refs) == len(set(refs)), "duplicate startup references"
        missing_refs = []
        for ref in refs:
            target = str(PurePosixPath("assets/game") / re.split(r"[?#]", ref, maxsplit=1)[0])
            if target not in current:
                missing_refs.append((ref, target))
        assert not missing_refs, missing_refs
        assert "systems-v81-portrait-core.js?v=1.74.3" in index
        assert "systems-v81-safe-updater.js?v=1.74.3" in index
        assert "systems-v81-update-center.js?v=1.74.3" in index
        assert not any(name in index for name in (
            "v1.66.0-living-world-balance.js", "v1.67.0-identity-world-integrity.js",
            "v1.68.0-curated-npc-portraits.js", "v1.74.0-stable-bundle.js", "systems-v81-fullbody-integrity.js",
        ))

        manifest_source = archive.read("assets/game/asset-manifest.js").decode("utf-8")
        assets = json.loads(manifest_source.split("=", 1)[1].strip().removesuffix(";"))
        assert len(assets) == len(set(assets)), "duplicate asset-manifest entries"
        assert all(name in assets for name in NEW_GAME_FILES)
        assert not set(EXCLUDED_FILES).intersection(assets)

        marker = json.loads(archive.read("assets/game/assets/v1743/native-build-198.json"))
        assert marker["version"] == VERSION and marker["build"] == BUILD and marker["package"] == PACKAGE
        assert marker["saveFormatChanged"] is False and marker["gameplayContentRemoved"] is False
        assert marker["retiredRedundantRuntimeFiles"] == 8
        assert marker["retiredUnwantedHeadOrBustPortraits"] == 13
        assert marker["voiceSystem"] == "preserved-byte-for-byte"

        core = archive.read("assets/game/systems-v81-portrait-core.js").decode("utf-8")
        assert "authoritative indexed portrait core" in core and "v1743PortraitCore" in core
        assert "replace-known-head-and-placeholder-art;preserve-existing-full-body-art" in core
        assert "assets/prisoners/bandit_male.webp" in core, "old-save compatibility mapping missing"
        assert '.entityList>.entity>img[src*="custom/npc-portraits/"]' in core and "object-fit:contain" in core
        center = archive.read("assets/game/systems-v81-update-center.js").decode("utf-8")
        assert "A full APK install can replace code and physically remove obsolete packaged files" in center
        assert "downloaded web update can only add or override downloaded files" in center
        assert "Do not uninstall" in center

        voice_names = {
            name for name in base_infos
            if name.startswith("assets/neural/") or name in {
                "lib/arm64-v8a/libonnxruntime.so", "lib/arm64-v8a/libsherpa-onnx-jni.so",
            }
        }
        assert len(voice_names) > 200, "offline neural voice payload was not found"
        assert all(name in current for name in voice_names)
        assert all(
            (base_infos[name].file_size, base_infos[name].CRC) == (current[name].file_size, current[name].CRC)
            for name in voice_names
        ), "offline neural voice payload changed"

        model_names = {name for name in base_infos if name.endswith(".glb")}
        media_names = {name for name in base_infos if Path(name).suffix.lower() in MEDIA_SUFFIXES}
        assert len(model_names) == 4 and len(media_names) == 129
        for name in model_names | media_names:
            assert name in current
            assert (base_infos[name].file_size, base_infos[name].CRC) == (current[name].file_size, current[name].CRC)

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
    if args.expected_sha256:
        assert digest == args.expected_sha256.lower(), "APK SHA-256 does not match the frozen release value"
    print(json.dumps({
        "status": "PASS", "version": VERSION, "build": BUILD, "bytes": apk.stat().st_size,
        "sha256": digest, "startupReferences": len(refs), "excludedFiles": len(excluded),
        "unchangedFiles": len(base_infos) - len(excluded) - len(GAME_MUTABLE) - 1,
        "voiceFiles": len(voice_names), "mediaFiles": len(media_names), "models": len(model_names),
        "signerSha256": EXPECTED_CERT,
    }, indent=2))


if __name__ == "__main__":
    main()
