#!/usr/bin/env python3
"""Structural release checks for the v1.62 fitted Valkorion GLB."""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path


FOUNDATION = {
    "foundation__head",
    "foundation__torso",
    "foundation__arms",
    "foundation__hands",
    "foundation__legs",
    "foundation__feet",
}

PRESERVED_GEAR = {
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

SLOT_PART_COUNTS = {
    "SLOT_CLOAK": 7,
    "SLOT_HELMET": 2,
    "SLOT_GORGET": 2,
    "SLOT_PAULDRONS": 2,
    "SLOT_CUIRASS": 5,
    "SLOT_UNDERCOAT": 5,
    "SLOT_GAUNTLETS": 6,
    "SLOT_BELT": 7,
    "SLOT_TROUSERS": 2,
    "SLOT_GREAVES": 6,
    "SLOT_BOOTS": 2,
    "SLOT_SCABBARD": 1,
}

REMOVED_BAD_ARMOR = {
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
}

ARMOR_ROOT = "VALKORION_DOMINUS_ARMOR"


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def read_glb(path: Path) -> tuple[bytes, dict, int]:
    data = path.read_bytes()
    check(len(data) <= 21 * 1024 * 1024, "release model exceeds the 21 MiB mobile budget")
    check(len(data) >= 28, "GLB is truncated")
    magic, version, total = struct.unpack_from("<4sII", data)
    check(magic == b"glTF" and version == 2, "not a glTF 2 binary")
    check(total == len(data), "GLB header length mismatch")

    json_length, json_type = struct.unpack_from("<II", data, 12)
    check(json_type == 0x4E4F534A, "missing JSON chunk")
    json_start = 20
    binary_header = json_start + json_length
    check(binary_header + 8 <= len(data), "missing BIN chunk header")
    document = json.loads(data[json_start:binary_header].decode("utf-8").rstrip("\x00 "))
    binary_length, binary_type = struct.unpack_from("<II", data, binary_header)
    check(binary_type == 0x004E4942, "missing BIN chunk")
    check(binary_header + 8 + binary_length == len(data), "BIN chunk length mismatch")
    check(len(document.get("buffers", [])) == 1, "release must remain a self-contained one-buffer GLB")
    check(document["buffers"][0]["byteLength"] == binary_length, "declared buffer length mismatch")
    return data, document, binary_length


def descendants(nodes: list[dict], roots: list[int]) -> set[int]:
    found: set[int] = set()
    pending = list(roots)
    while pending:
        index = pending.pop()
        check(0 <= index < len(nodes), f"node index {index} is out of range")
        if index in found:
            continue
        found.add(index)
        pending.extend(nodes[index].get("children", []))
    return found


def main(path: Path) -> None:
    data, document, binary_length = read_glb(path)
    nodes = document.get("nodes", [])
    meshes = document.get("meshes", [])
    accessors = document.get("accessors", [])
    node_names = [node.get("name", "") for node in nodes]
    name_to_index = {name: index for index, name in enumerate(node_names)}

    check(len(nodes) == 83, "expected 23 preserved nodes, 47 fitted fragments, 12 slots, and one armor root")
    check(len(name_to_index) == len(nodes), "all model nodes must have unique non-empty names")
    check(FOUNDATION | PRESERVED_GEAR | set(SLOT_PART_COUNTS) | {ARMOR_ROOT} <= set(node_names), "required named nodes are missing")
    check(not (REMOVED_BAD_ARMOR & set(node_names)), "a malformed v1.61 Dominus armor node survived")
    check(not document.get("skins") and not document.get("animations"), "unexpected rig or animation data")
    check(set(document.get("extensionsUsed", [])) <= {"KHR_materials_volume"}, "unexpected glTF extension")

    scene_index = document.get("scene", 0)
    check(0 <= scene_index < len(document.get("scenes", [])), "active scene index is invalid")
    scene_roots = document["scenes"][scene_index].get("nodes", [])
    expected_roots = FOUNDATION | PRESERVED_GEAR | {ARMOR_ROOT}
    check({node_names[index] for index in scene_roots} == expected_roots, "active scene roots changed")
    reachable = descendants(nodes, scene_roots)
    check(reachable == set(range(len(nodes))), "every node must be reachable from the active scene")

    root = nodes[name_to_index[ARMOR_ROOT]]
    check(root.get("mesh") is None, "armor root must remain a transform-only group")
    check(root.get("extras", {}).get("partCount") == 47, "armor root part-count metadata changed")
    check(root.get("extras", {}).get("slotCount") == 12, "armor root slot-count metadata changed")
    check({node_names[index] for index in root.get("children", [])} == set(SLOT_PART_COUNTS), "armor root slot list changed")

    armor_leaf_indices: set[int] = set()
    for slot_name, expected_count in SLOT_PART_COUNTS.items():
        slot = nodes[name_to_index[slot_name]]
        children = slot.get("children", [])
        check(slot.get("mesh") is None, f"{slot_name}: slot must be a transform-only group")
        check(slot.get("extras", {}).get("toggleAsUnit") is True, f"{slot_name}: unit-toggle metadata missing")
        check(len(children) == expected_count, f"{slot_name}: expected {expected_count} fitted fragments")
        check(not (armor_leaf_indices & set(children)), f"{slot_name}: fragment belongs to more than one slot")
        armor_leaf_indices.update(children)
        expected_slot = slot_name.removeprefix("SLOT_").lower()
        for child_index in children:
            child = nodes[child_index]
            check(child.get("name", "").startswith("VA_"), f"{slot_name}: child is not a fitted Valkorion fragment")
            check(child.get("extras", {}).get("aetherionSlot") == expected_slot, f"{child.get('name')}: slot metadata mismatch")
            check("mesh" in child and not child.get("children"), f"{child.get('name')}: armor fragment must own one mesh")

    check(len(armor_leaf_indices) == 47, "the fitted armor must contain exactly 47 unique fragments")
    check({index for index, name in enumerate(node_names) if name.startswith("VA_")} == armor_leaf_indices, "orphan fitted fragment found")

    preserved_indices = {name_to_index[name] for name in FOUNDATION | PRESERVED_GEAR}
    for index in preserved_indices:
        node = nodes[index]
        name = node["name"]
        check("mesh" in node and not node.get("children"), f"{name}: preserved node must still own one mesh")
        equipment = name in PRESERVED_GEAR
        check(node.get("extras", {}).get("aetherionEquipment") is equipment, f"{name}: equipment metadata mismatch")
        check(node.get("extras", {}).get("defaultVisible") is (not equipment), f"{name}: default visibility mismatch")

    referenced_meshes = {node["mesh"] for node in nodes if "mesh" in node}
    check(len(referenced_meshes) == 70 and referenced_meshes == set(range(len(meshes))), "all 70 meshes must be used by model nodes")
    check(len(document.get("materials", [])) == 51, "material set changed")
    check(len(document.get("images", [])) == 153, "embedded texture set changed")

    total_vertices = 0
    total_triangles = 0
    for node_index in preserved_indices | armor_leaf_indices:
        node = nodes[node_index]
        name = node["name"]
        check(not any(key in node for key in ("matrix", "translation", "rotation", "scale")), f"{name}: unexpected transform would break authored fit")
        mesh = meshes[node["mesh"]]
        check(len(mesh.get("primitives", [])) == 1, f"{name}: expected one primitive")
        primitive = mesh["primitives"][0]
        check(set(primitive.get("attributes", {})) == {"POSITION", "NORMAL", "TEXCOORD_0"}, f"{name}: vertex streams changed")
        check("indices" in primitive and "material" in primitive, f"{name}: indexed textured primitive required")
        position = accessors[primitive["attributes"]["POSITION"]]
        normal = accessors[primitive["attributes"]["NORMAL"]]
        uv = accessors[primitive["attributes"]["TEXCOORD_0"]]
        indices = accessors[primitive["indices"]]
        check(position["componentType"] == 5126 and position["type"] == "VEC3", f"{name}: invalid position encoding")
        check(normal["type"] == "VEC3" and uv["type"] == "VEC2", f"{name}: malformed normal or UV stream")
        check(position["count"] == normal["count"] == uv["count"], f"{name}: vertex-count mismatch")
        check(indices["componentType"] in (5123, 5125) and indices["type"] == "SCALAR", f"{name}: invalid indices")
        check(indices["count"] >= 12 and indices["count"] % 3 == 0, f"{name}: invalid triangle count")
        total_vertices += position["count"]
        total_triangles += indices["count"] // 3

        if node_index in armor_leaf_indices:
            low, high = position["min"], position["max"]
            check(-0.30 <= low[0] <= high[0] <= 0.30, f"{name}: fitted armor escaped its horizontal envelope")
            check(0.0 <= low[1] <= high[1] <= 1.01, f"{name}: fitted armor escaped its vertical envelope")
            check(-0.17 <= low[2] <= high[2] <= 0.17, f"{name}: fitted armor escaped its depth envelope")

    check(total_vertices == 244_792, "optimized vertex total changed")
    check(total_triangles == 299_672, "optimized triangle total changed")

    for index, view in enumerate(document.get("bufferViews", [])):
        check(view.get("buffer", 0) == 0, f"bufferView {index}: external buffer reference found")
        offset = view.get("byteOffset", 0)
        length = view["byteLength"]
        check(offset % 4 == 0, f"bufferView {index}: unaligned offset")
        check(offset >= 0 and length >= 0 and offset + length <= binary_length, f"bufferView {index}: out of range")

    for index, image in enumerate(document.get("images", [])):
        check("bufferView" in image and "uri" not in image, f"image {index}: texture must remain embedded")
        check(image.get("mimeType") in {"image/png", "image/jpeg", "image/webp"}, f"image {index}: unsupported texture format")

    print(
        f"{path.name}: 47 fitted fragments in 12 slots, "
        f"{total_vertices:,} vertices, {total_triangles:,} triangles, "
        f"{len(data) / 1048576:.2f} MiB — structural checks passed"
    )


if __name__ == "__main__":
    model = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("assets/v108/valkorion_modular.glb")
    main(model)
