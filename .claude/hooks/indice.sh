#!/usr/bin/env bash
# Reflejo de índice (PostToolUse Write|Edit): reescribe INDICE.md con título, ruta y fecha de cada nota. Silencioso.
cd "$(dirname "$0")/../.." 2>/dev/null || exit 0
cat >/dev/null
{
  echo "# Índice del vault"
  echo
  echo "Generado por el reflejo de índice. No se edita a mano."
  echo
  for d in 00-INBOX 01-CAPTURES 02-CONNECTIONS 03-BRIEFS 04-PUBLISHED 05-MATERIAL 06-PROYECTOS; do
    [ -d "$d" ] || continue
    echo "## $d"
    find "$d" -type f -name '*.md' ! -name README.md -printf '%TY-%Tm-%Td\t%p\n' 2>/dev/null | sort -r | while IFS=$'\t' read -r date file; do
      title=$(grep -m1 -E '^# ' "$file" 2>/dev/null | sed 's/^# //')
      [ -z "$title" ] && title=$(basename "$file" .md)
      echo "- $date · [$title]($file)"
    done
    echo
  done
} > INDICE.md 2>/dev/null
exit 0
