import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { transform } from '@astrojs/compiler-rs';
import { experimental_AstroContainer } from 'astro/container';
import { readProductDocument } from '../src/lib/price-intelligence/frontmatter-price.mjs';
import { readProductEditorial, saveProductEditorial, setManualProductPrice } from '../src/lib/price-intelligence/service.mjs';
import { handleOperationsRoute } from '../src/lib/admin/operations-router.mjs';
import { productEditorialPatchSchema } from '../src/content/schema/product-editorial-patch.mjs';
import { isPublishedProduct } from '../src/domain/productPublication.mjs';
import { calculateProductScore } from '../src/domain/productScore.ts';
import { resolveCommerceOffers, compareCommerceOffers } from '../src/domain/commerceOffers.mjs';

const manifest = JSON.parse(await fs.readFile(new URL('../research/product-integration-35.8/manifest.json', import.meta.url), 'utf8'));
const hash = source => createHash('sha256').update(source).digest('hex');
async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pt358-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const source = await fs.readFile(new URL('../src/content/products/mova-suretrack-pro.md', import.meta.url), 'utf8');
  const file = path.join(dir, 'product.md'); await fs.writeFile(file, source);
  return { file, source, find: () => readProductDocument(file) };
}

test('nur einzeln geprüfte Modelle sind freigegeben; Duo bleibt gesperrt und X bleibt Recherche', async () => {
  assert.equal(manifest.candidates.length, 4);
  assert.ok(manifest.mediaPolicy.authorizationBasis);
  for (const data of manifest.candidates) {
    assert.equal(isPublishedProduct(data), ['mova-suretrack-pro', 'satellai-collar-go'].includes(data.slug));
    assert.equal(Boolean(data.publicationBlockers.length), data.publicationStatus === 'draft');
    assert.deepEqual(data.decisionFacts, []);
    assert.ok((data.offers?.[0]?.price ?? data.price).current > 0);
    assert.equal((data.offers?.[0]?.price ?? data.price).currency, 'EUR');
    const document = await readProductDocument(new URL(`../src/content/products/${data.slug}.md`, import.meta.url).pathname);
    assert.equal(isPublishedProduct(document.data), isPublishedProduct(data));
  }
  assert.equal(new Set(manifest.candidates.map(data => data.mpn)).size, 4);
  assert.equal(manifest.researchOnly[0].publicationAllowed, false);
  assert.equal(isPublishedProduct({}), true, 'Bestehende veröffentlichte Produkte behalten ihren Status.');
  assert.equal(isPublishedProduct({ publicationStatus: 'published', publicationBlockers: ['Bildfreigabe fehlt'] }), false);
});

test('redaktioneller Editor validiert Kriterien, Datum, Quellen und verbietet direkte Preis-/Score-/Freigabeänderungen', () => {
  for (const patch of [{ ratings: { ortung: 6 } }, { updatedAt: '2026-02-30' }, { evidenceSources: [{ url: 'javascript:alert(1)' }] }, { price: { current: 1 } }, { score: 100 }, { publicationStatus: 'published' }]) {
    assert.equal(productEditorialPatchSchema.safeParse(patch).success, false);
  }
});

test('Cockpit speichert Bewertung und Nachweise atomar; Preis und Affiliate bleiben getrennt', async t => {
  const f = await fixture(t), before = await f.find();
  const result = await saveProductEditorial({ slug: before.slug, expectedHash: hash(f.source), patch: { ratings: { ortung: 4, app: 3 }, updatedAt: '2026-11-16', methodology: 'Dokumentierte redaktionelle Bewertung anhand der hinterlegten Herstellerquellen.', evidenceSources: before.data.evidenceSources, editorialStatus: 'required' } }, { find: f.find });
  const after = await f.find();
  assert.equal(result.editorial.score, 70);
  assert.equal(result.editorial.rating, 3.5);
  assert.deepEqual(after.data.price, before.data.price);
  assert.deepEqual(after.data.affiliate, before.data.affiliate);
  assert.deepEqual(after.data.evidenceSources, before.data.evidenceSources);
  assert.equal(after.data.publicationStatus, before.data.publicationStatus);
  await assert.rejects(saveProductEditorial({ slug: before.slug, expectedHash: hash(f.source), patch: { ratings: { ortung: 5 } } }, { find: f.find }), /Konflikt/);
});

test('Live-Lesen und API-Routen verwenden denselben Produktdatensatz, nicht statische veraltete Formulardaten', async t => {
  const f = await fixture(t), doc = await f.find(); let response;
  const dependencies = { request: { method: 'GET' }, response: {}, requestUrl: new URL(`http://localhost/api/admin/products/editorial?slug=${doc.slug}`), origin: 'http://localhost', json: (_r, status, data) => { response = { status, data }; }, assertJsonRequest: () => {}, readJsonBody: async () => ({ slug: doc.slug, expectedHash: hash(f.source), patch: { ratings: { ortung: 3, app: 3 } } }), editorialService: { read: slug => readProductEditorial(slug, { find: f.find }), save: input => saveProductEditorial(input, { find: f.find }) } };
  assert.equal(await handleOperationsRoute(dependencies), true);
  assert.equal(response.data.sourceHash, hash(f.source));
  await handleOperationsRoute({ ...dependencies, request: { method: 'POST' }, requestUrl: new URL('http://localhost/api/admin/products/editorial') });
  assert.equal(response.status, 200);
  assert.equal(response.data.editorial.score, 60);
});

