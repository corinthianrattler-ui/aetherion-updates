#!/usr/bin/env python3
"""Structural, fit, and payload checks for the v1.63 Valkorion GLB."""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path


GROUP_PART_COUNTS = {
    "foundation__head": 1,
    "foundation__torso": 1,
    "foundation__arms": 2,
    "foundation__hands": 2,
    "foundation__legs": 3,
    "foundation__feet": 2,
    "gear__royal_head": 1,
    "gear__royal_underlayer": 1,
    "gear__royal_body": 1,
    "gear__royal_shoulders": 2,
    "gear__royal_hands": 1,
    "gear__royal_waist": 1,
    "gear__royal_legs": 1,
    "gear__royal_feet": 2,
    "gear__royal_cloak": 1,
    "gear__royal_jewelry": 1,
    "gear__dominus_bow": 1,
    "gear__dominus_kite_shield": 1,
    "gear__dominus_dagger": 1,
    "gear__dominus_sword": 1,
    "gear__dominus_quiver": 1,
    "gear__dominus_thorn_whip": 1,
    "gear__dominus_signet": 1,
    "SLOT_HELMET": 1,
    "SLOT_GORGET": 1,
    "SLOT_PAULDRONS": 4,
    "SLOT_CUIRASS": 1,
    "SLOT_UNDERCOAT": 1,
    "SLOT_GAUNTLETS": 2,
    "SLOT_BELT": 1,
    "SLOT_TROUSERS": 4,
    "SLOT_GREAVES": 2,
    "SLOT_BOOTS": 2,
    "SLOT_CLOAK": 4,
    "SLOT_SCABBARD": 1,
}

FOUNDATION = {name for name in GROUP_PART_COUNTS if name.startswith("foundation__")}
ARMOR_SLOTS = {name for name in GROUP_PART_COUNTS if name.startswith("SLOT_")}
TOP_LEVEL_GEAR = set(GROUP_PART_COUNTS) - FOUNDATION - ARMOR_SLOTS
ARMOR_ROOT = "VALKORION_DOMINUS_ARMOR"
MODEL_ROOT = "VALKORION_FINAL"

