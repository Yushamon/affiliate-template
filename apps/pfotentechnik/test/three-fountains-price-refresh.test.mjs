import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'parse5';
import { readProductDocument } from '../src/lib/price-intelligence/frontmatter-price.mjs';
import { allowsAutomaticPriceCheck, checkDocumentPrice, checkProductPrice, checkAllProductPrices } from '../src/lib/price-intelligence/service.mjs';

const slugs = ['brook-glass-pet-fountain', 'catit-pixi-standard-trinkbrunnen', 'philips-pet-series-paw3210-02'];
const load = slug => readProductDocument(new URL(`../src/content/products/${slug}.md`, import.meta.url).pathname);

for (const slug of slugs) {
  test(`${slug}: bestätigter Amazon-Preis ist für Cockpit-Updates freigegeben`, async () => {
    const { data } = await load(slug);
    assert.equal(allowsAutomaticPriceCheck(data), true);
    assert.ok(data.price.current > 0);
    assert.equal(data.price.currency, 'EUR');
    assert.equal(data.price.source.type, 'merchant');
    assert.equal(data.priceState, 'available');
    assert.equal(data.priceAvailable, true);
  });
  test(`${slug}: Cockpit-Einzelprüfung aktualisiert Preis und bewahrt Affiliate-Link`, async t => {
    const original = await load(slug);
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pt-fountain-price-'));
    t.after(() => fs.rm(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'product.md');
    await fs.writeFile(file, original.source);
    const nextPrice = 47.31;
    const result = await checkProductPrice(slug, {
      find: () => readProductDocument(file),
      checkLegacy: doc => checkDocumentPrice(doc, { fetchText: async url => ({
        resolvedUrl: url,
        html: `<form id="addToCart"><input name="ASIN" value="${original.data.asin}"><input name="items[0.base][customerVisiblePrice][amount]" value="${nextPrice}"><input name="items[0.base][customerVisiblePrice][currencyCode]" value="EUR"></form>`
      }) })
    });
    assert.equal(result.ok, true);
    const updated = await readProductDocument(file);
    assert.equal(updated.data.price.current, nextPrice);
    assert.equal(updated.data.priceState, 'available');
    assert.equal(updated.data.affiliate.url, original.data.affiliate.url);
    assert.equal(updated.data.availability, original.data.availability);
  });
}

test('globale Cockpit-Preisprüfung nimmt alle drei neuen Produkte auf', async () => {
  const documents = await Promise.all(slugs.map(load));
  const checked = [];
  const result = await checkAllProductPrices({}, { listDocuments: async () => documents, check: async slug => { checked.push(slug); return { ok: true }; } });
  assert.deepEqual(checked, slugs);
  assert.equal(result.succeeded, 3);
});

test('Produktzuordnung ergänzt passende Vergleiche automatisch per Backlink', async () => {
  for (const slug of slugs) {
    const { data } = await load(slug);
    assert.ok(data.comparisons.includes('beste-trinkbrunnen-fuer-katzen'));
    assert.equal(data.comparisons.includes('beste-trinkbrunnen-fuer-hunde'), data.comparisonFilters.animal.includes('dog'));
  }
});

const walk = function* (node) { yield node; for (const child of node.childNodes ?? []) yield* walk(child); };
const visibleText = node => [...walk(node)].filter(n => n.nodeName === '#text').map(n => n.value).join(' ').replace(/\s+/g, ' ');

test('gebaute Vergleiche zeigen neue Produkte samt aktuellen Preisen ohne Duplikate', async () => {
  for (const comparison of ['beste-trinkbrunnen-fuer-katzen', 'beste-trinkbrunnen-fuer-hunde']) {
    const html = await fs.readFile(new URL(`../dist/vergleiche/${comparison}/index.html`, import.meta.url), 'utf8');
    const nodes = [...walk(parse(html))];
    const sticky = nodes.find(n => n.attrs?.some(a => a.name === 'class' && a.value.split(' ').includes('comparison-lab__sticky-products')));
    assert.ok(sticky, 'Der echte Direktvergleich ist gerendert.');
    const articles = [...walk(sticky)].filter(n => n.tagName === 'article');
    for (const slug of slugs) {
      const { data } = await load(slug);
      const matches = articles.filter(article => [...walk(article)].some(n => n.tagName === 'a' && n.attrs.some(a => a.name === 'href' && a.value === data.productUrl)));
      const included = data.comparisons.includes(comparison);
      assert.equal(matches.length, included ? 1 : 0, `${comparison}: ${slug} erscheint passend und genau einmal.`);
      if (included) {
        const price = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.price.current).replace(/\s+/g, ' ');
        assert.ok(visibleText(matches[0]).includes(price), `${slug}: sichtbarer Preis ${price}`);
        assert.doesNotMatch(visibleText(matches[0]), /Preis offen/);
      }
    }
  }
});

for (const slug of slugs) {
  test(`${slug}: gebaute Produktseite zeigt den Preis`, async () => {
    const { data } = await load(slug);
    const html = await fs.readFile(new URL(`../dist/produkt/${slug}/index.html`, import.meta.url), 'utf8');
    const price = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.price.current).replace(/\s+/g, ' ');
    assert.ok(visibleText(parse(html)).includes(price));
  });
}
