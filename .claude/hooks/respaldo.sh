#!/usr/bin/env bash
# Reflejo de cierre (Stop): commit y push del vault a la rama de trabajo. Nunca a la principal. Falla en silencio.
cd "$(dirname "$0")/../.." 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
br=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
[ -z "$br" ] || [ "$br" = "main" ] || [ "$br" = "master" ] || [ "$br" = "HEAD" ] && exit 0
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  git add -A >/dev/null 2>&1
  git commit -q -m "vault · $(date '+%Y-%m-%d %H:%M') · respaldo automático" >/dev/null 2>&1 || exit 0
fi
if git remote get-url origin >/dev/null 2>&1; then
  git push -q -u origin "$br" >/dev/null 2>&1 || true
fi
exit 0
