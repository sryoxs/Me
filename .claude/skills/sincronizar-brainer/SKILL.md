---
name: sincronizar-brainer
description: El sentido que une este vault con Brainer, la app del teléfono. Trae a 00-INBOX las capturas y peticiones que Smith dictó en Brainer, y lleva a Brainer las notas, informes y tarjetas que produce el vault. Úsala cuando Smith diga «sincroniza Brainer», «trae lo del teléfono», «procesa mis peticiones» o «manda esto a Brainer», y al principio de procesar-inbox, examinar y parte-del-dia.
---

# Sincronizar con Brainer

## Conexión
- Worker: `https://brainer-sync.kusical.workers.dev`
- Frase secreta en la variable de entorno `BRAINER_SECRET`. Si no existe, para y dile a Smith en una línea que la añada al entorno de Claude Code (menú del entorno en la barra de título → Editar → variable de entorno). Nunca la pidas por chat ni la escribas en archivos.
- Cabecera en todas las llamadas: `Authorization: Bearer $BRAINER_SECRET`.

```bash
# Todo lo que hay en Brainer (notas, recordatorios, perfil, memoria)
curl -s -H "Authorization: Bearer $BRAINER_SECRET" https://brainer-sync.kusical.workers.dev/engine/vault
# Peticiones pendientes (botones de habilidades pulsados en la app)
curl -s -H "Authorization: Bearer $BRAINER_SECRET" https://brainer-sync.kusical.workers.dev/engine/pending
```

## Traer (Brainer → vault)
1. Lee `/engine/vault`. Guarda en `.claude/brainer-sync.json` el `now` de la última sincronización para no repetir.
2. Cada nota de Brainer con `updated` posterior a la última sincronización y que no venga del vault (sin etiqueta `vault`) se escribe en `00-INBOX/brainer-<id-corto>.md` con frontmatter `fuente: brainer`, `brainer_id`, `tipo` (captura, tarea, idea…), `etiquetas`, y el cuerpo tal cual. No se afila aquí: eso lo hace `procesar-inbox`.
3. Cada petición pendiente de `/engine/pending` se ejecuta con su habilidad (`data.skill` → `procesar-inbox`, `conexiones-semana`, `brief`, `escribir`, `examinar`, `proyecto`, `parte-del-dia`) y su `data.prompt`. Al terminar se marca `hecho` (ver formato).

## Llevar (vault → Brainer)
Un solo `POST /sync` con los items. Cada nota que sube lleva etiqueta `vault` y, si es un informe del vault, `claude`.

```bash
NOW=$(date +%s000)
curl -s -X POST -H "Authorization: Bearer $BRAINER_SECRET" -H "content-type: application/json" \
  https://brainer-sync.kusical.workers.dev/sync -d @- <<EOF
{"items":[
  {"id":"<uuid>","kind":"note","updated":$NOW,"deleted":false,
   "data":{"id":"<uuid>","title":"<Título>","type":"informe","body":"<markdown>","tags":["vault","claude","<habilidad>"],"links":[],"files":[],"created":$NOW,"updated":$NOW}},
  {"id":"<uuid>","kind":"card","updated":$NOW,"deleted":false,
   "data":{"id":"<uuid>","q":"<pregunta>","a":"<respuesta>","noteId":null,"due":$NOW,"interval":0,"ease":2.5,"reps":0,"created":$NOW}},
  {"id":"<id de la petición>","kind":"request","updated":$NOW,"deleted":false,
   "data":{"id":"<id>","skill":"<skill>","prompt":"<prompt original>","status":"hecho","created":<created original>,"reportId":"<uuid del informe>"}}
]}
EOF
```

## Reglas
- Nunca borres nada en Brainer. Solo añades y marcas peticiones como hechas.
- Los informes para Brainer: título corto con fecha, markdown con `##`, negritas en términos clave, `[[Título]]` para notas del vault, y una sección final `## Siguiente paso`.
- Nada de secretos en los cuerpos.
