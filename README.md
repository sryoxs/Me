# Me

Cloudflare Worker que usa **Gemini** como modelo de trabajo.

## Configuración

```bash
npm install
npx wrangler secret put GEMINI_API_KEY   # clave de Google AI Studio
npm run deploy
```

Para desarrollo local, crea `.dev.vars` con `GEMINI_API_KEY=...` y ejecuta `npm run dev`.

El modelo por defecto se define en `wrangler.toml` (`GEMINI_MODEL`).

## Uso

```bash
curl -X POST https://me-gemini.<tu-subdominio>.workers.dev/chat \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "Hola, ¿quién eres?", "system": "Responde en español"}'
```

Respuesta: `{ "text": "...", "model": "gemini-2.5-flash" }`. Puedes pasar `"model"` en el cuerpo para usar otro modelo de Gemini.
