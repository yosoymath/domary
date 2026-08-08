from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


GIF_SIZE = (960, 540)
POSTER_SIZE = (1600, 900)
FRAME_COUNT = 18
FRAME_DURATION_MS = 110


def cover_crop(image: Image.Image, size: tuple[int, int], zoom: float, pan_x: float = 0, pan_y: float = 0) -> Image.Image:
    target_width, target_height = size
    source_width, source_height = image.size
    scale = max(target_width / source_width, target_height / source_height) * zoom
    resized = image.resize((round(source_width * scale), round(source_height * scale)), Image.Resampling.LANCZOS)

    left = (resized.width - target_width) / 2 + pan_x
    top = (resized.height - target_height) / 2 + pan_y
    left = min(max(0, left), resized.width - target_width)
    top = min(max(0, top), resized.height - target_height)
    return resized.crop((round(left), round(top), round(left + target_width), round(top + target_height)))


def add_light_sweep(frame: Image.Image, progress: float) -> Image.Image:
    width, height = frame.size
    oscillation = math.sin(progress * math.tau)
    center_x = width * (0.77 + oscillation * 0.025)
    mask = Image.new("L", frame.size, 0)
    draw = ImageDraw.Draw(mask)
    sweep_width = width * 0.035
    draw.polygon(
        [
            (center_x - sweep_width, -height * 0.1),
            (center_x + sweep_width, -height * 0.1),
            (center_x - sweep_width * 0.2, height * 1.1),
            (center_x - sweep_width * 2.2, height * 1.1),
        ],
        fill=38,
    )
    mask = mask.filter(ImageFilter.GaussianBlur(radius=24))
    yellow = Image.new("RGB", frame.size, (245, 196, 0))
    return Image.composite(yellow, frame, mask)


def build_assets(source: Path, gif_output: Path, poster_output: Path) -> None:
    image = Image.open(source).convert("RGB")
    poster = cover_crop(image, POSTER_SIZE, 1.0)
    poster.save(poster_output, "WEBP", quality=86, method=6)

    frames: list[Image.Image] = []
    for index in range(FRAME_COUNT):
        progress = index / FRAME_COUNT
        wave = math.sin(progress * math.tau)
        zoom = 1.018 + 0.008 * wave
        frame = cover_crop(image, GIF_SIZE, zoom, pan_x=5 * wave, pan_y=2 * math.cos(progress * math.tau))
        frame = ImageEnhance.Brightness(frame).enhance(1.0 + 0.012 * wave)
        frame = add_light_sweep(frame, progress)
        frames.append(frame.quantize(colors=80, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG))

    frames[0].save(
        gif_output,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        disposal=2,
        optimize=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Cria o GIF e o poster do hero Domary.")
    parser.add_argument("source", type=Path)
    parser.add_argument("gif_output", type=Path)
    parser.add_argument("poster_output", type=Path)
    args = parser.parse_args()

    args.gif_output.parent.mkdir(parents=True, exist_ok=True)
    args.poster_output.parent.mkdir(parents=True, exist_ok=True)
    build_assets(args.source, args.gif_output, args.poster_output)


if __name__ == "__main__":
    main()
