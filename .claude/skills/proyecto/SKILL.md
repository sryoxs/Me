---
name: proyecto
description: Arranca o continúa un proyecto de código o una app de Smith: plan por fases en 06-PROYECTOS, y el código lo escribe el subagente programador en una rama claude/… de su repositorio, con pruebas antes de dar cada fase por hecha. Úsala cuando Smith diga «ármame una app», «arranca el proyecto [nombre]», «sigue con el proyecto…» o «programa…». Nunca crea repositorios, servicios ni despliegues sin su «sí» escrito.
---

# Proyecto

## Fase 0 · Permisos (regla dura)
Antes de nada, di en dos líneas qué vas a hacer. Si el proyecto necesita un repositorio nuevo, un servicio, una base de datos o un despliegue, párate y pide el «sí» escrito de Smith. Sin él, el plan deja el paso marcado `[PERMISO]` y se sigue solo con lo que no cuesta ni crea nada.

## Fase 1 · Plan (en la conversación)
1. Lee el `CLAUDE.md` (identidad, metas, límites) y `06-PROYECTOS/<nombre>/` si ya existe.
2. Escribe o actualiza `06-PROYECTOS/<nombre>/plan.md`:
   - Objetivo en una frase y a quién sirve.
   - Alcance de la versión 1 (lo mínimo que ya es útil) y lo que queda fuera.
   - Estructura: módulos o pantallas, datos, integraciones.
   - Decisiones técnicas con una línea de justificación. Simple, local primero, sin dependencias innecesarias.
   - Fases con criterio de «hecho» para cada una.
   - Riesgos y cómo se mitigan.
   Máximo 600 palabras. Enséñaselo a Smith y espera su visto bueno antes de programar.

## Fase 2 · Código (subagente programador)
1. Delega en **programador** con el plan y la fase a construir. Trabaja en el repositorio del proyecto (o en `06-PROYECTOS/<nombre>/codigo/` si aún no hay repositorio autorizado), siempre en una rama `claude/<nombre>-<fase>`.
2. Al volver, exige su resumen de 5 líneas: qué hizo, cómo probarlo, resultado de las pruebas, qué falta.
3. Si las pruebas fallaron, vuelve a delegar con el error. No se avanza de fase con pruebas rojas.

## Fase 3 · Cierre de fase
1. Anota en `06-PROYECTOS/<nombre>/decisiones.md` la fecha, la fase, la rama, el resultado de las pruebas y las decisiones tomadas.
2. Dile a Smith en tres líneas cómo revisar y hacer merge. El merge lo hace él.

## Cuando Smith está en Brainer (teléfono)
Si la petición llegó por `sincronizar-brainer`, deja además una nota tipo `proyecto` en Brainer con el plan y el enlace a la rama, para que lo vea en la app.
