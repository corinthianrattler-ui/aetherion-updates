#!/usr/bin/env python3
"""Build the stable update manifest from the exact committed payload bytes."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW_BASE = "https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/"
PORTRAIT_ROOT = ROOT / "custom" / "npc-portraits" / "v168"


def portrait_number(path: Path) -> int:
    return int(path.name.split("_", 1)[0])


def payload(path: str) -> dict[str, object]:
    data = (ROOT / path).read_bytes()
    return {
        "path": path,
        "url": RAW_BASE + path,
        "sha256": hashlib.sha256(data).hexdigest(),
        "size": len(data),
        "restart_required": True,
    }


def main() -> None:
    portraits = [
        str(path.relative_to(ROOT))
        for path in sorted(PORTRAIT_ROOT.glob("*.webp"), key=portrait_number)
    ]
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
    ]
    manifest = {
        "schema": 1,
        "channel": "stable",
        "enabled": True,
        "latest": {
            "game_version": "1.68.0",
            "android_version_code": 183,
            "min_updater_schema": 1,
        },
        "manifest_url": RAW_BASE + "manifest.json",
        "release_base": (
            "https://github.com/corinthianrattler-ui/"
            "aetherion-updates/releases/download/"
        ),
        "payloads": [payload(path) for path in paths],
        "notes": (
            "Save-safe curated portrait update. Installs 110 new lore-matched, labeled "
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
            "and world-integrity repairs remain active. Restart after applying."
        ),
        "save_policy": {"managed": False, "preserve_always": True},
    }
    (ROOT / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"manifest.json: wrote {len(paths)} verified payload entries")


if __name__ == "__main__":
    main()
