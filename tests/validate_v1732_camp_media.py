#!/usr/bin/env python3
"""Validate the four supplied v1.73.2 camp-action films."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "custom" / "camp-scenes" / "v1732"
EXPECTED = {"make-camp.mp4", "strike-camp.mp4", "camp-food.mp4", "camp-sleep.mp4"}


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
    print("v1.73.2 camp media: 4/4 distinct H.264/AAC films at 672x448 and about six seconds passed")


if __name__ == "__main__":
    main()
