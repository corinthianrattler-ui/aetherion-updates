#!/usr/bin/env python3
"""Apply the audited build-193 native WebView fixes to Aetherion classes.dex.

The original Java sources and Android toolchain are not part of this update
repository.  These replacements are deliberately anchored to complete Dalvik
instruction sequences and abort unless every expected sequence occurs exactly
once.  The DEX SHA-1 signature and Adler-32 checksum are rebuilt afterward.
"""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import struct
import zlib


REPLACEMENTS = (
    # AetherionAssetClient.openAsset: keep a real '?' index instead of
    # replacing it with -1.  if-ltz (0x3a) -> if-gez (0x3b).
    (
        bytes.fromhex("3a 02 03 00 12 f2 3b 02 06 00"),
        bytes.fromhex("3b 02 03 00 12 f2 3b 02 06 00"),
        "query suffix branch",
    ),
    # The same correction for '#'.
    (
        bytes.fromhex("3a 03 03 00 12 f3 3a 03 05 00"),
        bytes.fromhex("3b 03 03 00 12 f3 3a 03 05 00"),
        "fragment suffix branch",
    ),
    # MainActivity.onCreate: WebSettings.LOAD_NO_CACHE (2) ->
    # WebSettings.LOAD_DEFAULT (-1).
    (
        bytes.fromhex("12 22 6e 20 35 00 24 00"),
        bytes.fromhex("12 f2 6e 20 35 00 24 00"),
        "WebView cache mode",
    ),
    # Remove clearCache(true) without moving any code offsets.  Three Dalvik
    # code units become three nop instructions.
    (
        bytes.fromhex("6e 20 3e 00 04 00"),
        bytes.fromhex("00 00 00 00 00 00"),
        "launch-time cache purge",
    ),
)


def replace_once(blob: bytearray, old: bytes, new: bytes, label: str) -> int:
    count = bytes(blob).count(old)
    if count != 1:
        raise ValueError(f"expected exactly one {label} sequence, found {count}")
    position = blob.find(old)
    blob[position : position + len(old)] = new
    return position


def rebuild_header(blob: bytearray) -> None:
    if len(blob) < 112 or not bytes(blob[:8]).startswith(b"dex\n"):
        raise ValueError("input is not a complete DEX file")
    declared_size = struct.unpack_from("<I", blob, 0x20)[0]
    if declared_size != len(blob):
        raise ValueError(
            f"DEX file-size mismatch: header={declared_size}, actual={len(blob)}"
        )
    blob[12:32] = hashlib.sha1(blob[32:]).digest()
    struct.pack_into("<I", blob, 8, zlib.adler32(blob[12:]) & 0xFFFFFFFF)


def patch(source: Path, destination: Path) -> None:
    blob = bytearray(source.read_bytes())
    repaired = []
    for old, new, label in REPLACEMENTS:
        repaired.append((replace_once(blob, old, new, label), old, new, label))
    rebuild_header(blob)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(blob)

    written = destination.read_bytes()
    for position, old, new, label in repaired:
        if old in written or written[position : position + len(new)] != new:
            raise ValueError(f"written DEX did not retain the {label} repair")
    if zlib.adler32(written[12:]) & 0xFFFFFFFF != struct.unpack_from("<I", written, 8)[0]:
        raise ValueError("written DEX checksum verification failed")
    if hashlib.sha1(written[32:]).digest() != written[12:32]:
        raise ValueError("written DEX signature verification failed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    patch(args.source, args.destination)
    body = args.destination.read_bytes()
    print(f"patched_dex={args.destination}")
    print(f"bytes={len(body)}")
    print(f"sha256={hashlib.sha256(body).hexdigest()}")


if __name__ == "__main__":
    main()
