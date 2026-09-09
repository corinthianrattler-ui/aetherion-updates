#!/usr/bin/env python3
"""Build the stable update manifest from the exact committed payload bytes."""

from __future__ import annotations

import hashlib
import json
import argparse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW_BASE = "https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/"
V171_RELEASE_BASE = (
    "https://github.com/corinthianrattler-ui/"
    "aetherion-updates/releases/download/v1.71.0/"
)
V171_ASSETS = {
    "assets/v171/valkorion-base-lord.glb",
    "assets/v171/valkorion-armored.glb",
    "assets/v171/libita-gothic-gown.glb",
}
V172_RELEASE_BASE = (
    "https://github.com/corinthianrattler-ui/"
    "aetherion-updates/releases/download/v1.72.0/"
)
V172_ASSETS = {
    "assets/v172/valkorion-base-lord.glb",
    "assets/v172/valkorion-armored.glb",
    "assets/v172/alexus-gothic-gown.glb",
}
PORTRAIT_ROOT = ROOT / "custom" / "npc-portraits" / "v168"
APK_NAME = "Aetherion_Reforged_v1.72.6_GAMEPLAY_REPAIR_FULL.apk"


def portrait_number(path: Path) -> int:
    return int(path.name.split("_", 1)[0])


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def payload(path: str, previous: dict[str, dict[str, object]]) -> dict[str, object]:
    local = ROOT / path
    if not local.is_file():
        if path not in previous:
            raise FileNotFoundError(local)
        return previous[path]
    data = local.read_bytes()
    if path in V172_ASSETS:
        url = V172_RELEASE_BASE + Path(path).name
    elif path in V171_ASSETS:
        url = V171_RELEASE_BASE + Path(path).name
    else:
        url = RAW_BASE + path
    return {
        "path": path,
        "url": url,
        "sha256": hashlib.sha256(data).hexdigest(),
        "size": len(data),
        "restart_required": True,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk", type=Path, required=True)
    args = parser.parse_args()
    if not args.apk.is_file():
        raise FileNotFoundError(args.apk)
    old = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    previous = {row["path"]: row for row in old.get("payloads", [])}
    portraits = [
        str(path.relative_to(ROOT))
        for path in sorted(PORTRAIT_ROOT.glob("*.webp"), key=portrait_number)
    ]
    if not portraits:
        portraits = sorted(
            path for path in previous if path.startswith("custom/npc-portraits/v168/")
        )
    assert len(portraits) == 111
    paths = [
        "patches/v1.59.2-dominus-art-fix.js",
        "assets/v109/valkorion_final.glb",
        "patches/v1.63.0-valkorion-final.js",
        "patches/v1.64.0-world-ui-integrity.js",
        "patches/v1.65.0-world-economy-cleanup.js",
        "patches/v1.66.0-living-world-balance.js",
        "patches/v1.66.1-immersive-narrator-sophia.js",
        "patches/v1.67.0-identity-world-integrity.js",
        *portraits,
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
    ]
    manifest = {
        "schema": 1,
        "channel": "stable",
        "enabled": True,
        "latest": {
            "game_version": "1.72.6",
            "android_version_code": 195,
            "min_updater_schema": 1,
        },
        "manifest_url": RAW_BASE + "manifest.json",
        "release_base": (
            "https://github.com/corinthianrattler-ui/"
            "aetherion-updates/releases/download/"
        ),
        "android_apk": {
            "version": "1.72.6",
            "version_code": 195,
            "filename": APK_NAME,
            "url": (
                "https://github.com/corinthianrattler-ui/aetherion-updates/"
                "releases/download/v1.72.6/"
                f"{APK_NAME}"
            ),
            "size": args.apk.stat().st_size,
            "sha256": file_sha256(args.apk),
            "signing_certificate_sha256": (
                "5e68318c3e12c9f5915976a25bbfd5039a2f7e651682b65744b2747b618c3e77"
            ),
        },
        "payloads": [payload(path, previous) for path in paths],
        "notes": (
            "Version 1.72.6 is Android build 195. It restores Lady Alexus's supplied 3D model in her Equipment view and uniquely classifies all 28 mesh sections into foundation plus 12 independently controlled fitted wardrobe slots. Her main-hand, off-hand, ranged, reserve, and ammunition pieces remain independent equipment cards because the supplied GLB has no geometry for those five pieces; nothing is fabricated or falsely described as visible geometry. Portrait-phone layout now constrains the game, modals, equipment, shops, selectors, Systems dock, and notices to one vertical viewport, removing sideways page scrolling and the right-side void. Ordinary shop and market purchases route directly to Valkorion's Carried Inventory. Quartermaster requisitions resolve the correct fitted wagon crate first, then the next compatible crate with capacity, and never treat an empty bare wagon floor as ordinary item storage. The small gameplay repair is available through the in-game updater on v1.72.5, while the full APK retains every prior asset and uses the exact same signing identity. Version 1.72.5 is Android build 194. It restores the fitted 17-slot Valkorion model, makes armor, court clothing, weapons, ammunition, cloak, and jewelry independently visible, and allows armor and court pieces to be mixed without swapping a whole-body model. Removing one item hides only that item. A shared registration contract rejects future baked or partial character models. Version 1.72.4 is Android build 193. It corrects the reversed native query and fragment branches that prevented versioned game files from loading, retains WebView cache between launches, loads the optional Three.js and WebLLM runtimes only when their systems are opened, and prevents already-current state from traversing the entire migration chain on every render. Version 1.72.3 is the fully scanned Android build 192 repair. It removes the false "
            "web-patch-as-APK success path, proves the installed native package with a bundled "
            "build marker, clears the hidden opening-film guard before Continue renders, mounts Valkorion on both Character and Equipment screens, displays a "
            "small live 3D status badge, repairs two zero-byte legacy images, and retains the "
            "original update-compatible signing identity. Version 1.72.2 replaces the Android file:// game origin with a secure internal "
            "HTTPS-style asset route, allowing the bundled Three.js loader to read the supplied "
            "Valkorion and Lady Alexus GLBs. The full APK is required because this correction is "
            "inside the native WebView shell; the staged channel adds a visible full-APK download "
            "path and does not pretend JavaScript alone can replace it. File access remains disabled. "
            "The APK's three fitted models use shape-preserving KHR_mesh_quantization without mesh "
            "simplification, cutting their combined bytes and GPU attribute memory while retaining "
            "all 23 base/Lord parts, 40 armor parts, 28 Lady Alexus parts, materials, and transforms. "
            "Version 1.72.1 repairs the live v80 wardrobe connection that was skipped when "
            "historical v97/v98 viewer globals were absent. The supplied Valkorion base, "
            "Lord, complete 40-piece armor, and Lady Alexus models now replace the flat "
            "portrait fallback in their actual viewers. The verified v1.72 model files are "
            "unchanged; Android build 190 corrects the loader hook and retains every v1.72 "
            "mobile optimization. Version 1.72.0 repairs Continue, removes the floating gold update control and "
            "Android blue tap flash, and keeps Game Updates inside the opening menu and Systems. "
            "Android build 189 uses the supplied fitted Valkorion base body, Lord's royal "
            "armor, complete armored kit, and his twin sister Lady Alexus Dominus's gothic-ball-gown model. The release "
            "preserves every fitted model part and authored transform while using bounded-error "
            "mobile geometry; all three GLBs are below the 50 MB mobile and Tripo target. It also "
            "removes repeated full-page observers, continuous idle rendering, and repeated model "
            "reframing. The Game Updates screen shows the exact channel address, received bytes, "
            "percentage, verification, install, and restart states. Base and "
            "Lord modes switch fitted-node visibility without rebuilding or separating the "
            "figure, complete armor changes the loaded source cleanly, and Lady Alexus's model "
            "loads only inside her person or equipment view. Android build 187 restores the "
            "finished 40-piece assembled Valkorion kit and "
            "playable Corvinus Keep jousting, armored-duel, and archery tournaments with the "
            "corrected heraldic scenes. The 106,006,128-byte finished GLB is bundled in the full "
            "APK because it exceeds GitHub's ordinary single-file repository limit. Rejected "
            "exploded, simplified, empty-arena, and rain-only variants are not active. Existing "
            "saves and all prior game systems are preserved. The bundled updater retrieves the "
            "stable channel through GitHub's JavaScript-safe Contents response, decodes the "
            "exact channel bytes locally, and retains a script-safe CDN fallback; it no longer "
            "asks Android to execute GitHub's raw text/plain response. The startup access repair "
            "is bundled into the APK: every app launch now stops at the opening menu, even when "
            "an autosave exists, so Continue and Game Updates remain reachable without deleting "
            "any timeline. Game Updates is also kept in the live Systems dock. "
            "The safe updater receives complete patch source before activation; "
            "enforces per-module SHA-256 checks, strict size limits, and trusted asset "
            "origins; stages updates locally; retains the previous release; automatically "
            "rolls back an update that cannot finish starting; and provides Safe Start once "
            "plus a permanent return to the built-in version without deleting game saves. "
            "It also retains the startup and gameplay hotfix for the curated portrait update. Removes "
            "whole-world identity and portrait scans from render, list-view, portrait-view, "
            "daily-tick, and already-migrated save paths; save migration now runs once per "
            "version and new NPC creation remains checked at its source. A 1,219-person "
            "stress save now performs zero portrait-record checks across repeated redraws. "
            "The library still installs 110 new lore-matched, labeled "
            "full-body NPC portraits plus the unchanged original Quartermaster role "
            "portrait. Every image is explicitly tagged for sex, visual age band, race, "
            "occupation, faction, mounted status, and individual-person use. Routing is "
            "deterministic and location-aware; one curated face cannot be assigned twice "
            "in the active world. Exact named-character art remains locked, including "
            "Quartermaster Halric Morn, Kael, Valkorion, Alexus, Libita, Nessa, surgeons, "
            "officers, and unique companions. Incompatible or unavailable art falls back "
            "without changing identity or save progress. The 19.91 MiB library covers "
            "human, dwarf, elf, dark-elf, ordinary-orc, Grimhorn beast-orc, civilian, "
            "child, infant, elder, knight, guard, rider, and lore-faction roles. All prior "
            "economy, shop, wine, wage, dialogue, Narrator, Sophia Help, item-purpose, "
            "and world-integrity repairs remain active. Existing saves are preserved. "
            "Restart after applying."
        ),
        "save_policy": {"managed": False, "preserve_always": True},
    }
    (ROOT / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"manifest.json: wrote {len(paths)} verified payload entries")


if __name__ == "__main__":
    main()
