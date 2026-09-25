#!/usr/bin/env bash
# Candado (PreToolUse): salida 2 bloquea la herramienta.
#  - Nada escribe ni edita dentro de 04-PUBLISHED/ (salvo su README).
#  - Ningún comando empuja, mezcla o commitea sobre la rama principal.
# Para editar 04-PUBLISHED a mano un rato: BRAINER_CANDADO=off claude
[ "${BRAINER_CANDADO:-on}" = "off" ] && exit 0
input=$(cat)
path=$(printf '%s' "$input" | python3 -c 'import sys,json
try:
  d=json.load(sys.stdin); ti=d.get("tool_input",{}) or {}
  print(ti.get("file_path") or ti.get("path") or ti.get("command") or "")
except Exception: print("")' 2>/dev/null)
tool=$(printf '%s' "$input" | python3 -c 'import sys,json
try: print(json.load(sys.stdin).get("tool_name",""))
except Exception: print("")' 2>/dev/null)
case "$tool" in
  Write|Edit|MultiEdit|NotebookEdit)
    case "$path" in
      *04-PUBLISHED/README.md) exit 0 ;;
      *04-PUBLISHED/*) echo "Bloqueado: 04-PUBLISHED es material ya publicado y no se edita. Si de verdad hay que cambiarlo, se cambia a mano (BRAINER_CANDADO=off)." >&2; exit 2 ;;
    esac ;;
  Bash)
    cmd="$path"
    if printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+push[^|;&]*[[:space:]](origin[[:space:]]+)?(main|master)([[:space:]]|$)|git[[:space:]]+push[^|;&]*HEAD:(main|master)'; then
      echo "Bloqueado: nunca se empuja a la rama principal. Usa una rama claude/… y deja el merge a Smith." >&2; exit 2
    fi
    if printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+(checkout|switch)[[:space:]]+(main|master)([[:space:]]|$)|git[[:space:]]+merge[[:space:]]'; then
      br=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
      case "$cmd" in *"git merge"*) if [ "$br" = "main" ] || [ "$br" = "master" ]; then echo "Bloqueado: no se mezcla sobre la rama principal desde aquí." >&2; exit 2; fi ;; esac
    fi
    if printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+commit'; then
      br=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
      if [ "$br" = "main" ] || [ "$br" = "master" ]; then echo "Bloqueado: estás en la rama principal. Crea una rama claude/… antes de commitear." >&2; exit 2; fi
    fi
    if printf '%s' "$cmd" | grep -Eq '(^|[^[:alnum:]_])(04-PUBLISHED/)[^[:space:]]*\.md' && printf '%s' "$cmd" | grep -Eq '>|>>|sed -i|tee |mv |rm '; then
      echo "Bloqueado: 04-PUBLISHED no se modifica desde la terminal." >&2; exit 2
    fi ;;
esac
exit 0
