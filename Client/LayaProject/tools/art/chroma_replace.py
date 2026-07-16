#!/usr/bin/env python3
"""Convert a chroma-key generated image into a project asset.

Usage:
  python tools/art/chroma_replace.py --input source.png --output asset.png --match-size existing.png
  python tools/art/chroma_replace.py --input source.png --output asset.png --size 750x279
  python tools/art/chroma_replace.py --input sheet.png --crop 0,0,512,256 --output asset.png --size 256x128

The script removes a flat border-sampled chroma background, crops transparent
padding, and resizes the result for Laya assets. It is intentionally small so
art replacement batches do not require repeated manual commands.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Tuple

from PIL import Image, ImageChops, ImageFilter


def parse_size(raw: str) -> Tuple[int, int]:
    if "x" not in raw.lower():
        raise argparse.ArgumentTypeError("size must look like WIDTHxHEIGHT")
    w, h = raw.lower().split("x", 1)
    return int(w), int(h)


def parse_crop(raw: str) -> Tuple[int, int, int, int]:
    parts = raw.split(",")
    if len(parts) != 4:
        raise argparse.ArgumentTypeError("crop must look like X,Y,WIDTH,HEIGHT")
    x, y, width, height = (int(part) for part in parts)
    if x < 0 or y < 0 or width <= 0 or height <= 0:
        raise argparse.ArgumentTypeError("crop values must be non-negative with positive size")
    return x, y, width, height


def sample_key(img: Image.Image) -> Tuple[int, int, int]:
    points = [
        img.getpixel((0, 0)),
        img.getpixel((img.width - 1, 0)),
        img.getpixel((0, img.height - 1)),
        img.getpixel((img.width - 1, img.height - 1)),
    ]
    return tuple(sum(p[i] for p in points) // len(points) for i in range(3))


def remove_chroma(img: Image.Image, threshold: int, edge_contract: int) -> Image.Image:
    rgba = img.convert("RGBA")
    rgb = rgba.convert("RGB")
    key = sample_key(rgb)
    key_img = Image.new("RGB", rgb.size, key)
    diff = ImageChops.difference(rgb, key_img).convert("L")
    alpha = diff.point(lambda p: 0 if p <= threshold else 255)
    if edge_contract > 0:
        alpha = alpha.filter(ImageFilter.MinFilter(edge_contract * 2 + 1))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.35))
    rgba.putalpha(alpha)
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a <= 2:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            if a < 255:
                # Remove chroma color from antialiased edge pixels.
                pixels[x, y] = (
                    max(0, min(255, r - key[0] * (255 - a) // 255)),
                    max(0, min(255, g - key[1] * (255 - a) // 255)),
                    max(0, min(255, b - key[2] * (255 - a) // 255)),
                    a,
                )
    return rgba


def crop_alpha(img: Image.Image, padding: int) -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        return img
    left = max(bbox[0] - padding, 0)
    top = max(bbox[1] - padding, 0)
    right = min(bbox[2] + padding, img.width)
    bottom = min(bbox[3] + padding, img.height)
    return img.crop((left, top, right, bottom))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--match-size", type=Path)
    parser.add_argument("--size", type=parse_size)
    parser.add_argument("--crop", type=parse_crop,
                        help="Crop a sprite-sheet region before chroma removal: X,Y,WIDTH,HEIGHT")
    parser.add_argument("--threshold", type=int, default=28)
    parser.add_argument("--padding", type=int, default=12)
    parser.add_argument("--edge-contract", type=int, default=1)
    args = parser.parse_args()

    if args.size and args.match_size:
        parser.error("Use only one of --size or --match-size")

    source = Image.open(args.input)
    source_size = source.size
    if args.crop:
        x, y, width, height = args.crop
        if x + width > source.width or y + height > source.height:
            parser.error("crop region exceeds source image bounds")
        source = source.crop((x, y, x + width, y + height))
    cutout = remove_chroma(source, args.threshold, args.edge_contract)
    cropped = crop_alpha(cutout, args.padding)

    if args.match_size:
        target_size = Image.open(args.match_size).size
    elif args.size:
        target_size = args.size
    else:
        target_size = cropped.size

    result = cropped.resize(target_size, Image.Resampling.LANCZOS)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.save(args.output)
    print(f"{args.output}: {source_size} -> {source.size} -> {cropped.size} -> {target_size}")


if __name__ == "__main__":
    main()
