#!/usr/bin/env python3
"""Build one LayaAir frame-animation PNG and .atlas from a regular sprite sheet.

The output PNG contains base frames in the upper half and matching team-color
masks in the lower half. No individual frame PNGs are emitted.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageFilter

from extract_team_tint_mask import extract as extract_team_mask


ACTIONS = ("idle", "walk", "attack")


def remove_green(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    alpha = Image.new("L", rgba.size)
    alpha_pixels = alpha.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, _ = pixels[x, y]
            other = max(r, b)
            green_excess = g - other
            if g > 80 and green_excess > 15:
                alpha_pixels[x, y] = max(0, min(255, round(255 - (green_excess - 15) * 1.5)))
                # Remove green spill from semi-transparent edge pixels.
                pixels[x, y] = (r, min(g, other + 8), b, 255)
            else:
                alpha_pixels[x, y] = 255
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.35))
    rgba.putalpha(alpha)
    return rgba


def fit_to_cell(frame: Image.Image, cell_width: int, cell_height: int, padding: int) -> Image.Image:
    bbox = frame.getchannel("A").getbbox()
    result = Image.new("RGBA", (cell_width, cell_height))
    if not bbox:
        return result
    subject = frame.crop(bbox)
    max_width = cell_width - padding * 2
    max_height = cell_height - padding * 2
    scale = min(max_width / subject.width, max_height / subject.height)
    target = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(target, Image.Resampling.LANCZOS)
    x = (cell_width - target[0]) // 2
    y = cell_height - padding - target[1]
    result.alpha_composite(subject, (x, y))
    return result


def mask_for_frame(frame: Image.Image, character_id: int, temp_dir: Path, index: int) -> Image.Image:
    source = temp_dir / f"frame-{index}.png"
    output = temp_dir / f"mask-{index}.png"
    frame.save(source)
    extract_team_mask(source, output, character_id)
    return Image.open(output).convert("RGBA")


def build(args: argparse.Namespace) -> None:
    source = Image.open(args.input).convert("RGB")
    idle_sequence = [int(value) for value in args.idle_sequence.split(",")]
    if len(idle_sequence) != args.columns or any(value < 0 or value >= args.columns for value in idle_sequence):
        raise ValueError(f"idle sequence must contain {args.columns} source columns in range 0..{args.columns - 1}")
    output_rows = args.rows * 2
    sheet = Image.new("RGBA", (args.cell_width * args.columns, args.cell_height * output_rows))
    frames: dict[str, dict] = {}
    args.temp_dir.mkdir(parents=True, exist_ok=True)

    for row, action in enumerate(ACTIONS):
        for column in range(args.columns):
            source_column = idle_sequence[column] if action == "idle" else column
            # Image generators may add one or two edge pixels. Proportional
            # boundaries keep all source pixels without requiring exact division.
            source_box = (
                round(source_column * source.width / args.columns),
                round(row * source.height / args.rows),
                round((source_column + 1) * source.width / args.columns),
                round((row + 1) * source.height / args.rows),
            )
            frame = fit_to_cell(remove_green(source.crop(source_box)), args.cell_width, args.cell_height, args.padding)
            mask = mask_for_frame(frame, args.character_id, args.temp_dir, row * args.columns + column)
            sheet.alpha_composite(frame, (column * args.cell_width, row * args.cell_height))
            sheet.alpha_composite(mask, (column * args.cell_width, (row + args.rows) * args.cell_height))

            for name, output_row in ((f"{action}_{column:02d}.png", row), (f"{action}_mask_{column:02d}.png", row + args.rows)):
                frames[name] = {
                    "frame": {
                        "x": column * args.cell_width,
                        "y": output_row * args.cell_height,
                        "w": args.cell_width,
                        "h": args.cell_height,
                    },
                    "spriteSourceSize": {"x": 0, "y": 0},
                    "sourceSize": {"w": args.cell_width, "h": args.cell_height},
                }

    args.output_png.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.output_png)
    atlas = {
        "frames": frames,
        "meta": {
            "image": args.output_png.name,
            "prefix": args.prefix,
            "scale": "1",
        },
    }
    args.output_atlas.write_text(json.dumps(atlas, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"{args.output_png}: {sheet.size}, frames={len(frames)}")
    print(f"{args.output_atlas}: prefix={args.prefix}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output-png", required=True, type=Path)
    parser.add_argument("--output-atlas", required=True, type=Path)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--character-id", required=True, type=int)
    parser.add_argument("--columns", type=int, default=6)
    parser.add_argument("--rows", type=int, default=3)
    parser.add_argument("--cell-width", type=int, default=128)
    parser.add_argument("--cell-height", type=int, default=160)
    parser.add_argument("--padding", type=int, default=4)
    parser.add_argument("--idle-sequence", default="0,1,2,3,4,5", help="comma-separated source columns for output idle frames")
    parser.add_argument("--temp-dir", type=Path, default=Path("tmp/frame-atlas"))
    args = parser.parse_args()
    if args.rows != len(ACTIONS):
        parser.error(f"rows must be {len(ACTIONS)} for {ACTIONS}")
    build(args)


if __name__ == "__main__":
    main()
