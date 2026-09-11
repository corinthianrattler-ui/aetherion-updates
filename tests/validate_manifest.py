#!/usr/bin/env python3
"""Validate the legacy full-APK handoff manifest."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APK_NAME = "Aetherion_Reforged_v1.74.0_CLEAN_MAINTENANCE_FULL.apk"
APK_SHA256 = "08791fdc068bcfa6a1809961dc01954c3f1d614cf5a684f4b33fd2308be0d3c7"
CERT_SHA256 = "5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77"


def main() -> None:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["schema"] == 1
    assert manifest["channel"] == "stable"
    assert manifest["enabled"] is True
    assert manifest["latest"] == {
        "game_version": "1.74.0",
        "android_version_code": 196,
        "min_updater_schema": 1,
        "requires_full_apk": True,
    }
    apk = manifest["android_apk"]
    assert apk["version"] == "1.74.0"
    assert apk["version_code"] == 196
    assert apk["filename"] == APK_NAME
    assert apk["url"].endswith(f"/v1.74.0/{APK_NAME}")
    assert apk["size"] == 543_684_738
    assert apk["sha256"] == APK_SHA256
    assert apk["signing_certificate_sha256"] == CERT_SHA256
    assert manifest["payloads"] == []
    assert manifest["save_policy"] == {"managed": False, "preserve_always": True}
    notes = manifest["notes"]
    for phrase in (
        "offline Piper neural voices",
        "280 local full-body portraits",
        "cloned-head fallback routing",
        "removes only verified unreferenced technical",
        "without touching saves",
    ):
        assert phrase in notes
    print("manifest: v1.74.0 full-APK handoff preserves content and stages no legacy patch pile")


if __name__ == "__main__":
    main()
