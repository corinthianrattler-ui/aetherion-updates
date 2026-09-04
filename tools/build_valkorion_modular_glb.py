#!/usr/bin/env python3
"""Build Aetherion's fitted modular Valkorion GLB from the five supplied Tripo sets.

The uploads are high-density display collections: every source contains one mesh,
one material, and several disconnected objects arranged on a presentation board.
This tool separates those objects by their authored layout, fits them to the shared
foundation body, simplifies each piece independently, and writes one standard GLB
whose named nodes can be switched by Aetherion's equipment state.
"""

from __future__ import annotations

import argparse
import io
import json
import math
import struct
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import fast_simplification
import numpy as np
from PIL import Image


COMPONENT_DTYPES = {
    5120: np.int8,
    5121: np.uint8,
    5122: np.int16,
    5123: np.uint16,
    5125: np.uint32,
    5126: np.float32,
}
TYPE_WIDTHS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}


@dataclass
class Source:
    name: str
    document: dict
    binary: bytes
    positions: np.ndarray
    normals: np.ndarray
    uvs: np.ndarray
    faces: np.ndarray
    images: tuple[bytes, bytes, bytes]  # normal, base color, metallic/roughness


@dataclass(frozen=True)
class Part:
    source: str
    label: int | None
    node: str
    target: tuple[float, float, float, float, float, float]
    faces: int
    rotation_degrees: float = 0.0
    mirror_x: bool = False
    uniform_scale: float | None = None
    reference_labels: tuple[int, ...] | None = None
    preserve_coordinates: bool = False


def parse_glb(path: Path, name: str) -> Source:
    with path.open("rb") as stream:
        magic, version, _ = struct.unpack("<4sII", stream.read(12))
        if magic != b"glTF" or version != 2:
            raise ValueError(f"{path}: expected a glTF 2 binary")
        json_length, json_type = struct.unpack("<II", stream.read(8))
        if json_type != 0x4E4F534A:
            raise ValueError(f"{path}: missing JSON chunk")
        document = json.loads(stream.read(json_length).decode("utf-8").rstrip("\x00 "))
        binary_length, binary_type = struct.unpack("<II", stream.read(8))
        if binary_type != 0x004E4942:
            raise ValueError(f"{path}: missing binary chunk")
        binary = stream.read(binary_length)

    primitive = document["meshes"][0]["primitives"][0]

    def read_accessor(index: int) -> np.ndarray:
        accessor = document["accessors"][index]
        view = document["bufferViews"][accessor["bufferView"]]
        dtype = COMPONENT_DTYPES[accessor["componentType"]]
        width = TYPE_WIDTHS[accessor["type"]]
        byte_offset = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
        values = np.frombuffer(
            binary,
            dtype=dtype,
            count=accessor["count"] * width,
            offset=byte_offset,
        )
        return values.reshape((-1, width)) if width > 1 else values

    material = document["materials"][primitive.get("material", 0)]
    texture_indices = (
        material["normalTexture"]["index"],
        material["pbrMetallicRoughness"]["baseColorTexture"]["index"],
        material["pbrMetallicRoughness"]["metallicRoughnessTexture"]["index"],
    )
    images = []
    for texture_index in texture_indices:
        image_index = document["textures"][texture_index]["source"]
        image = document["images"][image_index]
        view = document["bufferViews"][image["bufferView"]]
        start = view.get("byteOffset", 0)
        images.append(binary[start : start + view["byteLength"]])

    return Source(
        name=name,
        document=document,
        binary=binary,
        positions=read_accessor(primitive["attributes"]["POSITION"]).astype(np.float64),
        normals=read_accessor(primitive["attributes"]["NORMAL"]).astype(np.float64),
        uvs=read_accessor(primitive["attributes"]["TEXCOORD_0"]).astype(np.float64),
        faces=read_accessor(primitive["indices"]).astype(np.int32).reshape((-1, 3)),
        images=tuple(images),
    )


def body_labels(points: np.ndarray) -> np.ndarray:
    x, y = points[:, 0], points[:, 1]
    labels = np.full(len(points), -1, dtype=np.int8)
    labels[y >= 0.835] = 0  # head
    labels[y < 0.09] = 4  # feet
    hands = (y >= 0.285) & (y < 0.465) & (np.abs(x) > 0.095)
    labels[hands] = 5  # hands and cuffs can hide under equipped gauntlets
    arms = (y >= 0.465) & (y < 0.835) & (np.abs(x) > 0.105)
    labels[arms] = 2  # upper sleeves remain independently visible
    labels[(labels < 0) & (y >= 0.47)] = 1  # torso
    labels[labels < 0] = 3  # waist and legs
    return labels


