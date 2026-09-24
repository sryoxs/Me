# Brainer 🧠

Tu cerebro virtual personal. Una app web (PWA) que funciona en tu celular, iPad y computadora, guarda tu conocimiento como una bóveda de nodos conectados, te escucha por voz, te recuerda cosas sin que se lo pidas y te ayuda a estudiar.

**Todo funciona en tu dispositivo y sin gastar créditos.** Claude solo entra cuando tú lo pides para tareas exigentes.

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

## Conectar Claude (opcional)

1. Crea una clave en <https://console.anthropic.com/>.
2. Pégala en **Ajustes → Conexión con Claude**. Se guarda solo en tu dispositivo, nunca se exporta.
3. Cuando quieras, pulsa ✨ en una nota o en un resultado de búsqueda. Eliges **Ligero** (Haiku 4.5, muy barato) o **Exigente** (Opus 5). Brainer te muestra los tokens y el costo estimado de cada día.

## Varios dispositivos (Brainer Sync)

Brainer se sincroniza solo entre tu celular, iPad y computadora usando **tu propia cuenta de Cloudflare** (plan gratuito): un Worker (`worker/`) y una base de datos D1 llamada `brainer`. Nadie más tiene acceso: hace falta una frase secreta que solo tú conoces.

### Puesta en marcha (una sola vez)

1. En Cloudflare → **My Profile → API Tokens → Create Token → plantilla "Edit Cloudflare Workers"**. Copia el token.
2. Tu **Account ID** aparece en Cloudflare → Workers & Pages (barra derecha).
3. Inventa una **frase secreta** larga (será tu llave del cerebro).
4. En GitHub → **Settings → Secrets and variables → Actions** crea tres secretos:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `BRAINER_SECRET`
5. Ejecuta el flujo **Desplegar Brainer Sync** (Actions → Run workflow, o se lanza solo al hacer merge a `main`). Al terminar verás la dirección del Worker, algo como `https://brainer-sync.<tu-cuenta>.workers.dev`.
6. En Brainer → **Ajustes → Sincronizar entre dispositivos**: pega la dirección y la frase secreta y pulsa **Conectar y sincronizar todo**. Repite en cada dispositivo.

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
sw.js                 modo sin conexión (PWA)
```

Sin dependencias ni compilación: HTML, CSS y JavaScript puro.
