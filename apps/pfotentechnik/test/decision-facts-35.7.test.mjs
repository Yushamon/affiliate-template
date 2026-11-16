import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { build } from 'esbuild';
import { transform } from '@astrojs/compiler-rs';
import { experimental_AstroContainer } from 'astro/container';
import { z } from 'astro/zod';
import { productDecisionFactSchema, decisionFactApprovalRegistrySchema } from '../src/content/schema/decision-facts.mjs';
import { decisionFactApprovals, decisionFactFingerprint } from '../src/domain/productExperience/decisionFactReview.mjs';
import { buildDecisionFacts } from '../src/domain/productExperience/consequences.ts';
import { reviewProductDecisionFacts } from '../scripts/product-experience/decision-fact-quality.mjs';

const fact = { label: 'Akku', value: 'Nein', consequence: 'Plane für die Nutzung einen Netzanschluss ein.' };
const data = { slug: 'fixture', category: 'Trinkbrunnen', decisionFacts: [fact] };
const specs = [{ label: 'Akku', value: 'Nein' }, { label: 'Gewicht', value: '1 kg' }];
const approve = (item = fact, slug = 'fixture') => [{ slug, fingerprint: decisionFactFingerprint(item), reviewedAt: '2026-11-16T12:00:00+01:00', reviewReference: 'Synthetic test approval only' }];

test('Schema validiert vollständige Originaltexte ohne Änderungen', () => {
  assert.deepEqual(productDecisionFactSchema.parse(fact), fact);
  for (const key of ['label', 'value', 'consequence']) {
    for (const invalid of [undefined, '', '  ', 42]) assert.equal(productDecisionFactSchema.safeParse({ ...fact, [key]: invalid }).success, false);
  }
  assert.equal(productDecisionFactSchema.safeParse({ ...fact, approved: true }).success, false);
});

test('keine globale Freigabe oder Wildcard und keine vorhandene Freigabe', () => {
  assert.deepEqual(decisionFactApprovals, []);
  assert.equal(decisionFactApprovalRegistrySchema.safeParse({ version: 1, approvals: [], enabled: true }).success, false);
  assert.equal(decisionFactApprovalRegistrySchema.safeParse({ version: 1, approvals: approve(fact, '*') }).success, false);
});

test('ungeprüfte Frontmatter-Hinweise bleiben gesperrt und verwenden 35.6-Fallback', () => {
  const actual = buildDecisionFacts({ ...data, decisionFactsApproved: true }, specs);
  assert.ok(actual.every(item => item.source === 'technical-specification'));
  assert.match(actual[0].consequence, /^Kein integrierter Akku/);
  assert.equal(buildDecisionFacts(data, []).length, 0);
});

test('einzeln freigegebener Originaltext hat Vorrang, weitere Merkmale nutzen Fallback', () => {
  const result = buildDecisionFacts(data, specs, approve());
  assert.deepEqual(result[0], { ...fact, source: 'editorial' });
  assert.equal(result[1].label, 'Gewicht');
  assert.equal(result[1].source, 'technical-specification');
  assert.equal(result.filter(item => item.label === 'Akku').length, 1);
});

test('Freigabe gilt nur für genaues Produkt und genaues Texttripel', () => {
  for (const changed of [{ ...data, slug: 'other' }, ...['label', 'value', 'consequence'].map(key => ({ ...data, decisionFacts: [{ ...fact, [key]: fact[key] + ' geändert' }] }))]) {
    assert.ok(buildDecisionFacts(changed, specs, approve()).every(item => item.source !== 'editorial'));
  }
});

test('Teilfreigabe veröffentlicht keine Nachbareinträge und begrenzt Ausgabe auf sechs', () => {
  const extra = { label: 'App', value: 'Ja', consequence: 'Ungeprüfter Nachbartext.' };
  const result = buildDecisionFacts({ ...data, decisionFacts: [fact, extra] }, [...specs, ...Array.from({ length: 10 }, (_, i) => ({ label: `Gewicht ${i}`, value: '1 kg' }))], approve());
  assert.equal(result.length, 6);
  assert.equal(result.filter(item => item.source === 'editorial').length, 1);
  assert.ok(result.every(item => item.consequence !== extra.consequence));
});

test('echtes Produktschema übernimmt alle 437 Hinweise der 73 Produkte', async () => {
  const result = await build({ entryPoints: [fileURLToPath(new URL('../src/content/schema/product.ts', import.meta.url))], bundle: true, write: false, platform: 'node', format: 'esm', plugins: [{ name: 'collection-declarations', setup(builder) {
    builder.onResolve({ filter: /^astro(?::content|:loaders|\/loaders)$/ }, args => ({ path: args.path, namespace: 'collection-stub' }));
    builder.onLoad({ filter: /.*/, namespace: 'collection-stub' }, () => ({ contents: 'export const defineCollection=x=>x;export const glob=x=>x;', loader: 'js' }));
  } }] });
  const { createProductContentSchema } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
  const schema = createProductContentSchema(() => z.any());
  const dir = new URL('../src/content/products/', import.meta.url);
  let products = 0, facts = 0;
  for (const file of fs.readdirSync(dir).filter(name => /\.mdx?$/.test(name))) {
    const source = fs.readFileSync(new URL(file, dir), 'utf8');
    const original = yaml.load(source.match(/^---\s*\n([\s\S]*?)\n---/)[1], { schema: yaml.JSON_SCHEMA });
    const parsed = schema.safeParse(original);
    assert.equal(parsed.success, true, file + ': ' + JSON.stringify(parsed.error?.issues));
    assert.deepEqual(parsed.data.decisionFacts, original.decisionFacts ?? [], file);
    if (original.decisionFacts?.length) { products++; facts += original.decisionFacts.length; }
  }
  assert.equal(products, 73);
  assert.equal(facts, 437);
});

