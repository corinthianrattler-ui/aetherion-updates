#!/usr/bin/env python3
"""Decode and verify every v1.68 curated NPC portrait payload."""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PORTRAITS = ROOT / "custom" / "npc-portraits" / "v168"
NUMBERED = re.compile(r"^(\d{2,3})_.+\.webp$")
ORIGINAL_QUARTERMASTER_SHA256 = (
    "84a754e8a3c649b70eff77f90cfb694339b515adbc0347b96157eeb1679c8199"
)


def main() -> None:
    files = sorted(PORTRAITS.glob("*.webp"), key=lambda path: int(path.name.split("_", 1)[0]))
    assert len(files) == 111, f"expected 111 portraits, found {len(files)}"

    numbers: list[int] = []
    hashes: set[str] = set()
    total_bytes = 0
    for portrait in files:
        match = NUMBERED.fullmatch(portrait.name)
        assert match, f"bad portrait filename: {portrait.name}"
        numbers.append(int(match.group(1)))

        payload = portrait.read_bytes()
        digest = hashlib.sha256(payload).hexdigest()
        assert digest not in hashes, f"duplicate image bytes: {portrait.name}"
        hashes.add(digest)
        total_bytes += len(payload)

        with Image.open(portrait) as image:
            assert image.format == "WEBP", f"{portrait.name}: not WebP"
            width, height = image.size
            image.verify()
        if numbers[-1] == 0:
            assert (width, height) == (512, 512)
            assert digest == ORIGINAL_QUARTERMASTER_SHA256
        else:
            assert width >= 1_000 and height >= 1_300, (
                f"{portrait.name}: unexpectedly small {width}x{height}"
            )
            assert 0.62 <= width / height <= 0.85, (
                f"{portrait.name}: unexpected full-body aspect {width}x{height}"
            )

    assert numbers == list(range(111)), "portrait numbering must be exactly 00 through 110"
    assert 15_000_000 <= total_bytes <= 25_000_000, "portrait download budget changed"
    print(
        f"v1.68 portraits: {len(files)} decoded, {len(hashes)} unique, "
        f"{total_bytes / 1_048_576:.2f} MiB"
    )


if __name__ == "__main__":
    main()
