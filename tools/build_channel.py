#!/usr/bin/env python3
"""Build the bounded stable channel for the v1.72.5 modular-equipment APK."""

from __future__ import annotations

import hashlib
import json
import argparse
import datetime as dt
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PATCHES = [
    ("v175-native-install-path", "update-center"),
]
APK_NAME = "Aetherion_Reforged_v1.72.5_MODULAR_EQUIPMENT_UPDATE.apk"
APK_URL = (
    "https://github.com/corinthianrattler-ui/aetherion-updates/"
    f"releases/download/v1.72.5/{APK_NAME}"
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
        source = (ROOT / "patches" / f"v1.72.5-{stem}.js").read_text(encoding="utf-8")
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
            "version": "1.72.5",
            "build": 194,
            "minimumBundled": "1.72.4",
            "releasedAt": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "requiresApk": True,
            "apkUrl": APK_URL,
            "apkSha256": file_sha256(args.apk),
            "apkSize": args.apk.stat().st_size,
            "notes": [
                "Android build 194 is the full modular-equipment update for the startup-fixed v1.72.4 app.",
                "Valkorion's 17 equipment slots now control fitted armor, clothing, cloak, weapons, ammunition, and jewelry separately; mixed outfits no longer swap a whole-body model.",
                "Removing one equipped item hides only that fitted piece. Unsupported faction gear is reported instead of displaying false Dominus heraldry.",
                "The incomplete baked Lady Alexus gown no longer claims to be modular. Her working picture equipment view remains active, and future 3D character models must pass the complete per-slot contract.",
                "This APK retains the startup-crash repair and uses the same signing identity as the startup-fixed v1.72.4 copy.",
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
        f"channel.js: {len(modules)} build-194 install handoff module, 0 remote assets, {len(encoded):,} bytes"
    )


if __name__ == "__main__":
    main()
