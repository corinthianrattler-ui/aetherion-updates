#!/usr/bin/env python3
"""Decode and validate the complete v1.73.0 portrait catalog."""

from __future__ import annotations

import hashlib
import json
import re
from collections import Counter
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PORTRAITS = ROOT / "custom" / "npc-portraits" / "v173"
REGISTRY = PORTRAITS / "registry.json"
NAME = re.compile(r"^(\d{3})_[a-z0-9_]+_(ym|yf|om|of|tm|tf|dm|df|bm|bf)\.webp$")


def main() -> None:
    catalog = json.loads(REGISTRY.read_text(encoding="utf-8"))
    rows = catalog["portraits"]
    files = sorted(PORTRAITS.glob("*.webp"))
    assert catalog["schema"] == 1
    assert catalog["version"] == "1.73.0"
    assert catalog["portraitCount"] == 268
    assert len(rows) == len(files) == 268
    assert [row["id"] for row in rows] == [f"v173-{n:03d}" for n in range(1, 269)]
    assert {row["file"] for row in rows} == {path.name for path in files}
    assert {row["sourcePage"] for row in rows} == set(range(1, 74))

    compressed_hashes: set[str] = set()
    pixel_hashes: set[str] = set()
    total_bytes = 0
    by_name = {row["file"]: row for row in rows}
    for path in files:
        match = NAME.fullmatch(path.name)
        assert match, f"invalid filename: {path.name}"
        row = by_name[path.name]
        assert int(match.group(1)) == int(row["id"].split("-")[1])
        payload = path.read_bytes()
        assert len(payload) > 1_024, f"empty or truncated portrait: {path.name}"
        digest = hashlib.sha256(payload).hexdigest()
        assert digest not in compressed_hashes, f"duplicate encoded portrait: {path.name}"
        compressed_hashes.add(digest)
        total_bytes += len(payload)
        with Image.open(path) as image:
            assert image.format == "WEBP", f"{path.name}: not WebP"
            assert image.size == (512, 768), f"{path.name}: wrong dimensions {image.size}"
            pixels = hashlib.sha256(image.convert("RGB").tobytes()).hexdigest()
        assert pixels not in pixel_hashes, f"duplicate portrait pixels: {path.name}"
        pixel_hashes.add(pixels)
        assert row["gender"] in {"M", "F"}
        assert row["race"] in {"human", "orc", "elf", "dwarf", "darkelf"}
        assert row["minAge"] <= row["maxAge"]
        assert row["sourcePanel"] in range(1, 5)
        youth = row["ageBand"] in {"teen", "toddler", "baby"}
        assert row["ambientOnly"] is youth
        assert ("ambient-only" in row["flags"]) is youth

    ages = Counter(row["ageBand"] for row in rows)
    genders = Counter(row["gender"] for row in rows)
    races = Counter(row["race"] for row in rows)
    assert ages == {"young": 128, "older": 128, "teen": 4, "toddler": 4, "baby": 4}
    assert genders == {"M": 134, "F": 134}
    assert races == {"human": 264, "orc": 1, "elf": 1, "dwarf": 1, "darkelf": 1}
    assert all(not row["ambientOnly"] for row in rows if row["minAge"] >= 18)
    assert all(row["ambientOnly"] for row in rows if row["maxAge"] < 18)
    assert 18_000_000 <= total_bytes <= 24_000_000
    print(
        f"v1.73.0 portraits: {len(files)} decoded, {len(pixel_hashes)} unique, "
        f"{total_bytes / 1_048_576:.2f} MiB, 12 ambient youths"
    )


if __name__ == "__main__":
    main()
