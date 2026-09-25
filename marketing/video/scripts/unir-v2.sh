#!/usr/bin/env bash
# Video v2 final = TOMA REAL (Gemini, completa y con su audio al 100 %) + tramo animado
# (Kusi salta → pixelado → funciones → cierre) + música v2, que entra al terminar la toma.
#
# Uso:
#   ./scripts/unir-v2.sh                 # vertical:   toma/toma-vertical.mp4   → kusical-promo-v2-vertical.mp4
#   FMT=h ./scripts/unir-v2.sh           # horizontal: toma/toma-horizontal.mp4 → kusical-promo-v2-horizontal.mp4
#   FMT=h ./scripts/unir-v2.sh otra.mp4 salida.mp4
# Variables opcionales:
#   PUNCH=0.4 PX=… PY=…   punch-in al final de la toma hacia (PX,PY). Por defecto está apagado
#                         (PUNCH=0) porque la toma termina con Kusi saliendo del celular.
#   RERENDER=1            vuelve a renderizar el tramo animado aunque ya exista en build/.
set -euo pipefail
cd "$(dirname "$0")/.."
FF="${FFMPEG:-$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')}"
export NODE_PATH_PW="${NODE_PATH_PW:-$(npm root -g)/playwright}"
FMT="${FMT:-v}"
if [ "$FMT" = "h" ]; then W=1920; H=1080; NAME=horizontal; else W=1080; H=1920; NAME=vertical; fi
TOMA="${1:-toma/toma-$NAME.mp4}"
OUT="${2:-kusical-promo-v2-$NAME.mp4}"
TRAMO="build/v2-tramo-$NAME.mp4"
PUNCH="${PUNCH:-0}"; PX="${PX:-$((W / 2))}"; PY="${PY:-$((H / 2))}"
mkdir -p build
[ -f "$TOMA" ] || { echo "✗ Falta $TOMA. Cuando exista, corre: FMT=$FMT ./scripts/unir-v2.sh"; exit 1; }

if [ ! -f "$TRAMO" ] || [ "${RERENDER:-0}" = "1" ]; then
  echo "▶ Renderizando el tramo animado ($NAME ${W}x${H})…"
  FMT="$FMT" PAGE=src/v2/index.html node scripts/render.js seg V2 "$TRAMO"
fi
TR=$(python3 -c "import imageio_ffmpeg as f;print(round(f.count_frames_and_secs('$TRAMO')[1],3))")
D=$(python3 -c "import imageio_ffmpeg as f;print(round(f.count_frames_and_secs('$TOMA')[1],3))")
echo "▶ Toma: $D s · tramo: $TR s · total: $(python3 -c "print(round($D+$TR,2))") s"

# ---- video: toma (escalada/recortada a WxH, punch-in opcional, destello blanco) + tramo ----
ZP=""
if python3 -c "import sys; sys.exit(0 if float('$PUNCH') > 0 else 1)"; then
  N0=$(python3 -c "print(int(round(($D-$PUNCH)*30)))"); NP=$(python3 -c "print(max(1,int(round($PUNCH*30))))")
  ZP="zoompan=z='if(gte(in,$N0),1+2.4*pow((in-$N0)/$NP,2.2),1)':x='$PX*(1-1/zoom)':y='$PY*(1-1/zoom)':d=1:s=${W}x${H}:fps=30,"
fi
FL=$(python3 -c "print(round($D-0.08,3))")
VF="[0:v]fps=30,scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H,setsar=1,${ZP}fade=t=out:st=$FL:d=0.08:color=white,format=yuv420p[t0];\
[1:v]fps=30,format=yuv420p[t1];[t0][t1]concat=n=2:v=1:a=0[v]"

# ---- audio: música normalizada sola a -14 LUFS; la toma conserva su audio original al 100 % ----
python3 scripts/music-v2.py build/musica-v2.wav --offset "$D" --dur-tramo "$TR"
LN=$("$FF" -hide_banner -ss "$D" -i build/musica-v2.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | python3 -c "
import sys,json,re; j=json.loads(re.search(r'\{[^{}]*\}', sys.stdin.read(), re.S).group(0))
print(round(-14 - float(j['input_i']), 2))")
echo "▶ Ganancia de la música para -14 LUFS: $LN dB"
HAS_AUDIO=$("$FF" -i "$TOMA" 2>&1 | grep -c "Audio:" || true)
if [ "$HAS_AUDIO" -gt 0 ]; then
  AF="[0:a]aresample=44100,afade=t=out:st=$(python3 -c "print(round($D-0.12,3))"):d=0.12,apad[ta];[2:a]volume=${LN}dB[mu];[ta][mu]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.89:level=false[a]"
else
  AF="[2:a]volume=${LN}dB,alimiter=limit=0.89:level=false[a]"
fi
echo "▶ Montando $OUT…"
"$FF" -nostdin -y -loglevel error -i "$TOMA" -i "$TRAMO" -i build/musica-v2.wav \
  -filter_complex "$VF;$AF" -map "[v]" -map "[a]" \
  -c:v libx264 -preset slow -crf 19 -profile:v high -level 4.2 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -ar 44100 -movflags +faststart -t "$(python3 -c "print(round($D+$TR,3))")" "$OUT"
ls -lh "$OUT"
