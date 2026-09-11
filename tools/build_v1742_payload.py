#!/usr/bin/env python3
"""Build the deterministic v1.74.2 full-body repair payload and exclusion list."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import zipfile


ROOT = Path(__file__).resolve().parents[1]
VERSION = "1.74.2"
BUILD = 197
PACKAGE = "com.dominus.aetherionreforgey"

REMOVED_PERSON_FILES = (
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
    "custom/npc-portraits/v168/00_quartermaster_original_unchanged.webp",
    "assets/v38/thrall/nessa_cale_portrait.webp",
)
REMOVED_DIRECTORIES = ("assets/workers/", "assets/dynasty/")
RETIRED_TECHNICAL = (
    "patches/v1.74.0-safe-updater.js",
    "patches/v1.74.0-update-center.js",
    "assets/v1740/native-build-196.json",
)
NEW_GAME_FILES = (
    "patches/v1.74.2-safe-updater.js",
    "patches/v1.74.2-update-center.js",
    "systems-v81-dominus-blood-dial.js",
    "systems-v81-fullbody-integrity.js",
    "custom/ui/dominus-time/dominus-blood-dial-base.webp",
    "assets/v1742/native-build-197.json",
)


def game_exclusions(base_game: Path) -> list[str]:
    paths: list[str] = []
    for prefix in REMOVED_DIRECTORIES:
        directory = base_game / prefix.rstrip("/")
        paths.extend(path.relative_to(base_game).as_posix() for path in sorted(directory.rglob("*")) if path.is_file())
    paths.extend(REMOVED_PERSON_FILES)
    paths.extend(RETIRED_TECHNICAL)
    if len(paths) != len(set(paths)):
        raise ValueError("v1.74.2 exclusion list contains duplicates")
    for relative in paths:
        if not (base_game / relative).is_file():
            raise FileNotFoundError(f"expected v1.74.0 file is missing: {relative}")
    return sorted(paths)


def patch_index(source: str) -> str:
    safe_old = '<script src="patches/v1.74.0-safe-updater.js?v=1.74.0"></script>'
    center_old = '<script src="patches/v1.74.0-update-center.js?v=1.74.0"></script>'
    stable = '<script src="patches/v1.74.0-stable-bundle.js?v=1.74.0"></script>'
    for needle in (safe_old, center_old, stable):
        if source.count(needle) != 1:
            raise ValueError(f"expected one index marker: {needle}")
    source = source.replace(safe_old, '<script src="patches/v1.74.2-safe-updater.js?v=1.74.2"></script>')
    source = source.replace(center_old, '<script src="patches/v1.74.2-update-center.js?v=1.74.2"></script>')
    source = source.replace(
        stable,
        stable
        + '\n<!-- v1.74.2: House Dominus sky dial and authoritative full-body portrait integrity. -->'
        + '\n<script src="systems-v81-dominus-blood-dial.js?v=1.74.2"></script>'
        + '\n<script src="systems-v81-fullbody-integrity.js?v=1.74.2"></script>',
    )
    return source


def patch_manifest(source: bytes) -> bytes:
    old_version = "1.74.0".encode("utf-16le")
    new_version = VERSION.encode("utf-16le")
    old_code = b"\x08\x00\x00\x10" + (196).to_bytes(4, "little")
    new_code = b"\x08\x00\x00\x10" + BUILD.to_bytes(4, "little")
    if source.count(old_version) != 1 or source.count(old_code) != 1:
        raise ValueError("Android manifest does not contain the expected v1.74.0/build-196 markers")
    result = source.replace(old_version, new_version).replace(old_code, new_code)
    if PACKAGE.encode("utf-16le") not in result:
        raise ValueError("Android package identity changed or is missing")
    return result


def patch_asset_manifest(source: str, excluded: set[str]) -> str:
    prefix, encoded = source.split("=", 1)
    assets = json.loads(encoded.strip().removesuffix(";"))
    kept = [path for path in assets if path not in excluded and not any(path.startswith(prefix) for prefix in REMOVED_DIRECTORIES)]
    for path in NEW_GAME_FILES:
        if path not in kept:
            kept.append(path)
    return prefix + "=" + json.dumps(kept, indent=2, ensure_ascii=False) + ";\n"


def copy(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-apk", type=Path, required=True)
    parser.add_argument("--base-game", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--exclusions", type=Path, required=True)
    args = parser.parse_args()

    payload = args.output.resolve()
    if payload.exists():
        shutil.rmtree(payload)
    game = payload / "assets" / "game"
    game.mkdir(parents=True)

    exclusions = game_exclusions(args.base_game)
    args.exclusions.parent.mkdir(parents=True, exist_ok=True)
    args.exclusions.write_text("".join(f"assets/game/{path}\n" for path in exclusions), "utf-8")

    with zipfile.ZipFile(args.base_apk) as archive:
        manifest = archive.read("AndroidManifest.xml")
    (payload / "AndroidManifest.xml").write_bytes(patch_manifest(manifest))
    (game / "index.html").write_text(patch_index((args.base_game / "index.html").read_text("utf-8")), "utf-8")
    (game / "asset-manifest.js").write_text(
        patch_asset_manifest((args.base_game / "asset-manifest.js").read_text("utf-8"), set(exclusions)),
        "utf-8",
    )

    copy(ROOT / "patches" / "v1.74.2-safe-updater.js", game / "patches" / "v1.74.2-safe-updater.js")
    copy(ROOT / "patches" / "v1.74.2-update-center.js", game / "patches" / "v1.74.2-update-center.js")
    copy(ROOT / "changes" / "1.74.1" / "dominus-blood-dial.js", game / "systems-v81-dominus-blood-dial.js")
    copy(ROOT / "systems-v81-fullbody-integrity.js", game / "systems-v81-fullbody-integrity.js")
    copy(
        ROOT / "changes" / "1.74.1" / "assets" / "dominus-blood-dial-base.webp",
        game / "custom" / "ui" / "dominus-time" / "dominus-blood-dial-base.webp",
    )
    marker = {
        "version": VERSION,
        "build": BUILD,
        "package": PACKAGE,
        "maintenance": "content-preserving-fullbody-bugfix",
        "saveFormatChanged": False,
        "gameplayContentRemoved": False,
        "obsoletePortraitAssetsRemoved": len(exclusions) - len(RETIRED_TECHNICAL),
        "retiredTechnicalFiles": len(RETIRED_TECHNICAL),
        "voiceSystem": "preserved",
    }
    marker_path = game / "assets" / "v1742" / "native-build-197.json"
    marker_path.parent.mkdir(parents=True, exist_ok=True)
    marker_path.write_text(json.dumps(marker, indent=2) + "\n", "utf-8")
    print(f"payload={payload}")
    print(f"excluded_portraits={marker['obsoletePortraitAssetsRemoved']}")
    print(f"retired_technical={marker['retiredTechnicalFiles']}")


if __name__ == "__main__":
    main()
