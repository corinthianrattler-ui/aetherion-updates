#!/usr/bin/env python3
"""Build the final mobile Valkorion wardrobe from the two approved Tripo exports.

The royal-costume export faces a different axis than the complete-kit export.
The complete kit contains a duplicate of the same human split into ten named
parts, so those duplicate parts are used as alignment landmarks and omitted
from the release.  The resulting GLB keeps the user's authored armor, weapon,
and cape placement while exposing stable equipment groups for the game.
"""

from __future__ import annotations

import argparse
import copy
import json
import re
import struct
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import numpy as np
import pyfqmr
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from scipy.spatial import cKDTree

MODEL_VERSION = "1.63.0"
BODY_PATTERN = re.compile(r"(?:HUMAN|BODY)_PART_(\d+)")

JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942
COMPONENT_DTYPES = {
    5120: np.int8,
    5121: np.uint8,
    5122: np.int16,
    5123: np.uint16,
    5125: np.uint32,
    5126: np.float32,
}
COMPONENT_COUNTS = {
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4,
    "MAT2": 4,
    "MAT3": 9,
    "MAT4": 16,
}


def load_glb(path: Path) -> tuple[dict, bytes]:
    data = path.read_bytes()
    if len(data) < 20:
        raise ValueError(f"{path.name}: file is too short to be a GLB")
    magic, version, declared_length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or declared_length != len(data):
        raise ValueError(f"{path.name}: invalid GLB 2.0 header")
    document = None
    binary = b""
    offset = 12
    while offset + 8 <= len(data):
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_length]
        offset += chunk_length
        if chunk_type == JSON_CHUNK:
            document = json.loads(chunk.rstrip(b" \t\r\n\0"))
        elif chunk_type == BIN_CHUNK:
            binary = chunk
    if document is None or len(document.get("buffers", [])) != 1:
        raise ValueError(f"{path.name}: one embedded GLB buffer is required")
    return document, binary


def read_accessor(document: dict, binary: bytes, index: int) -> np.ndarray:
    accessor = document["accessors"][index]
    if "sparse" in accessor:
        raise ValueError("sparse accessors are not supported")
    view = document["bufferViews"][accessor["bufferView"]]
    dtype = np.dtype(COMPONENT_DTYPES[accessor["componentType"]]).newbyteorder("<")
    components = COMPONENT_COUNTS[accessor["type"]]
    offset = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    stride = view.get("byteStride", dtype.itemsize * components)
    values = np.ndarray(
        (accessor["count"], components),
        dtype=dtype,
        buffer=binary,
        offset=offset,
        strides=(stride, dtype.itemsize),
    )
    return np.ascontiguousarray(values)


class GlbBuilder:
    def __init__(self) -> None:
        self.binary = bytearray()
        self.buffer_views: list[dict] = []
        self.accessors: list[dict] = []

    def align(self) -> None:
        self.binary.extend(b"\0" * ((-len(self.binary)) % 4))

    def add_bytes(self, data: bytes, *, target: int | None = None, name: str | None = None) -> int:
        self.align()
        view = {"buffer": 0, "byteOffset": len(self.binary), "byteLength": len(data)}
        if target is not None:
            view["target"] = target
        if name:
            view["name"] = name
        self.binary.extend(data)
        self.buffer_views.append(view)
        return len(self.buffer_views) - 1

    def add_accessor(
        self,
        array: np.ndarray,
        *,
        component_type: int,
        accessor_type: str,
        target: int,
        name: str,
        include_bounds: bool = False,
        normalized: bool = False,
    ) -> int:
        dtype = np.dtype(COMPONENT_DTYPES[component_type]).newbyteorder("<")
        array = np.ascontiguousarray(array, dtype=dtype)
        view = self.add_bytes(array.tobytes(), target=target, name=f"{name}_VIEW")
        accessor = {
            "bufferView": view,
            "byteOffset": 0,
            "componentType": component_type,
            "count": int(array.shape[0]),
            "type": accessor_type,
            "name": name,
        }
        if normalized:
            accessor["normalized"] = True
        if include_bounds and array.size:
            accessor["min"] = np.min(array, axis=0).astype(float).tolist()
            accessor["max"] = np.max(array, axis=0).astype(float).tolist()
        self.accessors.append(accessor)
        return len(self.accessors) - 1


