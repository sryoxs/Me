# BRAINER · tu propio JARVIS

Un agente personal de cinco capas construido sobre este repositorio, siguiendo la guía *«Tu propio JARVIS»* de tododeia, más una ventana propia: **Brainer**, la app que lo ve, lo escucha y le habla desde el teléfono, el iPad o la computadora.

- El **vault** son archivos markdown en este repo, organizados **por tipo de nota, no por tema**.
- El **motor** es Claude Code con tu suscripción, abierto **dentro de esta carpeta**. Sin claves de API.
- La **ventana** es Brainer (`app/`), publicada en tu Cloudflare: https://brainer.kusical.workers.dev
- Los **sentidos** propios de Brainer (oído, voz humana, conversación) corren en tu Cloudflare (`worker/`).

## Las cinco capas, dónde viven

| Capa | Qué es | Dónde |
|---|---|---|
| 1 · Memoria | Quién es Smith, cómo suena, qué nunca se toca. < 200 líneas | `CLAUDE.md` (raíz), `.claude/rules/` |
| 2 · Habilidades | 8 procedimientos con nombre; la descripción es el disparador | `.claude/skills/*/SKILL.md` |
| 3 · Equipo | 5 subagentes fijos con memoria propia y herramientas recortadas | `.claude/agents/`, `.claude/agent-memory/` |
| 4 · Sentidos | Gmail, Calendar (conectores) y Brainer Sync (la app) | conectores de claude.ai · `worker/` |
| 5 · Latido | Rutinas que despiertan solas. **Encendido**: «Brainer · motor» pasa cada hora y reparte por esfuerzo (`brainer-motor`) | Rutinas de Claude Code |
| Reflejos | Hooks: parte de arranque, candado, respaldo, índice | `.claude/hooks/`, `.claude/settings.json` |

## El árbol

```
Me/
├── CLAUDE.md                 la memoria, en la raíz
├── PRIMERA-SEMANA.md         lo que haces a mano esta semana
├── INDICE.md                 lo genera el reflejo de índice
├── .claude/                  skills · agents · rules · hooks · settings.json · agent-memory
├── 00-INBOX/                 todo cae aquí primero (también lo dictado en Brainer)
├── 01-CAPTURES/              observations · reactions · patterns · questions · numbers
├── 02-CONNECTIONS/           lo que salió de cruzar notas
├── 03-BRIEFS/                la cola de producción (y los borradores)
├── 04-PUBLISHED/             lo publicado con sus números; el texto no se edita (hook)
├── 05-MATERIAL/              apuntes y PDFs de estudio; 05-MATERIAL/voz/ para tu huella de voz
├── 06-PROYECTOS/             un proyecto por carpeta: plan y decisiones; el código en su repo
├── app/                      Brainer, la ventana (PWA)
└── worker/                   Brainer Sync: D1 + Workers AI (oído, voz, conversación)
```

## Habilidades

| Cuando dices | Habilidad | Quién la corre |
|---|---|---|
| «procesa mi inbox» | `procesar-inbox` | archivista (haiku) |
| «sesión de conexiones», «conexiones del día» | `conexiones-semana` | tejedor (opus) |
| «haz un brief de esto» | `brief` | la conversación |
| «escribe este brief» | `escribir` | escriba |
| «examíname de…», «resume el tema…» | `examinar` | examinador |
| «ármame una app», «arranca el proyecto…» | `proyecto` | programador |
| «qué tengo hoy», «resumen del correo» | `parte-del-dia` | la conversación, con Gmail y Calendar |
| «sincroniza Brainer», «procesa mis peticiones» | `sincronizar-brainer` | la conversación |
| «pasa la ronda», «haz mi trabajo pendiente» | `brainer-motor` | la rutina de cada hora, repartiendo por esfuerzo |

## Reglas duras (con candado)

1. Nunca gastar dinero ni crear recursos sin el «sí» escrito de Smith.
2. Nunca tocar la rama principal: todo en ramas `claude/…`. El hook `candado.sh` bloquea `git push` a main y commits en main.
3. Nunca secretos en notas ni commits. Nunca editar el texto de `04-PUBLISHED/` (bloqueado).

## Brainer, la ventana

Abre https://brainer.kusical.workers.dev en Safari o Chrome (no dentro de otra app), pega tu frase secreta una vez y ya:

- **Conversación continua**: un toque al micrófono y hablas seguido, como una llamada. Si hablas encima, Brainer se calla y te escucha. «Adiós» la cierra.
- **Lección guiada**: «voy a estudiar elipses» arma videos de YouTube, ideas clave, fórmulas (KaTeX), un ejercicio resuelto paso a paso, la gráfica dibujada en la app y las fuentes (Wikipedia y web). Se guarda como nota y sus preguntas como tarjetas.
- **Equipo en la nube**: «ármame una app…», «investiga a fondo…» viajan a la bóveda con un esfuerzo (bajo, medio, alto). El motor pasa cada hora. Al volver: «¿está listo mi trabajo?» y Brainer lee el informe.
- Te oye (Whisper), te habla (Aura-2, voz Carina), conversa con un modelo en tu Cloudflare con tus notas como contexto y sincroniza tu bóveda entre dispositivos.

```bash
# Publicar la ventana (desde la raíz) y el worker
npx wrangler deploy
cd worker && npx wrangler deploy
```

## Cómo se usa

1. Abre Claude Code dentro de esta carpeta: `cd Me && claude`.
2. Sigue `PRIMERA-SEMANA.md`. Empieza por llenar los `[HUECO]` del `CLAUDE.md`.
3. Veinte minutos al día, treinta el domingo. Cuando salga bien a mano, se enciende el latido.
