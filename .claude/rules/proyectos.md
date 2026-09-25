---
paths:
  - "06-PROYECTOS/**/*.md"
---

# Reglas de los proyectos

- Cada proyecto tiene su carpeta aquí con `plan.md` (objetivo, alcance de la versión 1, estructura, decisiones, fases con criterio de «hecho») y `decisiones.md` (qué se decidió, cuándo y por qué).
- El código nunca vive aquí: vive en su propio repositorio y siempre en una rama `claude/…`. Nunca en `main`.
- No se crea un repositorio, servicio, base de datos ni despliegue sin el «sí» escrito de Smith en la conversación. Si falta, el plan lo deja como paso pendiente marcado `[PERMISO]`.
- Antes de dar una fase por terminada: pruebas o linter del proyecto ejecutados y su resultado anotado en `decisiones.md`.
- Un cambio pequeño y verificable vale más que uno grande sin probar.
