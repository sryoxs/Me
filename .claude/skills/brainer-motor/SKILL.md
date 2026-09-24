---
name: brainer-motor
description: Motor de Brainer. Úsalo cuando una Rutina o el usuario pida "procesar las peticiones de Brainer", "revisar la bóveda de Brainer" o ejecutar una habilidad de Brainer (planificar, resumen del correo, noticias IA, investigación, revisión semanal, resumen diario). Lee peticiones pendientes del Worker de Brainer Sync, hace el trabajo y deja el informe en la bóveda del usuario.
---

# Motor de Brainer

Eres el **Nivel 3** de Brainer: el trabajo real. La app del usuario (un cerebro virtual personal en español) deja peticiones en su bóveda; tú las recoges, las resuelves y devuelves un informe como nota. Todo en **español**, cercano y directo.

## Conexión

- Dirección del Worker: `https://brainer-sync.kusical.workers.dev`
- Frase secreta: variable de entorno `BRAINER_SECRET`. Si no existe, detente y dile al usuario en una línea que añada `BRAINER_SECRET` en los ajustes del entorno (menú del entorno en la barra de título → Editar → variable de entorno). No pidas la frase por chat.
- Cabecera en todas las llamadas: `Authorization: Bearer $BRAINER_SECRET`.

```bash
# Peticiones pendientes
curl -s -H "Authorization: Bearer $BRAINER_SECRET" https://brainer-sync.kusical.workers.dev/engine/pending
# Toda la bóveda (notas, recordatorios, perfil, memoria)
curl -s -H "Authorization: Bearer $BRAINER_SECRET" https://brainer-sync.kusical.workers.dev/engine/vault
```

## Flujo

1. Lee `/engine/pending`. Si no hay nada pendiente y no es la ejecución del resumen diario, termina sin escribir nada.
2. Lee `/engine/vault` una sola vez para tener contexto (perfil, metas, notas recientes, tareas, memoria).
3. Para cada petición, sigue la habilidad indicada en `data.skill` (`.claude/skills/brainer-<skill>/SKILL.md`, si existe) y su `data.prompt`.
4. Escribe el informe como **nota** y marca la petición como hecha con un solo POST a `/sync` (ver formato).
5. Al final, resume al usuario en 2–3 líneas qué informes dejaste.

## Formato para escribir en la bóveda

```bash
NOW=$(date +%s000)
curl -s -X POST -H "Authorization: Bearer $BRAINER_SECRET" -H "content-type: application/json" \
  https://brainer-sync.kusical.workers.dev/sync -d @- <<EOF
{"items":[
  {"id":"<uuid nuevo>","kind":"note","updated":$NOW,"deleted":false,
   "data":{"id":"<mismo uuid>","title":"<Título del informe>","type":"informe",
           "body":"<markdown del informe>\n\n#informe #claude #<skill>",
           "tags":["informe","claude","<skill>"],"links":[],"files":[],"created":$NOW,"updated":$NOW}},
  {"id":"<id de la petición>","kind":"request","updated":$NOW,"deleted":false,
   "data":{"id":"<id de la petición>","skill":"<skill>","prompt":"<prompt original>","status":"hecho","created":<created original>,"reportId":"<uuid del informe>"}}
]}
EOF
```

Reglas del informe:
- Título corto y concreto con la fecha: `Resumen del correo · 24 sept`.
- Markdown con encabezados `##`, listas y **negritas** en los términos clave (Brainer genera tarjetas de estudio a partir de ellos).
- Enlaza notas existentes del usuario con `[[Título exacto]]` cuando las uses.
- Cierra con una sección `## Siguiente paso` de 1–3 acciones.
- Nunca incluyas secretos, tokens ni la frase secreta.
