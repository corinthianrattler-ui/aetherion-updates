#!/usr/bin/env python3
import hashlib
import json
import struct
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GAME = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT
ASSETS = GAME / "assets" / "v170"
EXPECTED = {
    "valkorion-complete-kit.glb": "484976e440f38feb0b7403a0f1be069789399c169c3b1b2647acd45b5f12f0aa",
    "jousting-arena.png": "affc992ba0b26f6a1c049b6224f81ae2ef92018d59166dde19be389e6c95e43b",
    "duel-arena.png": "1fd320c2e692639e536932a4fdeb3c8b23ddb2c7b6ad388f1c86d61379e62d93",
    "archery-range.png": "8a5cab83aabe5940372f103529f40f94ab39252c5ca688f7de30e4ee60b77727",
}


def digest(path):
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


for name, expected in EXPECTED.items():
    path = ASSETS / name
    if not path.is_file():
        raise SystemExit(f"missing v1.70 asset: {name}")
    actual = digest(path)
    if actual != expected:
        raise SystemExit(f"wrong bytes for {name}: {actual}")

with (ASSETS / "valkorion-complete-kit.glb").open("rb") as handle:
    magic, version, total = struct.unpack("<III", handle.read(12))
    chunk_length, chunk_type = struct.unpack("<II", handle.read(8))
    payload = json.loads(handle.read(chunk_length))
if magic != 0x46546C67 or version != 2 or chunk_type != 0x4E4F534A:
    raise SystemExit("Valkorion complete kit is not a valid GLB 2.0 file")
if total != (ASSETS / "valkorion-complete-kit.glb").stat().st_size:
    raise SystemExit("Valkorion GLB declared length differs from file size")
if len(payload.get("meshes", [])) != 40 or len(payload.get("nodes", [])) != 41:
    raise SystemExit("Valkorion complete kit must contain 40 assembled meshes under one root")
root = payload["nodes"][0]
if root.get("name") != "ROOT" or root.get("children") != list(range(1, 41)):
    raise SystemExit("Valkorion assembled ROOT hierarchy is wrong")
if any(node.get("translation") or node.get("scale") or node.get("rotation") for node in payload["nodes"]):
    raise SystemExit("Valkorion complete kit contains an unexpected exploded-part transform")

sizes = {name: Image.open(ASSETS / name).size for name in ("jousting-arena.png", "duel-arena.png", "archery-range.png")}
if sizes != {"jousting-arena.png": (1672, 941), "duel-arena.png": (1672, 941), "archery-range.png": (1536, 1024)}:
    raise SystemExit(f"unexpected tournament art dimensions: {sizes}")

print("v1.70.0 assets: exact final Valkorion kit and corrected three-event heraldry passed")
