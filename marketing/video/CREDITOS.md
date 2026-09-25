# Créditos y licencias: video promocional de KusiCal

## Fotos de platos (Wikimedia Commons)

| Archivo local | Plato | Autor | Licencia | Fuente |
|---|---|---|---|---|
| `assets/ceviche1.jpg` | Ceviche (mesa, escáner, pixelado, portada, comunidad) | **S.hanry** | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | https://commons.wikimedia.org/wiki/File:Ceviche_Peruano.jpg |
| `assets/lomo2.jpg` | Lomo saltado (feed de comunidad) | **HugoMon** | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | https://commons.wikimedia.org/wiki/File:Lomo_Saltado.JPG |
| `assets/aji1.jpg` | Ají de gallina (feed de comunidad) | **Dtarazona** | Dominio público | https://commons.wikimedia.org/wiki/File:Ají_de_gallina_(gourmet)-b.jpg |

Se usan las miniaturas oficiales de Wikimedia (1280 px y 1920 px de ancho). En el video se recortan, se pixelan y se les superponen etiquetas. **CC BY exige atribución**: al publicar, pega esto en la descripción del post o en un comentario fijado:

> Fotos: "Ceviche Peruano" de S.hanry (CC BY 4.0) y "Lomo Saltado" de HugoMon (CC BY 3.0), vía Wikimedia Commons. Fotos modificadas.

## Capturas de la app

`capturas/*.png` son capturas reales de la demo https://kusical-demo.kusical.workers.dev (390x844 @3x), tomadas con `scripts/capture.js`. Son material propio de KusiCal.

## Kusi (mascota)

El sprite de Kusi (`src/kusi.js`) es un port 1:1 de los mapas de píxeles de la propia app (`app.js` y `kusi-pixel-extra.js` de la demo). También es material propio.

## Tipografías

- **Silkscreen** (Jason Kottke) y **Plus Jakarta Sans** (Tokotype), bajo [SIL Open Font License 1.1](https://openfontlicense.org), descargadas de Google Fonts a `assets/fonts/`.
- Emojis: **Noto Color Emoji** (Google, SIL OFL 1.1), la fuente del sistema con la que se renderiza.

## Música y efectos

La pista chiptune y todos los efectos (blips, ¡pop!, moneda, barridos) se sintetizan desde cero en `scripts/music.py` (numpy: ondas cuadradas, triangular y ruido). La melodía es original, así que no hay derechos de terceros.

## Marcas mencionadas

"Plaza Vea", "Tottus" y "Metro" aparecen solo como texto, para indicar dónde se compran productos que se pueden escanear. No se usan sus logos. El paquete de "Galletas de avena" es genérico e inventado.

## Versión 2

- **Toma real** (`toma/`): la entrega el dueño. Es un video generado con Gemini, y `toma/plato.png` es un cuadro del ceviche de esa toma. Los derechos y términos de uso dependen de la cuenta de Gemini del dueño.
- **Diario de la app:** las capturas son reales (`capturas/v2/`). Las de "después" se tomaron tras agregar el ceviche en la demo. Los valores de la IA simulada se ajustaron en el DOM antes de capturar (Cena 450 = 210 + 140 + 100) para que coincidan con la toma.
- **Música v2** (`scripts/music-v2.py`): original y sintetizada, sin derechos de terceros.
