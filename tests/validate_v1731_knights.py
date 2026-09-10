#!/usr/bin/env python3
"""Decode and validate the v1.73.1 full-body bannerless-knight set."""

from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PORTRAIT_ROOT = ROOT / "custom" / "npc-portraits" / "v1731"


def main() -> None:
    catalog = json.loads((PORTRAIT_ROOT / "registry.json").read_text(encoding="utf-8"))
    assert catalog["schema"] == 1
    assert catalog["version"] == "1.73.1"
    assert catalog["portraitCount"] == 12
    rows = catalog["portraits"]
    assert len(rows) == 12
    assert len({row["id"] for row in rows}) == 12
    assert len({row["file"] for row in rows}) == 12

    counts = Counter((row["gender"], row["ageBand"]) for row in rows)
    assert counts == Counter({("M", "young"): 4, ("M", "older"): 4,
                              ("F", "young"): 2, ("F", "older"): 2})
    assert all(row["role"] == "Bannerless Knight" for row in rows)
    assert all({"Lesser Knight", "Company Captain", "Knight"} <= set(row["aliases"])
               for row in rows)
    assert all(row["race"] == "human" and row["fullBody"] is True for row in rows)
    assert all(row["bannerless"] is True and row["generated"] is True for row in rows)
    assert all({"military", "bannerless", "full-body", "generated"} <= set(row["flags"])
               for row in rows)

    files = sorted(PORTRAIT_ROOT.glob("*.webp"))
    assert [path.name for path in files] == [row["file"] for row in rows]
    pixel_hashes: set[str] = set()
    for path in files:
        with Image.open(path) as image:
            image.load()
            assert image.format == "WEBP", path
            assert image.size == (512, 768), path
            assert image.width * 3 == image.height * 2, path
            assert image.mode in {"RGB", "RGBA"}, path
            pixel_hashes.add(hashlib.sha256(image.convert("RGB").tobytes()).hexdigest())
    assert len(pixel_hashes) == 12
    assert sum(path.stat().st_size for path in files) < 1_000_000
    print("v1.73.1 knights: 12/12 WebPs decoded at 512x768; gender, age, role, and uniqueness tags passed")


if __name__ == "__main__":
    main()
