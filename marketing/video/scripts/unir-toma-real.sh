#!/usr/bin/env bash
# Reemplaza el TRAMO A (mesa → sacar el celular → escanear) por una toma real o
# generada con IA, y la empalma con el tramo B (zoom al celular + pixelado + funciones + cierre).
#
# Uso:  ./scripts/unir-toma-real.sh toma.mp4 [salida.mp4]
#   - toma.mp4: clip vertical (idealmente 9:16) de 6 a 11 s. Debe TERMINAR con el celular
#     mostrando el plato en la cámara de KusiCal, centrado en el cuadro: ahí arranca el pixelado.
#   - Se escala y recorta a 1080x1920 @30 fps, se une con transición "pixelize" de 0.5 s
#     y se regenera la música para que el ¡pop! caiga en su sitio.
#   - MEZCLAR_AUDIO=1 conserva el sonido original de la toma (al 70 %) bajo la música.
set -euo pipefail
cd "$(dirname "$0")/.."
IN="${1:?Falta el clip: ./scripts/unir-toma-real.sh toma.mp4}"
OUT="${2:-kusical-promo-real.mp4}"
FF="${FFMPEG:-$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')}"
export NODE_PATH_PW="${NODE_PATH_PW:-$(npm root -g)/playwright}"
XF=$(grep -oP 'XFADE:\s*\K[0-9.]+' src/config.js)
A_END=$(grep -oP 'A_END:\s*\K[0-9.]+' src/config.js)
B_END=$(grep -oP 'B_END:\s*\K[0-9.]+' src/config.js)
mkdir -p build

D=$(python3 -c "import imageio_ffmpeg as f;print(round(f.count_frames_and_secs('$IN')[1],3))")
python3 - "$D" <<'PY'
import sys; d=float(sys.argv[1])
if not 6 <= d <= 11: print(f"⚠ La toma dura {d:.1f} s (se recomienda 6-11 s). Continúo igual.")
PY
[ -f build/tramo-b.mp4 ] || node scripts/render.js seg B build/tramo-b.mp4

echo "▶ Normalizando la toma a 1080x1920 @30 fps…"
"$FF" -y -loglevel error -i "$IN" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1,format=yuv420p" \
  -c:v libx264 -crf 18 -preset medium -an build/toma-real.mp4
HAS_AUDIO=$("$FF" -i "$IN" 2>&1 | grep -c "Audio:" || true)

DUR=$(python3 -c "print(round($D + ($B_END - $A_END) - $XF, 3))")
OFF=$(python3 -c "print(round($D - $XF, 3))")
echo "▶ Música para $DUR s (tramo real de $D s)…"
python3 scripts/music.py build/musica-real.wav --dur "$DUR" --a-dur "$D" --xfade "$XF" --sin-sfx-a

if [ "${MEZCLAR_AUDIO:-0}" = "1" ] && [ "$HAS_AUDIO" -gt 0 ]; then
  AUD="[3:a]volume=0.7,apad[amb];[2:a][amb]amix=inputs=2:duration=first:normalize=0[a]"; AMAP="[a]"; EXTRA=(-i "$IN")
else
  AUD="[2:a]anull[a]"; AMAP="[a]"; EXTRA=()
fi
echo "▶ Empalme con transición pixelize…"
"$FF" -y -loglevel error -i build/toma-real.mp4 -i build/tramo-b.mp4 -i build/musica-real.wav "${EXTRA[@]}" \
  -filter_complex "[0:v][1:v]xfade=transition=pixelize:duration=$XF:offset=$OFF,format=yuv420p[v];$AUD" \
  -map "[v]" -map "$AMAP" -c:v libx264 -preset slow -crf 19 -profile:v high -level 4.1 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -ar 44100 -movflags +faststart -shortest "$OUT"
ls -lh "$OUT"
