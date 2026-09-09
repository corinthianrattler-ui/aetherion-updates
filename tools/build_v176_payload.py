#!/usr/bin/env python3
"""Build the archive overlay for v1.72.6 from the verified v1.72.5 APK."""

from __future__ import annotations

import argparse
from pathlib import Path
import shutil
import zipfile


ROOT = Path(__file__).resolve().parents[1]
VERSION = "1.72.6"
BUILD = 195


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

    old_name = "1.72.5".encode("utf-16le")
    new_name = VERSION.encode("utf-16le")
    if manifest.count(old_name) != 1:
        raise ValueError("base AndroidManifest.xml does not contain exactly one 1.72.5 version")
    old_code, new_code = (194).to_bytes(4, "little"), BUILD.to_bytes(4, "little")
    if manifest.count(old_code) != 1:
        raise ValueError("base AndroidManifest.xml does not contain exactly one build 194 value")
    patched_manifest = manifest.replace(old_name, new_name).replace(old_code, new_code)
    (args.output / "AndroidManifest.xml").parent.mkdir(parents=True, exist_ok=True)
    (args.output / "AndroidManifest.xml").write_bytes(patched_manifest)

    index = replace_once(index, "<title>AETHERION REFORGED v1.72.5</title>", "<title>AETHERION REFORGED v1.72.6</title>", "title")
    index = replace_once(
        index,
        '<script src="patches/v1.72.5-safe-updater.js?v=1.72.5"></script>',
        '<script src="patches/v1.72.6-safe-updater.js?v=1.72.6"></script>',
        "safe updater",
    )
    index = replace_once(
        index,
        '<!-- v1.72.5: true per-slot equipment model, native updater, controls, and integrity repair. -->',
        '<!-- v1.72.6: Alexus fitted wardrobe, portrait-phone containment, personal trade, and fitted-crate repair. -->',
        "release comment",
    )
    index = replace_once(
        index,
        '<script src="patches/v1.72.5-update-center.js?v=1.72.5"></script>',
        '<script src="patches/v1.72.6-update-center.js?v=1.72.6"></script>',
        "update center",
    )
    index = replace_once(
        index,
        '<script src="patches/v1.72.4-performance.js?v=1.72.4"></script>',
        '<script src="patches/v1.72.4-performance.js?v=1.72.4"></script>\n'
        '<script src="patches/v1.72.6-gameplay-repair.js?v=1.72.6"></script>',
        "last-load gameplay repair",
    )
    output_game.mkdir(parents=True, exist_ok=True)
    (output_game / "index.html").write_text(index, encoding="utf-8")

    for name in ("safe-updater", "update-center", "gameplay-repair"):
        copy(ROOT / "patches" / f"v1.72.6-{name}.js", output_game / "patches" / f"v1.72.6-{name}.js")
    copy(ROOT / "assets/v176/native-build-195.json", output_game / "assets/v176/native-build-195.json")

    print(f"payload={args.output}")
    print(f"native_version={VERSION}")
    print(f"native_build={BUILD}")
    print("alexus_mesh_nodes=28")
    print("alexus_fitted_slots=12")
    print("alexus_card_only_slots=5")


if __name__ == "__main__":
    main()
