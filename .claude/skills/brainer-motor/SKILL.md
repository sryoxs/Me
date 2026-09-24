---
name: brainer-motor
description: La ronda del equipo en la nube. Cada hora, sin que Smith esté presente, recoge las peticiones que dejó en Brainer, las reparte a la habilidad y al subagente que tocan según el nivel de esfuerzo (bajo, medio, alto), deja el informe en su bóveda y marca la petición como hecha. La corre la rutina «Brainer · motor»; también sirve si Smith dice «pasa la ronda», «haz mi trabajo pendiente» o «procesa mis peticiones».
---

# Brainer · motor (la ronda de cada hora)

Eres el equipo que trabaja mientras Smith no está. Todo en español. Nada de secretos en notas, commits ni informes.

## 1. Conectar
Sigue la sección **Conexión** de `.claude/skills/sincronizar-brainer/SKILL.md` (Worker y `BRAINER_SECRET`). Las habilidades viven en `.claude/skills/<nombre>/SKILL.md`, sin prefijo.

## 2. Recoger
- `GET /engine/pending` → peticiones con `data.skill`, `data.prompt`, `data.effort` (`bajo` | `medio` | `alto`; si falta, `medio`) y `data.created`.
- Si no hay ninguna: termina en silencio. Ni notas ni comentarios.
- Además, con `/engine/vault`, trae a `00-INBOX/` lo dictado en Brainer y añade a `aprendido.md` los `memory.facts` nuevos (sección **Traer** y **Aprendizaje** de sincronizar-brainer).

## 3. Repartir según esfuerzo
El esfuerzo decide cuánto se gasta. Sin esfuerzo alto no se usa el modelo grande.

| Esfuerzo | Quién y cómo | Tamaño del informe |
|---|---|---|
| `bajo` | Tú mismo, sin subagentes, con lo que ya hay en la bóveda y una sola pasada. Sin conectores salvo que la habilidad lo exija. | 10 líneas o menos |
| `medio` | La habilidad tal como está escrita, con su subagente si lo indica (archivista, escriba, examinador, programador). | 25 líneas o menos |
| `alto` | La habilidad completa y, además: tejedor para cruzar notas, verificación en dos pasadas, fuentes citadas. Es el único nivel que justifica el modelo grande. | Lo que haga falta, con índice al inicio |

Habilidades: `procesar-inbox`, `conexiones-semana`, `brief`, `escribir`, `examinar`, `proyecto`, `parte-del-dia`. Si la petición no encaja en ninguna, usa `examinar` con «resume el tema».

## 4. Entregar
- Cada petición produce **una nota informe** en Brainer (sección **Llevar** de sincronizar-brainer): título corto con fecha, tipo `informe`, etiquetas `vault, claude, <habilidad>`, y estas secciones en este orden:
  1. `## En una frase` (lo primero que Brainer leerá en voz alta cuando Smith pregunte «¿está listo mi trabajo?»)
  2. `## Qué hice`
  3. `## Resultado`
  4. `## Siguiente paso`
- Marca la petición como `hecho` con su `reportId` en el mismo `POST /sync`.
- Si una habilidad necesita un conector apagado (Gmail, Calendar), informe corto que lo diga y petición marcada como hecha.

## 5. Límites de la ronda
- Nunca crees repositorios, servicios ni gastes dinero: si `proyecto` lo necesita, deja el plan en el informe y pide el «sí» de Smith en `## Siguiente paso`.
- Nunca toques `main`. Los commits de la ronda solo tocan `00-INBOX/`, `.claude/rules/aprendido.md` y `.claude/brainer-sync.json`, en la rama de trabajo.
- Termina con un resumen de dos o tres líneas: cuántas peticiones, qué informes quedaron, qué falta.
