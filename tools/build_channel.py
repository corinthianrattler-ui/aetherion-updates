#!/usr/bin/env python3
"""Build the bounded stable channel for the v1.72.3 full-APK repair."""

from __future__ import annotations

import hashlib
import json
import argparse
import datetime as dt
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = "https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/"
PATCHES = [
    ("v1723-native-install-path", "patches/v1.72.3-update-center.js"),
]
APK_NAME = "Aetherion_Reforged_v1.72.3_FULL_REPAIR.apk"
APK_URL = (
    "https://github.com/corinthianrattler-ui/aetherion-updates/"
    f"releases/download/v1.72.3/{APK_NAME}"
)


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk", type=Path, required=True)
    args = parser.parse_args()
    if not args.apk.is_file():
        raise FileNotFoundError(args.apk)
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
            "version": "1.72.3",
            "build": 192,
            "minimumBundled": "1.72.0",
            "releasedAt": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "requiresApk": True,
            "apkUrl": APK_URL,
            "apkSha256": file_sha256(args.apk),
            "apkSize": args.apk.stat().st_size,
            "notes": [
                "Android build 192 is a required full APK. A JavaScript patch cannot install the native shell or bundled GLB models.",
                "Valkorion's base body, Lord's royal set, complete 40-part armor, and Lady Alexus's 28-part gown model are included and checked at runtime.",
                "The wardrobe now shows a small BUILD 192 / 3D READY badge after the actual model loads; a flat portrait is never reported as success.",
                "Continue now clears the hidden opening-film guard and opens the live game; touch highlighting, two corrupt legacy images, and the false update-installed message are also repaired.",
            ],
            "modules": modules,
            # The native marker and models are part of the signed APK. This
            # module only gives older builds a truthful route to that APK.
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
        f"channel.js: {len(modules)} native-install handoff module, 0 remote assets, {len(encoded):,} bytes"
    )


if __name__ == "__main__":
    main()
