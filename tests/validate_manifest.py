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
    assert manifest["latest"]["game_version"] == "1.61.1"
    assert manifest["latest"]["android_version_code"] == 172
    assert manifest["latest"]["min_updater_schema"] <= 1
    payloads = manifest["payloads"]
    assert [payload["path"] for payload in payloads] == ["patches/v1.59.2-dominus-art-fix.js"]
    assert len({payload["path"] for payload in payloads}) == len(payloads)

    for payload in payloads:
        path = ROOT / payload["path"]
        data = path.read_bytes()
        actual_hash = hashlib.sha256(data).hexdigest()
        assert payload["size"] == len(data), f"{payload['path']}: size mismatch"
        assert payload["sha256"] == actual_hash, f"{payload['path']}: SHA-256 mismatch"
        assert payload["url"].endswith("/" + payload["path"]), f"{payload['path']}: URL mismatch"
        assert payload["restart_required"] is True

    assert manifest["save_policy"]["preserve_always"] is True
    print("manifest.json: 1.61.1 rollback payload sizes and SHA-256 hashes passed")


if __name__ == "__main__":
    main()
