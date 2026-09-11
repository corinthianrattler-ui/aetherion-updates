#!/usr/bin/env python3
"""Build the legacy JSON handoff to the complete v1.74.0 APK.

The current in-app updater consumes channel.js. This compact schema-1 file is
kept for older clients and deliberately contains no cumulative web-patch list:
build 196 is a full, same-signature maintenance install.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APK_NAME = "Aetherion_Reforged_v1.74.0_CLEAN_MAINTENANCE_FULL.apk"
APK_URL = (
    "https://github.com/corinthianrattler-ui/aetherion-updates/"
    f"releases/download/v1.74.0/{APK_NAME}"
)
APK_SHA256 = "08791fdc068bcfa6a1809961dc01954c3f1d614cf5a684f4b33fd2308be0d3c7"
APK_SIZE = 543_684_738
CERT_SHA256 = "5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77"


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

    manifest = {
        "schema": 1,
        "channel": "stable",
        "enabled": True,
        "latest": {
            "game_version": "1.74.0",
            "android_version_code": 196,
            "min_updater_schema": 1,
            "requires_full_apk": True,
        },
        "manifest_url": (
            "https://raw.githubusercontent.com/corinthianrattler-ui/"
            "aetherion-updates/main/manifest.json"
        ),
        "release_base": (
            "https://github.com/corinthianrattler-ui/"
            "aetherion-updates/releases/download/"
        ),
        "android_apk": {
            "version": "1.74.0",
            "version_code": 196,
            "filename": APK_NAME,
            "url": APK_URL,
            "size": APK_SIZE,
            "sha256": APK_SHA256,
            "signing_certificate_sha256": CERT_SHA256,
        },
        "payloads": [],
        "notes": (
            "Android build 196 is a content-preserving maintenance rebuild made directly "
            "from the verified 499 MB build 195 app. It retains the offline Piper neural "
            "voices, every model, map, film, mechanic and save format. It packages 280 local "
            "full-body portraits, repairs cloned-head fallback routing, gives the sky dial its "
            "own header space, preserves sleep-to-seasonal-dawn, waiting, moon phases and Watch "
            "Post guard rules, and removes only verified unreferenced technical patch copies and "
            "obsolete build markers. The new signed updater can add, replace and retire files, "
            "keeps one rollback and garbage-collects obsolete downloaded blobs without touching saves."
        ),
        "save_policy": {"managed": False, "preserve_always": True},
    }
    (ROOT / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print("manifest.json: full-APK handoff to v1.74.0 build 196")


if __name__ == "__main__":
    main()
