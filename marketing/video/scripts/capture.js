// Captura pantallas reales de la demo (390x844 @3x) usando el estado guardado por onboard.js.
const { chromium } = require(process.env.NODE_PATH_PW);
const fs = require('fs');
const { proxied, URL } = require('./explore.js');
const OUT = process.env.OUT_DIR ? process.env.OUT_DIR.replace(/\/?$/, '/') : require('./explore.js').OUT;
const { onboard } = require('./onboard.js');
const STEPS = JSON.parse(process.argv[2] || '[]'); // [{name, click:[texts...], wait}]
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  await proxied(ctx);
  // oculta la pastilla DEMO desde el primer render (también en el onboarding)
  await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '[class*=demoBadge],[id*=demoBadge]{display:none!important}'; document.head.appendChild(st); }));
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2500);
  console.log('onboard', await onboard(p, () => {}, OUT + 'plan.png'));
  await p.waitForTimeout(1500);
  for (const s of STEPS) {
    if (s.home) {
      const ok = await p.evaluate((name) => {
        const els = [...document.querySelectorAll('a,button,[role=tab],[role=button]')].filter(e => (e.innerText || e.getAttribute('aria-label') || '').trim().split('\n')[0].trim() === name);
        if (!els.length) return false; els[els.length - 1].click(); return els.length;
      }, s.home);
      console.log('home', s.home, ok); await p.waitForTimeout(s.wait || 2000);
    }
    for (const c of s.click || []) {
      const loc = c.startsWith('css=') ? p.locator(c.slice(4)).first() : p.getByText(c, { exact: false }).first();
      await loc.click({ timeout: 4000 }).catch(async () => {
        const ok = await p.evaluate((t) => { const els = [...document.querySelectorAll('button,a,[role=button]')].filter(e => (e.innerText || '').includes(t)); if (!els.length) return 0; els[els.length - 1].click(); return els.length; }, c);
        console.log('jsclick', c, ok);
      });
      await p.waitForTimeout(s.wait || 1500);
    }
    if (s.type) { await p.locator(s.type[0]).first().fill(s.type[1]).catch(()=>console.log('no type')); await p.keyboard.press('Enter'); await p.waitForTimeout(s.after || 6000); }
    if (s.upload) { await p.locator('input[type=file]').first().setInputFiles(s.upload).catch(e=>console.log('no upload', e.message)); await p.waitForTimeout(s.after || 8000); }
    if (s.fill) { await p.locator(s.fill[0]).first().fill(s.fill[1]).catch(() => console.log('no fill')); }
    if (s.then) for (const c of s.then) { await p.getByText(c).last().click({ timeout: 4000 }).catch(() => console.log('no then', c)); await p.waitForTimeout(s.after || 8000); }
    if (s.esc) { await p.keyboard.press('Escape'); await p.waitForTimeout(800); }
    if (s.ceviche) { // reintenta el análisis simulado de la demo hasta que salga ceviche + camote + choclo
      for (let k = 0; k < 15; k++) {
        await p.getByText('Analizar con Kusi').last().click().catch(() => {}); await p.waitForTimeout(7000);
        const tx = await p.evaluate(() => document.body.innerText);
        if (/Ceviche de pescado/.test(tx) && /\nCamote/.test(tx) && /\nChoclo/.test(tx)) { console.log('ceviche ok', k); break; }
      }
      await p.getByText('Agregar a Cena').last().click().catch(() => console.log('no agregar')); await p.waitForTimeout(3000);
      await p.evaluate(() => { const b = [...document.querySelectorAll('button,a')].filter(e => (e.innerText || '').trim().split('\n')[0] === 'Diario'); b[b.length - 1].click(); });
      await p.waitForTimeout(2500);
      if (await p.getByText('¡Sigamos!').count()) { // modal real de la racha: se guarda y se cierra
        await p.waitForTimeout(1500); await p.screenshot({ path: OUT + 'racha-modal.png' });
        await p.getByText('¡Sigamos!').last().click().catch(() => {}); await p.waitForTimeout(1500);
      }
      const tx = (await p.evaluate(() => document.body.innerText)).replace(/\n+/g, '|');
      const m = tx.match(/Cena\|sugerido 560 kcal\|(\d+)\|Ceviche de pescado.*?\|(\d+)(?=\|).*?Camote.*?\|(\d+)(?=\|).*?Choclo.*?\|(\d+)(?=\|)/);
      console.log('valores', m && m.slice(1).join(','));
      if (m) s.edit = [[m[1], String(s.ceviche.total), 1], [m[2], String(s.ceviche.items[0])], [m[3], String(s.ceviche.items[1])], [m[4], String(s.ceviche.items[2])], [String(1860 - +m[1]), String(1860 - s.ceviche.total), 1]];
    }
    if (s.edit) await p.evaluate((pairs) => {
      // reemplaza textos exactos (en orden) para alinear los números con la toma real
      const nodes = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) nodes.push(w.currentNode);
      const used = new Set();
      for (const [from, to, all] of pairs) for (const n of nodes) {
        if (used.has(n) || n.nodeValue.trim() !== from) continue;
        n.nodeValue = n.nodeValue.replace(from, to); used.add(n); if (!all) break;
      }
    }, s.edit);
    if (s.scroll) { await p.mouse.wheel(0, s.scroll); await p.waitForTimeout(800); }
    if (s.into) { await p.getByText(s.into).first().evaluate(e => e.scrollIntoView({ block: 'start' })).catch(() => console.log('no into')); await p.mouse.wheel(0, s.dy || 0); await p.waitForTimeout(900); }
    await p.addStyleTag({ content: '[class*=demoBadge],[id*=demoBadge],[class*=demo-badge]{display:none!important}' }).catch(() => {});
    if (s.debugDemo) console.log(await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.textContent.trim() === 'DEMO').map(e => e.tagName + '#' + e.id + '.' + e.className).join(' | ')));
    if (s.top) { await p.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll('*').forEach(e => { if (e.scrollTop) e.scrollTop = 0; }); }); await p.waitForTimeout(700); }
    await p.screenshot({ path: OUT + s.name + '.png' });
    console.log('== ' + s.name + ' ' + p.url());
    console.log((await p.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(0, 700));
    console.log('BTNS', await p.evaluate(() => [...document.querySelectorAll('a,button,[role=tab]')].map(e => ((e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\n/g,' '))).filter(Boolean).join(' ; ')));
  }
  await b.close();
})();
