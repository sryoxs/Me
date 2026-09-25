# Guion: "Antes de comer…" (KusiCal, TikTok / Reels)

**Formato:** vertical 1080x1920, 30 fps, H.264 + AAC. **Duración:** 37.5 s.
**Archivo:** `kusical-promo.mp4`. **Portada:** `portada.png`.
**Tono:** primera persona, cotidiano, español peruano juvenil, sin sermones.
**Zonas seguras:** nada importante en los 250 px de arriba, en los 400 px de abajo ni en los 150 px de la derecha. Para revisar, `SAFE=1 node scripts/render.js preview …` pinta esas zonas en rojo.

Los tiempos son los del MP4 final. El tramo B entra 0.5 s antes porque se solapa con la transición *pixelize*.

## Escenas

| # | Tiempo | Qué se ve | Texto en pantalla | Voz en off (propuesta) |
|---|---|---|---|---|
| 1 | 0.0–3.0 | **MESA.** Foto real de un ceviche con Ken Burns lento y vapor pixel que sube. | ANTES DE COMER... 👀 | "Antes de comer, un ritual…" |
| 2 | 3.0–6.0 | **SACO EL CEL.** Sube un celular sostenido por una mano pixel. Se abre KusiCal (splash con Kusi y luego el Diario real) y hay un *tap* en el botón central "Escanear". | SACO EL CEL 📱 | "…saco el cel y abro KusiCal." |
| 3 | 6.0–10.5 | **ESCÁNER.** En la pantalla, la cámara apunta al mismo plato: esquinas naranjas, línea de escaneo y etiquetas que aparecen. Abajo sale el total. | KUSI LO ESCANEA · 🌽 Choclo 90 · 🐟 Pescado 190 · 🍠 Camote 140 · Ceviche 420 kcal | "Kusi reconoce el plato y me dice las calorías de cada cosa." |
| — | 10.5–11.0 | Transición *pixelize* (ffmpeg). **Aquí se empalma la toma real si la hay.** | | |
| 4 | 11.0–15.5 | **MOMENTO ESTRELLA.** Zoom al celular. La foto se pixela por saltos (bloques cada vez más grandes, con un latido en cada salto). Luego ¡POP!: destello, confeti pixel, y el plato pixel vuela girando hasta la fila "Cena" del Diario. El anillo baja de 1860 a 1440 y sube un "+420 kcal". | MODO PIXEL ON 👾 · ¡POP! · DIRECTO AL DIARIO · +420 KCAL | "Y ¡pum!, directo a mi diario." |
| 5a | 15.5–18.1 | **SÚPER.** Un paquete pixel con código de barras, un láser rojo y una tarjeta de resultado. | ¿ALGO DEL SÚPER? · Escanea su código de barras · Plaza Vea · Tottus · Metro · 198 kcal | "¿Algo del súper? Escaneo el código de barras y listo." |
| 5b | 18.1–20.7 | **PLAN EXACTO.** Chips Bajar grasa / Mantener / Ganar músculo y un celular con la **captura real** de "Tu plan está listo" (1860 kcal resaltadas). | TU PLAN EXACTO · a tu medida | "Me arma un plan exacto: bajar grasa, mantener o ganar músculo." |
| 5c | 20.7–23.3 | **KUSI TE EXPLICA.** Chat del Coach. Pregunto "¿Por qué 1860 kcal?" y Kusi (pixel, hablando) responde mientras se escribe el texto. | KUSI TE EXPLICA · cada número, sin sermones | "Y si no entiendo un número, Kusi me lo explica. Sin sermones." |
| 5d | 23.3–25.7 | **RACHA.** Un fuego pixel que late, un contador que sube hasta 7 y una semana que se enciende día por día. | TU RACHA DIARIA · 7 días de racha | "Cada día sumo a mi racha…" |
| 5e | 25.7–28.7 | **COMUNIDAD** (con más peso). Un feed que se desplaza con platos pixelados de otros usuarios (ceviche, lomo saltado, ají de gallina), avatares de Kusi, kcal, likes animados y rachas. | LA COMUNIDAD · mira qué comen y súmate a retos | "…y veo qué están comiendo los demás. Hay retos para todos." |
| 5f | 28.7–31.7 | **PERSONALIZACIÓN** (con más peso). Kusi cambia de outfit cada 0.45 s (chullo + poncho, blanquirroja 🇵🇪, sombrero chotano, lentes de sol, corona, chullo andino) y de pelaje. El tema pasa de claro a **oscuro** con bloques. | HAZLO TUYO · outfits, pelajes y temas | "Y a Kusi lo visto como yo quiera." |
| 6 | 31.7–37.5 | **CIERRE.** Montañas pixel, Kusi salta y saluda y cae confeti. | KUSICAL · Gratis · sin descargar · en tu celular, tablet o compu · Link en la bio 👆 · @kusical | "KusiCal: gratis y sin descargar. Link en la bio." |

