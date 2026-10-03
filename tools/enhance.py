#!/usr/bin/env python3
"""Convierte fotos reales en piezas cuadradas 1080x1080 listas para Marketplace.

Uso:
    python tools/enhance.py                # procesa iphone-17-pro-max/fotos-originales
    python tools/enhance.py --price "$1,200" --claves "Importado USA|Desbloqueado|Revisable"

Mejora luz/color/nitidez, recorta al centro y (opcional) añade rótulos sobre
un degradado inferior. No altera el producto: solo presentación.
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

SIZE = 1080
ROOT = Path(__file__).resolve().parent.parent / "iphone-17-pro-max"
FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "C:/Windows/Fonts/arialbd.ttf",
]


def font(size):
    for path in FONTS:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def enhance(img):
    img = ImageOps.exif_transpose(img).convert("RGB")
    img = ImageOps.autocontrast(img, cutoff=0.5)
    img = ImageEnhance.Color(img).enhance(1.08)
    img = ImageEnhance.Contrast(img).enhance(1.05)
    img = ImageOps.fit(img, (SIZE, SIZE), Image.LANCZOS, centering=(0.5, 0.5))
    return img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=3))


def overlay(img, price, claves):
    if not (price or claves):
        return img
    base = img.convert("RGBA")
    grad = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    top = SIZE - 300
    for y in range(top, SIZE):
        gd.line([(0, y), (SIZE, y)], fill=(0, 0, 0, int(200 * (y - top) / 300)))
    base = Image.alpha_composite(base, grad)
    d = ImageDraw.Draw(base)
    if price:
        d.rounded_rectangle([40, 40, 40 + 24 * len(price) + 60, 130], 24, fill=(255, 255, 255, 235))
        d.text((70, 62), price, font=font(52), fill=(20, 20, 20))
    if claves:
        x = 40
        for c in claves:
            w = int(d.textlength(c, font=font(34))) + 44
            d.rounded_rectangle([x, SIZE - 110, x + w, SIZE - 50], 30, fill=(255, 255, 255, 235))
            d.text((x + 22, SIZE - 100), c, font=font(34), fill=(20, 20, 20))
            x += w + 16
    return base.convert("RGB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--entrada", default=str(ROOT / "fotos-originales"))
    ap.add_argument("--salida", default=str(ROOT / "fotos-listas"))
    ap.add_argument("--price", default="", help="Precio a rotular (solo se aplica a la 1.ª foto)")
    ap.add_argument("--claves", default="", help="Claves separadas por |, se aplican a la 1.ª foto")
    a = ap.parse_args()

    src = sorted(p for p in Path(a.entrada).iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".heic"})
    if not src:
        raise SystemExit(f"No hay fotos en {a.entrada}. Copia ahí tus fotos y vuelve a correr.")
    out = Path(a.salida)
    out.mkdir(parents=True, exist_ok=True)
    claves = [c.strip() for c in a.claves.split("|") if c.strip()]
    for i, p in enumerate(src, 1):
        img = enhance(Image.open(p))
        if i == 1:
            img = overlay(img, a.price, claves)
        dest = out / f"{i:02d}-{p.stem}.jpg"
        img.save(dest, quality=92, optimize=True)
        print("OK", dest)


if __name__ == "__main__":
    main()
