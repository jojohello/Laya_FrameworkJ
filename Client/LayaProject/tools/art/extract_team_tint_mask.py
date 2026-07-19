#!/usr/bin/env python3
"""Extract a shaded team-color overlay from a character texture.

Blue/cyan pixels are the default authoring key. Priest robes use a separate
light-cloth rule because the current source sprite only has a tiny blue gem.
"""

from __future__ import annotations

import argparse
import colorsys
from pathlib import Path

from PIL import Image, ImageFilter


def selection_weight(character_id: int, r: int, g: int, b: int) -> float:
    hue, saturation, value = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    hue_degrees = hue * 360
    blue_key = 165 <= hue_degrees <= 250 and saturation >= 0.18 and value >= 0.16
    if blue_key:
        return min(1.0, (saturation - 0.12) / 0.35 + 0.25)

    if character_id == 1003:
        # Select the priest's pale robe, while excluding warm skin, hair and gold trim.
        light_cloth = value >= 0.58 and saturation <= 0.22
        if light_cloth:
            return min(0.9, (value - 0.48) / 0.35)
    return 0.0


def extract(source: Path, output: Path, character_id: int) -> None:
    image = Image.open(source).convert("RGBA")
    alpha = Image.new("L", image.size)
    alpha_pixels = alpha.load()
    source_pixels = image.load()

    for y in range(image.height):
        for x in range(image.width):
            r, g, b, source_alpha = source_pixels[x, y]
            weight = selection_weight(character_id, r, g, b)
            alpha_pixels[x, y] = round(source_alpha * weight)

    alpha = alpha.filter(ImageFilter.GaussianBlur(0.45))
    result = Image.new("RGBA", image.size)
    result_pixels = result.load()
    alpha_pixels = alpha.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, _ = source_pixels[x, y]
            luminance = round(0.299 * r + 0.587 * g + 0.114 * b)
            shade = max(72, min(255, luminance))
            result_pixels[x, y] = (shade, shade, shade, alpha_pixels[x, y])

    output.parent.mkdir(parents=True, exist_ok=True)
    result.save(output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--character-id", required=True, type=int)
    args = parser.parse_args()
    extract(args.input, args.output, args.character_id)


if __name__ == "__main__":
    main()