def armor_labels(points: np.ndarray) -> np.ndarray:
    x, y, z = points[:, 0], points[:, 1], points[:, 2]
    labels = np.full(len(points), -1, dtype=np.int8)
    top = y >= 0.75
    labels[top & (x < -0.18)] = 0  # helmet
    labels[top & (x >= -0.18) & (x < 0.115)] = 1  # gorget
    labels[top & (x >= 0.115)] = 2  # pauldrons
    middle = (y >= 0.465) & (y < 0.75)
    labels[middle & (x < -0.065)] = 3  # cuirass
    labels[middle & (x >= -0.065)] = 4  # arming doublet
    lower = (y >= 0.285) & (y < 0.465)
    labels[lower & (x < -0.16)] = 5  # gauntlets
    labels[lower & (x >= -0.16) & (x < 0.135)] = 6  # belt
    labels[lower & (x >= 0.135)] = 7  # legplates
    bottom = y < 0.285
    labels[bottom & (x < -0.015)] = 8  # boots
    # The lower cloak and the left legplate overlap in the board's front view;
    # their authored depth separates them cleanly.
    low_legplate = bottom & (x >= 0.135) & (y >= 0.20) & (z < 0.04)
    labels[low_legplate] = 7
    labels[bottom & (x >= -0.015) & ~low_legplate] = 9  # cloak
    return labels


def royal_labels(points: np.ndarray) -> np.ndarray:
    x, y, z = points[:, 0], points[:, 1], points[:, 2]
    labels = np.full(len(points), -1, dtype=np.int8)

    # Two large pieces across the upper display. Their hems sit at different
    # heights, so keep the full cloak tail out of the lower accessories.
    labels[(y >= 0.385) & (x < 0.04)] = 0  # cloak
    coat = (y >= 0.55) & (x >= 0.04)
    outer = (x < 0.125) | (x > 0.295)
    labels[coat & outer & (y >= 0.77)] = 3  # shoulders / upper sleeves
    labels[coat & outer & (y < 0.77)] = 4  # gloves / lower sleeves
    labels[coat & ~((outer & (y >= 0.77)) | (outer & (y < 0.77)))] = 2  # coat body

    # Lower display: boots, sword belt, cravat, crown, and trousers. The crown
    # and trouser boots overlap in X/Y but sit on opposite sides of the board in Z.
    lower = labels < 0
    labels[lower & (x < -0.075) & (y < 0.385)] = 8  # boots
    crown = lower & (z > 0) & (((y < 0.14) & (x >= 0.025)) | ((y < 0.19) & (x >= 0.12)))
    labels[crown] = 6
    lower = labels < 0
    labels[lower & (x >= 0.22) & (y < 0.55)] = 7  # trousers
    lower = labels < 0
    labels[lower & (y >= 0.27) & (y < 0.55)] = 5  # waist belt
    lower = labels < 0
    labels[lower & (y < 0.29) & (x < 0.14)] = 1  # cravat / tunic detail
    lower = labels < 0
    labels[lower & (y < 0.27)] = 6  # remaining crown ornaments
    # Border triangles follow the nearest neighboring lower-display item.
    lower = labels < 0
    labels[lower & (x < 0.14)] = 1
    labels[labels < 0] = 7
    return labels


def weapon_labels(points: np.ndarray) -> np.ndarray:
    x, y = points[:, 0], points[:, 1]
    labels = np.full(len(points), -1, dtype=np.int8)
    labels[x < -0.17] = 0  # bow
    labels[(x >= -0.17) & (x < 0.145) & (y >= 0.30)] = 1  # shield
    labels[(x >= -0.17) & (x < 0.17) & (y < 0.30)] = 2  # dagger
    labels[(x >= 0.17) & (y < 0.46)] = 3  # sword
    labels[(x >= 0.285) & (y >= 0.46)] = 5  # thorn whip
    labels[(labels < 0) & (x >= 0.10) & (y >= 0.46)] = 4  # quiver
    return labels


