---
name: brainer-investigacion
description: Habilidad de Brainer "Investigación profunda". Investiga el tema que pide el usuario con fuentes y deja un informe completo y estudiable en su bóveda.
---

# Investigación profunda

El tema viene en `data.prompt`. Antes de buscar, revisa en `/engine/vault` si el usuario ya tiene notas relacionadas y enlázalas con `[[Título]]`.

1. Busca con `WebSearch` y lee con `WebFetch` 4–8 fuentes fiables (académicas, documentación oficial, medios de referencia).
2. Estructura del informe:
   - `## En una frase`
   - `## Lo esencial` — 5–8 puntos, con **términos clave en negrita** y definiciones en formato `Término: definición` (Brainer los convierte en tarjetas).
   - `## Cómo se conecta con lo que ya sabes` — usando sus notas.
   - `## Dudas frecuentes` — 3 preguntas con respuesta breve.
   - `## Fuentes` — lista con enlaces.
   - `## Siguiente paso`
3. Extensión: 600–1200 palabras. Español claro, nivel adaptado al perfil del usuario.
