#!/usr/bin/env python3
"""Build the bounded stable channel from the exact v1.72 patch sources."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = "https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/"
RELEASE = (
    "https://github.com/corinthianrattler-ui/"
    "aetherion-updates/releases/download/v1.72.0/"
)
PATCHES = [
    ("v172-character-models", "patches/v1.72.0-character-models.js"),
    ("v172-update-center", "patches/v1.72.0-update-center.js"),
    ("v172-runtime-repair", "patches/v1.72.0-runtime-repair.js"),
]
ASSETS = [
    "assets/v172/valkorion-base-lord.glb",
    "assets/v172/valkorion-armored.glb",
    "assets/v172/alexus-gothic-gown.glb",
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
            "version": "1.72.0",
            "build": 189,
            "minimumBundled": "1.70.0",
            "releasedAt": "2026-09-08T10:18:01Z",
            "notes": [
                "Continue now opens the existing timeline reliably from the opening menu.",
                "The floating gold update control is removed; Game Updates remains in the opening menu and Systems.",
                "Android's blue button tap flash is disabled while keyboard focus remains visible.",
                "Valkorion's base, Lord, complete armor, and Lady Alexus models keep every fitted part while using mobile-ready geometry.",
                "Repeated full-page observers, continuous idle rendering, and repeated model reframing are removed.",
            ],
            "modules": modules,
            "assets": {path: RELEASE + Path(path).name for path in ASSETS},
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
        f"channel.js: {len(modules)} modules, {len(ASSETS)} assets, {len(encoded):,} bytes"
    )


if __name__ == "__main__":
    main()
