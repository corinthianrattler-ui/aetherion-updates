#!/usr/bin/env python3
"""Build a cumulative, signed schema-2 Aetherion update."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import mimetypes
import os
from pathlib import Path, PurePosixPath
import re
import shutil

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


ROOT = Path(__file__).resolve().parents[1]
APP_ID = "aetherion-reforged"
BASE_VERSION = (1, 74, 0)
DEFAULT_BASE_URL = "https://raw.githubusercontent.com/corinthianrattler-ui/aetherion-updates/main/v2"
VERSION_RE = re.compile(r"^\d+\.\d+\.\d+$")
SAFE_ID_RE = re.compile(r"^[a-zA-Z0-9_.-]+$")
SAFE_PATH_RE = re.compile(r"^[a-zA-Z0-9_.\-/]+$")


def compact(value: object) -> bytes:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def semver(value: str) -> tuple[int, int, int]:
    if not VERSION_RE.fullmatch(value):
        raise argparse.ArgumentTypeError("version must contain three numeric parts")
    return tuple(int(part) for part in value.split("."))  # type: ignore[return-value]


def safe_id(value: str) -> str:
    if not SAFE_ID_RE.fullmatch(value):
        raise argparse.ArgumentTypeError("payload id may contain only letters, digits, dot, dash, and underscore")
    return value


def safe_game_path(value: str) -> str:
    clean = value.removeprefix("./").removeprefix("assets/game/")
    pure = PurePosixPath(clean)
    if (
        not clean
        or pure.is_absolute()
        or "." in pure.parts
        or ".." in pure.parts
        or not SAFE_PATH_RE.fullmatch(clean)
        or not clean.startswith(("assets/", "custom/"))
    ):
        raise argparse.ArgumentTypeError("game path must be a safe assets/ or custom/ path")
    return clean


def existing_file(value: str) -> Path:
    path = Path(value)
    if not path.is_file():
        raise argparse.ArgumentTypeError(f"file does not exist: {path}")
    return path


def extension_spec(value: str) -> tuple[str, Path]:
    if "=" not in value:
        raise argparse.ArgumentTypeError("extension must be ID=SOURCE_FILE")
    identity, source = value.split("=", 1)
    return safe_id(identity), existing_file(source)


def asset_spec(value: str) -> tuple[str, Path]:
    if "=" not in value:
        raise argparse.ArgumentTypeError("asset must be GAME_PATH=SOURCE_FILE")
    game_path, source = value.split("=", 1)
    return safe_game_path(game_path), existing_file(source)


def mime_for(path: Path, data: bytes) -> str:
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp"
    if data.startswith(b"\x89PNG"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"glTF"):
        return "model/gltf-binary"
    if path.suffix.lower() == ".js":
        return "text/javascript"
    return mimetypes.guess_type(path.name)[0] or "application/octet-stream"


def load_channel(path: Path) -> dict:
    if not path.exists():
        return {"schema": 2, "appId": APP_ID, "latest": ".".join(map(str, BASE_VERSION)), "releases": []}
    channel = json.loads(path.read_text("utf-8"))
    if channel.get("schema") != 2 or channel.get("appId") != APP_ID or not isinstance(channel.get("releases"), list):
        raise SystemExit("existing channel belongs to another app or schema")
    return channel


def inherited_manifest(output: Path, releases: list[dict], target: tuple[int, int, int]) -> tuple[list[dict], list[str]]:
    candidates = [release for release in releases if VERSION_RE.fullmatch(str(release.get("version", ""))) and semver(release["version"]) < target]
    if not candidates:
        return [], []
    parent = max(candidates, key=lambda release: semver(release["version"]))
    path = output / "releases" / f"{parent['version']}.json"
    if not path.is_file():
        raise SystemExit(f"cannot inherit missing manifest: {path}")
    manifest = json.loads(path.read_text("utf-8"))
    return list(manifest.get("files", [])), list(manifest.get("deletePaths", []))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("version")
    parser.add_argument("--extension", action="append", default=[], type=extension_spec, metavar="ID=SOURCE")
    parser.add_argument("--asset", action="append", default=[], type=asset_spec, metavar="GAME_PATH=SOURCE")
    parser.add_argument("--delete", action="append", default=[], type=safe_game_path, metavar="GAME_PATH")
    parser.add_argument("--retire-id", action="append", default=[], type=safe_id, metavar="ID")
    parser.add_argument("--notes", default="Signed Aetherion maintenance update.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--output", type=Path, default=ROOT / "v2")
    parser.add_argument("--private-key", type=existing_file, default=os.environ.get("AETHERION_UPDATE_PRIVATE_KEY"))
    args = parser.parse_args()

    target = semver(args.version)
    if target <= BASE_VERSION:
        parser.error("update version must be newer than the built-in 1.74.0 baseline")
    if not args.private_key:
        parser.error("provide --private-key or AETHERION_UPDATE_PRIVATE_KEY; never commit that key")
    if not args.base_url.startswith("https://"):
        parser.error("base URL must use HTTPS")
    if not (args.extension or args.asset or args.delete or args.retire_id):
        parser.error("the release must add, replace, retire, or delete at least one payload")

    output = args.output
    channel_path = output / "channel.json"
    channel = load_channel(channel_path)
    releases = list(channel["releases"])
    if any(release.get("version") == args.version for release in releases):
        raise SystemExit(f"release {args.version} already exists; use a new version")

    files, delete_paths = inherited_manifest(output, releases, target)
    retired_ids = set(args.retire_id)
    files = [entry for entry in files if entry.get("id") not in retired_ids]

    staging = output / ".staging" / args.version
    final_files = output / "files" / args.version
    if staging.exists() or final_files.exists():
        raise SystemExit(f"payload directory for {args.version} already exists")
    staging.mkdir(parents=True)
    try:
        for identity, source in args.extension:
            data = source.read_bytes()
            files = [entry for entry in files if entry.get("id") != identity]
            filename = f"{identity}{source.suffix.lower() or '.js'}"
            (staging / filename).write_bytes(data)
            files.append({
                "id": identity,
                "type": "extension",
                "path": identity,
                "mime": "text/javascript",
                "url": f"{args.base_url.rstrip('/')}/files/{args.version}/{filename}",
                "sha256": digest(data),
                "bytes": len(data),
                "label": source.name,
            })

        for game_path, source in args.asset:
            data = source.read_bytes()
            identity = "asset-" + digest(game_path.encode("utf-8"))[:16]
            files = [
                entry for entry in files
                if entry.get("id") != identity
                and not (entry.get("type") == "asset" and entry.get("path") == game_path)
            ]
            delete_paths = [path for path in delete_paths if path != game_path]
            filename = f"{identity}{source.suffix.lower()}"
            (staging / filename).write_bytes(data)
            files.append({
                "id": identity,
                "type": "asset",
                "path": game_path,
                "mime": mime_for(source, data),
                "url": f"{args.base_url.rstrip('/')}/files/{args.version}/{filename}",
                "sha256": digest(data),
                "bytes": len(data),
                "label": game_path,
            })

        for game_path in args.delete:
            files = [
                entry for entry in files
                if not (entry.get("type") == "asset" and entry.get("path") == game_path)
            ]
            if game_path not in delete_paths:
                delete_paths.append(game_path)
        added_paths = {entry["path"] for entry in files if entry.get("type") == "asset"}
        if added_paths & set(delete_paths):
            raise SystemExit("a release cannot both provide and retire the same asset path")

        identities = [entry.get("id") for entry in files]
        asset_paths = [entry.get("path") for entry in files if entry.get("type") == "asset"]
        if len(identities) != len(set(identities)) or len(asset_paths) != len(set(asset_paths)):
            raise SystemExit("cumulative manifest contains duplicate ids or asset paths")

        manifest = {
            "schema": 2,
            "appId": APP_ID,
            "version": args.version,
            "files": files,
            "deletePaths": sorted(set(delete_paths)),
        }
        manifest_bytes = compact(manifest)
        manifest_url = f"{args.base_url.rstrip('/')}/releases/{args.version}.json"
        release = {
            "version": args.version,
            "manifestUrl": manifest_url,
            "manifestSha256": digest(manifest_bytes),
            "notes": args.notes,
        }
        canonical = compact({
            "appId": APP_ID,
            "version": args.version,
            "manifestUrl": manifest_url,
            "manifestSha256": release["manifestSha256"],
        })
        key = serialization.load_pem_private_key(args.private_key.read_bytes(), password=None)
        release["signature"] = base64.b64encode(
            key.sign(canonical, padding.PKCS1v15(), hashes.SHA256())
        ).decode("ascii")

        final_files.parent.mkdir(parents=True, exist_ok=True)
        staging.rename(final_files)
        releases.append(release)
        releases.sort(key=lambda item: semver(item["version"]), reverse=True)
        release_path = output / "releases" / f"{args.version}.json"
        release_path.parent.mkdir(parents=True, exist_ok=True)
        release_path.write_bytes(manifest_bytes)
        channel_path.write_bytes(compact({
            "schema": 2,
            "appId": APP_ID,
            "latest": releases[0]["version"],
            "releases": releases,
        }))
    except Exception:
        if staging.exists():
            shutil.rmtree(staging)
        raise

    print(f"Built signed Aetherion {args.version}: {len(files)} cumulative payloads, {len(delete_paths)} retired paths")


if __name__ == "__main__":
    main()
