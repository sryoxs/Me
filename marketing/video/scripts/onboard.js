// Recorre el onboarding de la demo (17 pasos) dentro de una página ya abierta.
async function onboard(p, log = () => {}, planShot = null) {
  await p.getByText('Comenzar').first().click();
  for (let i = 0; i < 30; i++) {
    await p.waitForTimeout(900);
    const txt = await p.evaluate(() => document.body.innerText);
    log('step ' + i + ' ' + txt.slice(0, 60).replace(/\n/g, ' '));
    if (/Escanear comida/.test(txt)) return true;
    if (/Entrar a Kusi/.test(txt)) {
      if (planShot) { await p.waitForTimeout(1500); await p.addStyleTag({ content: '[class*=demoBadge]{display:none!important}' }); await p.screenshot({ path: planShot }); planShot = null; } await p.getByText('Entrar a Kusi').first().click(); continue; }
    if (/Hazlo tuyo/.test(txt)) {
      for (const t of ['Chullo', 'Poncho andino', 'Montañas andinas']) await p.getByText(t, { exact: true }).first().click().catch(() => {});
    }
    const inputs = await p.$$('input:not([type=hidden]):not([type=checkbox]):not([type=radio])');
    for (const inp of inputs) {
      const t = await inp.getAttribute('type');
      if (!(await inp.inputValue())) await inp.fill(t === 'number' ? '25' : 'Ana').catch(() => {});
    }
    if (!/Hazlo tuyo/.test(txt)) for (const o of await p.$$('button')) {
      const t = ((await o.innerText()) || '').trim(); const al = (await o.getAttribute('aria-label')) || '';
      if (t && !/Continuar|Atrás|Omitir|Saltar|^[−+]$/i.test(t + al)) { await o.click().catch(() => {}); break; }
    }
    await p.waitForTimeout(400);
    const cont = p.getByRole('button', { name: /Continuar/i }).first();
    if (await cont.count()) await cont.click({ timeout: 2000 }).catch(() => {});
  }
  return false;
}
module.exports = { onboard };