def jewelry_labels(points: np.ndarray) -> np.ndarray:
    labels = np.zeros(len(points), dtype=np.int8)
    labels[points[:, 0] >= 0] = 1  # signet ring; left side is the necklace
    return labels


CLASSIFIERS: dict[str, Callable[[np.ndarray], np.ndarray]] = {
    "body": body_labels,
    "armor": armor_labels,
    "royal": royal_labels,
    "weapons": weapon_labels,
    "jewelry": jewelry_labels,
}


PARTS = (
    # All six nodes come from one globally simplified body and retain its exact
    # shared coordinates/normals. The split enables coverage hiding without
    # changing anatomy or opening seams in the foundation loadout.
    Part("body", 0, "foundation__head", (0, 0, 0, 0, 0, 0), 1000000, preserve_coordinates=True),
    Part("body", 1, "foundation__torso", (0, 0, 0, 0, 0, 0), 1000000, preserve_coordinates=True),
    Part("body", 2, "foundation__arms", (0, 0, 0, 0, 0, 0), 1000000, preserve_coordinates=True),
    Part("body", 5, "foundation__hands", (0, 0, 0, 0, 0, 0), 1000000, preserve_coordinates=True),
    Part("body", 3, "foundation__legs", (0, 0, 0, 0, 0, 0), 1000000, preserve_coordinates=True),
    Part("body", 4, "foundation__feet", (0, 0, 0, 0, 0, 0), 1000000, preserve_coordinates=True),

    Part("armor", 0, "gear__dominus_lord_helm", (-0.087, 0.087, 0.825, 1.018, -0.112, 0.135), 14000, uniform_scale=1.05),
    Part("armor", 1, "gear__dominus_gorget", (-0.100, 0.100, 0.735, 0.858, -0.108, 0.125), 9000, uniform_scale=0.66),
    Part("armor", 2, "gear__dominus_pauldrons", (-0.205, 0.205, 0.685, 0.845, -0.135, 0.135), 16000, uniform_scale=1.20),
    Part("armor", 3, "gear__dominus_cuirass", (-0.150, 0.150, 0.490, 0.800, -0.125, 0.150), 20000, uniform_scale=1.11),
    Part("armor", 4, "gear__dominus_arming_doublet", (-0.188, 0.188, 0.350, 0.815, -0.120, 0.128), 22000, uniform_scale=1.28),
    Part("armor", 5, "gear__dominus_gauntlets", (-0.205, 0.205, 0.285, 0.475, -0.122, 0.140), 14000, uniform_scale=1.50),
    Part("armor", 6, "gear__dominus_belt", (-0.148, 0.148, 0.440, 0.555, -0.128, 0.145), 9000, uniform_scale=0.95),
    Part("armor", 7, "gear__dominus_legplates", (-0.126, 0.126, 0.135, 0.545, -0.125, 0.138), 22000, uniform_scale=1.30),
    # The board already contains the authored boot pair; do not mirror it.
    Part("armor", 8, "gear__dominus_boots", (-0.140, 0.140, 0.005, 0.205, -0.125, 0.150), 16000, uniform_scale=0.72),
    Part("armor", 9, "gear__dominus_cloak", (-0.205, 0.205, 0.265, 0.690, -0.160, -0.086), 24000, uniform_scale=1.38),

    Part("royal", 0, "gear__royal_cloak", (-0.215, 0.215, 0.150, 0.825, -0.165, -0.090), 26000, uniform_scale=1.03),
    Part("royal", 1, "gear__royal_underlayer", (-0.060, 0.060, 0.735, 0.835, 0.090, 0.145), 7000, uniform_scale=0.70),
    Part("royal", 2, "gear__royal_body", (-0.190, 0.190, 0.340, 0.855, -0.095, 0.115), 23000, uniform_scale=1.25, reference_labels=(2, 3, 4)),
    Part("royal", 3, "gear__royal_shoulders", (-0.190, 0.190, 0.340, 0.855, -0.095, 0.115), 12000, uniform_scale=1.25, reference_labels=(2, 3, 4)),
    Part("royal", 4, "gear__royal_hands", (-0.190, 0.190, 0.340, 0.855, -0.095, 0.115), 10000, uniform_scale=1.25, reference_labels=(2, 3, 4)),
    Part("royal", 5, "gear__royal_waist", (-0.150, 0.150, 0.450, 0.540, -0.110, 0.130), 9000, uniform_scale=0.90),
    Part("royal", 6, "gear__royal_head", (-0.090, 0.090, 0.965, 1.095, -0.095, 0.128), 12000, uniform_scale=0.76),
    Part("royal", 7, "gear__royal_legs", (-0.112, 0.112, 0.085, 0.525, -0.110, 0.125), 22000, uniform_scale=0.96),
    Part("royal", 8, "gear__royal_feet", (-0.140, 0.140, 0.010, 0.230, -0.115, 0.145), 16000, uniform_scale=0.74),

    Part("weapons", 0, "gear__dominus_bow", (-0.260, -0.075, 0.110, 0.850, -0.175, -0.125), 15000, -7, uniform_scale=0.79),
    Part("weapons", 1, "gear__dominus_kite_shield", (-0.380, -0.070, 0.255, 0.755, 0.125, 0.190), 24000, 4, uniform_scale=0.76),
    Part("weapons", 2, "gear__dominus_dagger", (-0.185, -0.095, 0.245, 0.535, 0.115, 0.170), 11000, 12, uniform_scale=0.82),
    Part("weapons", 3, "gear__dominus_sword", (0.135, 0.260, 0.000, 0.665, 0.115, 0.172), 15000, -4, uniform_scale=1.15),
    Part("weapons", 4, "gear__dominus_quiver", (0.070, 0.225, 0.405, 0.925, -0.185, -0.125), 17000, -7, uniform_scale=0.99),
    Part("weapons", 5, "gear__dominus_thorn_whip", (-0.385, -0.145, 0.100, 0.655, 0.120, 0.178), 17000, 4, uniform_scale=1.08),

    Part("jewelry", 0, "gear__royal_jewelry", (-0.100, 0.100, 0.655, 0.850, 0.105, 0.153), 18000, uniform_scale=0.20),
    Part("jewelry", 1, "gear__dominus_signet", (-0.183, -0.143, 0.365, 0.420, 0.105, 0.145), 10000, -8, uniform_scale=0.10),
)


