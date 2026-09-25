// Exploración de la demo: entra con "Comenzar" y lista navegación disponible.
const { chromium } = require(process.env.NODE_PATH_PW);
const fs = require('fs');
const URL = 'https://kusical-demo.kusical.workers.dev/?demo=1';
const OUT = __dirname + '/../capturas/';
async function proxied(ctx) {
  await ctx.route('**/*', async (route) => {
    const r = route.request();
    try {
      const res = await fetch(r.url(), { method: r.method(), headers: r.headers(), body: r.postDataBuffer() || undefined });
      const body = Buffer.from(await res.arrayBuffer());
      const headers = {}; res.headers.forEach((v, k) => { if (!['content-encoding','content-length','transfer-encoding'].includes(k)) headers[k] = v; });
      await route.fulfill({ status: res.status, headers, body });
    } catch (e) { await route.abort(); }
  });
}
module.exports = { proxied, URL, OUT };
if (require.main === module) (async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await proxied(ctx);
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(3000);
  await p.getByText('Comenzar').first().click().catch(e => console.log('no comenzar', e.message));
  await p.waitForTimeout(3000);
  console.log('URL', p.url());
  console.log(await p.evaluate(() => document.body.innerText));
  console.log(await p.evaluate(() => [...document.querySelectorAll('a,button,[role=tab]')].map(e => (e.tagName+':'+(e.innerText||e.getAttribute('aria-label')||'').trim()+':'+(e.getAttribute('href')||''))).join('\n')));
  await p.screenshot({ path: OUT + 'explore1.png' });
  await b.close();
})();