COMPONENT_BYTES = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
TYPE_COMPONENTS = {
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4,
    "MAT2": 4,
    "MAT3": 9,
    "MAT4": 16,
}


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def read_glb(path: Path) -> tuple[bytes, dict, int]:
    data = path.read_bytes()
    check(len(data) <= 12 * 1024 * 1024, "release model exceeds the 12 MiB mobile budget")
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
    check(len(document.get("buffers", [])) == 1, "release must be one self-contained GLB")
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
    views = document.get("bufferViews", [])
    names = [node.get("name", "") for node in nodes]
    name_to_index = {name: index for index, name in enumerate(names)}

    check(len(nodes) == 91, "expected 35 groups, two roots, and 54 fitted mesh nodes")
    check(len(names) == len(name_to_index) and all(names), "all nodes need unique non-empty names")
    check(set(GROUP_PART_COUNTS) | {MODEL_ROOT, ARMOR_ROOT} <= set(names), "required equipment nodes are missing")
    check(len(meshes) == 54, "expected one mesh for each fitted part")
    check(len(document.get("materials", [])) == 52, "material set changed")
    check(len(document.get("images", [])) == 58, "embedded image set changed")
    check(len(document.get("textures", [])) == 58, "texture set changed")
    check(len(document.get("samplers", [])) == 3, "sampler set changed")
    check(not document.get("skins") and not document.get("animations"), "unexpected rig or animation data")
    check(
        set(document.get("extensionsUsed", []))
        == {"KHR_mesh_quantization", "KHR_texture_transform"},
        "release extension set changed",
    )
    check(
        document.get("extensionsRequired") == ["KHR_mesh_quantization"],
        "required release extension changed",
    )

    scene_index = document.get("scene", 0)
    check(0 <= scene_index < len(document.get("scenes", [])), "active scene index is invalid")
    scene_roots = document["scenes"][scene_index].get("nodes", [])
    check(scene_roots == [name_to_index[MODEL_ROOT]], "the active scene must contain only VALKORION_FINAL")
    check(descendants(nodes, scene_roots) == set(range(len(nodes))), "every node must be reachable")

    model_root = nodes[name_to_index[MODEL_ROOT]]
    expected_model_children = FOUNDATION | TOP_LEVEL_GEAR | {ARMOR_ROOT}
    check({names[index] for index in model_root.get("children", [])} == expected_model_children, "model-root groups changed")
    model_extras = model_root.get("extras", {})
    check(model_extras.get("aetherionVersion") == "1.63.0", "model version metadata changed")
    check(model_extras.get("duplicateKitBodyRemoved") is True, "duplicate kit body was not marked removed")
    axis_fits = model_extras.get("alignment", {}).get("axisFits", [])
    check(len(axis_fits) == 3 and max(item["rmse"] for item in axis_fits) <= 0.012, "foundation-to-kit fit is outside tolerance")
    optimization = model_extras.get("optimization", {})
    check(optimization.get("attributeSeamsPreserved") is True, "seam-safe optimization metadata is missing")
    check(optimization.get("sourceTriangles") == 4_146_118, "source triangle count changed")
    check(optimization.get("restoredParts") == ["part__royal_costume_ring"], "tiny signet restoration changed")
    check(optimization.get("quantizationChildrenCollapsed") == 53, "quantized node normalization changed")

    armor_root = nodes[name_to_index[ARMOR_ROOT]]
    check("mesh" not in armor_root, "armor root must be transform-only")
    check({names[index] for index in armor_root.get("children", [])} == ARMOR_SLOTS, "armor slot list changed")

    all_leaf_indices: set[int] = set()
    leaf_parent: dict[int, str] = {}
    for group_name, expected_count in GROUP_PART_COUNTS.items():
        group = nodes[name_to_index[group_name]]
        children = group.get("children", [])
        check("mesh" not in group, f"{group_name}: group must remain transform-only")
        check(len(children) == expected_count, f"{group_name}: expected {expected_count} fitted parts")
        extras = group.get("extras", {})
        check(extras.get("toggleAsUnit") is True, f"{group_name}: toggle metadata missing")
        check(extras.get("aetherionEquipment") is (group_name not in FOUNDATION), f"{group_name}: equipment flag changed")
        check(extras.get("defaultVisible") is (group_name in FOUNDATION), f"{group_name}: default visibility changed")
        for child in children:
            check(child not in leaf_parent, f"{names[child]} belongs to more than one equipment group")
            leaf_parent[child] = group_name
        all_leaf_indices.update(children)

    check(len(all_leaf_indices) == 54, "expected exactly 54 unique fitted mesh nodes")
    check({index for index, node in enumerate(nodes) if "mesh" in node} == all_leaf_indices, "orphan mesh node found")

    referenced_meshes: set[int] = set()
    total_vertices = 0
    total_triangles = 0
    helmet_bounds = None
    gauntlet_bounds: list[tuple[list[float], list[float]]] = []
    for node_index in sorted(all_leaf_indices):
        node = nodes[node_index]
        name = node["name"]
        check(name.startswith("part__"), f"{name}: fitted part name changed")
        check(not node.get("children"), f"{name}: mesh node unexpectedly has children")
        check("matrix" not in node and "rotation" not in node, f"{name}: unsupported fitted transform")
        extras = node.get("extras", {})
        check(extras.get("aetherionPart") is True, f"{name}: part metadata missing")
        check(extras.get("slot") == leaf_parent[node_index], f"{name}: equipment group metadata mismatch")
        check(extras.get("seamSafeSimplification") is True, f"{name}: seam-safe marker missing")
        source_node = extras.get("sourceNode", "")
        check("_BODY_PART_" not in source_node, f"{name}: duplicate kit body geometry survived")
        check("ARMOR_PART_20" not in source_node, f"{name}: rejected old gauntlet survived")

        mesh_index = node["mesh"]
        check(0 <= mesh_index < len(meshes), f"{name}: mesh index is invalid")
        check(mesh_index not in referenced_meshes, f"{name}: mesh is shared unexpectedly")
        referenced_meshes.add(mesh_index)
        primitives = meshes[mesh_index].get("primitives", [])
        check(len(primitives) == 1, f"{name}: expected one primitive")
        primitive = primitives[0]
        check(primitive.get("mode", 4) == 4, f"{name}: primitive is not TRIANGLES")
        check(set(primitive.get("attributes", {})) == {"POSITION", "NORMAL", "TEXCOORD_0"}, f"{name}: vertex streams changed")
        check("indices" in primitive and "material" in primitive, f"{name}: indexed textured primitive required")
        check(0 <= primitive["material"] < len(document["materials"]), f"{name}: material index is invalid")

        position = accessors[primitive["attributes"]["POSITION"]]
        normal = accessors[primitive["attributes"]["NORMAL"]]
        uv = accessors[primitive["attributes"]["TEXCOORD_0"]]
        indices = accessors[primitive["indices"]]
        check(position["componentType"] in (5123, 5126) and position["type"] == "VEC3", f"{name}: position stream changed")
        check(normal["componentType"] == 5120 and normal["type"] == "VEC3" and normal.get("normalized") is True, f"{name}: normal stream changed")
        check(uv["componentType"] == 5123 and uv["type"] == "VEC2" and uv.get("normalized") is True, f"{name}: UV stream changed")
        check(position["count"] == normal["count"] == uv["count"], f"{name}: vertex counts differ")
        check(indices["componentType"] in (5123, 5125) and indices["type"] == "SCALAR", f"{name}: index stream changed")
        check(indices["count"] >= 12 and indices["count"] % 3 == 0, f"{name}: invalid triangle count")
        triangles = indices["count"] // 3
        check(extras.get("releaseTriangles") == triangles, f"{name}: release triangle metadata is stale")
        check(extras.get("releaseVertices") == position["count"], f"{name}: release vertex metadata is stale")
        check(extras.get("sourceTriangles", 0) >= triangles, f"{name}: simplification increased triangle count")
        total_vertices += position["count"]
        total_triangles += triangles

        low, high = position["min"], position["max"]
        if position["componentType"] == 5123:
            scale = node.get("scale")
            translation = node.get("translation")
            check(scale is not None and translation is not None, f"{name}: quantized position transform missing")
            low = [low[i] * scale[i] + translation[i] for i in range(3)]
            high = [high[i] * scale[i] + translation[i] for i in range(3)]
        else:
            check("scale" not in node and "translation" not in node, f"{name}: restored float mesh gained a transform")
        check(-0.41 <= low[0] <= high[0] <= 0.40, f"{name}: horizontal bounds escaped")
        check(-0.01 <= low[1] <= high[1] <= 1.06, f"{name}: vertical bounds escaped")
        check(-0.57 <= low[2] <= high[2] <= 0.30, f"{name}: depth bounds escaped")
        if leaf_parent[node_index] == "SLOT_HELMET":
            helmet_bounds = (low, high)
        elif leaf_parent[node_index] == "SLOT_GAUNTLETS":
            gauntlet_bounds.append((low, high))

    check(referenced_meshes == set(range(54)), "every release mesh must be used exactly once")
    check(total_vertices == 234_998, "optimized vertex total changed")
    check(total_triangles == 397_747, "optimized triangle total changed")
    check(optimization.get("releaseVertices") == total_vertices, "root vertex metadata is stale")
    check(optimization.get("releaseTriangles") == total_triangles, "root triangle metadata is stale")
    check(document.get("extras", {}).get("attributeSeamsPreserved") is True, "document seam-safety metadata missing")

    check(helmet_bounds is not None and helmet_bounds[0][1] >= 0.79 and helmet_bounds[1][1] >= 1.0, "helmet is not fitted to the head")
    check(len(gauntlet_bounds) == 2, "approved gauntlet pair is incomplete")
    check(any(high[0] < -0.15 for _, high in gauntlet_bounds), "left gauntlet is not fitted to the left hand")
    check(any(low[0] > 0.14 for low, _ in gauntlet_bounds), "right gauntlet is not fitted to the right hand")

    for index, view in enumerate(views):
        check(view.get("buffer", 0) == 0, f"bufferView {index}: external buffer reference found")
        offset = view.get("byteOffset", 0)
        length = view["byteLength"]
        check(offset % 4 == 0, f"bufferView {index}: unaligned offset")
        check(offset >= 0 and length >= 0 and offset + length <= binary_length, f"bufferView {index}: out of range")

    for index, accessor in enumerate(accessors):
        check("sparse" not in accessor, f"accessor {index}: sparse accessors are not expected")
        view_index = accessor.get("bufferView")
        check(isinstance(view_index, int) and 0 <= view_index < len(views), f"accessor {index}: invalid bufferView")
        view = views[view_index]
        element_size = COMPONENT_BYTES[accessor["componentType"]] * TYPE_COMPONENTS[accessor["type"]]
        stride = view.get("byteStride", element_size)
        end = accessor.get("byteOffset", 0) + (accessor["count"] - 1) * stride + element_size
        check(end <= view["byteLength"], f"accessor {index}: data exceeds its bufferView")

    for index, image in enumerate(document.get("images", [])):
        check("bufferView" in image and "uri" not in image, f"image {index}: texture is not embedded")
        check(image.get("mimeType") in {"image/png", "image/jpeg", "image/webp"}, f"image {index}: unsupported texture format")

    print(
        f"{path.name}: 54 fitted parts in 35 equipment/foundation groups, "
        f"{total_vertices:,} vertices, {total_triangles:,} triangles, "
        f"{len(data) / 1048576:.2f} MiB — structural and fit checks passed"
    )


if __name__ == "__main__":
    model = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("assets/v109/valkorion_final.glb")
    main(model)
