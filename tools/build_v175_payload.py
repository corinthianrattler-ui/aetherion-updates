#!/usr/bin/env python3
"""Build the archive overlay for v1.72.5 from the verified v1.72.4 APK."""

from __future__ import annotations

import argparse
from pathlib import Path
import shutil
import zipfile


ROOT = Path(__file__).resolve().parents[1]
VERSION = "1.72.5"
BUILD = 194


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise ValueError(f"expected one {label} occurrence of {old!r}, found {count}")
    return source.replace(old, new)


def copy(source: Path, destination: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-apk", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output_game = args.output / "assets" / "game"

    with zipfile.ZipFile(args.base_apk) as archive:
        manifest = archive.read("AndroidManifest.xml")
        index = archive.read("assets/game/index.html").decode("utf-8")

    old_name = "1.72.4".encode("utf-16le")
    new_name = VERSION.encode("utf-16le")
    if manifest.count(old_name) != 1:
        raise ValueError("base AndroidManifest.xml does not contain exactly one 1.72.4 version")
    old_code, new_code = (193).to_bytes(4, "little"), BUILD.to_bytes(4, "little")
    if manifest.count(old_code) != 1:
        raise ValueError("base AndroidManifest.xml does not contain exactly one build 193 value")
    patched_manifest = manifest.replace(old_name, new_name).replace(old_code, new_code)
    (args.output / "AndroidManifest.xml").parent.mkdir(parents=True, exist_ok=True)
    (args.output / "AndroidManifest.xml").write_bytes(patched_manifest)

    index = replace_once(index, "<title>AETHERION REFORGED v1.72.4</title>", "<title>AETHERION REFORGED v1.72.5</title>", "title")
    index = replace_once(
        index,
        '<script src="patches/v1.72.4-safe-updater.js?v=1.72.4"></script>',
        '<script src="patches/v1.72.5-safe-updater.js?v=1.72.5"></script>',
        "safe updater",
    )
    index = replace_once(
        index,
        '<!-- v1.72.4: verified native models, truthful APK update path, controls, and integrity repair. -->',
        '<!-- v1.72.5: true per-slot equipment model, native updater, controls, and integrity repair. -->',
        "release comment",
    )
    index = replace_once(
        index,
        '<script src="patches/v1.72.4-character-models.js?v=1.72.4"></script>',
        '<script src="patches/v1.72.5-character-models.js?v=1.72.5"></script>',
        "character controller",
    )
    index = replace_once(
        index,
        '<script src="patches/v1.72.4-update-center.js?v=1.72.4"></script>',
        '<script src="patches/v1.72.5-update-center.js?v=1.72.5"></script>',
        "update center",
    )
    output_game.mkdir(parents=True, exist_ok=True)
    (output_game / "index.html").write_text(index, encoding="utf-8")

    for name in ("safe-updater", "character-models", "update-center"):
        copy(ROOT / "patches" / f"v1.72.5-{name}.js", output_game / "patches" / f"v1.72.5-{name}.js")
    copy(ROOT / "assets/v109/valkorion_final.glb", output_game / "assets/v109/valkorion_final.glb")
    copy(ROOT / "assets/v175/native-build-194.json", output_game / "assets/v175/native-build-194.json")

    print(f"payload={args.output}")
    print(f"native_version={VERSION}")
    print(f"native_build={BUILD}")
    print("modular_slots=17")


if __name__ == "__main__":
    main()
