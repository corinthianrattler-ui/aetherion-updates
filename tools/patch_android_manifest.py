#!/usr/bin/env python3
"""Apply a same-width Android version name/code update to a binary manifest."""

from pathlib import Path
import argparse


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--from-version", default="1.70.0")
    parser.add_argument("--to-version", default="1.71.0")
    parser.add_argument("--from-code", type=int, default=187)
    parser.add_argument("--to-code", type=int, default=188)
    args = parser.parse_args()
    body = args.source.read_bytes()
    old_name = args.from_version.encode("utf-16le")
    new_name = args.to_version.encode("utf-16le")
    if len(old_name) != len(new_name):
        raise ValueError("binary manifest version names must have the same encoded width")
    if body.count(old_name) != 1:
        raise ValueError(f"expected exactly one {args.from_version} string in AndroidManifest.xml")
    body = body.replace(old_name, new_name)
    old_code = args.from_code.to_bytes(4, "little")
    new_code = args.to_code.to_bytes(4, "little")
    if body.count(old_code) != 1:
        raise ValueError(f"expected exactly one Android build {args.from_code} value in AndroidManifest.xml")
    body = body.replace(old_code, new_code)
    args.destination.parent.mkdir(parents=True, exist_ok=True)
    args.destination.write_bytes(body)
    print(f"patched={args.destination}")


if __name__ == "__main__":
    main()
