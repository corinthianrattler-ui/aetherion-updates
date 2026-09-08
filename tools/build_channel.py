#!/usr/bin/env python3
"""Build the bounded stable channel from the exact v1.71 patch source."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = "https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/"
RELEASE = (
    "https://github.com/corinthianrattler-ui/"
    "aetherion-updates/releases/download/v1.71.0/"
)
PATCH = "patches/v1.71.0-character-models.js"
ASSETS = [
    "assets/v171/valkorion-base-lord.glb",
    "assets/v171/valkorion-armored.glb",
    "assets/v171/libita-gothic-gown.glb",
]


def main() -> None:
    source = (ROOT / PATCH).read_text(encoding="utf-8")
    feed = {
        "schema": 2,
        "channel": "stable",
        "release": {
            "version": "1.71.0",
            "build": 188,
            "minimumBundled": "1.70.0",
            "releasedAt": "2026-09-08T08:03:36Z",
            "notes": [
                "Valkorion now uses the supplied fitted base body, Lord's royal armor, and complete armored models instead of the v1.70 single-model override.",
                "Libita Savitas now has the supplied fitted gothic-ball-gown model in her person and equipment views.",
                "All fitted node names and transforms are preserved; only weapon geometry received a 1% upload-size pass, with body and armor geometry untouched.",
                "Existing saves, rollback protection, tournaments, narration, portraits, and all other systems are preserved.",
            ],
            "modules": [
                {
                    "id": "v171-character-models",
                    "sha256": hashlib.sha256(source.encode()).hexdigest(),
                    "source": source,
                }
            ],
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
        f"channel.js: 1 module, {len(ASSETS)} assets, {len(encoded):,} bytes, "
        f"patch SHA-256 {feed['release']['modules'][0]['sha256']}"
    )


if __name__ == "__main__":
    main()