def face_labels(source: Source) -> np.ndarray:
    centers = source.positions[source.faces].mean(axis=1)
    return CLASSIFIERS[source.name](centers)


def refine_body_face_labels(source: Source, labels: np.ndarray) -> np.ndarray:
    """Move the detached linen collar out of the persistent head region."""
    head_face_ids = np.flatnonzero(labels == 0)
    head_faces = source.faces[head_face_ids]
    vertices = np.unique(head_faces)
    parent = {int(vertex): int(vertex) for vertex in vertices}

    def find(vertex: int) -> int:
        while parent[vertex] != vertex:
            parent[vertex] = parent[parent[vertex]]
            vertex = parent[vertex]
        return vertex

    def union(left: int, right: int) -> None:
        left_root, right_root = find(left), find(right)
        if left_root != right_root:
            parent[right_root] = left_root

    for a, b, c in head_faces:
        union(int(a), int(b))
        union(int(a), int(c))

    components: dict[int, list[int]] = {}
    for local_index, face in enumerate(head_faces):
        components.setdefault(find(int(face[0])), []).append(local_index)
    refined = labels.copy()
    for local_indices in components.values():
        global_face_ids = head_face_ids[np.asarray(local_indices, dtype=np.int64)]
        points = source.positions[np.unique(source.faces[global_face_ids].reshape(-1))]
        # The two collar surfaces end below the jaw/hair components.
        if points[:, 1].max() < 0.90:
            refined[global_face_ids] = 1
    return refined


def computed_normals(positions: np.ndarray, faces: np.ndarray) -> np.ndarray:
    normals = np.zeros_like(positions, dtype=np.float64)
    triangles = positions[faces]
    face_normals = np.cross(triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0])
    np.add.at(normals, faces[:, 0], face_normals)
    np.add.at(normals, faces[:, 1], face_normals)
    np.add.at(normals, faces[:, 2], face_normals)
    lengths = np.linalg.norm(normals, axis=1)
    normals /= np.maximum(lengths[:, None], 1e-12)
    return normals


