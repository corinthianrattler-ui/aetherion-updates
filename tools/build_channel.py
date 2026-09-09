#!/usr/bin/env python3
"""Build the bounded stable channel for the v1.72.4 full-APK repair."""

from __future__ import annotations

import hashlib
import json
import argparse
import datetime as dt
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from tools.build_v174_payload import transform_patch

RAW = "https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/"
PATCHES = [
    ("v174-native-install-path", "update-center"),
]
APK_NAME = "Aetherion_Reforged_v1.72.4_FULL_REPAIR.apk"
APK_URL = (
    "https://github.com/corinthianrattler-ui/aetherion-updates/"
    f"releases/download/v1.72.4/{APK_NAME}"
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
    for module_id, stem in PATCHES:
        source = transform_patch(stem)
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
            "version": "1.72.4",
            "build": 193,
            "minimumBundled": "1.72.0",
            "releasedAt": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "requiresApk": True,
            "apkUrl": APK_URL,
            "apkSha256": file_sha256(args.apk),
            "apkSize": args.apk.stat().st_size,
            "notes": [
                "Android build 193 is a required full APK. It repairs the native loader that prevented versioned scripts, styles, and model checks from opening.",
                "Valkorion's base body, Lord's royal set, complete 40-part armor, and Lady Alexus's 28-part gown model are included and checked at runtime.",
                "The wardrobe shows BUILD 193 / 3D READY only after the actual model parses and mounts; the legacy flat portrait is not reported as success.",
                "Continue no longer repeats the entire migration chain, WebView cache is retained, and the optional 3D and offline-AI libraries load only when requested.",
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
        f"channel.js: {len(modules)} build-193 install handoff module, 0 remote assets, {len(encoded):,} bytes"
    )


if __name__ == "__main__":
    main()
