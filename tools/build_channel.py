#!/usr/bin/env python3
"""Build the bounded stable channel for the v1.72.2 native asset-loader release."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = "https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/"
PATCHES = [
    ("v1722-full-apk-path", "patches/v1.72.2-update-center.js"),
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
            "version": "1.72.2",
            "build": 191,
            "minimumBundled": "1.72.0",
            "releasedAt": "2026-09-08T14:15:00Z",
            "notes": [
                "Android build 191 is a required full APK: it replaces the blocked file:// model path with a secure internal HTTPS-style asset route.",
                "The supplied Valkorion base body, Lord's royal set, complete 40-piece armor, and Lady Alexus model are bundled in that APK.",
                "The full build uses shape-preserving mobile quantization, not mesh simplification, so fitted armor surfaces remain intact while memory use drops.",
                "This staged patch adds the visible DOWNLOAD FULL APK path; installing the native APK is what activates the corrected 3D asset route.",
            ],
            "modules": modules,
            # The model payload is part of the signed APK. It cannot be fixed by
            # a JavaScript-only staged update because Android blocks file://
            # pages from reading GLB bytes.
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
        f"channel.js: {len(modules)} full-APK handoff module, 0 remote assets, {len(encoded):,} bytes"
    )


if __name__ == "__main__":
    main()
