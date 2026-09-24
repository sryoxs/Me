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

## Varios dispositivos

En esta versión: **Ajustes → Exportar cerebro** en un dispositivo y **Importar cerebro** en el otro. La sincronización automática (por ejemplo con Supabase) está prevista como siguiente paso.

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
