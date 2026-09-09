#!/usr/bin/env python3
"""Verify that every stable-manifest payload matches the committed bytes."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REMOTE_MODEL_METADATA = {
    "assets/v171/valkorion-base-lord.glb": (37_293_792, "963d66d60d4e7b1dcfdeb43f44bc764683ddf2f8a4a4ffe4dbd63a530d186d47"),
    "assets/v171/valkorion-armored.glb": (99_848_008, "de12485beeebd6be86e9354e25a2071a1203fb94a6b8b660fd8c7d01acaecba1"),
    "assets/v171/libita-gothic-gown.glb": (97_544_908, "5941aa40b5c08b2e71b04a39665a11129d5960312361d513fa3f76d34b0df2f9"),
    "assets/v172/valkorion-base-lord.glb": (21_148_428, "c15bee80cec479f90b7a53d5fb08fb12099f7750c3847335ba14a5bd064acd72"),
    "assets/v172/valkorion-armored.glb": (42_261_516, "5e203593a2289b6f74d191630cad5cbe3c760065f2980c057a9dacabe87479fe"),
    "assets/v172/alexus-gothic-gown.glb": (40_013_784, "12ba557524188ccb30b11bec2e5b84a6053b1796727999aef57ea211ee946399"),
}


def main() -> None:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["schema"] == 1
    assert manifest["enabled"] is True
    assert manifest["latest"]["game_version"] == "1.72.4"
    assert manifest["latest"]["android_version_code"] == 193
    assert manifest["latest"]["min_updater_schema"] <= 1
    apk = manifest["android_apk"]
    assert apk["version"] == "1.72.4"
    assert apk["version_code"] == 193
    assert apk["filename"] == "Aetherion_Reforged_v1.72.4_FULL_REPAIR.apk"
    assert apk["url"].endswith("/v1.72.4/" + apk["filename"])
    assert apk["size"] == 479189462
    assert apk["sha256"] == "da5a55da228dcabf15bb00935881b983ef948ba665abe0db6f2d65d5adcbeee1"
    assert apk["signing_certificate_sha256"] == "ca8042f4758d9a056eb0748edfaad0cfd8a436ea7d35907c28b32c3f3afd5eb8"
    payloads = manifest["payloads"]
    portrait_root = ROOT / "custom" / "npc-portraits" / "v168"
    portrait_paths = [
        str(path.relative_to(ROOT))
        for path in sorted(
            portrait_root.glob("*.webp"),
            key=lambda path: int(path.name.split("_", 1)[0]),
        )
    ]
    assert len(portrait_paths) == 111
    assert [payload["path"] for payload in payloads] == [
        "patches/v1.59.2-dominus-art-fix.js",
        "assets/v109/valkorion_final.glb",
        "patches/v1.63.0-valkorion-final.js",
        "patches/v1.64.0-world-ui-integrity.js",
        "patches/v1.65.0-world-economy-cleanup.js",
        "patches/v1.66.0-living-world-balance.js",
        "patches/v1.66.1-immersive-narrator-sophia.js",
        "patches/v1.67.0-identity-world-integrity.js",
        *portrait_paths,
        "patches/v1.68.0-curated-npc-portraits.js",
        "patches/v1.69.0-safe-updater.js",
        "patches/v1.69.1-start-menu-access.js",
        "patches/v1.69.2-safe-updater.js",
        "patches/v1.70.0-safe-updater.js",
        "patches/v1.70.0-valkorion-complete.js",
        "patches/v1.70.0-tournaments.js",
        "assets/v170/jousting-arena.png",
        "assets/v170/duel-arena.png",
        "assets/v170/archery-range.png",
        "patches/v1.71.0-safe-updater.js",
        "patches/v1.71.0-update-center.js",
        "patches/v1.71.0-character-models.js",
        "assets/v171/valkorion-base-lord.glb",
        "assets/v171/valkorion-armored.glb",
        "assets/v171/libita-gothic-gown.glb",
        "patches/v1.72.0-safe-updater.js",
        "patches/v1.72.0-update-center.js",
        "patches/v1.72.0-character-models.js",
        "patches/v1.72.0-runtime-repair.js",
        "assets/v172/valkorion-base-lord.glb",
        "assets/v172/valkorion-armored.glb",
        "assets/v172/alexus-gothic-gown.glb",
        "patches/v1.72.1-safe-updater.js",
        "patches/v1.72.1-update-center.js",
        "patches/v1.72.1-character-models.js",
        "patches/v1.72.1-runtime-repair.js",
        "patches/v1.72.1-character-loader-hotfix.js",
        "patches/v1.72.2-safe-updater.js",
        "patches/v1.72.2-update-center.js",
        "patches/v1.72.2-character-models.js",
        "patches/v1.72.2-runtime-repair.js",
        "patches/v1.72.3-safe-updater.js",
        "patches/v1.72.3-update-center.js",
        "patches/v1.72.3-character-models.js",
        "patches/v1.72.3-runtime-repair.js",
        "assets/v173/native-build-192.json",
        "patches/v1.72.4-performance.js",
        "assets/v174/native-build-193.json",
    ]
    assert len({payload["path"] for payload in payloads}) == len(payloads)

    for payload in payloads:
        if payload["path"] == "assets/v109/valkorion_final.glb":
            assert payload["url"] == (
                "https://raw.githubusercontent.com/corinthianrattler-ui/"
                "aetherion-updates/main/assets/v109/valkorion_final.glb"
            )
            assert payload["size"] == 38_658_288
            assert payload["sha256"] == (
                "7c6006efb6b2966b78c3d65ae10605f63bb9fe2c1fa674b569d8dc52b1dffee5"
            )
            assert payload["restart_required"] is True
            continue
        path = ROOT / payload["path"]
        if not path.is_file() and payload["path"] in REMOTE_MODEL_METADATA:
            size, digest = REMOTE_MODEL_METADATA[payload["path"]]
            assert payload["size"] == size
            assert payload["sha256"] == digest
            release = "v1.71.0" if payload["path"].startswith("assets/v171/") else "v1.72.0"
            assert payload["url"] == (
                "https://github.com/corinthianrattler-ui/aetherion-updates/"
                f"releases/download/{release}/{path.name}"
            )
            assert payload["restart_required"] is True
            continue
        data = path.read_bytes()
        actual_hash = hashlib.sha256(data).hexdigest()
        assert payload["size"] == len(data), f"{payload['path']}: size mismatch"
        assert payload["sha256"] == actual_hash, f"{payload['path']}: SHA-256 mismatch"
        if payload["path"].startswith("assets/v171/"):
            assert payload["url"] == (
                "https://github.com/corinthianrattler-ui/aetherion-updates/"
                f"releases/download/v1.71.0/{path.name}"
            ), f"{payload['path']}: release URL mismatch"
        elif payload["path"].startswith("assets/v172/"):
            assert payload["url"] == (
                "https://github.com/corinthianrattler-ui/aetherion-updates/"
                f"releases/download/v1.72.0/{path.name}"
            ), f"{payload['path']}: release URL mismatch"
        else:
            assert payload["url"].endswith("/" + payload["path"]), f"{payload['path']}: URL mismatch"
        assert payload["restart_required"] is True

    assert manifest["save_policy"]["preserve_always"] is True
    assert "Version 1.72.4 is Android build 193" in manifest["notes"]
    assert "Version 1.72.3 is the fully scanned Android build 192 repair" in manifest["notes"]
    assert "Version 1.72.2 replaces the Android file:// game origin" in manifest["notes"]
    assert "shape-preserving KHR_mesh_quantization without mesh simplification" in manifest["notes"]
    assert "Version 1.72.1 repairs the live v80 wardrobe connection" in manifest["notes"]
    assert "Version 1.72.0 repairs Continue" in manifest["notes"]
    assert "Lady Alexus Dominus's gothic-ball-gown model" in manifest["notes"]
    assert "50 MB mobile and Tripo target" in manifest["notes"]
    assert "Android build 187 restores the finished 40-piece assembled Valkorion kit" in manifest["notes"]
    assert "raw text/plain response" in manifest["notes"]
    assert "Continue and Game Updates remain reachable" in manifest["notes"]
    assert "automatically rolls back" in manifest["notes"]
    assert "zero portrait-record checks" in manifest["notes"]
    assert "110 new lore-matched" in manifest["notes"]
    assert "Quartermaster Halric Morn" in manifest["notes"]
    print("manifest.json: 1.72.4 payload sizes, release URLs, and SHA-256 hashes passed")


if __name__ == "__main__":
    main()
