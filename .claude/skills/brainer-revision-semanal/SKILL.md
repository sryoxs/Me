---
name: brainer-revision-semanal
description: Habilidad de Brainer "Revisión semanal". Analiza la bóveda del usuario (notas, tareas, recordatorios, memoria de estudio) y deja una revisión puntuada de la semana con mejoras concretas.
---

# Revisión semanal

Solo con datos de `/engine/vault` (no hace falta buscar en la web).

1. Ventana: últimos 7 días (`updated` / `created`).
2. Calcula y explica:
   - **Estudio**: días con registro (`memory.studyLog`, notas `#estudio`), temas tocados, tarjetas creadas.
   - **Tareas**: creadas vs. con etiqueta `#hecha`; las vencidas.
   - **Recordatorios**: cumplidos vs. ignorados.
   - **Bóveda**: notas nuevas, notas huérfanas (sin enlaces ni etiquetas), temas más frecuentes.
3. Puntuación de 0 a 10 por área y global, con una línea de justificación cada una.
4. `## Lo que funcionó` (3 puntos) y `## Qué cambiar la próxima semana` (3 acciones pequeñas y medibles).
5. `## Preguntas para ti` — 3 preguntas de repaso sobre lo estudiado esta semana, en formato `Pregunta: respuesta` para que Brainer las convierta en tarjetas.
