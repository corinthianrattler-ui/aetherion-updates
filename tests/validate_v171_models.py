#!/usr/bin/env python3
"""Validate the v1.71 fitted character GLBs and their mobile upload budget."""

from __future__ import annotations

import hashlib
import json
import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942
LIMIT = 100_000_000

EXPECTED = {
    "assets/v171/valkorion-base-lord.glb": {
        "size": 37_293_792,
        "sha256": "963d66d60d4e7b1dcfdeb43f44bc764683ddf2f8a4a4ffe4dbd63a530d186d47",
        "nodes": 24,
        "meshes": 23,
        "materials": 23,
        "images": 23,
        "triangles": 988_007,
        "parts": {
            "HUMAN_PART_": 10,
            "ROYAL_COSTUME_PART_": 10,
            "Gothic_": 2,
            "tripo_part_new_0": 1,
        },
    },
    "assets/v171/valkorion-armored.glb": {
        "size": 99_848_008,
        "sha256": "de12485beeebd6be86e9354e25a2071a1203fb94a6b8b660fd8c7d01acaecba1",
        "nodes": 41,
        "meshes": 40,
        "materials": 40,
        "images": 40,
        "triangles": 2_860_055,
        "parts": {
            "BODY_ARMOR_PART_": 27,
            "HELMET_PART_": 3,
            "CAPE_PART_": 4,
            "WEAPONS_PART_": 6,
        },
    },
    "assets/v171/libita-gothic-gown.glb": {
        "size": 97_544_908,
        "sha256": "5941aa40b5c08b2e71b04a39665a11129d5960312361d513fa3f76d34b0df2f9",
        "nodes": 29,
        "meshes": 28,
        "materials": 28,
        "images": 56,
        "triangles": 2_718_772,
        "parts": {"BODY_": 21, "GOWN_": 7},
    },
}


def read_glb(path: Path) -> tuple[dict, bytes]:
    data = path.read_bytes()
    assert len(data) >= 20, f"{path.name}: truncated"
    magic, version, declared = struct.unpack_from("<4sII", data)
    assert magic == b"glTF" and version == 2, f"{path.name}: not GLB 2.0"
    assert declared == len(data), f"{path.name}: header length mismatch"
    document = None
    binary = b""
    offset = 12
    while offset < len(data):
        size, kind = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset : offset + size]
        assert len(chunk) == size, f"{path.name}: truncated chunk"
        offset += size
        if kind == JSON_CHUNK:
            document = json.loads(chunk.rstrip(b" \t\r\n\0"))
        elif kind == BIN_CHUNK:
            binary = chunk
    assert document is not None and binary, f"{path.name}: missing JSON or BIN chunk"
    return document, data


def triangle_count(document: dict) -> int:
    count = 0
    accessors = document["accessors"]
    for mesh in document["meshes"]:
        for primitive in mesh["primitives"]:
            assert primitive.get("mode", 4) == 4, "non-triangle primitive found"
            accessor = primitive.get("indices")
            values = accessors[accessor if accessor is not None else primitive["attributes"]["POSITION"]]["count"]
            assert values % 3 == 0
            count += values // 3
    return count


def matching(name: str, prefix: str) -> bool:
    return name == prefix if prefix == "tripo_part_new_0" else name.startswith(prefix)


def validate(path_string: str, expected: dict) -> None:
    path = ROOT / path_string
    document, data = read_glb(path)
    assert len(data) == expected["size"]
    assert len(data) < LIMIT, f"{path.name}: exceeds the 100 MB Tripo/GitHub ceiling"
    digest = hashlib.sha256(data).hexdigest()
    assert digest == expected["sha256"], f"{path.name}: unexpected bytes"
    assert len(document.get("nodes", [])) == expected["nodes"]
    assert len(document.get("meshes", [])) == expected["meshes"]
    assert len(document.get("materials", [])) == expected["materials"]
    assert len(document.get("images", [])) == expected["images"]
    assert not document.get("animations") and not document.get("skins")
    assert not document.get("extensionsRequired"), f"{path.name}: requires a non-core decoder"
    assert all("normalTexture" not in material for material in document["materials"])
    assert triangle_count(document) == expected["triangles"]

    nodes = document["nodes"]
    roots = [(index, node) for index, node in enumerate(nodes) if node.get("name") == "ROOT"]
    assert len(roots) == 1, f"{path.name}: expected one ROOT"
    root_index, root = roots[0]
    scene_roots = document["scenes"][document.get("scene", 0)]["nodes"]
    assert scene_roots == [root_index], f"{path.name}: ROOT is not the scene root"
    mesh_nodes = {index for index, node in enumerate(nodes) if "mesh" in node}
    assert set(root.get("children", [])) == mesh_nodes, f"{path.name}: fitted parts escaped ROOT"
    assert len(mesh_nodes) == expected["meshes"]
    names = [nodes[index].get("name", "") for index in mesh_nodes]
    assert len(names) == len(set(names)), f"{path.name}: duplicate part names"
    for prefix, count in expected["parts"].items():
        assert sum(matching(name, prefix) for name in names) == count, f"{path.name}: {prefix} contract changed"
    assert sum(expected["parts"].values()) == len(names)

    buffer_length = document["buffers"][0]["byteLength"]
    assert buffer_length <= len(data)
    for view in document.get("bufferViews", []):
        assert view.get("buffer", 0) == 0
        assert view.get("byteOffset", 0) + view["byteLength"] <= buffer_length
    print(
        f"{path.name}: {len(mesh_nodes)} fitted parts, "
        f"{expected['triangles']:,} triangles, {len(data):,} bytes"
    )


def main() -> None:
    for path, expected in EXPECTED.items():
        validate(path, expected)
    print("v1.71 character GLBs: structure, materials, hashes, and upload limits passed")


if __name__ == "__main__":
    main()