test('manuelle Cockpit-Preisänderung erreicht echte Kaufkomponente und verändert keinen Score', async t => {
  const f = await fixture(t), before = await f.find(), score = calculateProductScore(before.data);
  await setManualProductPrice({ slug: before.slug, current: '91,23', currency: 'EUR' }, { find: f.find });
  const after = await f.find();
  assert.equal(after.data.price.current, 91.23);
  assert.deepEqual(calculateProductScore(after.data), score);
  const source = await fs.readFile(new URL('../src/components/product-experience-2/PriceBox2.astro', import.meta.url), 'utf8');
  const compiled = transform(source, { filename: '/PriceBox2.astro', internalURL: 'astro/compiler-runtime' });
  const code = compiled.code.replace(/^import .*\?astro&type=style[^\n]*\n/gm, '').replace(', createMetadata as $$createMetadata', '').replace(/export const \$\$metadata = [\s\S]*?\n\}\);\n/, '').replace('"astro/compiler-runtime"', JSON.stringify(import.meta.resolve('astro/compiler-runtime')));
  const { default: PriceBox } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  const container = await experimental_AstroContainer.create();
  const html = await container.renderToString(PriceBox, { props: { commerce: compareCommerceOffers(resolveCommerceOffers(after.data)), operations: { availability: 'unknown' }, affiliate: after.data.affiliate } });
  assert.match(html, /91,23/);
  assert.ok(html.includes('mova.tech'));
  assert.match(html, /Direkter Herstellerlink/);
  assert.doesNotMatch(html, /erhalten wir ggf. eine Provision|data-affiliate-link/);
});

test('Product Reference Model übernimmt die gespeicherten redaktionellen Teilbewertungen', async t => {
  const f = await fixture(t), before = await f.find();
  await saveProductEditorial({ slug: before.slug, expectedHash: hash(f.source), patch: { ratings: { ortung: 3, app: 4 } } }, { find: f.find });
  const after = await f.find();
  const output = await build({ entryPoints: [fileURLToPath(new URL('../src/domain/productExperience/model.ts', import.meta.url))], bundle: true, write: false, platform: 'node', format: 'esm', define: { 'import.meta.env.PROD': 'true', 'import.meta.env.DEV': 'false' } });
  const { buildProductExperienceModel } = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].text).toString('base64'));
  const model = buildProductExperienceModel({ currentEntry: { data: after.data }, allProducts: [{ data: after.data }] });
  assert.equal(model.score, 70);
  const alternatives = await Promise.all(after.data.reviewedAlternatives.map(item => readProductDocument(new URL(`../src/content/products/${item.slug}.md`, import.meta.url).pathname)));
  const reviewedModel = buildProductExperienceModel({ currentEntry: { data: after.data }, allProducts: [{ data: after.data }, ...alternatives.map(doc => ({ data: doc.data }))] });
  assert.deepEqual(reviewedModel.alternatives.map(item => item.href), after.data.reviewedAlternatives.map(item => `/produkt/${item.slug}/`));
  assert.deepEqual(reviewedModel.alternatives.map(item => item.reason), after.data.reviewedAlternatives.map(item => item.reason));
  assert.ok(reviewedModel.alternatives.every(item => item.type === 'editorial'));
});

test('alle sechs Bildsätze sind exakt nachverfolgbar und vollständig lokal vorhanden', async () => {
  for (const request of manifest.mediaRequests) {
    const base = new URL(`../src/assets/images/products/${request.slug}/`, import.meta.url);
    const provenance = JSON.parse(await fs.readFile(new URL('media-provenance-35.8.json', base), 'utf8'));
    assert.equal(provenance.identity, request.identity);
    assert.equal(provenance.authorization.thirdPartyLicenseClaimed, false);
    assert.equal(provenance.assets.length, 6);
    assert.ok(new Set(provenance.assets.map(asset => asset.sourceUrl)).size >= 3);
    for (const asset of provenance.assets) {
      assert.equal(hash(await fs.readFile(new URL(asset.file, base))), asset.sha256);
      assert.ok(asset.bytes < 150000);
      assert.ok(request.urls.includes(asset.sourceUrl));
    }
  }
});

test('Amazon-Abruf bleibt begrenzt und hebt das Limit fremder Händler nicht an', async () => {
  const { safeFetchText } = await import('../src/lib/price-intelligence/safe-fetch.mjs');
  const calls = [];
  const fetchResource = async (url, options) => { calls.push(options); return { buffer: Buffer.from('<html></html>'), contentType: 'text/html', resolvedUrl: url, status: 200 }; };
  for (const url of ['https://www.amazon.de/dp/B0D6Z4L6BW', 'https://amazon.de.attacker.test/', 'https://de.mova.tech/']) await safeFetchText(url, {}, { fetchResource });
  assert.deepEqual(calls.map(options => options.maxBytes), [5000000, 2500000, 2500000]);
  await safeFetchText('https://www.amazon.de/', { maxBytes: 1234 }, { fetchResource });
  assert.equal(calls.at(-1).maxBytes, 1234);
});

test('Invoxia-Jahrespaket zählt enthaltene Monate nicht noch einmal als Zusatzkosten', async () => {
  const { buildSubscriptionCostModel } = await import('../src/domain/subscriptionCosts.ts');
  const { data } = await readProductDocument(new URL('../src/content/products/invoxia-biotracker-2026.md', import.meta.url).pathname);
  assert.equal(data.asin, 'B0H4QZMTSY');
  assert.match(data.price.variantLabel, /1 Jahr/);
  assert.equal(data.gps.includedServiceMonths, 12);
  assert.equal(data.subscription.includedServiceMonths, 12);
  const model = buildSubscriptionCostModel({ subscription: data.subscription, devicePrice: data.price.current, now: '2026-11-16' });
  assert.equal(model.totals.months12.value, data.price.current);
});
