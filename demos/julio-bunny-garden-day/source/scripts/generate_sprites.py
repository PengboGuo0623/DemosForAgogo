#!/usr/bin/env python3
from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src" / "data" / "sprites.manifest.json"
OUT_DIR = ROOT / "public" / "assets" / "sprites"


def is_background(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a < 8:
        return True
    return r >= 244 and g >= 244 and b >= 244 and max(r, g, b) - min(r, g, b) <= 18


def remove_connected_white_background(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    visited: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    def add_if_bg(x: int, y: int) -> None:
        if (x, y) not in visited and is_background(pixels[x, y]):
            visited.add((x, y))
            queue.append((x, y))

    for x in range(width):
        add_if_bg(x, 0)
        add_if_bg(x, height - 1)
    for y in range(height):
        add_if_bg(0, y)
        add_if_bg(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                add_if_bg(nx, ny)

    for x, y in visited:
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)

    bbox = image.getbbox()
    if bbox is None:
        return image

    left, top, right, bottom = bbox
    pad = 4
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(width, right + pad)
    bottom = min(height, bottom + pad)
    return image.crop((left, top, right, bottom))


def clear_rects(image: Image.Image, rects: list[list[int]]) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    for x, y, w, h in rects:
        for px in range(max(0, x), min(width, x + w)):
            for py in range(max(0, y), min(height, y + h)):
                r, g, b, _ = pixels[px, py]
                pixels[px, py] = (r, g, b, 0)
    return image


def trim_alpha(image: Image.Image) -> Image.Image:
    bbox = image.getbbox()
    return image.crop(bbox) if bbox else image


def keep_largest_alpha_component(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    visited: set[tuple[int, int]] = set()
    largest: list[tuple[int, int]] = []

    for start_y in range(height):
        for start_x in range(width):
            if (start_x, start_y) in visited or pixels[start_x, start_y][3] == 0:
                continue

            component: list[tuple[int, int]] = []
            queue: deque[tuple[int, int]] = deque([(start_x, start_y)])
            visited.add((start_x, start_y))

            while queue:
                x, y = queue.popleft()
                component.append((x, y))
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < width and 0 <= ny < height:
                        if (nx, ny) not in visited and pixels[nx, ny][3] > 0:
                            visited.add((nx, ny))
                            queue.append((nx, ny))

            if len(component) > len(largest):
                largest = component

    keep = set(largest)
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > 0 and (x, y) not in keep:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)

    return trim_alpha(image)


def preprocess_crop(image: Image.Image, sprite: dict) -> Image.Image:
    if sprite.get("clearRects"):
        return clear_rects(image, sprite["clearRects"])
    return image


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old_sprite in OUT_DIR.glob("*.png"):
        old_sprite.unlink()
    sprites = json.loads(MANIFEST.read_text())
    for sprite in sprites:
        source = ROOT / sprite["source"]
        x, y, w, h = sprite["crop"]
        cropped = Image.open(source).crop((x, y, x + w, y + h))
        cropped = preprocess_crop(cropped, sprite)
        output = remove_connected_white_background(cropped)
        if sprite.get("keepLargest"):
            output = keep_largest_alpha_component(output)
        output = trim_alpha(output)
        output.save(OUT_DIR / f"{sprite['id']}.png", optimize=True)
        print(f"generated {sprite['id']}.png {output.size[0]}x{output.size[1]}")


if __name__ == "__main__":
    main()
