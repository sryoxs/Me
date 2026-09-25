// Worker de Cloudflare que usa Gemini como modelo de trabajo.
// POST /chat  { "prompt": "...", "system": "...", "model": "..." }  ->  { "text": "...", "model": "..." }

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (url.pathname === "/") return json({ ok: true, model: env.GEMINI_MODEL });
    if (url.pathname !== "/chat" || request.method !== "POST") {
      return json({ error: "Usa POST /chat" }, 404);
    }
    if (!env.GEMINI_API_KEY) return json({ error: "Falta el secreto GEMINI_API_KEY" }, 500);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Cuerpo JSON inválido" }, 400);
    }
    if (!body.prompt) return json({ error: "Falta 'prompt'" }, 400);

    const model = body.model || env.GEMINI_MODEL;
    const payload = { contents: [{ role: "user", parts: [{ text: body.prompt }] }] };
    if (body.system) payload.systemInstruction = { parts: [{ text: body.system }] };

    const res = await fetch(`${GEMINI_API}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data.error?.message || "Error de Gemini" }, res.status);

    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    return json({ text, model });
  },
};
