const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  const ext = path.extname(p); res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' }[ext] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
const results = []; const errors = [];
const log = (k, v) => { results.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`); };
(async () => {
  await new Promise(r => server.listen(8765, r));
  const browser = await chromium.launch();
  const BASE = 'http://localhost:8765/test/';

  async function newPage(name, viewport, opts = {}) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: opts.dpr || 1, reducedMotion: opts.reduce ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.googleapis|ERR_|Failed to load resource/.test(m.text())) errors.push(`[${name}] ${m.text()}`); });
    page.on('pageerror', e => errors.push(`[${name}] pageerror ${e.message}`));
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    return { ctx, page };
  }
  const sh = (page, file, el) => (el ? page.locator(el).screenshot({ path: `test/shots/${file}.png` }) : page.screenshot({ path: `test/shots/${file}.png` }));
  const inShadow = (page, sel) => page.locator('lgij-party-builder').locator(sel);

  /* ---------- 1. demo mode, desktop, full flow ---------- */
  {
    const { ctx, page } = await newPage('desk', { width: 1280, height: 860 });
    await page.goto(BASE + 'host-demo.html'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500);
    log('ready attr', await page.$eval('lgij-party-builder', e => e.hasAttribute('data-ready')));
    log('fallback hidden', await page.$eval('.lgij-fallback', e => e.getBoundingClientRect().height === 0));
    await page.evaluate(() => document.getElementById('book').scrollIntoView());
    await page.waitForTimeout(300);
    await sh(page, 'd1-empty');
    await inShadow(page, '.unit[data-slug="rainbow"]').click(); await page.waitForTimeout(2300);
    await inShadow(page, '.unit[data-slug="unicorn"]').click(); await page.waitForTimeout(2300);
    await sh(page, 'd2-two');
    log('yard count', await inShadow(page, '[data-el="yard"] [data-slug]').count());
    log('sign', await inShadow(page, '[data-el="signTotal"]').textContent());
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(900);
    const sat = await inShadow(page, '.day.open').evaluateAll(els => { const s = els.find(e => /Saturday/.test(e.getAttribute('aria-label'))); return (s || els[0]).dataset.n; });
    const taken = inShadow(page, '.day.taken').first();
    if (await taken.count()) { await taken.click(); await page.waitForTimeout(250); log('taken note', await inShadow(page, '[data-el="calNote"]').textContent()); }
    await inShadow(page, `.day.open[data-n="${sat}"]`).click(); await page.waitForTimeout(1100);
    await sh(page, 'd3-calendar');
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(800);
    await inShadow(page, '[data-el="range"]').evaluate(el => { el.value = 8; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await inShadow(page, '[data-el="lenPlus"]').click(); await page.waitForTimeout(800);
    log('time range', await inShadow(page, '[data-el="tRange"]').textContent());
    log('mini', await inShadow(page, '[data-el="mini"]').textContent());
    await sh(page, 'd4-time');
    // palette + calm via page-level attributes
    await page.click('#pal'); await page.waitForTimeout(300);
    log('bunting fill after palette', await inShadow(page, '[data-el="bunt"] path').first().getAttribute('fill'));
    await page.click('#pal'); await page.click('#pal'); await page.click('#pal'); await page.click('#pal'); // back to rainbow
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(800);
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(700); // trigger validation
    log('errors shown', await inShadow(page, '.field.bad').count());
    await sh(page, 'd5-errors');
    const fills = { street: '123 Example Lane', city: 'Suffolk', zip: '23434', firstName: 'Jordan', lastName: 'Example', phone: '757-555-0100', email: 'jordan@example.com', guestCount: '12', childName: 'Maya' };
    for (const [k, v] of Object.entries(fills)) await inShadow(page, '#f_' + k).fill(v);
    await inShadow(page, '#f_eventType').selectOption('Birthday Party');
    await inShadow(page, 'label[for="f_policies"]').click(); await inShadow(page, 'label[for="f_sms"]').click();
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(1300);
    log('board total', await inShadow(page, '[data-el="boardAmt"]').textContent());
    await sh(page, 'd6-review');
    await inShadow(page, '.tag input[value="fee"]').check({ force: true });
    await inShadow(page, '[data-el="holdBtn"]').click(); await page.waitForTimeout(2600);
    await sh(page, 'd7-held');
    log('countdown', await inShadow(page, '[data-el="countdown"]').textContent());
    log('sign after hold', await inShadow(page, '[data-el="signTotal"]').textContent());
    // reload restores the hold from session storage
    await page.reload(); await page.waitForTimeout(800);
    log('hold restored after reload', await inShadow(page, '[data-el="countdown"]').count());
    await inShadow(page, '[data-el="startOver"]').click(); await page.waitForTimeout(600);
    // Book This One from outside the component
    await page.click('#pick'); await page.waitForTimeout(1200);
    log('preselect via event', await inShadow(page, '.unit.on').evaluateAll(e => e.map(x => x.dataset.slug)));
    // organization form
    await inShadow(page, '[data-el="orgLink"]').click(); await page.waitForTimeout(400);
    await inShadow(page, '[data-el="orgSubmit"]').click(); await page.waitForTimeout(400);
    log('org errors', await inShadow(page, '.field.bad').count());
    await sh(page, 'd8-org');
    // hostile CSS check: inner heading font + color
    log('h2 inside', await inShadow(page, '#stepTitle').evaluate(e => { const s = getComputedStyle(e); return [s.fontFamily.split(',')[0], s.color, s.fontSize]; }));
    log('page overflow', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
    await ctx.close();
  }

  /* ---------- 2. phone ---------- */
  {
    const { ctx, page } = await newPage('phone', { width: 390, height: 844 }, { dpr: 2 });
    await page.goto(BASE + 'host-demo.html'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
    await page.evaluate(() => document.getElementById('book').scrollIntoView()); await page.waitForTimeout(200);
    await inShadow(page, '.unit[data-slug="toddler-slide"]').click(); await page.waitForTimeout(2300);
    await sh(page, 'p1-pick');
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(900);
    await sh(page, 'p2-calendar');
    const first = await inShadow(page, '.day.open').first().getAttribute('data-n');
    await inShadow(page, `.day.open[data-n="${first}"]`).click(); await page.waitForTimeout(900);
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(900);
    await sh(page, 'p3-time');
    log('phone overflow', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
    log('stage sticky top (phone)', await inShadow(page, '.stage-wrap').evaluate(e => getComputedStyle(e).position + ' ' + getComputedStyle(e).top));
    await ctx.close();
  }

  /* ---------- 3. reduced motion ---------- */
  {
    const { ctx, page } = await newPage('calm', { width: 1280, height: 860 }, { reduce: true });
    await page.goto(BASE + 'host-demo.html'); await page.waitForTimeout(400);
    await page.evaluate(() => document.getElementById('book').scrollIntoView());
    await inShadow(page, '.unit[data-slug="rainbow"]').click(); await page.waitForTimeout(200);
    log('calm: bouncer present immediately', await inShadow(page, '[data-el="yard"] [data-slug="rainbow"]').count());
    log('calm: running animations', await inShadow(page, '.lgij').evaluate(el => el.getRootNode().getAnimations ? el.getRootNode().getAnimations().filter(a => a.playState === 'running').length : 'n/a'));
    await sh(page, 'c1-calm');
    await ctx.close();
  }

  /* ---------- 4. live API mode with mocked server ---------- */
  {
    const { ctx, page } = await newPage('api', { width: 1280, height: 860 });
    const calls = [];
    let bookingMode = 'taken';
    await page.route('**/api/party/**', async route => {
      const req = route.request(); const url = new URL(req.url()); calls.push(req.method() + ' ' + url.pathname + url.search);
      if (url.pathname.endsWith('/availability')) {
        const month = url.searchParams.get('month'); const [y, m] = month.split('-').map(Number); const days = new Date(y, m, 0).getDate();
        const open = []; for (let d = 1; d <= days; d++) if (d % 3 !== 0) open.push(`${month}-${String(d).padStart(2, '0')}`);
        return route.fulfill({ json: { open, earliest: `${month}-01` } });
      }
      if (url.pathname.endsWith('/booking')) {
        const body = JSON.parse(req.postData()); log('booking payload keys', Object.keys(body));
        log('booking payload sample', { units: body.units, date: body.date, startTime: body.startTime, hours: body.hours, payment: body.payment, who: body.whoIsThisFor, sms: body.smsConsent });
        if (bookingMode === 'taken') { bookingMode = 'ok'; return route.fulfill({ status: 409, json: { ok: false, reason: 'date_taken' } }); }
        return route.fulfill({ json: { ok: true, payUrl: 'https://example.com/pay/abc', holdExpiresAt: new Date(Date.now() + 30 * 60000).toISOString() } });
      }
      if (url.pathname.endsWith('/request')) { log('request payload', JSON.parse(req.postData()).requestType); return route.fulfill({ json: { ok: true } }); }
      route.fulfill({ status: 404, json: {} });
    });
    await page.goto(BASE + 'host-api.html'); await page.waitForTimeout(500);
    await page.evaluate(() => document.getElementById('book').scrollIntoView());
    await inShadow(page, '.unit[data-slug="rainbow"]').click(); await page.waitForTimeout(400);
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(900);
    // go to next month so the mock opens predictable dates
    await inShadow(page, '[data-el="nextM"]').click(); await page.waitForTimeout(700);
    log('api open/taken counts', [await inShadow(page, '.day.open').count(), await inShadow(page, '.day.taken').count()]);
    const n = await inShadow(page, '.day.open').first().getAttribute('data-n');
    await inShadow(page, `.day.open[data-n="${n}"]`).click(); await page.waitForTimeout(500);
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(500);
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(500);
    const fills = { street: '1 Test St', city: 'Suffolk', zip: '23434', firstName: 'Ana', lastName: 'Lee', phone: '7575550111', email: 'ana@example.com' };
    for (const [k, v] of Object.entries(fills)) await inShadow(page, '#f_' + k).fill(v);
    await inShadow(page, 'label[for="f_policies"]').click();
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(900);
    await inShadow(page, '[data-el="holdBtn"]').click(); await page.waitForTimeout(1800);
    log('after date_taken: step title', await inShadow(page, '#stepTitle').getAttribute('aria-label'));
    const n2 = await inShadow(page, '.day.open').first().getAttribute('data-n');
    await inShadow(page, `.day.open[data-n="${n2}"]`).click(); await page.waitForTimeout(400);
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(400);
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(400);
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(900);
    await inShadow(page, '[data-el="holdBtn"]').click(); await page.waitForTimeout(2200);
    log('pay link', await inShadow(page, 'a[data-el="payNow"]').getAttribute('href'));
    await inShadow(page, '[data-el="startOver"]').click(); await page.waitForTimeout(400);
    await inShadow(page, '[data-el="orgLink"]').click(); await page.waitForTimeout(300);
    for (const [k, v] of Object.entries({ organizationName: 'Suffolk Daycare', firstName: 'Bo', lastName: 'Ray', phone: '7575550122', email: 'bo@example.com', eventDate: '2026-12-05' })) await inShadow(page, '#o_' + k).fill(v);
    await inShadow(page, '[data-el="orgSubmit"]').click(); await page.waitForTimeout(800);
    log('org thanks', await inShadow(page, '.thanks').count());
    log('api calls', calls);
    await ctx.close();
  }

  /* ---------- 5. API down ---------- */
  {
    const { ctx, page } = await newPage('down', { width: 1280, height: 860 });
    await page.route('**/api/party/**', r => r.fulfill({ status: 500, body: 'oops' }));
    await page.goto(BASE + 'host-api.html'); await page.waitForTimeout(400);
    await inShadow(page, '.unit[data-slug="unicorn"]').click(); await page.waitForTimeout(300);
    await inShadow(page, '[data-el="next"]').click(); await page.waitForTimeout(900);
    log('availability down note', await inShadow(page, '[data-el="calNote"]').textContent());
    await ctx.close();
  }

  await browser.close(); server.close();
  console.log(results.join('\n'));
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
})();
