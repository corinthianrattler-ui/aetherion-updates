#!/usr/bin/env python3
"""Build the minimal archive-overlay payload for Android build 192."""

from __future__ import annotations

import argparse
from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parents[1]
PATCHES = (
    "v1.72.3-safe-updater.js",
    "v1.72.3-character-models.js",
    "v1.72.3-update-center.js",
    "v1.72.3-runtime-repair.js",
)


def replace_once(source: str, old: str, new: str) -> str:
    count = source.count(old)
    if count != 1:
        raise ValueError(f"expected one index occurrence of {old!r}, found {count}")
    return source.replace(old, new)


def copy(source: Path, destination: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def patch_manifest(source: Path, destination: Path) -> None:
    body = source.read_bytes()
    old_name, new_name = "1.72.2".encode("utf-16le"), "1.72.3".encode("utf-16le")
    if body.count(old_name) != 1:
        raise ValueError("AndroidManifest.xml does not contain exactly one 1.72.2 version name")
    old_code, new_code = (191).to_bytes(4, "little"), (192).to_bytes(4, "little")
    if body.count(old_code) != 1:
        raise ValueError("AndroidManifest.xml does not contain exactly one build 191 value")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(body.replace(old_name, new_name).replace(old_code, new_code))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--game-root", type=Path, required=True)
    parser.add_argument("--android-manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    game, payload_game = args.game_root, args.output / "assets" / "game"

    index = (game / "index.html").read_text(encoding="utf-8")
    index = replace_once(index, "AETHERION REFORGED v1.72.2", "AETHERION REFORGED v1.72.3")
    for stem in ("safe-updater", "character-models", "update-center", "runtime-repair"):
        index = replace_once(
            index,
            f'patches/v1.72.2-{stem}.js?v=1.72.2',
            f'patches/v1.72.3-{stem}.js?v=1.72.3',
        )
    index = index.replace(
        "<!-- v1.72.2: Android HTTPS-style asset loader, supplied 3D models, repaired controls, and menu update path. -->",
        "<!-- v1.72.3: verified native models, truthful APK update path, controls, and integrity repair. -->",
    )
    payload_game.mkdir(parents=True, exist_ok=True)
    (payload_game / "index.html").write_text(index, encoding="utf-8")

    for name in PATCHES:
        copy(ROOT / "patches" / name, payload_game / "patches" / name)
    copy(ROOT / "assets/v173/native-build-192.json", payload_game / "assets/v173/native-build-192.json")

    # Two historical angle frames in build 191 were zero-byte files. The
    # matching valid frame from the alternate bundled set is the exact repair.
    copy(game / "assets/v44/valkorion/wraith_0.webp", payload_game / "assets/v41/valkorion/wraith_0.webp")
    copy(game / "assets/v41/valkorion/wraith_3.webp", payload_game / "assets/v44/valkorion/wraith_3.webp")
    for repaired in (
        payload_game / "assets/v41/valkorion/wraith_0.webp",
        payload_game / "assets/v44/valkorion/wraith_3.webp",
    ):
        if repaired.stat().st_size < 100:
            raise ValueError(f"replacement image is invalid: {repaired}")

    patch_manifest(args.android_manifest, args.output / "AndroidManifest.xml")
    print(f"payload={args.output}")
    print("native_version=1.72.3")
    print("native_build=192")
    print("repaired_zero_byte_images=2")


if __name__ == "__main__":
    main()
