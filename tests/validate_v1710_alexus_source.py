#!/usr/bin/env python3
"""Prove the corrected Alexus map against her original and packaged GLBs."""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from pathlib import Path


ORIGINAL_SHA256 = "5941aa40b5c08b2e71b04a39665a11129d5960312361d513fa3f76d34b0df2f9"
PACKAGED_SHA256 = "6a5dbb1b0de94e327a5e853292989e747fb20931c9cd7dea34992f0181e00988"
BODY = {
    "BODY_tripo_part_81", "BODY_tripo_part_46", "BODY_tripo_part_10",
    "BODY_tripo_part_9", "BODY_tripo_part_12", "BODY_tripo_part_74",
    "BODY_tripo_part_0", "BODY_tripo_part_25", "BODY_tripo_part_49",
    "BODY_tripo_part_39", "BODY_tripo_part_28", "BODY_tripo_part_2",
}
FITTED = {
    "GOWN_tripo_part_19", "GOWN_tripo_part_18", "BODY_tripo_part_75",
    "BODY_tripo_part_13", "BODY_tripo_part_15", "BODY_tripo_part_17",
    "BODY_tripo_part_37", "BODY_tripo_part_72", "BODY_tripo_part_86",
    "GOWN_tripo_part_10", "BODY_tripo_part_50", "GOWN_tripo_part_4",
    "GOWN_tripo_part_5", "GOWN_tripo_part_17", "GOWN_tripo_part_7",
    "BODY_tripo_part_56",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def glb_document(path: Path) -> dict:
    data = path.read_bytes()
    assert struct.unpack_from("<III", data, 0) == (0x46546C67, 2, len(data))
    offset = 12
    document = None
    while offset < len(data):
        length, kind = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset : offset + length]
        offset += length
        if kind == 0x4E4F534A:
            document = json.loads(chunk.rstrip(b"\x00 ").decode("utf-8"))
    assert document is not None
    return document


def named_meshes(document: dict) -> set[str]:
    return {node["name"] for node in document["nodes"] if "mesh" in node}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--original", type=Path, required=True)
    parser.add_argument("--packaged", type=Path, required=True)
    args = parser.parse_args()

    assert sha256(args.original) == ORIGINAL_SHA256, "wrong original Alexus upload"
    assert sha256(args.packaged) == PACKAGED_SHA256, "wrong packaged Alexus model"
    original = glb_document(args.original)
    packaged = glb_document(args.packaged)
    original_names = named_meshes(original)
    packaged_names = named_meshes(packaged)

    assert len(original_names) == len(packaged_names) == 28
    assert len(original["meshes"]) == len(packaged["meshes"]) == 28
    assert original_names == packaged_names == BODY | FITTED
    assert BODY.isdisjoint(FITTED)
    assert "BODY_tripo_part_28" in BODY  # authored upper-chest skin
    assert "BODY_tripo_part_2" in BODY  # authored torso
    assert "GOWN_tripo_part_10" in FITTED  # actual full dress
    assert "ALEXUS_FOUNDATION_TORSO" not in original_names | packaged_names
    print(
        "v1.72.10 Alexus sources: original 97,544,908-byte upload and packaged "
        "30,457,220-byte GLB expose the same 28 meshes; complete body and wardrobe "
        "are disjoint with no fabricated torso"
    )


if __name__ == "__main__":
    main()
