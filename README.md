# Brainer 🧠

Tu cerebro virtual personal. Una app web (PWA) que funciona en tu celular, iPad y computadora, guarda tu conocimiento como una bóveda de nodos conectados, te escucha por voz, te recuerda cosas sin que se lo pidas y te ayuda a estudiar.

**Todo funciona en tu dispositivo y sin gastar créditos.** El trabajo pesado lo hace Claude Code desde este repositorio y deja el informe en tu bóveda.

## Las 5 piezas, un solo sistema

| Pieza | Qué hace | Dónde está |
|---|---|---|
| **Motor** — Claude Code | El trabajo real. Recoge tus peticiones cada hora, ejecuta la habilidad y deja el informe en la bóveda. Cada noche escribe el resumen del día. | `.claude/skills/brainer-*/SKILL.md`, Rutinas de Claude Code |
| **Memoria** — la Bóveda | Notas markdown con `[[enlaces]]`, `#etiquetas`, backlinks y vista previa. El grafo las muestra como una red neuronal que se activa al buscar. | `js/store.js`, `js/graph.js`, D1 `brainer` en Cloudflare |
| **Oídos + boca** — Whisper local | Reconocimiento de voz con una red neuronal **en tu dispositivo** (el audio no sale). Respuesta con la voz del sistema. | `js/local-ai.js`, `js/voice.js` |
| **Clasificador** — Neuro | Decide el nivel de cada petición: **1** reglas y datos guardados (instantáneo) · **2** redes neuronales locales (búsqueda semántica) · **3** Claude Code. Te dice qué eligió y por qué. | `js/neuro.js` |
| **Cara** — Cabina + HUD | El orbe con estados (escuchando, pensando, hablando), medidor de peticiones, botones de habilidades, agenda, tareas e informes. `Ctrl+Alt+J` desde cualquier vista. | `js/hud.js`, `index.html` |

### Habilidades (botones de la Cabina)

`skills/skills.json` define los botones; cada uno de Nivel 3 apunta a un `SKILL.md` real en `.claude/skills/`:

- 🗓️ **Planificar hoy** y 📚 **Repaso** — instantáneos, en tu dispositivo.
- 📬 **Resumen del correo** — Claude Code lee tu Gmail (conector) y prioriza.
- 🤖 **Noticias IA** — lo relevante de hoy en 5 puntos.
- 🔬 **Investigación profunda** — informe con fuentes y preguntas de repaso.
- 📈 **Revisión semanal** — tu semana puntuada.
- 🌙 **Resumen diario** — cada noche, automático.

### Cómo llega el trabajo a Claude Code

1. Pulsas un botón (o Neuro decide Nivel 3). Brainer guarda una **petición** en la bóveda y la sincroniza.
2. La Rutina **Brainer · motor** arranca cada hora, consulta `/engine/pending` en el Worker, ejecuta la habilidad y escribe el informe con un `POST /sync`.
3. Tu app lo recibe en la siguiente sincronización: aparece en la Cabina y en la Bóveda, y genera tarjetas de estudio de las **negritas** y `Término: definición`.

Requisito: la variable de entorno `BRAINER_SECRET` (tu frase secreta) en el entorno de Claude Code (menú del entorno en la barra de título → Editar → variable de entorno).

## Qué hace

| Vista | Qué encuentras |
|---|---|
| **Brainer** | Conversación por texto o voz. “Búscame el informe de física”, “recuérdame estudiar mañana a las 7”, “crea nota sobre…”. Te da un resumen de tu día y te pregunta por tus estudios. |
| **Bóveda** | Tus notas, informes, tareas e ideas. Importa `.txt`, `.md`, `.pdf` e imágenes. Enlaza notas con `[[Título]]` y agrupa con `#etiquetas`. |
| **Cerebro** | Grafo interactivo de todo lo que sabes: notas conectadas por enlaces y etiquetas. Toca un nodo para abrirlo. |
| **Estudio** | Tarjetas de repaso generadas automáticamente desde tus notas (gratis) con repetición espaciada. |
| **Recordatorios** | Los que creas y los que Brainer te propone al detectar fechas en tus tareas e informes. |
| **Portafolio** | Tu perfil, metas y proyectos (`#proyecto`). |
| **Ajustes** | Clave de Claude (opcional), nivel de IA, comportamiento proactivo, respaldo. |

