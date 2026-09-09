#!/usr/bin/env python3
"""Exhaustive static integrity scan for a packaged Aetherion game tree and APK."""

from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
import re
import struct
import subprocess
import zipfile

from PIL import Image


HTML_REF = re.compile(r"\b(?:src|href)\s*=\s*['\"]([^'\"]+)['\"]", re.I)
CSS_REF = re.compile(r"url\(\s*['\"]?([^)'\"\s]+)", re.I)
MEDIA_SUFFIXES = {".mp3", ".wav", ".ogg", ".m4a", ".mp4", ".webm"}
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}


def local_reference(value: str) -> bool:
    return not (
        not value
        or value.startswith(("#", "data:", "blob:", "http:", "https:", "javascript:"))
    )


def resolve(root: Path, owner: Path, value: str) -> Path:
    clean = value.split("?", 1)[0].split("#", 1)[0]
    if clean.startswith("/"):
        return root / clean.lstrip("/")
    return owner.parent / clean


def glb_summary(path: Path) -> dict[str, object]:
    body = path.read_bytes()
    if len(body) < 20 or body[:4] != b"glTF":
        raise ValueError(f"invalid GLB header: {path}")
    version, declared = struct.unpack_from("<II", body, 4)
    if version != 2 or declared != len(body):
        raise ValueError(f"invalid GLB length/version: {path}")
    cursor, document, bin_bytes = 12, None, 0
    while cursor < len(body):
        if cursor + 8 > len(body):
            raise ValueError(f"truncated GLB chunk: {path}")
        size, kind = struct.unpack_from("<II", body, cursor)
        cursor += 8
        chunk = body[cursor : cursor + size]
        if len(chunk) != size:
            raise ValueError(f"truncated GLB payload: {path}")
        if kind == 0x4E4F534A:
            document = json.loads(chunk.rstrip(b"\0 \t\r\n"))
        elif kind == 0x004E4942:
            bin_bytes += size
        cursor += size
    if cursor != len(body) or not isinstance(document, dict):
        raise ValueError(f"invalid GLB chunk table: {path}")
    for buffer in document.get("buffers", []):
        if "uri" not in buffer and int(buffer.get("byteLength", 0)) > bin_bytes:
            raise ValueError(f"GLB buffer exceeds BIN chunk: {path}")
    for view in document.get("bufferViews", []):
        end = int(view.get("byteOffset", 0)) + int(view.get("byteLength", 0))
        if end > bin_bytes:
            raise ValueError(f"GLB bufferView exceeds BIN chunk: {path}")
    return {
        "path": path.relative_to(path.parents[2]).as_posix(),
        "bytes": len(body),
        "nodes": len(document.get("nodes", [])),
        "meshes": len(document.get("meshes", [])),
        "materials": len(document.get("materials", [])),
        "extensions": document.get("extensionsUsed", []),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("game_root", type=Path)
    parser.add_argument("--apk", type=Path)
    parser.add_argument("--expected-glbs", type=int, default=3)
    args = parser.parse_args()
    root = args.game_root.resolve()
    files = sorted(path for path in root.rglob("*") if path.is_file())
    if not files:
        raise ValueError("game tree is empty")
    empty = [path.relative_to(root).as_posix() for path in files if path.stat().st_size == 0]
    if empty:
        raise ValueError(f"zero-byte packaged files: {empty}")
    names = [path.relative_to(root).as_posix() for path in files]
    folded = Counter(name.casefold() for name in names)
    collisions = [name for name, count in folded.items() if count > 1]
    if collisions:
        raise ValueError(f"case-colliding paths: {collisions}")

    missing: list[str] = []
    reference_count = 0
    for path in files:
        refs: list[str] = []
        if path.suffix.lower() in {".html", ".htm"}:
            refs.extend(HTML_REF.findall(path.read_text(encoding="utf-8")))
        elif path.suffix.lower() == ".css":
            refs.extend(CSS_REF.findall(path.read_text(encoding="utf-8")))
        for value in refs:
            if not local_reference(value):
                continue
            reference_count += 1
            target = resolve(root, path, value)
            if not target.is_file():
                missing.append(f"{path.relative_to(root)} -> {value}")
    if missing:
        raise ValueError(f"missing local HTML/CSS references: {missing[:30]}")

    scripts = [path for path in files if path.suffix.lower() in {".js", ".cjs", ".mjs"}]
    for script in scripts:
        subprocess.run(
            ["node", "--check", str(script)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )

    images = [path for path in files if path.suffix.lower() in IMAGE_SUFFIXES]
    for image in images:
        with Image.open(image) as opened:
            opened.verify()

    json_files = [path for path in files if path.suffix.lower() == ".json"]
    for document in json_files:
        json.loads(document.read_text(encoding="utf-8"))

    media = [path for path in files if path.suffix.lower() in MEDIA_SUFFIXES]
    for item in media:
        subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=format_name", "-of", "default=nw=1:nk=1", str(item)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )

    models = [glb_summary(path) for path in files if path.suffix.lower() == ".glb"]
    if len(models) != args.expected_glbs:
        raise ValueError(f"expected exactly {args.expected_glbs} active GLBs, found {len(models)}")

    archive_entries = None
    if args.apk:
        with zipfile.ZipFile(args.apk) as archive:
            infos = archive.infolist()
            duplicate = [name for name, count in Counter(info.filename for info in infos).items() if count > 1]
            if duplicate:
                raise ValueError(f"duplicate APK entries: {duplicate[:20]}")
            bad = archive.testzip()
            if bad:
                raise ValueError(f"APK CRC failed: {bad}")
            archive_entries = len(infos)

    result = {
        "files": len(files),
        "bytes": sum(path.stat().st_size for path in files),
        "html_css_local_references": reference_count,
        "javascript_files": len(scripts),
        "images": len(images),
        "json_files": len(json_files),
        "media_files": len(media),
        "glbs": models,
        "apk_entries": archive_entries,
        "status": "PASS",
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
