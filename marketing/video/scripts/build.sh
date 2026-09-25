#!/usr/bin/env bash
# Regenera todo: capturas NO (usa capturas/ existentes) → tramos A y B → música → MP4 final + portada.
# Requisitos: node + playwright (global), python3 con numpy, imageio-ffmpeg (trae ffmpeg).
set -euo pipefail
cd "$(dirname "$0")/.."
export NODE_PATH_PW="${NODE_PATH_PW:-$(npm root -g)/playwright}"
FF="${FFMPEG:-$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')}"
mkdir -p build
A_END=$(grep -oP 'A_END:\s*\K[0-9.]+' src/config.js)
B_END=$(grep -oP 'B_END:\s*\K[0-9.]+' src/config.js)
XF=$(grep -oP 'XFADE:\s*\K[0-9.]+' src/config.js)
DUR=$(python3 -c "print($B_END - $XF)")
OFF=$(python3 -c "print($A_END - $XF)")

echo "▶ Renderizando tramos A y B en paralelo…"
node scripts/render.js seg A build/tramo-a.mp4 &
node scripts/render.js seg B build/tramo-b.mp4 &
wait
echo "▶ Música chiptune ($DUR s)…"
python3 scripts/music.py build/musica.wav --dur "$DUR" --a-dur "$A_END" --xfade "$XF"
echo "▶ Empalme con transición pixelize + audio…"
"$FF" -y -loglevel error -i build/tramo-a.mp4 -i build/tramo-b.mp4 -i build/musica.wav \
  -filter_complex "[0:v][1:v]xfade=transition=pixelize:duration=$XF:offset=$OFF,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 19 -profile:v high -level 4.1 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -ar 44100 -movflags +faststart -shortest kusical-promo.mp4
node scripts/render.js cover portada.png
ls -lh kusical-promo.mp4 portada.png
