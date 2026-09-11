#!/usr/bin/env python3
"""Exercise the cumulative schema-2 update builder without production secrets."""

from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa


ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "tools" / "build_v2_update.py"


def compact(value: object) -> bytes:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def run(*args: str) -> None:
    subprocess.run([sys.executable, str(BUILDER), *args], check=True, capture_output=True, text=True)


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="aetherion-v2-test-") as temporary:
        root = Path(temporary)
        output = root / "v2"
        output.mkdir()
        (output / "channel.json").write_text('{"schema":2,"appId":"aetherion-reforged","latest":"1.74.0","releases":[]}', "utf-8")
        extension = root / "feature.js"
        portrait = root / "portrait.webp"
        extension.write_text("'use strict';window.TestFeature=true;", "utf-8")
        portrait.write_bytes(b"RIFF\x00\x00\x00\x00WEBPtest")
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        key_path = root / "private.pem"
        key_path.write_bytes(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))

        run(
            "1.74.1", "--output", str(output), "--private-key", str(key_path),
            "--extension", f"feature={extension}",
            "--asset", f"custom/portraits/test.webp={portrait}",
            "--delete", "assets/obsolete/test.webp", "--notes", "Fixture one",
        )
        channel = json.loads((output / "channel.json").read_text("utf-8"))
        manifest_bytes = (output / "releases" / "1.74.1.json").read_bytes()
        manifest = json.loads(manifest_bytes)
        release = channel["releases"][0]
        assert channel["appId"] == "aetherion-reforged" and channel["latest"] == "1.74.1"
        assert len(manifest["files"]) == 2 and manifest["deletePaths"] == ["assets/obsolete/test.webp"]
        assert release["manifestSha256"] == hashlib.sha256(manifest_bytes).hexdigest()
        canonical = compact({
            "appId": "aetherion-reforged",
            "version": release["version"],
            "manifestUrl": release["manifestUrl"],
            "manifestSha256": release["manifestSha256"],
        })
        key.public_key().verify(base64.b64decode(release["signature"]), canonical, padding.PKCS1v15(), hashes.SHA256())

        run(
            "1.74.2", "--output", str(output), "--private-key", str(key_path),
            "--retire-id", "feature", "--delete", "custom/portraits/test.webp", "--notes", "Fixture two",
        )
        inherited = json.loads((output / "releases" / "1.74.2.json").read_text("utf-8"))
        assert inherited["files"] == []
        assert inherited["deletePaths"] == ["assets/obsolete/test.webp", "custom/portraits/test.webp"]

    print("v1.74.0 update builder: cumulative inheritance, signed releases, replacement, retirement, and deletion passed")


if __name__ == "__main__":
    main()
