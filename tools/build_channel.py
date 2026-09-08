#!/usr/bin/env python3
"""Build the bounded stable channel for the v1.72.1 wardrobe-loader repair."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = "https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/"
PATCHES = [
    ("v1721-character-loader-hotfix", "patches/v1.72.1-character-loader-hotfix.js"),
]


def main() -> None:
    modules = []
    for module_id, path in PATCHES:
        source = (ROOT / path).read_text(encoding="utf-8")
        modules.append(
            {
                "id": module_id,
                "sha256": hashlib.sha256(source.encode()).hexdigest(),
                "source": source,
            }
        )
    feed = {
        "schema": 2,
        "channel": "stable",
        "release": {
            "version": "1.72.1",
            "build": 190,
            "minimumBundled": "1.72.0",
            "releasedAt": "2026-09-08T18:58:00Z",
            "notes": [
                "Repairs the live v80 wardrobe hook that prevented the supplied 3D character models from replacing the flat portrait fallback.",
                "Valkorion's base body, Lord's royal set, and complete 40-piece armor now connect to the Wardrobe Trunk viewer.",
                "Lady Alexus's fitted gothic-gown model uses the same corrected loader path in her person and equipment views.",
                "The verified v1.72 model files are unchanged; this update corrects only the loader connection.",
            ],
            "modules": modules,
            # Build 189 already contains the verified GLBs. Keeping this empty
            # makes the hotfix use those local files instead of streaming the
            # same 103 MB back from GitHub when the wardrobe opens.
            "assets": {},
        },
    }
    payload = json.dumps(feed, ensure_ascii=False, separators=(",", ":"))
    output = (
        "/* Aetherion Reforged safe update channel. This file carries verified staged patch source. */\n"
        "(()=>{\n"
        f" const feed={payload};\n"
        " window.AetherionUpdater?.receiveChannel?.(feed);\n"
        "})();\n"
    )
    encoded = output.encode()
    assert len(encoded) <= 100_000, "channel exceeds the bundled safe-updater limit"
    (ROOT / "channel.js").write_bytes(encoded)
    print(
        f"channel.js: {len(modules)} modules, 0 remote assets, {len(encoded):,} bytes"
    )


if __name__ == "__main__":
    main()