def simplify_source(source: Source, target_faces: int) -> Source:
    """Simplify a source once, before it is divided into visibility regions.

    This is essential for the foundation body: simplifying independently after
    cutting it into head/torso/arms/hands/legs/feet creates different border vertices
    and visible seams.  A single global pass keeps every region in one unchanged
    coordinate system and gives duplicated border vertices identical normals.
    """
    if len(source.faces) <= target_faces:
        return source

    _, _, collapses = fast_simplification.simplify(
        source.positions,
        source.faces,
        target_count=target_faces,
        agg=5.0,
        return_collapses=True,
        preserve_border=False,
    )
    positions, faces, mapping = fast_simplification.replay_simplification(
        source.positions.astype(np.float32), source.faces, collapses
    )
    valid = mapping >= 0
    uv_sum = np.zeros((len(positions), 2), dtype=np.float64)
    uv_count = np.zeros(len(positions), dtype=np.int64)
    np.add.at(uv_sum, mapping[valid], source.uvs[valid])
    np.add.at(uv_count, mapping[valid], 1)
    uv_count[uv_count == 0] = 1
    uvs = uv_sum / uv_count[:, None]
    normals = computed_normals(positions, faces)
    print(f"{source.name:10s} global simplify={len(source.faces):7d} -> {len(faces):7d} faces")
    return Source(
        name=source.name,
        document=source.document,
        binary=source.binary,
        positions=np.asarray(positions, dtype=np.float64),
        normals=normals,
        uvs=uvs,
        faces=np.asarray(faces, dtype=np.int32),
        images=source.images,
    )


def fitted_submesh(
    source: Source,
    selected_faces: np.ndarray,
    part: Part,
    reference_faces: np.ndarray | None = None,
):
    if len(selected_faces) < 4:
        raise ValueError(f"{part.node}: selector returned only {len(selected_faces)} faces")
    source_faces = source.faces[selected_faces]
    used, inverse = np.unique(source_faces.reshape(-1), return_inverse=True)
    faces = inverse.reshape((-1, 3)).astype(np.int32)
    positions = source.positions[used].copy()
    source_normals = source.normals[used].copy()
    uvs = source.uvs[used].copy()

    reference_positions = (
        source.positions[np.unique(source.faces[reference_faces].reshape(-1))]
        if reference_faces is not None
        else positions
    )
    low = reference_positions.min(axis=0)
    high = reference_positions.max(axis=0)
    target_low = np.array((part.target[0], part.target[2], part.target[4]), dtype=np.float64)
    target_high = np.array((part.target[1], part.target[3], part.target[5]), dtype=np.float64)
    span = np.maximum(high - low, 1e-8)
    if part.preserve_coordinates:
        pass
    elif part.uniform_scale is not None:
        source_center = (low + high) * 0.5
        target_center = (target_low + target_high) * 0.5
        positions = (positions - source_center) * part.uniform_scale + target_center
    else:
        positions = (positions - low) * ((target_high - target_low) / span) + target_low

    if part.rotation_degrees:
        angle = math.radians(part.rotation_degrees)
        cosine, sine = math.cos(angle), math.sin(angle)
        center = (target_low[:2] + target_high[:2]) * 0.5
        xy = positions[:, :2] - center
        positions[:, 0] = xy[:, 0] * cosine - xy[:, 1] * sine + center[0]
        positions[:, 1] = xy[:, 0] * sine + xy[:, 1] * cosine + center[1]

    if part.mirror_x:
        mirrored = positions.copy()
        mirrored[:, 0] *= -1
        vertex_offset = len(positions)
        positions = np.vstack((positions, mirrored))
        uvs = np.vstack((uvs, uvs.copy()))
        # Reflection flips winding; swap the mirrored triangle's last vertices.
        faces = np.vstack((faces, faces[:, [0, 2, 1]] + vertex_offset))

    original_face_count = len(faces)
    geometry_changed = part.mirror_x
    if original_face_count > part.faces:
        try:
            _, _, collapses = fast_simplification.simplify(
                positions,
                faces,
                target_count=part.faces,
                agg=5.0,
                return_collapses=True,
                # The Tripo display meshes contain thousands of tiny detached
                # ornamental islands. Preserving every island border prevents
                # meaningful reduction and inflates the Android download.
                preserve_border=False,
            )
            positions, faces, mapping = fast_simplification.replay_simplification(
                positions.astype(np.float32), faces, collapses
            )
            valid = mapping >= 0
            uv_sum = np.zeros((len(positions), 2), dtype=np.float64)
            uv_count = np.zeros(len(positions), dtype=np.int64)
            np.add.at(uv_sum, mapping[valid], uvs[valid])
            np.add.at(uv_count, mapping[valid], 1)
            uv_count[uv_count == 0] = 1
            uvs = uv_sum / uv_count[:, None]
            geometry_changed = True
        except Exception as error:
            print(f"warning: {part.node} simplification failed ({error}); retaining source geometry")

    # Foundation regions reuse normals from the globally simplified body. This
    # prevents a lighting seam where two independently emitted nodes meet.
    normals = (
        source_normals
        if part.preserve_coordinates and not geometry_changed
        else computed_normals(positions, faces)
    )

    print(
        f"{part.node:34s} source={original_face_count:7d} output={len(faces):6d} "
        f"vertices={len(positions):6d}"
    )
    return (
        np.ascontiguousarray(positions, dtype=np.float32),
        np.ascontiguousarray(normals, dtype=np.float32),
        np.ascontiguousarray(uvs, dtype=np.float32),
        np.ascontiguousarray(faces),
    )


