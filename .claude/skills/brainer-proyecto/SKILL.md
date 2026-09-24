---
name: brainer-proyecto
description: Habilidad de Brainer "Nuevo proyecto o app". Cuando el usuario pide construir algo (una app, una web, un script, un bot), abre una sesión de Claude Code dedicada que lo arma con el equipo (Arquitecto, Programador, Tester) y deja en la bóveda el plan y el enlace a la sesión.
---

# Nuevo proyecto o app

El encargo viene en `data.prompt` (por ejemplo, "ármame una app de recetas con IA").

## 1. Plan (aquí mismo)
Invoca al subagente **brainer-arquitecto** con el encargo y el Núcleo del usuario (`/engine/vault` → profile). Guarda su plan.

## 2. Abrir la sesión de trabajo
Usa `mcp__Claude_Code_Remote__create_session` (cárgala con ToolSearch si hace falta) con:
- `title`: `Brainer · <nombre corto del proyecto>`
- `prompt`: el plan del Arquitecto + estas instrucciones: "Eres el Programador del equipo de Brainer. Trabaja en español, en una rama nueva. Crea el proyecto siguiendo el plan por fases. Al terminar cada fase, ejecuta el Tester (subagente brainer-tester) y corrige. Deja un README en español con cómo ejecutarlo. No hagas merge ni publiques sin permiso."
- Si el proyecto es nuevo y no hay repositorio, crea uno con `mcp__github__create_repository` (privado, nombre en minúsculas con guiones) y pásalo como `source_url`. Si el usuario nombró un repositorio existente, úsalo.
- `permission_mode`: el heredado (nunca `plan`).

Si `create_session` no está disponible en este entorno, no inventes un enlace: escribe el plan completo en la nota y explica que la sesión hay que abrirla desde Claude Code con el prompt incluido.

## 3. Informe en la bóveda
Nota de tipo `proyecto`, etiquetas `proyecto, claude, <nombre>`, con:
- `## Qué vamos a construir` (una frase)
- `## Plan` (del Arquitecto)
- `## Sesión de Claude Code` con el enlace `https://claude.ai/code/<session_id>` y el repositorio
- `## Siguiente paso` para el usuario (qué revisar, qué decidir)

Marca la petición como hecha con `reportId` = id de la nota.
