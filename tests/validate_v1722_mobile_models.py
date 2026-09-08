#!/usr/bin/env python3
"""Validate the exact mobile GLBs placed in the v1.72.2 APK payload."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct


EXPECTED = {
    "valkorion-base-lord.glb": (15_208_480, "ce3dfbb8e002f4f4a311d29d72120d7bd1541b28c77df80fd2a03a676794ddfc", 24, 23),
    "valkorion-armored.glb": (30_056_648, "8f3b4b538c16434f919037eb880c301ae50b15bb35ad8856b8bba203655d9e21", 41, 40),
    "alexus-gothic-gown.glb": (30_457_220, "6a5dbb1b0de94e327a5e853292989e747fb20931c9cd7dea34992f0181e00988", 29, 28),
}


def inspect(path: Path) -> tuple[bytes, dict]:
    body = path.read_bytes()
    assert body[:4] == b"glTF", f"{path.name}: missing GLB magic"
    version, declared = struct.unpack_from("<II", body, 4)
    assert version == 2 and declared == len(body), f"{path.name}: incomplete GLB"
    json_size, chunk_type = struct.unpack_from("<II", body, 12)
    assert chunk_type == 0x4E4F534A, f"{path.name}: missing JSON chunk"
    document = json.loads(body[20 : 20 + json_size])
    return body, document


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("asset_root", type=Path)
    args = parser.parse_args()

    total = 0
    for name, (size, digest, nodes, meshes) in EXPECTED.items():
        body, document = inspect(args.asset_root / name)
        assert len(body) == size, f"{name}: byte size changed"
        assert hashlib.sha256(body).hexdigest() == digest, f"{name}: SHA-256 changed"
        assert len(document.get("nodes", [])) == nodes, f"{name}: node count changed"
        assert len(document.get("meshes", [])) == meshes, f"{name}: fitted mesh count changed"
        assert any(node.get("name") == "ROOT" for node in document["nodes"]), f"{name}: ROOT missing"
        assert document.get("extensionsRequired") == ["KHR_mesh_quantization"], f"{name}: unexpected compression"
        materials = document.get("materials", [])
        assert len(materials) == meshes, f"{name}: material count changed"
        assert all(material.get("doubleSided") is True for material in materials), f"{name}: backface protection missing"
        total += len(body)

    assert total == 75_722_348
    print("v1.72.2 mobile models: exact hashes, all 91 fitted meshes, quantization-only geometry, and double-sided surfaces passed")


if __name__ == "__main__":
    main()
