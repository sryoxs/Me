"""Compone el logo final de KusiCal a partir del recorte de Kusi (kusi_tight.png)
y las fuentes de marca. Genera: perfil (cuadrado, con y sin fondo), logo con
nombre, y versión transparente para superponer."""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

KUSI = sys.argv[1]        # kusi_tight.png
SILK = sys.argv[2]        # Silk-700.ttf
OUT = sys.argv[3]         # carpeta de salida

ORANGE, CREAM, DARK = (232, 112, 42), (250, 249, 245), (20, 20, 19)

def glow(size, base_rgb, glow_rgb, glow_alpha, cx, cy, r):
    """Fondo sólido base_rgb con un resplandor radial suave de glow_rgb hacia el centro."""
    out = Image.new('RGBA', size, base_rgb + (255,))
    mask = Image.new('L', size, 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=glow_alpha)
    mask = mask.filter(ImageFilter.GaussianBlur(r // 2))
    tint = Image.new('RGBA', size, glow_rgb + (255,))
    tint.putalpha(mask)
    out = Image.alpha_composite(out, tint)
    return out

def paste_kusi(base, kusi, target_h, cx, top_y):
    k = kusi.resize((round(kusi.width * target_h / kusi.height), target_h), Image.LANCZOS)
    base.alpha_composite(k, (cx - k.width // 2, top_y))
    return k

def text(draw, s, xy, font, fill, align='center'):
    bbox = draw.textbbox((0, 0), s, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x, y = xy
    if align == 'center':
        x -= w / 2
    draw.text((x - bbox[0], y - bbox[1]), s, font=font, fill=fill)
    return w, h

kusi = Image.open(KUSI).convert('RGBA')

# 1) Foto de perfil: fondo naranja sólido de marca, con un resplandor claro detrás de Kusi.
S = 1080
base = glow((S, S), ORANGE, (255, 255, 255), 60, S // 2, int(S * 0.40), 480)
paste_kusi(base, kusi, 780, S // 2, 150)
base.convert('RGB').save(f'{OUT}/perfil-naranja.png')

# 2) Foto de perfil alterna: fondo crema con resplandor naranja.
base2 = glow((S, S), CREAM, ORANGE, 40, S // 2, int(S * 0.40), 480)
paste_kusi(base2, kusi, 780, S // 2, 150)
base2.convert('RGB').save(f'{OUT}/perfil-crema.png')

# 3) Logo con nombre (para bio, web, merch): Kusi + "KUSICAL" abajo, fondo naranja.
logo = glow((S, S), ORANGE, (255, 255, 255), 55, S // 2, int(S * 0.34), 440)
paste_kusi(logo, kusi, 620, S // 2, 90)
d = ImageDraw.Draw(logo)
f_big = ImageFont.truetype(SILK, 108)
text(d, 'KUSICAL', (S // 2, 800), f_big, CREAM + (255,))
logo.convert('RGB').save(f'{OUT}/logo-con-nombre.png')

# 4) Versión transparente (Kusi + nombre, sin fondo) para superponer en videos/merch.
trans = Image.new('RGBA', (S, S), (0, 0, 0, 0))
paste_kusi(trans, kusi, 620, S // 2, 60)
d = ImageDraw.Draw(trans)
text(d, 'KUSICAL', (S // 2, 770), f_big, ORANGE + (255,))
trans.save(f'{OUT}/logo-transparente.png')

# 5) Isotipo chico (favicon-like) 512x512, más apretado, para stickers/watermark.
S2 = 512
mini = glow((S2, S2), ORANGE, (255, 255, 255), 60, S2 // 2, int(S2 * 0.40), 230)
paste_kusi(mini, kusi, 390, S2 // 2, 62)
mini.convert('RGB').save(f'{OUT}/isotipo-512.png')

print('listo')
