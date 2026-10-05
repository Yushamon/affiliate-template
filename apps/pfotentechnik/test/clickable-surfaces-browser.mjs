// Use an existing Playwright installation via UX_PLAYWRIGHT_MODULE; no repo dependency is required.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.UX_PLAYWRIGHT_MODULE ?? 'playwright');
const dist = path.resolve('apps/pfotentechnik/dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(dist, '.' + decodeURIComponent(url.pathname) + (url.pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(dist + '/') || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.UX_BROWSER_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const checks = [], errors = [], targets = new Set();
const routes = ['trinkbrunnen', 'smarte-futterautomaten', 'gps-tracker', 'katzenklappen', 'haustierkameras', 'automatische-katzentoiletten'];
const output = process.env.UX_SCREENSHOTS;
const verify = async (page, selector, hrefPrefix, parts) => {
  const links = page.locator(selector);
  assert.ok(await links.count() > 0, selector);
  for (const link of await links.all()) {
    assert.equal(await link.evaluate(e => e.tagName), 'A');
    const href = await link.getAttribute('href'); assert.ok(href.startsWith(hrefPrefix), href); targets.add(href);
    assert.equal(await link.locator('a,button,input,[tabindex]').count(), 0, 'One focus target, no nested interactive elements');
    assert.ok(await link.getAttribute('aria-label'), 'Meaningful accessible name');
    await link.scrollIntoViewIfNeeded();
    for (const part of parts) {
      const child = link.locator(part).first(); if (!await child.count()) continue;
      const hit = await child.evaluate(e => {
        const b = e.getBoundingClientRect(); return document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)?.closest('a')?.getAttribute('href');
      }); assert.equal(hit, href, `${part} belongs to the same link`);
    }
    const rect = await link.boundingBox(); await link.hover(); assert.deepEqual(await link.boundingBox(), rect, 'Hover causes no layout movement');
    assert.equal(await link.evaluate(e => getComputedStyle(e).cursor), 'pointer');
  }
  // Tab enters the link, shows its focus ring, and moves directly to the next surface.
  const first = links.first();
  await first.evaluate(e => {
    const before = document.createElement('button'); before.id = 'ux-tab-start'; e.before(before); before.focus();
  });
  await page.keyboard.press('Tab'); assert.equal(await first.evaluate(e => document.activeElement === e), true);
  assert.equal(await first.evaluate(e => e.matches(':focus-visible')), true);
  const outline = await first.evaluate(e => ({ style: getComputedStyle(e).outlineStyle, width: getComputedStyle(e).outlineWidth }));
  assert.notEqual(outline.style, 'none'); assert.ok(parseFloat(outline.width) >= 2);
  if (await links.count() > 1) { await page.keyboard.press('Tab'); assert.equal(await links.nth(1).evaluate(e => document.activeElement === e), true); }
  await page.locator('#ux-tab-start').evaluate(e => e.remove());
};
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  for (const route of routes) {
    await page.goto(`${origin}/${route}/`, { waitUntil: 'networkidle' });
    await verify(page, '.pt-category-hub__product', '/produkt/', ['.pt-category-hub__product-media', '.pt-category-hub__product-copy h3', '.pt-category-hub__product-copy > p:last-child', '.pt-category-hub__product-decision', '.pt-category-hub__product-cta']);
    checks.push({ route, rows: await page.locator('.pt-category-hub__product').count() });
  }
  await page.goto(origin, { waitUntil: 'networkidle' });
  await verify(page, '.pt-home__decision', '/vergleiche/', ['.pt-home__decision-media', 'h3', 'p', 'small']);
  assert.equal(await page.locator('.pt-home__decision[href="/vergleiche/beste-mikrochip-katzenklappen/"]').count(), 1);
  const activate = async (url, selector) => {
    await page.goto(origin + url, { waitUntil: 'networkidle' });
    const link = page.locator(selector).first(), href = await link.getAttribute('href');
    const modifier = await page.evaluate(() => /Mac/.test(navigator.platform) ? 'Meta' : 'Control');
    const [popup] = await Promise.all([page.context().waitForEvent('page'), link.click({ modifiers: [modifier] })]);
    await popup.waitForURL(origin + href); await popup.close(); assert.equal(page.url(), origin + url);
    await link.focus(); await Promise.all([page.waitForURL(origin + href), page.keyboard.press('Enter')]);
  };
  await activate('/trinkbrunnen/', '.pt-category-hub__product');
  await activate('/', '.pt-home__decision[href="/vergleiche/beste-mikrochip-katzenklappen/"]');
  await context.close();
  for (const width of [375, 1600]) for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    for (const [route, selector] of [['/trinkbrunnen/', '.pt-category-hub__product'], ['/', '.pt-home__decision']]) {
      await p.goto(origin + route, { waitUntil: 'networkidle' });
      // Load lazy media and settle fonts before geometry/visual checks.
      for (const image of await p.locator(selector + ' img').all()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(i => i.decode()); }
      await p.evaluate(() => document.fonts.ready);
      await verify(p, selector, route === '/' ? '/vergleiche/' : '/produkt/', route === '/' ? ['h3', 'small'] : ['h3', '.pt-category-hub__product-cta']);
      const metrics = await p.evaluate(sel => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, color: getComputedStyle(document.querySelector(sel)).color, background: getComputedStyle(document.querySelector(sel)).backgroundColor }), selector);
      assert.ok(metrics.scrollWidth <= width + 1, JSON.stringify({ route, theme, metrics })); checks.push({ route, width, theme, ...metrics });
      // Only four fullpage images: mobile product rows and desktop comparison teasers.
      if (output && (route === '/trinkbrunnen/' && width === 375 || route === '/' && width === 1600)) {
        fs.mkdirSync(output, { recursive: true });
        await p.evaluate(async () => {
          document.activeElement?.blur();
          await Promise.allSettled([...document.images].map(image => { image.loading = 'eager'; return image.decode(); }));
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
        await p.mouse.move(width - 1, 0);
        await p.waitForFunction(() => scrollY === 0);
        // Let the existing sticky header settle after the hit-testing scrolls.
        await p.waitForTimeout(250);
        await p.screenshot({ path: `${output}/${route === '/' ? 'home' : 'trinkbrunnen'}-${width}-${theme}.png`, fullPage: true });
      }
    }
    await ctx.close();
  }
  for (const href of targets) { const response = await fetch(origin + href); assert.equal(response.status, 200, href); }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', checks, links: targets.size, keyboard: 'PASS', modifiedClick: 'PASS', nestedAnchors: 0, hoverLayoutShift: 0, browserErrors: errors }, null, 2));
} finally { await browser.close(); server.close(); }