## Cómo usarlo

### En línea (recomendado)
1. En GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Haz merge de esta rama a `main`. El flujo `Publicar Brainer en GitHub Pages` la publica en `https://<tu-usuario>.github.io/Me/`.
3. Ábrela en tu celular/iPad y usa **Compartir → Añadir a pantalla de inicio** para instalarla como app.

### En local
```bash
python3 -m http.server 8080
# abre http://localhost:8080
```
(Necesita servirse por HTTP; abrir el `index.html` directo no carga los módulos.)

## Redes neuronales en tu dispositivo

En **Ajustes → Redes neuronales en tu dispositivo** puedes activar:

- **Whisper local** (`onnx-community/whisper-base`, ≈80 MB): transcribe tu voz en el navegador con WebGPU o WASM. Graba hasta que dejas de hablar. Si está apagado, Brainer usa el reconocimiento del sistema.
- **Búsqueda semántica** (`paraphrase-multilingual-MiniLM-L12-v2`, ≈120 MB): calcula un vector por nota y encuentra por significado ("el informe donde hablaba de calor" → *Termodinámica*). Neuro usa el Nivel 2 cuando está lista.

Los modelos se descargan una vez y quedan en la caché del navegador. Funcionan mejor en computadora o iPad.

## API directa de Claude (opcional, avanzado)

Si algún día tienes una clave de <https://console.anthropic.com/>, puedes ponerla en **Ajustes → Conexión directa**. No hace falta: sin clave, todo el Nivel 3 lo hace Claude Code.

## Varios dispositivos (Brainer Sync)

Brainer se sincroniza solo entre tu celular, iPad y computadora usando **tu propia cuenta de Cloudflare** (plan gratuito): un Worker (`worker/`) y una base de datos D1 llamada `brainer`. Nadie más tiene acceso: hace falta una frase secreta que solo tú conoces.

### Ya desplegado

El Worker está publicado en **`https://brainer-sync.kusical.workers.dev`** con su frase secreta configurada.

En Brainer → **Ajustes → Sincronizar entre dispositivos**: pega esa dirección y tu frase secreta y pulsa **Conectar y sincronizar todo**. Repite en cada dispositivo.

### Volver a desplegar el Worker (si cambias `worker/`)

Opción A, desde tu computadora:
```bash
cd worker
npx wrangler login
npx wrangler deploy
npx wrangler secret put BRAINER_SECRET   # solo si quieres cambiar la frase
```

Opción B, desde GitHub: crea los secretos `CLOUDFLARE_API_TOKEN` (plantilla "Edit Cloudflare Workers"), `CLOUDFLARE_ACCOUNT_ID` y `BRAINER_SECRET` en *Settings → Secrets and variables → Actions* y lanza el flujo **Desplegar Brainer Sync** desde la pestaña Actions.

A partir de ahí se sincroniza al abrir la app, al volver a ella y cada minuto. Si dos dispositivos cambian lo mismo, gana el cambio más reciente. Los archivos adjuntos se quedan en el dispositivo donde los importaste (el texto extraído sí viaja); para llevarlos usa **Exportar/Importar cerebro**.

## Estructura

```
index.html            interfaz
css/brainer.css       estilos (oscuro, móvil primero)
js/app.js             lógica de la interfaz
js/store.js           base de datos local (IndexedDB) y respaldo
js/search.js          búsqueda sin acentos + interpretación de órdenes en español
js/graph.js           grafo de fuerzas en canvas
js/voice.js           reconocimiento y síntesis de voz
js/ai.js              conexión con Claude y contador de créditos
js/study.js           tarjetas y repetición espaciada
js/reminders.js       recordatorios, sugerencias proactivas y resumen del día
js/neuro.js           clasificador de niveles (1 reglas · 2 red local · 3 Claude Code)
js/hud.js             el orbe: red neuronal animada con estados
js/local-ai.js        Whisper y embeddings en el dispositivo (transformers.js)
js/sync.js            sincronización con el Worker (Cloudflare D1)
skills/skills.json    botones de la Cabina
.claude/skills/       habilidades que ejecuta Claude Code (SKILL.md en español)
worker/               Brainer Sync: Worker + D1, endpoints /sync y /engine/*
sw.js                 modo sin conexión (PWA)
```

Sin dependencias ni compilación: HTML, CSS y JavaScript puro.
