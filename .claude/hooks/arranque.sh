#!/usr/bin/env bash
# Reflejo de arranque: dos líneas al abrir la sesión. Nunca bloquea.
cd "$(dirname "$0")/../.." 2>/dev/null || exit 0
n=$(find 00-INBOX -maxdepth 1 -type f ! -name README.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$n" = "0" ]; then echo "Inbox: 0 notas sin procesar."; else echo "Inbox: $n nota(s) sin procesar en 00-INBOX/."; fi
if [ -f .claude/ultima-corrida.md ]; then
  echo "Última corrida: $(head -n 1 .claude/ultima-corrida.md | cut -c1-140)"
else
  last=$(find 01-CAPTURES -type f -name '*.md' ! -name README.md -printf '%TY-%Tm-%Td %p\n' 2>/dev/null | sort | tail -n 1)
  if [ -n "$last" ]; then echo "Sin reporte de corrida. Último archivado: $last"; else echo "Sin rastro de una corrida: el inbox está sin procesar."; fi
fi
exit 0
