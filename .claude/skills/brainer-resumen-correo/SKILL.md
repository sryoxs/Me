---
name: brainer-resumen-correo
description: Habilidad de Brainer "Resumen del correo". Lee el Gmail del usuario con el conector de Gmail y deja en su bóveda un informe priorizado de lo importante.
---

# Resumen del correo

Usa las herramientas del conector **Gmail** (`mcp__Gmail__search_threads`, `mcp__Gmail__get_thread`). Si el conector no está disponible, escribe una nota corta explicando que hace falta conectar Gmail y termina.

1. Busca hilos de las últimas 24 h (`newer_than:1d`), sin promociones ni sociales: `-category:promotions -category:social`.
2. Lee solo lo necesario para clasificar. No respondas ni cambies etiquetas.
3. Informe en tres bloques:
   - **Urgente** (requiere acción hoy): remitente, asunto, qué piden, fecha límite.
   - **Importante** (esta semana).
   - **Para leer** (informativo), una línea cada uno.
4. Detecta fechas de entrega o citas y lístalas en `## Fechas detectadas` con el formato `30 de octubre` para que Brainer proponga recordatorios.
5. `## Siguiente paso`: máximo 3 acciones.

Nunca copies contraseñas, códigos de verificación ni datos bancarios en el informe.
