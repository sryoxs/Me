#!/usr/bin/env bash
# Arma las dos versiones de la toma de Gemini a partir de los cuadros reescalados:
#   toma-horizontal.mp4  1920x1080 (formato original)
#   toma-vertical.mp4    1080x1920 (TikTok/Reels), con un recorte 9:16 por plano
# Uso: ./armar_tomas.sh <cuadros_4k> <cuadros_fuente_corregidos> <video_gemini_original>
# Mezcla 60 % Real-ESRGAN + 40 % Lanczos y un grano fino para que no se vea "plastificado".
# El audio original se conserva completo y a su volumen original.
set -euo pipefail
UP="$1"; SRC="$2"; ORIG="$3"
DIR="$(cd "$(dirname "$0")" && pwd)"
FF="$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')"
LOOK="blend=all_expr='A*0.6+B*0.4',noise=alls=5:allf=t+u,eq=contrast=1.04:saturation=1.05,fps=30,format=yuv420p"
ENC=(-c:v libx264 -crf 17 -preset slow -c:a aac -b:a 192k -movflags +faststart)

# Horizontal: el cuadro completo
"$FF" -loglevel error -y -framerate 24 -i "$UP/f%04d.png" -framerate 24 -i "$SRC/f%04d.png" -i "$ORIG" \
  -filter_complex "[0]scale=1920:1080:flags=lanczos[u];[1]scale=1920:1080:flags=lanczos[l];[u][l]$LOOK[v]" \
  -map "[v]" -map 2:a "${ENC[@]}" -shortest "$DIR/toma-horizontal.mp4"

# Vertical: plano -> (inicio, fin, x del recorte en la fuente de 1280x720, ancho 406)
PLANOS=("0 2.0 367" "2.0 5.4583 427" "5.4583 7.0833 347" "7.0833 10.01 347")
fc=""; cat_u=""; cat_l=""; n=0
for p in "${PLANOS[@]}"; do
  read -r a b x <<<"$p"
  fc+="[0]trim=$a:$b,setpts=PTS-STARTPTS,crop=1218:2160:$((x * 3)):0,scale=1080:1920:flags=lanczos[u$n];"
  fc+="[1]trim=$a:$b,setpts=PTS-STARTPTS,crop=406:720:$x:0,scale=1080:1920:flags=lanczos[l$n];"
  cat_u+="[u$n]"; cat_l+="[l$n]"; n=$((n + 1))
done
fc+="${cat_u}concat=n=$n:v=1:a=0[u];${cat_l}concat=n=$n:v=1:a=0[l];[u][l]$LOOK[v]"
"$FF" -loglevel error -y -framerate 24 -i "$UP/f%04d.png" -framerate 24 -i "$SRC/f%04d.png" -i "$ORIG" \
  -filter_complex "$fc" -map "[v]" -map 2:a "${ENC[@]}" -shortest "$DIR/toma-vertical.mp4"

for f in toma-horizontal toma-vertical; do
  { "$FF" -i "$DIR/$f.mp4" 2>&1 || true; } | grep -E "Duration|Video:" | sed "s/^/$f: /"
done
