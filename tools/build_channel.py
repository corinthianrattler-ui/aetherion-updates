#!/usr/bin/env python3
"""Build the bounded stable channel for the v1.73.1 knight-diversity update."""

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
]
APK_NAME = "Aetherion_Reforged_v1.72.6_GAMEPLAY_REPAIR_FULL.apk"
APK_URL = (
    "https://github.com/corinthianrattler-ui/aetherion-updates/"
    f"releases/download/v1.72.6/{APK_NAME}"
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
            "version": "1.73.1",
            # This content update targets the verified v1.72.6 full APK. It
            # contains no native files and can stage on Android build 195.
            "build": 195,
            "minimumBundled": "1.72.6",
            "releasedAt": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "requiresApk": False,
            "apkUrl": APK_URL,
            "apkSha256": file_sha256(args.apk),
            "apkSize": args.apk.stat().st_size,
            "notes": [
                "Adds 12 new, individually generated 2:3 full-body bannerless-knight portraits, with young and older men and women, distinct faces, builds, hair, armor, weapons, and poses.",
                "Repairs the starting twenty-person mounted retinue on existing saves, replacing repeated dynasty headshots with ten compatible full-body identities; no one portrait appears more than three times in the age-weighted starting roster.",
                "Matches every repaired knight to stored gender and visual age, retains the four compatible full-body bannerless knights from v1.73.0, and preserves canonical, named, user-supplied, and custom-companion art.",
                "Displays curated people art uncropped at a 2:3 ratio and lazily decodes roster thumbnails, so the list shows the full figure instead of a large face crop.",
                "Removes redundant per-card and legacy whole-world identity repairs from ordinary redraws, preventing older upgrade code from changing curated art back to dynasty heads; settlement, labor, surgeon, and recruit structure setup is bounded to one pass per save version.",
                "Does not remove characters, jobs, items, mechanics, locations, story, save progress, or other content; only redundant repeated setup and render work is bypassed.",
                "Adds 268 new labeled full-body portraits to the existing 111-image curated library, producing 379 reviewed choices without duplicating the smaller recruitable catalog.",
                "Teen, toddler, and baby portraits appear only as ambient household members in People Here, family records, and daily schedules. They are never workers or recruitable applicants.",
                "Retains v1.73.0's bankers, recruit jobs, settlement residents, and village apiaries, goat herds, and poultry flocks with time, weather, production, market, health, and prosperity mechanics.",
                "Portrait files load from this trusted GitHub repository and fall back to packaged dynasty art if offline or unavailable, so a missing network image cannot break a person view.",
                "Retains Lady Alexus's original authored body map and gown mapping, the v1.72.8 equipment-state repair, and the v1.72.7 vertical-scrolling repair.",
                "This is a staged script-and-portrait update for the verified v1.72.6 APK; it uses the original packaged GLB unchanged and requires no replacement APK, model, or save reset.",
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
    assert len(encoded) <= 100_000, "channel exceeds the bundled safe-updater limit"
    (ROOT / "channel.js").write_bytes(encoded)
    print(
        f"channel.js: {len(modules)} v1.72.6-compatible modules, 280 lazy portrait assets, {len(encoded):,} bytes"
    )


if __name__ == "__main__":
    main()
