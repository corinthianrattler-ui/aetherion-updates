#!/usr/bin/env python3
"""Regression-test the exact native DEX transformation used by build 193."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import struct
import sys
import tempfile
import zlib

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tools.patch_android_dex import REPLACEMENTS, patch


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("classes_dex", type=Path)
    args = parser.parse_args()
    source = args.classes_dex.read_bytes()
    with tempfile.TemporaryDirectory() as directory:
        output = Path(directory) / "classes.dex"
        patch(args.classes_dex, output)
        result = output.read_bytes()

    assert len(result) == len(source)
    assert result != source
    assert result[:8] == source[:8]
    assert struct.unpack_from("<I", result, 0x20)[0] == len(result)
    assert struct.unpack_from("<I", result, 8)[0] == zlib.adler32(result[12:]) & 0xFFFFFFFF
    assert result[12:32] == hashlib.sha1(result[32:]).digest()
    for old, new, label in REPLACEMENTS[:-1]:
        assert old not in result, label
        assert result.count(new) == 1, label
    old, _, label = REPLACEMENTS[-1]
    assert old not in result, label
    print("Android DEX patch: query/fragment routing and retained WebView cache passed")


if __name__ == "__main__":
    main()
