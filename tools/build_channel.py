#!/usr/bin/env python3
"""Build the bounded stable channel for the v1.72.6 gameplay repair."""

from __future__ import annotations

import hashlib
import json
import argparse
import datetime as dt
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PATCHES = [
    ("v176-gameplay-repair", "gameplay-repair"),
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
    for module_id, stem in PATCHES:
        source = (ROOT / "patches" / f"v1.72.6-{stem}.js").read_text(encoding="utf-8")
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
            "version": "1.72.6",
            # Keep the staged patch on build 194 so the installed v1.72.5
            # updater may apply these web/gameplay fixes in place. Build 195
            # is available below as the complete signed APK.
            "build": 194,
            "minimumBundled": "1.72.5",
            "releasedAt": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "requiresApk": False,
            "apkUrl": APK_URL,
            "apkSha256": file_sha256(args.apk),
            "apkSize": args.apk.stat().st_size,
            "notes": [
                "Lady Alexus's supplied model is restored in her Equipment view: all 28 mesh sections are uniquely classified into foundation plus 12 independently controlled fitted wardrobe slots.",
                "Her five weapon and ammunition slots remain separate equipment cards because the supplied GLB has no geometry for them; no fake pieces or baked outfit claim is used.",
                "Portrait-phone screens are constrained to one vertical viewport, including modals, equipment, shop cards, selectors, the Systems dock, and notices; sideways page scrolling and the right-side void are removed.",
                "Ordinary shop and market purchases go directly to Valkorion's Carried Inventory. Quartermaster requisitions use the correct fitted wagon crate, then the next compatible crate with capacity.",
                "This small gameplay patch installs inside v1.72.5. The complete Android build 195 APK remains available for a clean install or recovery and keeps the same signing identity.",
            ],
            "modules": modules,
            # The Alexus model already exists in v1.72.5. Only the verified
            # controller is staged; build 195 bundles it for clean installs.
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
        f"channel.js: {len(modules)} v1.72.5-compatible gameplay module, 0 remote assets, {len(encoded):,} bytes"
    )


if __name__ == "__main__":
    main()
