#!/usr/bin/env python3
"""Build the bounded stable channel for the v1.73.0 living portrait update."""

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
            "version": "1.73.0",
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
                "Adds 268 new labeled full-body portraits to the existing 111-image curated library, producing 379 reviewed choices without duplicating the smaller recruitable catalog.",
                "Routes portraits deterministically by the person's persistent identity, occupation, gender, visual age, race, and bannerless status; named, canonical, user-created, and unique-character art remains protected.",
                "Teen, toddler, and baby portraits appear only as ambient household members in People Here, family records, and daily schedules. They are never workers or recruitable applicants.",
                "Adds real occupations where the catalog exposed genuine gaps: banker, beekeeper, goatherd, poultry keeper, skilled artisan, bannerless archer, crossbowman, sergeant, swordsman, footman, and militia recruit.",
                "Village apiaries, goat herds, and poultry flocks now persist across weeks, respond to season and weather, produce honeycomb, beeswax, goat milk, and eggs, stock local markets, and affect settlement health and prosperity.",
                "Named bankers keep posted counter hours and serve the existing reserve, deposit, withdrawal, bullion, mint, and currency systems. A Dominus banker appears when its bank is founded.",
                "Existing settlements gain compatible named residents and labor candidates without replacing established people. Recruit halls gain a bounded rotating sample of the new military and artisan jobs.",
                "Portrait assignment scans existing saves once during migration and checks only newly created people afterward; redraws, lists, schedules, and daily ticks do not rescan the world.",
                "Portrait files load from this trusted GitHub repository and fall back to packaged dynasty art if offline or unavailable, so a missing network image cannot break a person view.",
                "Restores Lady Alexus's original authored body map: her head, hair, upper chest, torso, arms, hands, and legs remain visible regardless of empty wardrobe slots.",
                "Maps GOWN_tripo_part_10, the actual full dress, to the Tailored Dominus Lady's Gown so removing that item removes the dress instead of her body.",
                "Removes the fabricated v1.72.9 torso clone; no replacement geometry, recolouring, or guessed body layer remains.",
                "Classifies all 28 packaged mesh nodes exactly once. Nine items have genuine independent model geometry; cards with no separate source mesh never hide anatomy or another garment.",
                "Retains the v1.72.8 equipment-state repair, so empty slots survive redraw migration and already-created duplicate unique items are recovered safely.",
                "Retains the v1.72.7 vertical scrolling repair without restoring the right-side void.",
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
        f"channel.js: {len(modules)} v1.72.6-compatible modules, 268 lazy portrait assets, {len(encoded):,} bytes"
    )


if __name__ == "__main__":
    main()
