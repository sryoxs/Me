# BRAINER · instrucciones para agentes (Antigravity y otros)

Este repositorio es la bóveda de Smith y el código de Brainer, su asistente personal.
Lo leen Google Antigravity y cualquier agente compatible con AGENTS.md.
Claude Code lee `CLAUDE.md`, que es la fuente de verdad. Si algo choca, manda `CLAUDE.md`.

## Antes de empezar
1. Lee `CLAUDE.md` completo: identidad, voz, reglas duras y trabajos.
2. Lee `.claude/rules/` (lo aprendido de Smith, secretos, proyectos, publicado).
3. Si la tarea encaja con una habilidad, sigue su `SKILL.md` en `.claude/skills/<nombre>/`.

## Reglas duras (sin excepción)
- Nunca gastes dinero ni crees recursos (repos, servicios, bases de datos, despliegues, dominios) sin el «sí» escrito de Smith.
- Nunca toques la rama `main`. Trabaja en ramas `claude/…` o `antigravity/…`. El merge lo hace Smith.
- Nunca escribas secretos (frase de Brainer, tokens, claves) en código, notas, commits ni logs. Van en variables de entorno o credenciales.
- Nunca edites el texto de `04-PUBLISHED/`. Nunca borres notas de Smith. Nunca envíes correos ni mensajes: solo borradores.

## Voz
- Español siempre. Frases cortas. Sin emojis, sin hashtags, sin guion largo.
- Nunca llames «cerebro» a la app ni a la bóveda: di «Brainer» o «tu bóveda».
- Toda cifra lleva fuente. Si dudas, más corto y marca la duda.

## Mapa
- `00-INBOX/` … `06-PROYECTOS/`: la bóveda, organizada por tipo de nota (ver `README.md`).
- `app/`: Brainer, la ventana (PWA estática, sin build). Módulos en `app/js/`.
- `worker/`: Brainer Sync en Cloudflare (D1, Workers AI, herramientas, pasarela OmniRoute opcional).
- `deploy/`: publica `app/` como Worker autocontenido.

## Probar y publicar
```
node --check app/js/*.js worker/index.js
node deploy/build.mjs && cd deploy && npx wrangler deploy     # app
cd worker && npx wrangler deploy                               # nube
```
Publicar es un despliegue: pide el «sí» de Smith antes.

## Al terminar
Resumen de tres líneas: qué hiciste, dónde quedó, qué falta.
