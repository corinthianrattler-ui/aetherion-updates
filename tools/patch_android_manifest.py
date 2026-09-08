#!/usr/bin/env python3
"""Apply the same-width v1.70/build 187 to v1.71/build 188 Android manifest update."""

from pathlib import Path
import argparse


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    body = args.source.read_bytes()
    old_name = "1.70.0".encode("utf-16le")
    new_name = "1.71.0".encode("utf-16le")
    if body.count(old_name) != 1:
        raise ValueError("expected exactly one v1.70.0 string in AndroidManifest.xml")
    body = body.replace(old_name, new_name)
    old_code = (187).to_bytes(4, "little")
    new_code = (188).to_bytes(4, "little")
    if body.count(old_code) != 1:
        raise ValueError("expected exactly one Android build 187 value in AndroidManifest.xml")
    body = body.replace(old_code, new_code)
    args.destination.parent.mkdir(parents=True, exist_ok=True)
    args.destination.write_bytes(body)
    print(f"patched={args.destination}")


if __name__ == "__main__":
    main()
