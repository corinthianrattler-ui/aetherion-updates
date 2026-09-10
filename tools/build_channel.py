#!/usr/bin/env python3
"""Build the bounded stable channel for the v1.73.3 camp-film UI repair."""

from __future__ import annotations

import hashlib
import json
import argparse
import datetime as dt
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PATCHES = [
    ("v177-scroll-repair", ROOT / "patches" / "v1.72.7-scroll-repair.js"),
    ("v178-alexus-equipment-repair", ROOT / "patches" / "v1.72.8-alexus-equipment-repair.js"),
    ("v1710-alexus-original-body-map", ROOT / "patches" / "v1.72.10-alexus-original-body-map.js"),
    ("v1730-portrait-data", ROOT / "patches" / "v1.73.0-portrait-data.js"),
    ("v1730-living-portraits", ROOT / "patches" / "v1.73.0-living-portraits.js"),
    ("v1731-knight-diversity-performance", ROOT / "patches" / "v1.73.1-knight-diversity-performance.js"),
    ("v1733-camp-scenes", ROOT / "patches" / "v1.73.3-camp-scenes.js"),
]
APK_NAME = "Aetherion_Reforged_v1.72.6_GAMEPLAY_REPAIR_FULL.apk"
APK_URL = (
    "https://github.com/corinthianrattler-ui/aetherion-updates/"
    f"releases/download/v1.72.6/{APK_NAME}"
)
APK_SHA256 = "2fd692cb05cb163e5bde55abfae8789c3131e15e956831921abe07f905f2c645"
APK_SIZE = 499_039_030


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk", type=Path)
    args = parser.parse_args()
    if args.apk is not None:
        if not args.apk.is_file():
            raise FileNotFoundError(args.apk)
        assert args.apk.stat().st_size == APK_SIZE, "verified APK size changed"
        assert file_sha256(args.apk) == APK_SHA256, "verified APK hash changed"
    modules = []
    for module_id, path in PATCHES:
        source = path.read_text(encoding="utf-8")
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
            "version": "1.73.3",
            # This content update targets the verified v1.72.6 full APK. It
            # contains no native files and can stage on Android build 195.
            "build": 195,
            "minimumBundled": "1.72.6",
            "releasedAt": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "requiresApk": False,
            "apkUrl": APK_URL,
            "apkSha256": APK_SHA256,
            "apkSize": APK_SIZE,
            "notes": [
                "Camp films autoplay without browser pause, play, seek, fullscreen, or download controls; only a small Skip button remains.",
                "Make Camp takes 2 hours, Take Down Camp 1 hour, Cook 2 hours, and Sleep 8 hours; blocked actions still do nothing.",
                "Retains the four camp films, knight diversity, all earlier content, and every save. No APK or reset is required.",
            ],
            "modules": modules,
            # Image URLs are constructed from one fixed trusted repository root
            # inside the verified patch, avoiding a 268-entry channel map.
            "assets": {},
        },
    }
    payload = json.dumps(feed, ensure_ascii=False, separators=(",", ":"))
    output = (
        "/* Aetherion Reforged safe update channel. This file carries verified staged patch source. */\n"
        "(()=>{\n"
        f" const feed={payload};\n"
        " window.__aetherionFullApkUrl=feed.release.apkUrl;\n"
        " if(!window.__aetherionV175ApkHandoff&&typeof document==='object'&&document?.addEventListener){\n"
        "  window.__aetherionV175ApkHandoff=true;\n"
        "  document.addEventListener('click',event=>{\n"
        "   const control=event.target?.closest?.('button,a');\n"
        "   if(String(control?.textContent||'').trim().toUpperCase()!=='DOWNLOAD FULL APK')return;\n"
        "   const url=String(window.__aetherionFullApkUrl||'');\n"
        "   if(!/^https:\\/\\/github\\.com\\/corinthianrattler-ui\\/aetherion-updates\\/releases\\/download\\//.test(url))return;\n"
        "   event.preventDefault?.();event.stopPropagation?.();event.stopImmediatePropagation?.();globalThis.location.href=url;\n"
        "  },true);\n"
        " }\n"
        " window.AetherionUpdater?.receiveChannel?.(feed);\n"
        "})();\n"
    )
    encoded = output.encode()
    assert len(encoded) <= 100_000, f"channel exceeds the bundled safe-updater limit: {len(encoded):,} bytes"
    (ROOT / "channel.js").write_bytes(encoded)
    print(
        f"channel.js: {len(modules)} v1.72.6-compatible modules, 280 portraits, 4 camp films, {len(encoded):,} bytes"
    )


if __name__ == "__main__":
    main()
