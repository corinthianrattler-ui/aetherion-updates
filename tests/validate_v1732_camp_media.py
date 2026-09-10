#!/usr/bin/env python3
"""Validate the four supplied v1.73.2 camp-action films."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "custom" / "camp-scenes" / "v1732"
EXPECTED = {"make-camp.mp4", "strike-camp.mp4", "camp-food.mp4", "camp-sleep.mp4"}
POSTERS = {name.replace(".mp4", ".webp") for name in EXPECTED}


def main() -> None:
    files = sorted(MEDIA.glob("*.mp4"))
    assert {path.name for path in files} == EXPECTED
    hashes = set()
    for path in files:
        probe = json.loads(subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration:stream=index,codec_type,codec_name,width,height",
            "-of", "json", str(path),
        ]))
        videos = [row for row in probe["streams"] if row.get("codec_type") == "video" and row.get("codec_name") == "h264"]
        audio = [row for row in probe["streams"] if row.get("codec_type") == "audio" and row.get("codec_name") == "aac"]
        assert len(videos) == 1 and (videos[0]["width"], videos[0]["height"]) == (672, 448), path
        assert len(audio) == 1, path
        assert 5.9 <= float(probe["format"]["duration"]) <= 6.2, path
        hashes.add(hashlib.sha256(path.read_bytes()).hexdigest())
    assert len(hashes) == 4
    posters = sorted(MEDIA.glob("*.webp"))
    assert {path.name for path in posters} == POSTERS
    poster_hashes = set()
    for path in posters:
        with Image.open(path) as image:
            assert image.format == "WEBP" and image.size == (672, 448), path
            image.load()
        poster_hashes.add(hashlib.sha256(path.read_bytes()).hexdigest())
    assert len(poster_hashes) == 4
    print("v1.73.4 camp media: 4 distinct six-second H.264/AAC films and 4 matching 672x448 WebP posters passed")


if __name__ == "__main__":
    main()
