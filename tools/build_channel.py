#!/usr/bin/env python3
"""Build the legacy-channel handoff to the complete v1.74.0 APK."""

from __future__ import annotations

import hashlib
import json
import argparse
import datetime as dt
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PATCHES = []
APK_NAME = "Aetherion_Reforged_v1.74.0_CLEAN_MAINTENANCE_FULL.apk"
APK_URL = (
    "https://github.com/corinthianrattler-ui/aetherion-updates/"
    f"releases/download/v1.74.0/{APK_NAME}"
)
APK_SHA256 = "08791fdc068bcfa6a1809961dc01954c3f1d614cf5a684f4b33fd2308be0d3c7"
APK_SIZE = 543_684_738


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
            "version": "1.74.0",
            # Build 196 changes the packaged game and updater, so build 195
            # must use the complete same-signature APK instead of stacking
            # another web patch.
            "build": 196,
            "minimumBundled": "1.72.6",
            "releasedAt": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "requiresApk": True,
            "apkUrl": APK_URL,
            "apkSha256": APK_SHA256,
            "apkSize": APK_SIZE,
            "notes": [
                "Complete maintenance rebuild; preserves voices, content, mechanics and saves.",
                "Repairs full-body portrait routing and removes only verified technical debris.",
            ],
            "modules": modules,
            # Image URLs are constructed from one fixed trusted repository root
            # inside the verified patch, avoiding a 268-entry channel map.
            "assets": {},
        },
    }
    payload = json.dumps(feed, ensure_ascii=False, separators=(",", ":"))
    output = (
        "/* Aetherion Reforged safe update channel. */\n"
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
        f"channel.js: full-APK handoff to Android build 196, {len(encoded):,} bytes"
    )


if __name__ == "__main__":
    main()
