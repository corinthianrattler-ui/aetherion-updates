#!/usr/bin/env python3
"""Structural release checks for Aetherion's modular Valkorion GLB."""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path


EXPECTED_FOUNDATION = {
    "foundation__head",
    "foundation__torso",
    "foundation__arms",
    "foundation__hands",
    "foundation__legs",
    "foundation__feet",
}
EXPECTED_GEAR = {
    "gear__dominus_lord_helm",
    "gear__dominus_gorget",
    "gear__dominus_pauldrons",
    "gear__dominus_cuirass",
    "gear__dominus_arming_doublet",
    "gear__dominus_gauntlets",
    "gear__dominus_belt",
    "gear__dominus_legplates",
    "gear__dominus_boots",
    "gear__dominus_cloak",
    "gear__royal_head",
    "gear__royal_underlayer",
    "gear__royal_body",
    "gear__royal_shoulders",
    "gear__royal_hands",
    "gear__royal_waist",
    "gear__royal_legs",
    "gear__royal_feet",
    "gear__royal_cloak",
    "gear__dominus_bow",
    "gear__dominus_kite_shield",
    "gear__dominus_dagger",
    "gear__dominus_sword",
    "gear__dominus_quiver",
    "gear__dominus_thorn_whip",
    "gear__royal_jewelry",
    "gear__dominus_signet",
}


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main(path: Path) -> None:
    data = path.read_bytes()
    check(len(data) <= 20 * 1024 * 1024, "release model exceeds the 20 MiB mobile budget")
    magic, version, total = struct.unpack_from("<4sII", data)
    check(magic == b"glTF" and version == 2, "not a glTF 2 binary")
    check(total == len(data), "GLB header length mismatch")

    json_length, json_type = struct.unpack_from("<II", data, 12)
    check(json_type == 0x4E4F534A, "missing JSON chunk")
    json_start = 20
    document = json.loads(data[json_start : json_start + json_length].decode("utf-8").rstrip("\x00 "))
    binary_header = json_start + json_length
    binary_length, binary_type = struct.unpack_from("<II", data, binary_header)
    check(binary_type == 0x004E4942, "missing BIN chunk")
    check(binary_header + 8 + binary_length == len(data), "BIN chunk length mismatch")
    check(document["buffers"][0]["byteLength"] == binary_length, "declared buffer length mismatch")

    nodes = document["nodes"]
    node_names = {node["name"] for node in nodes}
    check(node_names == EXPECTED_FOUNDATION | EXPECTED_GEAR, "named equipment-node set changed")
    check(len(nodes) == len(node_names) == 33, "node names must be unique")
    check(len(document["meshes"]) == 33, "each switchable node must own one mesh")
    check(len(document["materials"]) == 5, "expected one material for each supplied source GLB")
    check(len(document["images"]) == 15, "expected normal/base/RM textures for five sources")
    check(len(document.get("skins", [])) == 0 and len(document.get("animations", [])) == 0, "unexpected rig data")
    check(set(document["extras"]["equipmentNodes"]) == EXPECTED_GEAR, "equipment metadata is incomplete")
    check(set(document["scenes"][0]["nodes"]) == set(range(33)), "scene must include every modular node")

    for index, node in enumerate(nodes):
        name = node["name"]
        check(node.get("mesh") == index, f"{name}: node/mesh index drift")
        check(bool(node["extras"]["aetherionEquipment"]) == (name in EXPECTED_GEAR), f"{name}: equipment flag mismatch")
        check(bool(node["extras"]["defaultVisible"]) == (name in EXPECTED_FOUNDATION), f"{name}: default visibility mismatch")
        primitive = document["meshes"][index]["primitives"][0]
        check(set(primitive["attributes"]) == {"POSITION", "NORMAL", "TEXCOORD_0"}, f"{name}: missing vertex stream")
        position = document["accessors"][primitive["attributes"]["POSITION"]]
        normal = document["accessors"][primitive["attributes"]["NORMAL"]]
        uv = document["accessors"][primitive["attributes"]["TEXCOORD_0"]]
        indices = document["accessors"][primitive["indices"]]
        check(position["count"] == normal["count"] == uv["count"], f"{name}: vertex-count mismatch")
        check(position["componentType"] == 5126 and not position.get("normalized"), f"{name}: invalid position encoding")
        check(normal["componentType"] == 5120 and normal.get("normalized") is True, f"{name}: normals are not packed")
        check(uv["componentType"] == 5123 and uv.get("normalized") is True, f"{name}: UVs are not packed")
        check(indices["count"] % 3 == 0 and indices["count"] >= 12, f"{name}: invalid triangle index count")
        low, high = position["min"], position["max"]
        check(-0.50 <= low[0] <= high[0] <= 0.50, f"{name}: horizontal fit escaped the body envelope")
        check(-0.03 <= low[1] <= high[1] <= 1.10, f"{name}: vertical fit escaped the body envelope")
        check(-0.30 <= low[2] <= high[2] <= 0.24, f"{name}: depth fit escaped the body envelope")

    for index, view in enumerate(document["bufferViews"]):
        offset = view.get("byteOffset", 0)
        length = view["byteLength"]
        check(offset % 4 == 0, f"bufferView {index}: unaligned offset")
        check(offset >= 0 and length >= 0 and offset + length <= binary_length, f"bufferView {index}: out of range")

    print(
        f"{path.name}: 33 fitted nodes, {len(EXPECTED_GEAR)} equipment pieces, "
        f"{len(data) / 1048576:.2f} MiB — structural checks passed"
    )


if __name__ == "__main__":
    model = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("assets/v107/valkorion_modular.glb")
    main(model)
