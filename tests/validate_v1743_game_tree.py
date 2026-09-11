#!/usr/bin/env python3
"""Validate the unpacked v1.74.3 game against the complete v1.74.2 baseline."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import sys


if len(sys.argv) != 3:
    raise SystemExit("usage: validate_v1743_game_tree.py BASE_GAME CANDIDATE_GAME")

base = Path(sys.argv[1]).resolve()
candidate = Path(sys.argv[2]).resolve()

retired_technical = {
    "patches/v1.66.0-living-world-balance.js",
    "patches/v1.67.0-identity-world-integrity.js",
    "patches/v1.68.0-curated-npc-portraits.js",
    "patches/v1.74.0-stable-bundle.js",
    "patches/v1.74.2-safe-updater.js",
    "patches/v1.74.2-update-center.js",
    "systems-v81-fullbody-integrity.js",
    "assets/v1742/native-build-197.json",
}
retired_portraits = {
    "assets/prisoners/bandit_female.webp",
    "assets/prisoners/bandit_male.webp",
    "assets/prisoners/mercenary_male.webp",
    "assets/prisoners/orc_male.webp",
    "assets/v28/scenes/dock_foreman.webp",
    "assets/v28/scenes/marine_captain.webp",
    "assets/v28/scenes/master_shipwright.webp",
    "assets/v28/scenes/navigator.webp",
    "assets/v28/scenes/privateer_captain.webp",
    "assets/v28/scenes/quartermaster.webp",
    "assets/v26/scenes/blood_thrall.webp",
    "assets/v26/scenes/street_informant.webp",
    "assets/v26/scenes/watch_captain.webp",
}
retired = retired_technical | retired_portraits
modified = {
    "index.html",
    "asset-manifest.js",
    "data.js",
    "systems-v10.js",
    "systems-v16.js",
    "systems-v23.js",
    "systems-v26.js",
    "systems-v28.js",
    "systems-v31.js",
    "systems-v34-frontier.js",
    "systems-v35-fishing.js",
    "systems-v51-physical-commerce.js",
    "systems-v55-blueprint-commerce.js",
}
added = {
    "systems-v81-safe-updater.js",
    "systems-v81-update-center.js",
    "systems-v81-economy-dialogue.js",
    "systems-v81-identity-integrity.js",
    "systems-v81-scroll.js",
    "systems-v81-alexus-equipment.js",
    "systems-v81-alexus-body-map.js",
    "systems-v81-portrait-data.js",
    "systems-v81-portrait-catalog.js",
    "systems-v81-living-world.js",
    "systems-v81-knight-roster.js",
    "systems-v81-time-cycle.js",
    "systems-v81-portrait-core.js",
    "assets/v1743/native-build-198.json",
}


def files(root: Path) -> set[str]:
    return {str(path.relative_to(root)) for path in root.rglob("*") if path.is_file()}


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


base_files = files(base)
candidate_files = files(candidate)
if base_files - candidate_files != retired:
    raise SystemExit(f"unexpected removed files: {sorted(base_files - candidate_files)}")
if candidate_files - base_files != added:
    raise SystemExit(f"unexpected added files: {sorted(candidate_files - base_files)}")

changed = {
    name for name in base_files & candidate_files if digest(base / name) != digest(candidate / name)
}
if changed != modified:
    raise SystemExit(f"unexpected modified files: {sorted(changed)}")

for name in retired:
    if (candidate / name).exists():
        raise SystemExit(f"retired runtime file remains: {name}")

manifest_text = (candidate / "asset-manifest.js").read_text("utf-8")
asset_manifest = json.loads(manifest_text.split("=", 1)[1].strip().removesuffix(";"))
if len(asset_manifest) != len(set(asset_manifest)):
    raise SystemExit("asset-manifest.js contains duplicate paths")
manifest_missing = [name for name in asset_manifest if not (candidate / name).is_file()]
if manifest_missing:
    raise SystemExit(f"asset-manifest.js references missing files: {manifest_missing[:30]}")
if retired & set(asset_manifest):
    raise SystemExit(f"asset-manifest.js still lists retired files: {sorted(retired & set(asset_manifest))}")
if not added <= set(asset_manifest):
    raise SystemExit(f"asset-manifest.js omits new files: {sorted(added - set(asset_manifest))}")

literal_pattern = re.compile(
    r"['\"]((?:assets|custom)/[^'\"?#+)\\ ]+\.(?:webp|png|jpe?g|gif|mp3|wav|ogg|mp4|webm|glb|json))['\"]",
    re.IGNORECASE,
)
missing_literals: set[tuple[str, str]] = set()
for source in candidate.rglob("*.js"):
    relative = str(source.relative_to(candidate))
    for match in literal_pattern.finditer(source.read_text("utf-8", errors="ignore")):
        reference = match.group(1)
        if not (candidate / reference).is_file():
            missing_literals.add((relative, reference))

removed_person_files = {
    "assets/v29/portraits/blacksmith.webp",
    "assets/v29/portraits/bookseller.webp",
    "assets/v29/portraits/captain_edric.webp",
    "assets/v29/portraits/captain_sabine.webp",
    "assets/v29/portraits/carpenter.webp",
    "assets/v29/portraits/fence.webp",
    "assets/v29/portraits/foreman_garran.webp",
    "assets/v29/portraits/moneychanger.webp",
    "assets/v29/portraits/navigator_yselle.webp",
    "assets/v29/portraits/quartermaster_halric.webp",
    "assets/v29/portraits/shipwright_odran.webp",
    "assets/v29/portraits/stablemaster.webp",
    "assets/v29/portraits/surgeon_halric.webp",
    "assets/v29/portraits/surgeon_ysabet.webp",
    "assets/v29/portraits/tavernkeeper.webp",
    "assets/v34/people/market_loader.webp",
    "assets/v34/people/market_teamster.webp",
    "assets/v34/people/market_wheelwright.webp",
    "assets/v34/people/quartermaster_corvinus.webp",
    "assets/prisoners/bandit_female.webp",
    "assets/prisoners/bandit_male.webp",
    "assets/prisoners/mercenary_male.webp",
    "assets/prisoners/orc_male.webp",
    "assets/v28/scenes/dock_foreman.webp",
    "assets/v28/scenes/marine_captain.webp",
    "assets/v28/scenes/master_shipwright.webp",
    "assets/v28/scenes/navigator.webp",
    "assets/v28/scenes/privateer_captain.webp",
    "assets/v28/scenes/quartermaster.webp",
    "assets/v26/scenes/blood_thrall.webp",
    "assets/v26/scenes/street_informant.webp",
    "assets/v26/scenes/watch_captain.webp",
    "assets/v38/thrall/nessa_cale_portrait.webp",
    "custom/npc-portraits/v168/00_quartermaster_original_unchanged.webp",
}
missing_video_fallbacks = {
    "assets/v52/pleasure_tavern_01.mp4",
    "assets/v52/pleasure_tavern_02.mp4",
    "assets/v52/pleasure_tavern_03.mp4",
    "assets/v54/camp_pleasure_01.mp4",
    "assets/v54/camp_pleasure_02.mp4",
}
allowed_missing_literals = {
    *(('systems-v81-portrait-core.js', name) for name in removed_person_files),
    *(('systems-v81-identity-integrity.js', name) for name in missing_video_fallbacks),
}
if missing_literals != allowed_missing_literals:
    raise SystemExit(
        "unexpected missing literal asset references: "
        + json.dumps(sorted(missing_literals ^ allowed_missing_literals), indent=2)
    )

marker = json.loads((candidate / "assets/v1743/native-build-198.json").read_text("utf-8"))
if marker.get("version") != "1.74.3" or marker.get("build") != 198:
    raise SystemExit(f"incorrect native marker: {marker}")
if marker.get("gameplayContentRemoved") is not False or marker.get("saveFormatChanged") is not False:
    raise SystemExit(f"invalid preservation declaration: {marker}")

preserved = base_files - retired - modified
preserved_bytes = sum((candidate / name).stat().st_size for name in preserved)
voice_files = {
    name for name in preserved
    if "piper" in name.lower() or name.lower().endswith((".onnx", ".onnx.json"))
}
media_files = {name for name in preserved if name.lower().endswith((".mp3", ".wav", ".ogg", ".mp4", ".webm"))}
model_files = {name for name in preserved if name.lower().endswith(".glb")}

print(json.dumps({
    "status": "PASS",
    "baseFiles": len(base_files),
    "candidateFiles": len(candidate_files),
    "retiredTechnicalFiles": len(retired_technical),
    "retiredUnwantedPortraits": len(retired_portraits),
    "modifiedGameFiles": len(modified),
    "newSystemFiles": len(added),
    "byteIdenticalFiles": len(preserved),
    "byteIdenticalBytes": preserved_bytes,
    "voiceFilesPreserved": len(voice_files),
    "mediaFilesPreserved": len(media_files),
    "modelFilesPreserved": len(model_files),
    "intentionalCompatibilityReferences": len(allowed_missing_literals),
}, indent=2))
