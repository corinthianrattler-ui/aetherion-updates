#!/usr/bin/env python3
"""Verify that every stable-manifest payload matches the committed bytes."""

from __future__ import annotations

import hashlib
import json
import subprocess
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
    previous_manifest = json.loads(
        subprocess.check_output(
            ["git", "show", "HEAD:manifest.json"], cwd=ROOT, text=True
        )
    )
    previous_payloads = {
        payload["path"]: payload for payload in previous_manifest["payloads"]
    }
    assert manifest["schema"] == 1
    assert manifest["enabled"] is True
    assert manifest["latest"]["game_version"] == "1.73.0"
    assert manifest["latest"]["android_version_code"] == 195
    assert manifest["latest"]["min_updater_schema"] <= 1
    apk = manifest["android_apk"]
    assert apk["version"] == "1.72.6"
    assert apk["version_code"] == 195
    assert apk["filename"] == "Aetherion_Reforged_v1.72.6_GAMEPLAY_REPAIR_FULL.apk"
    assert apk["url"].endswith("/v1.72.6/" + apk["filename"])
    assert apk["size"] == 499039030
    assert apk["sha256"] == "2fd692cb05cb163e5bde55abfae8789c3131e15e956831921abe07f905f2c645"
    assert apk["signing_certificate_sha256"] == "5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77"
    payloads = manifest["payloads"]
    portrait_paths = [
        payload["path"] for payload in payloads
        if payload["path"].startswith("custom/npc-portraits/v168/")
    ]
    portrait_paths_v173 = [
        payload["path"] for payload in payloads
        if payload["path"].startswith("custom/npc-portraits/v173/")
        and payload["path"].endswith(".webp")
    ]
    assert len(portrait_paths) == 111
    assert len(portrait_paths_v173) == 268
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
        "patches/v1.72.5-safe-updater.js",
        "patches/v1.72.5-update-center.js",
        "patches/v1.72.5-character-models.js",
        "assets/v175/native-build-194.json",
        "patches/v1.72.6-safe-updater.js",
        "patches/v1.72.6-update-center.js",
        "patches/v1.72.6-gameplay-repair.js",
        "assets/v176/native-build-195.json",
        "patches/v1.72.7-scroll-repair.js",
        "patches/v1.72.8-alexus-equipment-repair.js",
        "patches/v1.72.10-alexus-original-body-map.js",
        *portrait_paths_v173,
        "custom/npc-portraits/v173/registry.json",
        "patches/v1.73.0-portrait-data.js",
        "patches/v1.73.0-living-portraits.js",
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
        if not path.is_file():
            previous = previous_payloads.get(payload["path"])
            assert previous is not None, f"{payload['path']}: new payload is missing locally"
            for field in ("size", "sha256", "url", "restart_required"):
                assert payload[field] == previous[field], (
                    f"{payload['path']}: omitted stable payload changed {field}"
                )
            continue
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
    assert "Version 1.73.0 adds 268 unique" in manifest["notes"]
    assert "379 reviewed portrait choices" in manifest["notes"]
    assert "never workers or recruitable applicants" in manifest["notes"]
    assert "beekeepers, goatherds and poultry keepers" in manifest["notes"]
    assert "whole-world portrait scans" in manifest["notes"]
    assert "Version 1.72.10 restores Lady Alexus's original authored anatomy map" in manifest["notes"]
    assert "Version 1.72.6 is Android build 195" in manifest["notes"]
    assert "all 28 mesh sections" in manifest["notes"]
    assert "12 independently controlled fitted wardrobe slots" in manifest["notes"]
    assert "Carried Inventory" in manifest["notes"]
    assert "correct fitted wagon crate first" in manifest["notes"]
    assert "Version 1.72.5 is Android build 194" in manifest["notes"]
    assert "17-slot Valkorion model" in manifest["notes"]
    assert "shared registration contract rejects future baked or partial character models" in manifest["notes"]
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
    print("manifest.json: 1.73.0 payload sizes, release URLs, and SHA-256 hashes passed")


if __name__ == "__main__":
    main()
