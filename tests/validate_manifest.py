#!/usr/bin/env python3
"""Verify that every stable-manifest payload matches the committed bytes."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["schema"] == 1
    assert manifest["enabled"] is True
    assert manifest["latest"]["game_version"] == "1.63.2"
    assert manifest["latest"]["android_version_code"] == 176
    assert manifest["latest"]["min_updater_schema"] <= 1
    payloads = manifest["payloads"]
    assert [payload["path"] for payload in payloads] == [
        "patches/v1.59.2-dominus-art-fix.js",
        "assets/v109/valkorion_final.glb",
        "patches/v1.63.0-valkorion-final.js",
    ]
    assert len({payload["path"] for payload in payloads}) == len(payloads)

    for payload in payloads:
        if payload["path"] == "assets/v109/valkorion_final.glb":
            assert payload["url"] == (
                "https://github.com/corinthianrattler-ui/aetherion-updates/"
                "releases/download/v1.63.2/valkorion_final.glb"
            )
            assert payload["size"] == 38_658_288
            assert payload["sha256"] == (
                "7c6006efb6b2966b78c3d65ae10605f63bb9fe2c1fa674b569d8dc52b1dffee5"
            )
            assert payload["restart_required"] is True
            continue
        path = ROOT / payload["path"]
        data = path.read_bytes()
        actual_hash = hashlib.sha256(data).hexdigest()
        assert payload["size"] == len(data), f"{payload['path']}: size mismatch"
        assert payload["sha256"] == actual_hash, f"{payload['path']}: SHA-256 mismatch"
        assert payload["url"].endswith("/" + payload["path"]), f"{payload['path']}: URL mismatch"
        assert payload["restart_required"] is True

    assert manifest["save_policy"]["preserve_always"] is True
    print("manifest.json: 1.63.2 release payload sizes and SHA-256 hashes passed")


if __name__ == "__main__":
    main()