class GlbBuilder:
    def __init__(self):
        self.binary = bytearray()
        self.document = {
            "asset": {
                "version": "2.0",
                "generator": "Aetherion Valkorion Modular Builder v1.60.0",
            },
            "scene": 0,
            "scenes": [{"name": "Valkorion Modular Equipment", "nodes": []}],
            "nodes": [],
            "meshes": [],
            "materials": [],
            "textures": [],
            "images": [],
            "samplers": [
                {
                    "magFilter": 9729,
                    "minFilter": 9987,
                    "wrapS": 10497,
                    "wrapT": 10497,
                }
            ],
            "accessors": [],
            "bufferViews": [],
            "buffers": [{"byteLength": 0}],
            "extras": {
                "aetherionVersion": "1.60.0",
                "equipmentNodes": [part.node for part in PARTS if part.node.startswith("gear__")],
            },
        }

    def align(self):
        while len(self.binary) % 4:
            self.binary.append(0)

    def append_view(self, data: bytes, target: int | None = None) -> int:
        self.align()
        offset = len(self.binary)
        self.binary.extend(data)
        view = {"buffer": 0, "byteOffset": offset, "byteLength": len(data)}
        if target is not None:
            view["target"] = target
        self.document["bufferViews"].append(view)
        return len(self.document["bufferViews"]) - 1

    def append_accessor(
        self,
        values: np.ndarray,
        component_type: int,
        value_type: str,
        target: int,
        include_bounds: bool = False,
        normalized: bool = False,
    ) -> int:
        view = self.append_view(values.tobytes(order="C"), target)
        record = {
            "bufferView": view,
            "componentType": component_type,
            "count": int(len(values)),
            "type": value_type,
        }
        if include_bounds:
            record["min"] = [float(value) for value in values.min(axis=0)]
            record["max"] = [float(value) for value in values.max(axis=0)]
        if normalized:
            record["normalized"] = True
        self.document["accessors"].append(record)
        return len(self.document["accessors"]) - 1

    def add_material(self, source: Source, maximum_size: int = 768) -> int:
        texture_indices = []
        for channel, original in zip(("normal", "basecolor", "metallicroughness"), source.images):
            image = Image.open(io.BytesIO(original)).convert("RGB")
            image.thumbnail((maximum_size, maximum_size), Image.Resampling.LANCZOS)
            encoded = io.BytesIO()
            image.save(
                encoded,
                format="JPEG",
                quality=88 if channel == "basecolor" else 84,
                optimize=True,
                progressive=True,
            )
            view = self.append_view(encoded.getvalue())
            self.document["images"].append(
                {
                    "name": f"{source.name}_{channel}",
                    "mimeType": "image/jpeg",
                    "bufferView": view,
                }
            )
            self.document["textures"].append(
                {"name": f"{source.name}_{channel}", "sampler": 0, "source": len(self.document["images"]) - 1}
            )
            texture_indices.append(len(self.document["textures"]) - 1)

        normal, basecolor, metallic_roughness = texture_indices
        self.document["materials"].append(
            {
                "name": f"aetherion_{source.name}",
                "doubleSided": True,
                "normalTexture": {"index": normal, "scale": 0.82},
                "pbrMetallicRoughness": {
                    "baseColorTexture": {"index": basecolor},
                    "metallicRoughnessTexture": {"index": metallic_roughness},
                    "baseColorFactor": [1, 1, 1, 1],
                    "metallicFactor": 1,
                    "roughnessFactor": 1,
                },
            }
        )
        return len(self.document["materials"]) - 1

    def add_mesh(self, node_name: str, material: int, arrays):
        positions, normals, uvs, faces = arrays
        position_accessor = self.append_accessor(positions, 5126, "VEC3", 34962, True)
        # glTF allows normalized integer vertex attributes. They preserve the
        # fitted geometry while cutting several MiB from the mobile payload.
        packed_normals = np.rint(np.clip(normals, -1, 1) * 127).astype(np.int8)
        packed_uvs = np.rint(np.clip(uvs, 0, 1) * 65535).astype(np.uint16)
        normal_accessor = self.append_accessor(packed_normals, 5120, "VEC3", 34962, normalized=True)
        uv_accessor = self.append_accessor(packed_uvs, 5123, "VEC2", 34962, normalized=True)
        if len(positions) <= 65535:
            indices = faces.astype(np.uint16).reshape(-1)
            component_type = 5123
        else:
            indices = faces.astype(np.uint32).reshape(-1)
            component_type = 5125
        index_accessor = self.append_accessor(indices, component_type, "SCALAR", 34963)
        self.document["meshes"].append(
            {
                "name": f"{node_name}__mesh",
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
        self.document["nodes"].append(
            {
                "name": node_name,
                "mesh": len(self.document["meshes"]) - 1,
                "extras": {
                    "aetherionEquipment": node_name.startswith("gear__"),
                    "defaultVisible": node_name.startswith("foundation__"),
                },
            }
        )
        self.document["scenes"][0]["nodes"].append(len(self.document["nodes"]) - 1)

    def write(self, path: Path):
        self.align()
        self.document["buffers"][0]["byteLength"] = len(self.binary)
        json_bytes = json.dumps(self.document, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        while len(json_bytes) % 4:
            json_bytes += b" "
        binary_bytes = bytes(self.binary)
        while len(binary_bytes) % 4:
            binary_bytes += b"\x00"
        total_length = 12 + 8 + len(json_bytes) + 8 + len(binary_bytes)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("wb") as stream:
            stream.write(struct.pack("<4sII", b"glTF", 2, total_length))
            stream.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))
            stream.write(json_bytes)
            stream.write(struct.pack("<II", len(binary_bytes), 0x004E4942))
            stream.write(binary_bytes)


def main():
    parser = argparse.ArgumentParser()
    for name in CLASSIFIERS:
        parser.add_argument(f"--{name}", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--texture-size",
        type=int,
        default=768,
        help="maximum width/height for each embedded mobile texture (default: 768)",
    )
    args = parser.parse_args()

    if args.texture_size < 256:
        parser.error("--texture-size must be at least 256")

    sources = {name: parse_glb(getattr(args, name), name) for name in CLASSIFIERS}
    sources["body"] = simplify_source(sources["body"], 120000)
    labels = {name: face_labels(source) for name, source in sources.items()}
    labels["body"] = refine_body_face_labels(sources["body"], labels["body"])
    builder = GlbBuilder()
    materials = {
        name: builder.add_material(source, args.texture_size)
        for name, source in sources.items()
    }

    assigned_faces = {name: 0 for name in sources}
    for part in PARTS:
        selected = (
            np.arange(len(sources[part.source].faces))
            if part.label is None
            else np.flatnonzero(labels[part.source] == part.label)
        )
        assigned_faces[part.source] += len(selected)
        reference = (
            np.flatnonzero(np.isin(labels[part.source], part.reference_labels))
            if part.reference_labels
            else None
        )
        arrays = fitted_submesh(sources[part.source], selected, part, reference)
        builder.add_mesh(part.node, materials[part.source], arrays)

    for name, source in sources.items():
        unassigned = int(np.count_nonzero(labels[name] < 0))
        print(
            f"{name:10s} total={len(source.faces):8d} assigned={assigned_faces[name]:8d} "
            f"unassigned={unassigned:6d}"
        )
    builder.write(args.output)
    print(f"wrote {args.output} ({args.output.stat().st_size / 1048576:.2f} MiB)")


if __name__ == "__main__":
    main()