**Voz en off completa** (unos 30 s a ritmo natural; se puede grabar encima o usar la voz de TikTok):

> Antes de comer, un ritual: saco el cel y abro KusiCal. Kusi reconoce el plato y me dice las calorías de cada cosa. Y ¡pum!, directo a mi diario. ¿Algo del súper? Escaneo el código de barras. Me arma un plan exacto, y si no entiendo un número, Kusi me lo explica. Sin sermones. Sumo a mi racha, veo qué comen los demás y a Kusi lo visto como quiera. KusiCal: gratis y sin descargar. Link en la bio.

**Hashtags sugeridos:** #comidaperuana #ceviche #contarcalorias #fitnessperu #pixelart #kusical

## Tramo reemplazable (escenas 1 a 3 con toma real)

Las escenas 1 a 3 del MP4 son una **versión provisional animada**. La idea es cambiarlas por una toma **realista**, filmada o generada con IA.

**Qué debe mostrar la toma (6 a 11 s, vertical 9:16):**
1. Una mesa servida con un ceviche (u otro plato peruano), con luz cálida. Una persona está a punto de comer.
2. Saca el celular del bolsillo, con las manos visibles, y abre KusiCal.
3. Apunta la cámara al plato. **El último segundo** debe ser el celular centrado en el cuadro, con la pantalla mostrando el plato. Ahí arranca el zoom con pixelado del tramo B.

*Prompt de ejemplo para un generador de video con IA:*
> Vertical 9:16 video, cozy Peruvian restaurant table, a plate of ceviche with sweet potato and corn, warm light. A young person's hands take a smartphone out of a jeans pocket, unlock it and point the camera at the plate; the phone screen shows the plate with orange corner brackets. Handheld, realistic, 8 seconds, ends with the phone centered in frame.

**Cómo unirla:**
```bash
cd marketing/video
./scripts/unir-toma-real.sh ~/Descargas/toma.mp4                 # → kusical-promo-real.mp4
MEZCLAR_AUDIO=1 ./scripts/unir-toma-real.sh toma.mp4 final.mp4    # conserva el audio ambiente (70 %)
```
El script hace esto:
1. Escala y recorta la toma a 1080x1920 @30 fps (`force_original_aspect_ratio=increase` + `crop`).
2. Usa `build/tramo-b.mp4`. Si no existe, lo renderiza.
3. Regenera la música con la duración real de la toma y sin los efectos del tramo A. El ¡pop! y los demás efectos quedan sincronizados.
4. Empalma con `xfade=pixelize` de 0.5 s.

## Regenerar el video

```bash
cd marketing/video
./scripts/build.sh      # tramos A y B → música → kusical-promo.mp4 + portada.png (unos 4 min)
```

- Textos, tiempos y el **handle** (`HANDLE: '@kusical'`) están en `src/config.js`.
- Para ver cuadros sueltos: `node scripts/render.js preview /tmp/prev 1.5 13.7 30` (con `SAFE=1` se ven las zonas seguras).
- Para rehacer las capturas de la app: `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=… NODE_PATH_PW=$(npm root -g)/playwright node scripts/capture.js '[{"name":"dash","click":["Saltar","Seguir sin cuenta"]}]'`. El script recorre solo el onboarding de la demo.

---

# Versión 2 (v2): toma real + tramo animado (vertical y horizontal)

**Entregables:**
- `kusical-promo-v2-vertical.mp4`: 1080x1920, para TikTok, Reels y Shorts.
- `kusical-promo-v2-horizontal.mp4`: 1920x1080, para YouTube y la web.
- `portada-v2.png`: portada vertical.

**Estructura:** primero va la **toma real** de Gemini, completa y con su audio original al 100 %. Luego entra el **tramo animado** de 21.3 s, a 120 BPM. Cada corte cae al inicio de un compás y el *drop* coincide con el ¡pop! del pixelado. La música empieza cuando termina la toma. Antes solo suena un riser suave en los últimos 0.5 s de la toma.

Los tiempos de la tabla cuentan desde el inicio del tramo. Tiempo en el video = duración de la toma (unos 10 s) + tiempo del tramo.

