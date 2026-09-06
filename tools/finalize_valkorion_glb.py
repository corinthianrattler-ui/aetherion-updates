#!/usr/bin/env python3
"""Finish the compact, seam-safe Valkorion release GLB.

``gltfpack -kn`` preserves named equipment nodes, but quantized meshes are
placed on generated transform children. Collapse those children back into the
named part nodes so the wardrobe keeps its stable node contract. Aggressive
simplification can also discard the physically tiny signet; restore any such
missing part verbatim from the authored source GLB.
"""

from __future__ import annotations

import argparse
import copy
from pathlib import Path

import numpy as np

from build_valkorion_final_glb import (
    ARMOR_GROUPS,
    FOUNDATION_GROUPS,
    MODEL_VERSION,
    ROYAL_GROUPS,
    WEAPON_GROUPS,
    load_glb,
    read_accessor,
    write_glb,
)


def append_accessor(
    document: dict,
    binary: bytearray,
    source_document: dict,
    source_binary: bytes,
    source_index: int,
    *,
    target: int,
) -> int:
    """Copy one tightly packed accessor from the authored source."""
    source = source_document["accessors"][source_index]
    values = np.ascontiguousarray(
        read_accessor(source_document, source_binary, source_index)
    )
    element_size = values.dtype.itemsize * values.shape[1]
    stride = element_size
    payload = values.tobytes()
    if target == 34962 and element_size % 4:
        stride = (element_size + 3) & ~3
        packed = np.zeros((values.shape[0], stride), dtype=np.uint8)
        packed[:, :element_size] = values.view(np.uint8).reshape(values.shape[0], element_size)
        payload = packed.tobytes()
    binary.extend(b"\0" * ((-len(binary)) % 4))
    view_index = len(document["bufferViews"])
    document["bufferViews"].append(
        {
            "buffer": 0,
            "byteOffset": len(binary),
            "byteLength": len(payload),
            "target": target,
        }
    )
    if stride != element_size:
        document["bufferViews"][-1]["byteStride"] = stride
    binary.extend(payload)
    accessor = {
        key: copy.deepcopy(value)
        for key, value in source.items()
        if key
        in {
            "componentType",
            "count",
            "type",
            "normalized",
            "min",
            "max",
            "name",
            "extras",
        }
    }
    accessor["bufferView"] = view_index
    accessor["byteOffset"] = 0
    document["accessors"].append(accessor)
    return len(document["accessors"]) - 1


def restore_missing_parts(
    document: dict,
    binary: bytearray,
    source_document: dict,
    source_binary: bytes,
) -> list[str]:
    """Restore named part meshes that gltfpack reduced to zero triangles."""
    source_nodes = {node.get("name"): node for node in source_document["nodes"]}
    material_by_name = {
        material.get("name"): index
        for index, material in enumerate(document.get("materials", []))
    }
    restored: list[str] = []
    for node in document["nodes"]:
        name = node.get("name", "")
        if not name.startswith("part__") or "mesh" in node or node.get("children"):
            continue
        source_node = source_nodes.get(name)
        if source_node is None or "mesh" not in source_node:
            raise ValueError(f"{name}: missing authored source mesh")
        source_mesh = source_document["meshes"][source_node["mesh"]]
        if len(source_mesh.get("primitives", [])) != 1:
            raise ValueError(f"{name}: expected one authored primitive")
        source_primitive = source_mesh["primitives"][0]
        attributes = {
            semantic: append_accessor(
                document,
                binary,
                source_document,
                source_binary,
                accessor,
                target=34962,
            )
            for semantic, accessor in source_primitive["attributes"].items()
        }
        primitive = {
            "attributes": attributes,
            "indices": append_accessor(
                document,
                binary,
                source_document,
                source_binary,
                source_primitive["indices"],
                target=34963,
            ),
            "mode": source_primitive.get("mode", 4),
        }
        source_material = source_document["materials"][source_primitive["material"]]
        material_name = source_material.get("name")
        if material_name not in material_by_name:
            raise ValueError(f"{name}: material {material_name!r} was not retained")
        primitive["material"] = material_by_name[material_name]
        document["meshes"].append(
            {"name": source_mesh.get("name", name), "primitives": [primitive]}
        )
        node["mesh"] = len(document["meshes"]) - 1
        restored.append(name)
    return restored


