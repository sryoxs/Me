"""Reemplaza la etiqueta inventada por Gemini ("Marma tine 470 kcal") por "Lechuga 15 kcal".
Sigue la etiqueta "Ceviche" (que se mueve con la cámara) con template matching.
Uso: python3 corregir_etiqueta.py carpeta_cuadros fuente_bold.ttf fuente_regular.ttf"""
import sys, glob, os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

REF = 212                      # cuadro de referencia (8.8 s a 24 fps)
TPL = (913, 405, 44, 44)       # ícono verde de la etiqueta mala en REF: x, y, w, h
TXT = (47, 2, 104, 50)         # zona del texto malo, relativa al ícono
PRIMER, ASENTADA = 199, 206    # cuadros donde la etiqueta asoma y donde ya está quieta
BORRAR = (880, 385, 1115, 485)  # zona que ocupa la etiqueta mala mientras crece

def main():
    d, fb, fr = sys.argv[1:4]
    files = sorted(glob.glob(os.path.join(d, 'f*.png')))
    ref = cv2.imread(files[REF - 1])
    x, y, w, h = TPL
    tpl = ref[y:y + h, x:x + w]
    bold, reg = ImageFont.truetype(fb, 18), ImageFont.truetype(fr, 16)
    for i, f in enumerate(files, 1):
        if i < PRIMER:
            continue
        img = cv2.imread(f)
        sx0, sy0 = x - 80, y - 60
        win = img[sy0:sy0 + h + 120, sx0:sx0 + w + 160]
        _, score, _, loc = cv2.minMaxLoc(cv2.matchTemplate(win, tpl, cv2.TM_CCOEFF_NORMED))
        px, py = sx0 + loc[0], sy0 + loc[1]
        a = 1.0
        if i < ASENTADA:       # la etiqueta mala está creciendo: se borra con el fondo de antes
            limpio = cv2.imread(files[PRIMER - 3])
            m = np.zeros(img.shape[:2], np.float32)
            bx0, by0, bx1, by1 = BORRAR
            m[by0:by1, bx0:bx1] = 1.0
            m = cv2.GaussianBlur(m, (21, 21), 0)[..., None]
            cv2.imwrite(f, (img * (1 - m) + limpio * m).astype(np.uint8))
            print(i, 'borrada', flush=True)
            continue
        tx, ty, tw, th = px + TXT[0], py + TXT[1], TXT[2], TXT[3]
        reg_px = img[ty:ty + th, tx:tx + tw].reshape(-1, 3).astype(int)
        claros = reg_px[reg_px.sum(axis=1) > 600]          # fondo claro de la etiqueta, sin el texto
        bg = tuple(int(v) for v in np.median(claros if len(claros) else reg_px, axis=0)[::-1])
        patch = Image.new('RGBA', (tw + 20, th + 20), bg + (255,))
        dr = ImageDraw.Draw(patch)
        dr.text((12, 12), 'Lechuga', font=bold, fill=(34, 34, 34, 255))
        dr.text((12, 33), '15 kcal', font=reg, fill=(60, 60, 60, 255))
        patch = patch.rotate(-5, resample=Image.BICUBIC, expand=False, fillcolor=bg + (0,))
        base = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).convert('RGBA')
        layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
        layer.paste(patch, (tx - 10, ty - 10))
        mask = np.zeros((base.size[1], base.size[0]), np.uint8)
        mask[ty:ty + th, tx:tx + tw] = int(255 * a)
        mask = cv2.GaussianBlur(mask, (5, 5), 0)
        layer.putalpha(Image.fromarray(mask))
        out = Image.alpha_composite(base, layer).convert('RGB')
        out.save(f)
        print(i, round(score, 2), px, py, flush=True)

if __name__ == '__main__':
    main()