| Tramo | Escena | Qué se ve | Texto | Transición de salida | Voz en off (propuesta) |
|---|---|---|---|---|---|
| 0.0–1.0 | **Kusi salta** | Puente con la toma. Kusi, con el sprite exacto de la app, brinca y vuela hacia la cámara entre líneas de velocidad pixel. | — | destello | "¡Y aquí entra Kusi!" |
| 1.0–4.0 | **Pixelado → Diario** | La foto real del plato se pixela en 5 golpes (×2 … ×32) y pasa a ser un plato pixel. En el ¡pop! (drop) hay onda de choque y confeti. Sube un iPhone con el **Diario real**, el plato cae en la fila "Cena", la tarjeta se abre con los ingredientes (210 / 140 / 100) y aparece "+450 kcal". | DIRECTO AL DIARIO · +450 KCAL | zoom a través | "Lo escaneo y ¡pum!, directo a mi diario." |
| 4.0–6.0 | **Comida peruana** | Tres fotos (lomo saltado, ceviche, ají de gallina). Cada una se escanea al ritmo y muestra su etiqueta. | RECONOCE COMIDA PERUANA | whip pan | "Reconoce comida peruana…" |
| 6.0–8.0 | **Súper** | Paquete pixel con código de barras, láser, bip y tarjeta con el resultado. Aparecen Plaza Vea, Tottus y Metro. | ¿ALGO DEL SÚPER? · 198 kcal | wipe de bloques | "…y lo del súper, con el código de barras." |
| 8.0–10.0 | **Plan exacto** | Chips de objetivo que cambian al ritmo y un iPhone con la **captura real** del plan. El 1860 se resalta. | TU PLAN EXACTO | whip pan vertical | "Me arma un plan exacto." |
| 10.0–12.0 | **Coach** | Pregunta, puntos de escritura y respuesta de Kusi escrita en vivo. Kusi habla y saluda. | KUSI TE EXPLICA · Sin sermones | mosaico | "Kusi me explica cada número. Sin sermones." |
| 12.0–14.0 | **Racha** | Fuego pixel que late, contador de 1 a 7 y la semana que se enciende. | NO ROMPAS TU RACHA | wipe de bloques | "No rompas tu racha…" |
| 14.0–16.0 | **Comunidad** | Feed en movimiento con platos pixelados de otros usuarios, avatares de Kusi, likes y rachas. | LA COMUNIDAD | zoom a través | "…mira qué come la comunidad…" |
| 16.0–18.0 | **Hazlo tuyo** | 6 outfits, uno por corchea. El tema pasa a modo noche con un círculo pixel. | HAZLO TUYO · outfits, pelajes y temas | mosaico | "…y viste a tu Kusi como quieras." |
| 18.0–21.3 | **Cierre** | Logo letra por letra, Kusi saluda, confeti y montañas en parallax. | KUSICAL · Gratis · sin descargar · Link en la bio · @kusical | — | "KusiCal. Gratis, sin descargar. Link en la bio." |

**Formatos:** en **vertical** los títulos van arriba, centrados en x=540, y el contenido abajo. Se respetan las zonas seguras de TikTok: 250 px arriba, 400 px abajo y 150 px a los lados. En **horizontal** el título va en la columna izquierda y el contenido (teléfono, tarjetas, Kusi) en la derecha, con márgenes de 80 px. No hay barras negras. `render(t)` toma el formato de la URL (`?fmt=v` o `?fmt=h`), que fija `CFG.W`, `CFG.H` y `CFG.MODE`.

**Audio:** el audio de la toma queda intacto. La música se normaliza sola a -14 LUFS y el limitador está en -1 dBTP. Los efectos incluyen whoosh en cada corte, blips en cada palabra de los títulos, pops en el pixelado, ding en las kcal, bip del lector y más.

**Regenerar:**
```bash
cd marketing/video
./scripts/unir-v2.sh                         # vertical   (usa toma/toma-vertical.mp4)
FMT=h ./scripts/unir-v2.sh                   # horizontal (usa toma/toma-horizontal.mp4)
RERENDER=1 ./scripts/unir-v2.sh              # re-renderiza el tramo después de cambiar src/v2/
PAGE=src/v2/index.html node scripts/render.js cover portada-v2.png
# revisar cuadros sueltos con zonas seguras:
PAGE=src/v2/index.html FMT=h SAFE=1 node scripts/render.js preview /tmp/prev 1.5 5 9.5
```
Los textos, tiempos, cortes y el handle (`HANDLE`) se editan en `src/v2/config.js`. La música está en `scripts/music-v2.py`.
