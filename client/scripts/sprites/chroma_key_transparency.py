#!/usr/bin/env python3
"""Replace an exact authoring background color with transparent pixels."""

from __future__ import annotations

import argparse
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Pillow is required. Use the documented Gym Buddies authoring runtime."
    ) from exc


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Remove a flat chroma-key color from a sprite reference PNG."
    )
    parser.add_argument("--input", required=True, help="Source PNG.")
    parser.add_argument("--out", required=True, help="Transparent output PNG.")
    parser.add_argument(
        "--key",
        default="ff00ff",
        help="Six-digit RGB key without #. Default: ff00ff.",
    )
    parser.add_argument(
        "--tolerance",
        type=int,
        default=0,
        help="Per-channel match tolerance. Keep 0 for indexed pixel art.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if len(args.key) != 6:
        raise SystemExit("--key must be six hexadecimal digits.")
    if not 0 <= args.tolerance <= 255:
        raise SystemExit("--tolerance must be between 0 and 255.")
    key = tuple(int(args.key[index : index + 2], 16) for index in (0, 2, 4))
    image = Image.open(args.input).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            if all(
                abs(channel - target) <= args.tolerance
                for channel, target in zip((red, green, blue), key)
            ):
                pixels[x, y] = (red, green, blue, 0)
            elif alpha != 0:
                pixels[x, y] = (red, green, blue, 255)
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output)


if __name__ == "__main__":
    main()