def collapse_quantization_children(document: dict) -> int:
    """Move generated quantized meshes onto their stable named part nodes."""
    nodes = document["nodes"]
    removed: set[int] = set()
    for node in nodes:
        if not node.get("name", "").startswith("part__"):
            continue
        children = node.get("children", [])
        if not children:
            continue
        if len(children) != 1:
            raise ValueError(f"{node['name']}: expected one quantization child")
        child_index = children[0]
        child = nodes[child_index]
        if "mesh" not in child or child.get("children"):
            raise ValueError(f"{node['name']}: invalid quantization child")
        node["mesh"] = child["mesh"]
        for key in ("matrix", "translation", "rotation", "scale"):
            if key in child:
                node[key] = child[key]
        node.pop("children", None)
        removed.add(child_index)

    if not removed:
        return 0
    remap: dict[int, int] = {}
    compacted: list[dict] = []
    for old_index, node in enumerate(nodes):
        if old_index in removed:
            continue
        remap[old_index] = len(compacted)
        compacted.append(node)
    for node in compacted:
        if "children" in node:
            node["children"] = [remap[index] for index in node["children"]]
    for scene in document.get("scenes", []):
        scene["nodes"] = [remap[index] for index in scene.get("nodes", [])]
    document["nodes"] = compacted
    return len(removed)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("model", type=Path)
    parser.add_argument("--restore-source", type=Path)
    parser.add_argument("--source-triangles", type=int, default=4_146_118)
    parser.add_argument("--target-ratio", type=float, default=0.125)
    args = parser.parse_args()

    document, loaded_binary = load_glb(args.model)
    binary = bytearray(loaded_binary)
    restored: list[str] = []
    if args.restore_source:
        source_document, source_binary = load_glb(args.restore_source)
        restored = restore_missing_parts(
            document, binary, source_document, source_binary
        )
    collapsed = collapse_quantization_children(document)

    nodes = document["nodes"]
    meshes = document["meshes"]
    accessors = document["accessors"]
    output_triangles = 0
    output_vertices = 0

    for node in nodes:
        mesh_index = node.get("mesh")
        if mesh_index is None:
            continue
        primitives = meshes[mesh_index].get("primitives", [])
        if len(primitives) != 1:
            raise ValueError(f"{node.get('name')}: expected one primitive")
        primitive = primitives[0]
        triangles = accessors[primitive["indices"]]["count"] // 3
        vertices = accessors[primitive["attributes"]["POSITION"]]["count"]
        node.setdefault("extras", {})["releaseTriangles"] = triangles
        node["extras"]["releaseVertices"] = vertices
        node["extras"]["seamSafeSimplification"] = True
        output_triangles += triangles
        output_vertices += vertices

    root = next(node for node in nodes if node.get("name") == "VALKORION_FINAL")
    root.setdefault("extras", {})["optimization"] = {
        "tool": "meshoptimizer gltfpack 1.2",
        "targetRatio": args.target_ratio,
        "attributeSeamsPreserved": True,
        "sourceTriangles": args.source_triangles,
        "releaseTriangles": output_triangles,
        "releaseVertices": output_vertices,
        "restoredParts": restored,
        "quantizationChildrenCollapsed": collapsed,
    }
    document["asset"]["generator"] = (
        f"Aetherion final Valkorion wardrobe builder {MODEL_VERSION} + "
        "meshoptimizer gltfpack 1.2"
    )
    document["extras"] = {
        "aetherionVersion": MODEL_VERSION,
        "equipmentNodes": sorted(ROYAL_GROUPS | WEAPON_GROUPS | ARMOR_GROUPS),
        "foundationNodes": sorted(FOUNDATION_GROUPS),
        "sourceTriangles": args.source_triangles,
        "releaseTriangles": output_triangles,
        "releaseVertices": output_vertices,
        "attributeSeamsPreserved": True,
    }
    write_glb(args.model, document, binary)
    print(
        f"{args.model}: {output_vertices:,} vertices, "
        f"{output_triangles:,} triangles; restored {len(restored)} part(s), "
        f"collapsed {collapsed} quantization child node(s)"
    )


if __name__ == "__main__":
    main()
