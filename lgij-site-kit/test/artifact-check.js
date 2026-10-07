const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [name, vp] of [['desk', { width: 1280, height: 860 }], ['phone', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errs.push(name + ' ' + e.message));
    await p.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + fs.readFileSync('/home/claude/proto/party-builder.html', 'utf8') + '</body></html>';
    await p.setContent(html); await p.waitForTimeout(600);
    await p.locator('lgij-party-builder').locator('[data-ctl="demo"]').click(); await p.waitForTimeout(calmWait = 11000);
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
    await p.screenshot({ path: `test/shots/artifact-${name}.png` });
    console.log(name, 'step title:', await p.locator('lgij-party-builder').locator('#stepTitle').getAttribute('aria-label'), 'overflow:', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  }
  console.log('errors:', errs.length ? errs : 'none'); await b.close();
})();
