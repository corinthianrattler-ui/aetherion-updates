#!/usr/bin/env python3
"""Validate the native loader and exact startup graph in Android build 193."""

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

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tools.patch_android_dex import REPLACEMENTS


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("apk")
    args = parser.parse_args()

    with zipfile.ZipFile(args.apk) as archive:
        names = {info.filename for info in archive.infolist()}
        assert len(names) == len(archive.infolist()), "duplicate live APK entries"
        archive.testzip() is None or (_ for _ in ()).throw(AssertionError("APK CRC failure"))

        manifest = archive.read("AndroidManifest.xml")
        assert "1.72.4".encode("utf-16le") in manifest
        assert "1.72.3".encode("utf-16le") not in manifest

        dex = archive.read("classes.dex")
        assert struct.unpack_from("<I", dex, 8)[0] == zlib.adler32(dex[12:]) & 0xFFFFFFFF
        assert dex[12:32] == hashlib.sha1(dex[32:]).digest()
        for old, new, label in REPLACEMENTS[:-1]:
            assert old not in dex, label
            assert dex.count(new) == 1, label
        assert REPLACEMENTS[-1][0] not in dex, REPLACEMENTS[-1][2]

        index = archive.read("assets/game/index.html").decode("utf-8")
        assert "AETHERION REFORGED v1.72.4" in index
        assert '<script src="vendor/webllm/webllm.bundle.js' not in index
        assert '<script src="aetherion-three.min.js' not in index
        assert "patches/v1.72.4-performance.js?v=1.72.4" in index

        refs = re.findall(r"<(?:script|link)\b[^>]*(?:src|href)=[\"']([^\"']+)", index, re.I)
        local = [ref for ref in refs if not re.match(r"^[a-z]+://|^data:", ref, re.I)]
        missing = []
        for ref in local:
            plain = re.split(r"[?#]", ref, maxsplit=1)[0]
            target = str(PurePosixPath("assets/game") / plain)
            if target not in names:
                missing.append((ref, target))
        assert not missing, missing
        assert sum("?" in ref or "#" in ref for ref in local) >= 130

        marker = json.loads(archive.read("assets/game/assets/v174/native-build-193.json"))
        assert marker == {
            "version": "1.72.4",
            "build": 193,
            "nativeAssetLoader": "query-safe",
            "models": "bundled",
            "cache": "retained",
        }
        awareness = archive.read("assets/game/systems-v45-awareness.js").decode("utf-8")
        characters = archive.read("assets/game/patches/v1.72.4-character-models.js").decode("utf-8")
        assert "function v174LoadWebLlm()" in awareness
        assert "await v174LoadWebLlm()" in awareness
        assert "function loadThreeRuntime()" in characters
        assert characters.count("await loadThreeRuntime()") == 2
        for model in (
            "valkorion-base-lord.glb",
            "valkorion-armored.glb",
            "alexus-gothic-gown.glb",
        ):
            assert f"assets/game/assets/v172/{model}" in names

    print(
        f"v1.72.4 APK: native DEX, {len(local)} startup references, lazy runtimes, "
        "sentinel, and three bundled character models passed"
    )


if __name__ == "__main__":
    main()