def write_glb(path: Path, document: dict, binary: bytearray) -> None:
    binary_data = bytes(binary)
    binary_data += b"\0" * ((-len(binary_data)) % 4)
    document["buffers"] = [{"byteLength": len(binary_data), "name": "VALKORION_FINAL_BUFFER"}]
    json_data = json.dumps(document, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    json_data += b" " * ((-len(json_data)) % 4)
    total = 12 + 8 + len(json_data) + 8 + len(binary_data)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as stream:
        stream.write(struct.pack("<4sII", b"glTF", 2, total))
        stream.write(struct.pack("<II", len(json_data), JSON_CHUNK))
        stream.write(json_data)
        stream.write(struct.pack("<II", len(binary_data), BIN_CHUNK))
        stream.write(binary_data)

FOUNDATION_GROUPS = {
    "foundation__head",
    "foundation__torso",
    "foundation__arms",
    "foundation__hands",
    "foundation__legs",
    "foundation__feet",
}

ROYAL_GROUPS = {
    "gear__royal_head",
    "gear__royal_underlayer",
    "gear__royal_body",
    "gear__royal_shoulders",
    "gear__royal_hands",
    "gear__royal_waist",
    "gear__royal_legs",
    "gear__royal_feet",
    "gear__royal_cloak",
    "gear__royal_jewelry",
}

WEAPON_GROUPS = {
    "gear__dominus_bow",
    "gear__dominus_kite_shield",
    "gear__dominus_dagger",
    "gear__dominus_sword",
    "gear__dominus_quiver",
    "gear__dominus_thorn_whip",
    "gear__dominus_signet",
}

ARMOR_GROUPS = {
    "SLOT_HELMET",
    "SLOT_GORGET",
    "SLOT_PAULDRONS",
    "SLOT_CUIRASS",
    "SLOT_UNDERCOAT",
    "SLOT_GAUNTLETS",
    "SLOT_BELT",
    "SLOT_TROUSERS",
    "SLOT_GREAVES",
    "SLOT_BOOTS",
    "SLOT_CLOAK",
    "SLOT_SCABBARD",
}

CATEGORY_TARGETS = {
    "foundation": 125_000,
    "royal": 100_000,
    "armor": 105_000,
    "helmet_gauntlets": 45_000,
    "cape": 35_000,
    "weapons": 85_000,
    "legacy": 20_000,
}


@dataclass(frozen=True)
class Source:
    key: str
    path: Path
    document: dict
    binary: bytes


@dataclass
class Part:
    source: Source
    source_node: int
    group: str
    category: str
    label: str
    face_filter: Callable[[np.ndarray], np.ndarray] | None = None
    source_triangles: int = 0
    target_triangles: int = 0


def decoded_accessor(source: Source, index: int) -> np.ndarray:
    """Read an accessor and apply glTF normalized-integer conversion."""
    values = read_accessor(source.document, source.binary, index)
    accessor = source.document["accessors"][index]
    if not accessor.get("normalized"):
        return values
    component_type = accessor["componentType"]
    values = values.astype(np.float32)
    if component_type == 5120:
        return np.maximum(values / 127.0, -1.0)
    if component_type == 5121:
        return values / 255.0
    if component_type == 5122:
        return np.maximum(values / 32767.0, -1.0)
    if component_type == 5123:
        return values / 65535.0
    raise ValueError(f"unsupported normalized component type {component_type}")


def node_map(source: Source) -> dict[str, int]:
    return {node.get("name", ""): index for index, node in enumerate(source.document["nodes"])}


def numbered_node(source: Source, family: str, number: int) -> int:
    marker = f"{family}_PART_{number:02d}_tripo"
    matches = [
        index
        for index, node in enumerate(source.document["nodes"])
        if marker in node.get("name", "") and "mesh" in node
    ]
    if len(matches) != 1:
        raise ValueError(f"{source.path.name}: expected one {marker} node, found {matches}")
    return matches[0]


def body_part_node(source: Source, family: str, number: int) -> int:
    marker = f"{family}_PART_{number:02d}_"
    matches = [
        index
        for index, node in enumerate(source.document["nodes"])
        if marker in node.get("name", "") and "mesh" in node
    ]
    if len(matches) != 1:
        raise ValueError(f"{source.path.name}: expected one {marker} node, found {matches}")
    return matches[0]


def primitive_arrays(source: Source, node_index: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, int]:
    node = source.document["nodes"][node_index]
    mesh = source.document["meshes"][node["mesh"]]
    if len(mesh.get("primitives", [])) != 1:
        raise ValueError(f"{node.get('name')}: expected one primitive")
    primitive = mesh["primitives"][0]
    if primitive.get("mode", 4) != 4 or "indices" not in primitive:
        raise ValueError(f"{node.get('name')}: indexed TRIANGLES required")
    attributes = primitive["attributes"]
    if not {"POSITION", "NORMAL", "TEXCOORD_0"} <= set(attributes):
        raise ValueError(f"{node.get('name')}: missing a required vertex stream")
    positions = decoded_accessor(source, attributes["POSITION"]).astype(np.float32)
    normals = decoded_accessor(source, attributes["NORMAL"]).astype(np.float32)
    uvs = decoded_accessor(source, attributes["TEXCOORD_0"]).astype(np.float32)
    faces = decoded_accessor(source, primitive["indices"]).reshape((-1, 3)).astype(np.uint32)
    return positions, normals, uvs, faces, primitive.get("material", 0)


def compact_faces(
    positions: np.ndarray,
    normals: np.ndarray,
    uvs: np.ndarray,
    faces: np.ndarray,
    selected: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    faces = faces[selected]
    used = np.unique(faces.reshape(-1))
    remap = np.full(len(positions), -1, dtype=np.int64)
    remap[used] = np.arange(len(used), dtype=np.int64)
    return positions[used], normals[used], uvs[used], remap[faces].astype(np.uint32)


def part_arrays(part: Part) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, int]:
    positions, normals, uvs, faces, material = primitive_arrays(part.source, part.source_node)
    if part.face_filter is not None:
        selected = np.asarray(part.face_filter(positions[faces].mean(axis=1)), dtype=bool)
        if len(selected) != len(faces) or not np.any(selected):
            raise ValueError(f"{part.label}: face filter selected no geometry")
        positions, normals, uvs, faces = compact_faces(positions, normals, uvs, faces, selected)
    return positions, normals, uvs, faces, material


def quantiles(points: np.ndarray, axis: int, values: np.ndarray) -> np.ndarray:
    return np.quantile(points[:, axis], values)


def alignment_transform(foundation: Source, kit: Source) -> tuple[np.ndarray, np.ndarray, dict]:
    """Solve the foundation-to-kit axis/scale transform from ten body landmarks."""
    qs = np.array([0.0, 0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99, 1.0])
    mappings = ((2, -1.0), (1, 1.0), (0, 1.0))
    matrix = np.zeros((3, 3), dtype=np.float64)
    offset = np.zeros(3, dtype=np.float64)
    metrics = []
    kit_body_points = []

    for target_axis, (source_axis, sign) in enumerate(mappings):
        x_values: list[float] = []
        y_values: list[float] = []
        for number in range(1, 11):
            source_points = primitive_arrays(
                foundation, body_part_node(foundation, "HUMAN", number)
            )[0]
            target_points = primitive_arrays(
                kit, body_part_node(kit, "BODY", number)
            )[0]
            source_qs = qs if sign > 0 else 1.0 - qs
            x_values.extend((quantiles(source_points, source_axis, source_qs) * sign).tolist())
            y_values.extend(quantiles(target_points, target_axis, qs).tolist())
            if target_axis == 0:
                kit_body_points.append(target_points)
        x = np.asarray(x_values)
        y = np.asarray(y_values)
        scale, intercept = np.polyfit(x, y, 1)
        residual = y - (scale * x + intercept)
        matrix[target_axis, source_axis] = scale * sign
        offset[target_axis] = intercept
        metrics.append(
            {
                "targetAxis": target_axis,
                "sourceAxis": source_axis,
                "sign": sign,
                "scale": float(scale),
                "offset": float(intercept),
                "rmse": float(np.sqrt(np.mean(residual**2))),
                "maxError": float(np.max(np.abs(residual))),
            }
        )

    target_body = np.concatenate(kit_body_points)
    target_low = target_body.min(axis=0)
    target_high = target_body.max(axis=0)
    recenter = np.array(
        [-(target_low[0] + target_high[0]) * 0.5, -target_low[1], -(target_low[2] + target_high[2]) * 0.5],
        dtype=np.float64,
    )
    offset += recenter
    metadata = {
        "method": "ten-part quantile landmark fit",
        "matrix": matrix.tolist(),
        "offset": offset.tolist(),
        "kitRecentering": recenter.tolist(),
        "axisFits": metrics,
    }
    if max(metric["rmse"] for metric in metrics) > 0.012:
        raise ValueError(f"foundation/kit alignment residual is too large: {metrics}")
    return matrix, offset, metadata


def transformed(
    positions: np.ndarray,
    normals: np.ndarray,
    matrix: np.ndarray,
    offset: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    positions = positions.astype(np.float64) @ matrix.T + offset
    normal_matrix = np.linalg.inv(matrix)
    normals = normals.astype(np.float64) @ normal_matrix
    lengths = np.linalg.norm(normals, axis=1)
    good = lengths > 1e-20
    normals[good] /= lengths[good, None]
    return positions.astype(np.float32), normals.astype(np.float32)


def vertex_components(vertex_count: int, faces: np.ndarray) -> np.ndarray:
    a = np.concatenate((faces[:, 0], faces[:, 1], faces[:, 2]))
    b = np.concatenate((faces[:, 1], faces[:, 2], faces[:, 0]))
    graph = coo_matrix(
        (np.ones(len(a), dtype=np.uint8), (a, b)),
        shape=(vertex_count, vertex_count),
    ).tocsr()
    _, labels = connected_components(graph, directed=False, return_labels=True)
    return labels.astype(np.int32, copy=False)


def surface_normals(points: np.ndarray, faces: np.ndarray) -> np.ndarray:
    normals = np.zeros_like(points, dtype=np.float64)
    face_normals = np.cross(
        points[faces[:, 1]] - points[faces[:, 0]],
        points[faces[:, 2]] - points[faces[:, 0]],
    )
    np.add.at(normals, faces[:, 0], face_normals)
    np.add.at(normals, faces[:, 1], face_normals)
    np.add.at(normals, faces[:, 2], face_normals)
    lengths = np.linalg.norm(normals, axis=1)
    good = lengths > 1e-20
    normals[good] /= lengths[good, None]
    return normals


def transfer_attributes_by_island(
    old_points: np.ndarray,
    old_normals: np.ndarray,
    old_uvs: np.ndarray,
    old_faces: np.ndarray,
    new_points: np.ndarray,
    new_faces: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, float]:
    old_labels = vertex_components(len(old_points), old_faces)
    new_labels = vertex_components(len(new_points), new_faces)
    tree = cKDTree(old_points)
    k = min(24, len(old_points))
    distances, candidates = tree.query(new_points, k=k, workers=-1)
    if k == 1:
        distances = distances[:, None]
        candidates = candidates[:, None]
    candidate_labels = old_labels[candidates]
    selected = np.empty(len(new_points), dtype=np.int64)
    cache: dict[int, tuple[cKDTree, np.ndarray]] = {}

    order = np.argsort(new_labels, kind="stable")
    groups = np.split(order, np.flatnonzero(np.diff(new_labels[order])) + 1)
    for group in groups:
        source_label = int(np.bincount(candidate_labels[group].reshape(-1)).argmax())
        allowed = candidate_labels[group] == source_label
        masked = np.where(allowed, distances[group], np.inf)
        columns = np.argmin(masked, axis=1)
        valid = np.isfinite(masked[np.arange(len(group)), columns])
        if np.any(valid):
            selected[group[valid]] = candidates[group[valid], columns[valid]]
        if not np.all(valid):
            component = cache.get(source_label)
            if component is None:
                source_indices = np.flatnonzero(old_labels == source_label)
                component = (cKDTree(old_points[source_indices]), source_indices)
                cache[source_label] = component
            component_tree, source_indices = component
            _, local = component_tree.query(new_points[group[~valid]], k=1)
            selected[group[~valid]] = source_indices[local]

    # A simplifier can join tiny artificial Tripo islands. If the dominant
    # island is spatially wrong for an outlier, retain seam safety for normal
    # vertices but fall back to the nearest normal-compatible candidate there.
    selected_distance = np.linalg.norm(new_points - old_points[selected], axis=1)
    nearest_distance = distances[:, 0]
    suspicious = selected_distance > np.maximum(0.005, nearest_distance * 4.0 + 1e-6)
    if np.any(suspicious):
        generated_normals = surface_normals(new_points, new_faces)
        candidate_normals = old_normals[candidates[suspicious]]
        normal_score = np.einsum(
            "nkj,nj->nk", candidate_normals, generated_normals[suspicious]
        )
        scale = max(float(np.linalg.norm(np.ptp(old_points, axis=0))), 1e-9)
        score = normal_score - (distances[suspicious] / scale) * 3.0
        best_column = np.argmax(score, axis=1)
        selected[suspicious] = candidates[suspicious, best_column]

    selected_distance = np.linalg.norm(new_points - old_points[selected], axis=1)
    still_far = selected_distance > np.maximum(0.01, nearest_distance * 4.0 + 1e-6)
    if np.any(still_far):
        selected[still_far] = candidates[still_far, 0]

    normals = old_normals[selected].astype(np.float32, copy=True)
    lengths = np.linalg.norm(normals, axis=1)
    good = lengths > 1e-20
    normals[good] /= lengths[good, None]
    uvs = old_uvs[selected].astype(np.float32, copy=True)
    error = np.linalg.norm(new_points - old_points[selected], axis=1)
    return normals, uvs, float(np.max(error, initial=0.0))


def simplify(
    positions: np.ndarray,
    normals: np.ndarray,
    uvs: np.ndarray,
    faces: np.ndarray,
    target: int,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, float]:
    if target >= len(faces):
        return positions, normals, uvs, faces, 0.0
    tool = pyfqmr.Simplify()
    tool.setMesh(positions.astype(np.float64), faces.astype(np.int32))
    tool.simplify_mesh(
        target_count=max(4, target),
        update_rate=5,
        aggressiveness=7.0,
        max_iterations=100,
        verbose=False,
        preserve_border=False,
    )
    new_positions, new_faces, _ = tool.getMesh()
    new_positions = np.ascontiguousarray(new_positions, dtype=np.float32)
    new_faces = np.ascontiguousarray(new_faces, dtype=np.uint32)
    new_normals, new_uvs, error = transfer_attributes_by_island(
        positions, normals, uvs, faces, new_positions, new_faces
    )
    return new_positions, new_normals, new_uvs, new_faces, error


class ReleaseBuilder:
    def __init__(self, alignment: dict):
        self.glb = GlbBuilder()
        self.samplers: list[dict] = []
        self.images: list[dict] = []
        self.textures: list[dict] = []
        self.materials: list[dict] = []
        self.meshes: list[dict] = []
        self.nodes: list[dict] = [
            {
                "name": "VALKORION_FINAL",
                "children": [],
                "extras": {
                    "aetherionVersion": MODEL_VERSION,
                    "alignment": alignment,
                    "duplicateKitBodyRemoved": True,
                },
            }
        ]
        self.groups: dict[str, int] = {}
        self.material_cache: dict[tuple[str, int], int] = {}
        self.sampler_cache: dict[tuple[str, int], int] = {}
        self.image_cache: dict[tuple[str, int], int] = {}
        self.texture_cache: dict[tuple[str, int], int] = {}
        self.extensions_used: set[str] = set()

        for name in sorted(FOUNDATION_GROUPS | ROYAL_GROUPS | WEAPON_GROUPS):
            self.add_group(name, 0)
        armor_root = len(self.nodes)
        self.nodes.append(
            {
                "name": "VALKORION_DOMINUS_ARMOR",
                "children": [],
                "extras": {"aetherionEquipmentRoot": True},
            }
        )
        self.nodes[0]["children"].append(armor_root)
        for name in sorted(ARMOR_GROUPS):
            self.add_group(name, armor_root)

    def add_group(self, name: str, parent: int) -> None:
        equipment = name not in FOUNDATION_GROUPS
        index = len(self.nodes)
        self.nodes.append(
            {
                "name": name,
                "children": [],
                "extras": {
                    "aetherionEquipment": equipment,
                    "defaultVisible": not equipment,
                    "toggleAsUnit": True,
                },
            }
        )
        self.nodes[parent]["children"].append(index)
        self.groups[name] = index

    def copy_sampler(self, source: Source, old_index: int) -> int:
        key = (source.key, old_index)
        if key not in self.sampler_cache:
            item = copy.deepcopy(source.document.get("samplers", [])[old_index])
            item["name"] = f"{source.key}_{item.get('name', f'sampler_{old_index}')}"
            self.sampler_cache[key] = len(self.samplers)
            self.samplers.append(item)
        return self.sampler_cache[key]

    def copy_image(self, source: Source, old_index: int) -> int:
        key = (source.key, old_index)
        if key not in self.image_cache:
            image = copy.deepcopy(source.document["images"][old_index])
            image["name"] = f"{source.key}_{image.get('name', f'image_{old_index}')}"
            if "bufferView" not in image or "uri" in image:
                raise ValueError(f"{source.path.name}: embedded image required")
            view = source.document["bufferViews"][image["bufferView"]]
            start = view.get("byteOffset", 0)
            data = source.binary[start : start + view["byteLength"]]
            image["bufferView"] = self.glb.add_bytes(data, name=f"{source.key}_image_{old_index}")
            self.image_cache[key] = len(self.images)
            self.images.append(image)
        return self.image_cache[key]

    def copy_texture(self, source: Source, old_index: int) -> int:
        key = (source.key, old_index)
        if key not in self.texture_cache:
            texture = copy.deepcopy(source.document["textures"][old_index])
            texture["name"] = f"{source.key}_{texture.get('name', f'texture_{old_index}')}"
            if "source" in texture:
                texture["source"] = self.copy_image(source, texture["source"])
            if "sampler" in texture:
                texture["sampler"] = self.copy_sampler(source, texture["sampler"])
            self.texture_cache[key] = len(self.textures)
            self.textures.append(texture)
        return self.texture_cache[key]

    def copy_material(self, source: Source, old_index: int) -> int:
        key = (source.key, old_index)
        if key in self.material_cache:
            return self.material_cache[key]
        material = copy.deepcopy(source.document["materials"][old_index])
        material["name"] = f"{source.key}_{material.get('name', f'material_{old_index}')}"

        def visit(value, parent_key: str = "") -> None:
            if isinstance(value, dict):
                extensions = value.get("extensions")
                if isinstance(extensions, dict):
                    self.extensions_used.update(extensions)
                if "texture" in parent_key.lower() and isinstance(value.get("index"), int):
                    value["index"] = self.copy_texture(source, value["index"])
                for child_key, child in value.items():
                    visit(child, child_key)
            elif isinstance(value, list):
                for child in value:
                    visit(child, parent_key)

        visit(material)
        self.material_cache[key] = len(self.materials)
        self.materials.append(material)
        return self.material_cache[key]

    def add_part(
        self,
        part: Part,
        arrays: tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray],
        source_material: int,
        error: float,
    ) -> None:
        positions, normals, uvs, faces = arrays
        label = re.sub(r"[^A-Za-z0-9_]+", "_", part.label)
        position_accessor = self.glb.add_accessor(
            positions.astype(np.float32),
            component_type=5126,
            accessor_type="VEC3",
            target=34962,
            name=f"{label}_POSITION",
            include_bounds=True,
        )
        packed_normals = np.rint(np.clip(normals, -1.0, 1.0) * 127).astype(np.int8)
        packed_uvs = np.rint(np.clip(uvs, 0.0, 1.0) * 65535).astype(np.uint16)
        normal_accessor = self.glb.add_accessor(
            packed_normals,
            component_type=5120,
            accessor_type="VEC3",
            target=34962,
            name=f"{label}_NORMAL",
            normalized=True,
        )
        uv_accessor = self.glb.add_accessor(
            packed_uvs,
            component_type=5123,
            accessor_type="VEC2",
            target=34962,
            name=f"{label}_TEXCOORD_0",
            normalized=True,
        )
        if len(positions) <= 65_535:
            indices = faces.astype(np.uint16).reshape(-1)
            component_type = 5123
        else:
            indices = faces.astype(np.uint32).reshape(-1)
            component_type = 5125
        index_accessor = self.glb.add_accessor(
            indices,
            component_type=component_type,
            accessor_type="SCALAR",
            target=34963,
            name=f"{label}_INDICES",
        )
        material = self.copy_material(part.source, source_material)
        mesh_index = len(self.meshes)
        self.meshes.append(
            {
                "name": f"{label}__mesh",
                "primitives": [
                    {
                        "attributes": {
                            "POSITION": position_accessor,
                            "NORMAL": normal_accessor,
                            "TEXCOORD_0": uv_accessor,
                        },
                        "indices": index_accessor,
                        "material": material,
                        "mode": 4,
                    }
                ],
            }
        )
        node_index = len(self.nodes)
        self.nodes.append(
            {
                "name": f"part__{label}",
                "mesh": mesh_index,
                "extras": {
                    "aetherionPart": True,
                    "slot": part.group,
                    "sourceFile": part.source.path.name,
                    "sourceNode": part.source.document["nodes"][part.source_node].get("name", ""),
                    "sourceTriangles": part.source_triangles,
                    "releaseTriangles": int(len(faces)),
                    "maxAttributeTransferDistance": error,
                },
            }
        )
        self.nodes[self.groups[part.group]]["children"].append(node_index)

    def document(self, stats: dict) -> dict:
        document = {
            "asset": {
                "version": "2.0",
                "generator": "Aetherion final Valkorion wardrobe builder 1.63.0",
            },
            "scene": 0,
            "scenes": [{"name": "Valkorion Final Modular Wardrobe", "nodes": [0]}],
            "nodes": self.nodes,
            "meshes": self.meshes,
            "accessors": self.glb.accessors,
            "bufferViews": self.glb.buffer_views,
            "materials": self.materials,
            "textures": self.textures,
            "images": self.images,
            "samplers": self.samplers,
            "extras": {
                "aetherionVersion": MODEL_VERSION,
                "equipmentNodes": sorted(ROYAL_GROUPS | WEAPON_GROUPS | ARMOR_GROUPS),
                "foundationNodes": sorted(FOUNDATION_GROUPS),
                "buildStats": stats,
            },
        }
        if self.extensions_used:
            document["extensionsUsed"] = sorted(self.extensions_used)
        return document


def make_parts(foundation: Source, kit: Source, legacy: Source) -> list[Part]:
    parts: list[Part] = []

    def add(source: Source, family: str, number: int, group: str, category: str, label: str | None = None, face_filter=None):
        parts.append(
            Part(
                source=source,
                source_node=numbered_node(source, family, number),
                group=group,
                category=category,
                label=label or f"{source.key}_{family.lower()}_{number:02d}",
                face_filter=face_filter,
            )
        )

    # New black under-suit body. HUMAN_PART_06 contains the head and one
    # detached hand; split it spatially so the helmet and gauntlets toggle cleanly.
    add(foundation, "HUMAN", 6, "foundation__head", "foundation", "foundation_head", lambda centers: centers[:, 1] >= 0.70)
    add(foundation, "HUMAN", 3, "foundation__torso", "foundation", "foundation_torso")
    for number in (1, 5):
        add(foundation, "HUMAN", number, "foundation__arms", "foundation")
    add(foundation, "HUMAN", 6, "foundation__hands", "foundation", "foundation_hand_left", lambda centers: centers[:, 1] < 0.70)
    add(foundation, "HUMAN", 10, "foundation__hands", "foundation", "foundation_hand_right")
    for number in (4, 7, 9):
        add(foundation, "HUMAN", number, "foundation__legs", "foundation")
    for number in (2, 8):
        add(foundation, "HUMAN", number, "foundation__feet", "foundation")

    # Approved royal outfit: crown, tunic, sleeves, belt, trousers, boots,
    # full back cape, and fitted ring. The tiny one-triangle Tripo remnant is omitted.
    add(foundation, "ROYAL_COSTUME", 12, "gear__royal_head", "royal")
    add(foundation, "ROYAL_COSTUME", 13, "gear__royal_body", "royal")
    for number in (4, 9):
        add(foundation, "ROYAL_COSTUME", number, "gear__royal_shoulders", "royal")
    add(foundation, "ROYAL_COSTUME", 2, "gear__royal_waist", "royal")
    add(foundation, "ROYAL_COSTUME", 7, "gear__royal_legs", "royal")
    for number in (3, 11):
        add(foundation, "ROYAL_COSTUME", number, "gear__royal_feet", "royal")
    add(foundation, "ROYAL_COSTUME", 1, "gear__royal_cloak", "royal")
    add(foundation, "ROYAL_COSTUME", 5, "gear__dominus_signet", "royal", "royal_costume_ring")

    # Final fitted plate set. ARMOR_PART_20 is the rejected old single gauntlet;
    # HELMET_PART_01 and _03 are the approved replacement pair.
    armor_map = {
        "SLOT_GORGET": (12,),
        "SLOT_PAULDRONS": (2, 5, 8, 14),
        "SLOT_CUIRASS": (10,),
        "SLOT_UNDERCOAT": (9,),
        "SLOT_BELT": (11,),
        "SLOT_TROUSERS": (6, 13, 16, 18),
        "SLOT_GREAVES": (7, 17),
        "SLOT_BOOTS": (3, 15),
    }
    for group, numbers in armor_map.items():
        for number in numbers:
            add(kit, "ARMOR", number, group, "armor")
    add(kit, "HELMET", 2, "SLOT_HELMET", "helmet_gauntlets", "approved_helmet")
    for number in (1, 3):
        add(kit, "HELMET", number, "SLOT_GAUNTLETS", "helmet_gauntlets", f"approved_gauntlet_{number}")
    for number in (1, 2, 3, 4):
        add(kit, "CAPE", number, "SLOT_CLOAK", "cape")

    weapon_map = {
        1: "gear__dominus_bow",
        2: "gear__dominus_dagger",
        3: "gear__dominus_quiver",
        4: "SLOT_SCABBARD",
        5: "gear__dominus_kite_shield",
        6: "gear__dominus_sword",
    }
    for number, group in weapon_map.items():
        add(kit, "WEAPONS", number, group, "weapons")

    # These four mechanics exist in the game but were not included as separate
    # geometry in the two final Tripo exports. Retain their already fitted v108
    # meshes so no legitimate equipped item becomes invisible.
    legacy_nodes = node_map(legacy)
    for name in (
        "gear__royal_underlayer",
        "gear__royal_hands",
        "gear__royal_jewelry",
        "gear__dominus_thorn_whip",
    ):
        parts.append(
            Part(
                source=legacy,
                source_node=legacy_nodes[name],
                group=name,
                category="legacy",
                label=f"preserved_{name.removeprefix('gear__')}",
            )
        )
    return parts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--foundation", required=True, type=Path)
    parser.add_argument("--kit", required=True, type=Path)
    parser.add_argument("--legacy", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--full-geometry",
        action="store_true",
        help=(
            "retain every source triangle for a seam-safe intermediate GLB; "
            "the release build is then simplified with gltfpack"
        ),
    )
    args = parser.parse_args()

    sources = {}
    for key, path in (("final_foundation", args.foundation), ("final_kit", args.kit), ("v108_legacy", args.legacy)):
        document, binary = load_glb(path)
        sources[key] = Source(key, path, document, binary)
    foundation = sources["final_foundation"]
    kit = sources["final_kit"]
    legacy = sources["v108_legacy"]

    foundation_matrix, foundation_offset, alignment = alignment_transform(foundation, kit)
    recenter = np.asarray(alignment["kitRecentering"], dtype=np.float64)
    identity = np.eye(3, dtype=np.float64)
    zero = np.zeros(3, dtype=np.float64)
    parts = make_parts(foundation, kit, legacy)

    category_totals = {key: 0 for key in CATEGORY_TARGETS}
    for part in parts:
        arrays = part_arrays(part)
        part.source_triangles = len(arrays[3])
        category_totals[part.category] += part.source_triangles
    for part in parts:
        total = category_totals[part.category]
        budget = CATEGORY_TARGETS[part.category]
        minimum = 900 if part.category not in {"weapons", "helmet_gauntlets"} else 1_800
        part.target_triangles = min(
            part.source_triangles,
            max(minimum, int(round(budget * part.source_triangles / total))),
        )

    builder = ReleaseBuilder(alignment)
    output_triangles = 0
    max_transfer_error = 0.0
    group_counts = {name: 0 for name in FOUNDATION_GROUPS | ROYAL_GROUPS | WEAPON_GROUPS | ARMOR_GROUPS}
    for index, part in enumerate(parts, 1):
        positions, normals, uvs, faces, material = part_arrays(part)
        if part.source is foundation:
            positions, normals = transformed(positions, normals, foundation_matrix, foundation_offset)
        elif part.source is kit:
            positions, normals = transformed(positions, normals, identity, recenter)
        else:
            positions, normals = transformed(positions, normals, identity, zero)

        if args.full_geometry:
            error = 0.0
        else:
            positions, normals, uvs, faces, error = simplify(
                positions, normals, uvs, faces, part.target_triangles
            )
        builder.add_part(part, (positions, normals, uvs, faces), material, error)
        output_triangles += len(faces)
        max_transfer_error = max(max_transfer_error, error)
        group_counts[part.group] += 1
        print(
            f"[{index:02d}/{len(parts):02d}] {part.group:31s} {part.label:35s} "
            f"{part.source_triangles:7,d} -> {len(faces):6,d} triangles; UV transfer {error:.6g}",
            flush=True,
        )

    stats = {
        "sourceTriangles": int(sum(category_totals.values())),
        "releaseTriangles": int(output_triangles),
        "categorySourceTriangles": category_totals,
        "categoryBudgets": CATEGORY_TARGETS,
        "groupPartCounts": group_counts,
        "maxAttributeTransferDistance": float(max_transfer_error),
        "discarded": {
            "kitDuplicateBodyParts": 10,
            "rejectedOldSingleGauntlet": "BODY_ARMOR_PART_01_ARMOR_PART_20",
            "degenerateRoyalTriangle": "ROYAL_COSTUME_PART_06",
        },
    }
    document = builder.document(stats)
    write_glb(args.output, document, builder.glb.binary)
    print(json.dumps({"output": str(args.output), "sizeBytes": args.output.stat().st_size, **stats}, indent=2))


if __name__ == "__main__":
    main()