const review = (facts, patch = {}) => reviewProductDecisionFacts({ ...data, specs, decisionFacts: facts, ...patch });
test('Qualitätsreport meldet leere Felder und identische Konsequenzen mit Fundstellen', () => {
  assert.ok(review([{ ...fact, value: '' }])[0].issues.some(issue => issue.code === 'INCOMPLETE_FACT'));
  const rows = review([fact, { ...fact, label: 'Stromversorgung' }]);
  assert.ok(rows.every(row => row.issues.some(issue => issue.code === 'DUPLICATE_CONSEQUENCE' && issue.evidence.length)));
});
test('Qualitätsreport erkennt Funktionswiderspruch und Mengenabweichung', () => {
  assert.ok(review([{ ...fact, value: 'Ja' }])[0].issues.some(issue => issue.code === 'FEATURE_CONTRADICTION'));
  assert.ok(review([{ label: 'Kapazität', value: '4 Liter', consequence: 'Eine Aussage.' }], { specs: [{ label: 'Kapazität', value: '2 Liter' }] })[0].issues.some(issue => issue.code === 'NUMERIC_VALUE_DIFFERS'));
});
test('Qualitätsreport meldet positive Behauptung bei unbekannter Eigenschaft', () => {
  const rows = review([{ label: 'Akku', value: 'Akkustatus unbekannt', consequence: 'Ein integrierter Akku ermöglicht Betrieb ohne Netzanschluss.' }], { specs: [] });
  assert.ok(rows[0].issues.some(issue => issue.code === 'PRESENCE_WITH_UNKNOWN_PROPERTY'));
  const known = review([{ label: 'Akku', value: 'Integrierter Akku; Zellchemie nicht dokumentiert', consequence: 'Ein integrierter Akku ermöglicht Betrieb ohne Netzanschluss.' }], { specs: [] });
  assert.ok(known[0].issues.every(issue => issue.code !== 'PRESENCE_WITH_UNKNOWN_PROPERTY'));
});
test('Qualitätsreport trennt pauschale Vorlagen, falschen Kontext und fehlende Belege von Freigabe', () => {
  const rows = review([{ label: 'Kapazität', value: '2 Liter', consequence: 'Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab.' }]);
  assert.ok(rows[0].issues.some(issue => issue.code === 'GENERIC_CONSEQUENCE'));
  assert.ok(rows[0].issues.some(issue => issue.code === 'WRONG_DECISION_CONTEXT'));
  const clean = review([fact], { specs: [] })[0];
  assert.equal(clean.automatedResult, 'no-rule-findings');
  assert.equal(clean.checks.technicalConsistency.result, 'not-verifiable');
  assert.equal(clean.editorialReview, 'unreviewed');
  assert.equal(clean.publication, 'blocked-fallback-only');
});

test('Astro rendert geprüfte Hinweise vollständig, sperrt ungeprüfte und escaped Texte', async () => {
  const source = fs.readFileSync(new URL('../src/components/product-experience-2/ProductDecisionFacts2.astro', import.meta.url), 'utf8');
  const compiled = transform(source, { filename: '/ProductDecisionFacts2.astro', internalURL: 'astro/compiler-runtime' });
  assert.equal(compiled.diagnostics.filter(item => item.severity === 'error').length, 0);
  const code = compiled.code.replace(/^import .*\?astro&type=style[^\n]*\n/gm, '')
    .replace(', createMetadata as $$createMetadata', '').replace(/export const \$\$metadata = [\s\S]*?\n\}\);\n/, '')
    .replace('"astro/compiler-runtime"', JSON.stringify(import.meta.resolve('astro/compiler-runtime')));
  const { default: Component } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  const container = await experimental_AstroContainer.create();
  const html = await container.renderToString(Component, { props: { facts: buildDecisionFacts(data, specs, approve()) } });
  assert.match(html, /Was die wichtigsten Daten bedeuten/);
  assert.ok(html.includes(fact.consequence));
  assert.match(html, /Gewicht/);
  const unreviewed = await container.renderToString(Component, { props: { facts: buildDecisionFacts(data, specs) } });
  assert.ok(!unreviewed.includes(fact.consequence));
  assert.match(unreviewed, /Kein integrierter Akku/);
  const malicious = { ...fact, consequence: '<script>alert(1)</script>' };
  const escaped = await container.renderToString(Component, { props: { facts: buildDecisionFacts({ ...data, decisionFacts: [malicious] }, specs, approve(malicious)) } });
  assert.ok(!escaped.includes('<script>'));
  assert.match(escaped, /&lt;script&gt;/);
});
