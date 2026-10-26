#!/usr/bin/env python3
"""Shrinks large product photos so the shop loads fast.
Needs Pillow once:  py -m pip install pillow
Run:                py tools/optimize-images.py
Originals are copied to tools/originals-backup/ before anything is changed."""
import pathlib, shutil
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "images" / "products"
BACKUP = ROOT / "tools" / "originals-backup"
MAX_W, QUALITY, MAX_BYTES = 1400, 82, 350_000

done = saved = 0
for p in sorted(IMG.rglob("*")):
    if p.suffix.lower() not in (".jpg", ".jpeg"):
        continue
    before = p.stat().st_size
    im = ImageOps.exif_transpose(Image.open(p))
    if im.width <= MAX_W and before <= MAX_BYTES:
        continue
    b = BACKUP / p.relative_to(IMG)
    if not b.exists():
        b.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, b)
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    im.convert("RGB").save(p, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    done += 1
    saved += before - p.stat().st_size
print(f"Optimized {done} photos, saved {saved/1e6:.1f} MB. Originals are in tools/originals-backup/")
