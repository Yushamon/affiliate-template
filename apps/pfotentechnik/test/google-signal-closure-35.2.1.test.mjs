import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Public prose and internal workflow fields already have separate locations.
// Validate their boundary; never silently filter/rewrite valid product statements.
const publicFields = ['title', 'description', 'recommendation', 'useCase', 'features',
  'strengths', 'weaknesses', 'decision', 'review', 'specs', 'faq', 'experience'];
const internalRoleLabel = /\b(?:lifecycle|intent|editorial|publication|maintenance)[\s-]+owner\b|\b(?:workflow|research|qa)[\s-]+(?:status|state)\b/i;
const strings = (value, field) => typeof value === 'string' ? [{ field, value }]
  : value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => strings(child, `${field}.${key}`)) : [];
const violations = (data) => publicFields.flatMap(field => strings(data[field], field))
  .filter(({ value }) => internalRoleLabel.test(value));
const products = fs.readdirSync(path.join(app, 'src/content/products')).filter(f => f.endsWith('.md'))
  .map(file => {
    const source = fs.readFileSync(path.join(app, 'src/content/products', file), 'utf8');
    return { file, source, data: yaml.load(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]) };
  });

test('public product fields reject internal role/state labels, while typed internal fields remain allowed', () => {
  const note = 'Diese Route ist der gemeinsame Lifecycle-Owner';
  assert.deepEqual(violations({ metadata: { note }, editorialStatus: 'complete',
    externalEvidence: { researchStatus: 'constrained' }, weaknesses: ['Keine Holzpellets'],
    review: { summary: 'Keine eigene Praxiserfahrung; Herstellerangaben bleiben als solche erkennbar.' } }), []);
  for (const field of publicFields) {
    assert.equal(violations({ [field]: [note] }).length, 1, field);
  }
  for (const label of ['Editorial Owner', 'Workflow Status', 'Research Status', 'QA State', 'Publication Owner', 'Maintenance Owner']) {
    assert.equal(violations({ strengths: [label] }).length, 1, label);
  }
});

test('all product public text inputs are free of internal workflow role/state labels', () => {
  assert.ok(products.length > 0);
  const failures = products.flatMap(({ file, data }) => violations(data).map(v => ({ file, ...v })));
  assert.deepEqual(failures, []);
});

test('Neakasa keeps lifecycle ownership only as a private YAML comment, outside public prose and Review inputs', () => {
  const p = products.find(p => p.data.slug === 'neakasa-m1-lite');
  assert.ok(p);
  assert.match(p.source, /# Intern: Diese Route bleibt Lifecycle-Owner/);
  assert.deepEqual(violations(p.data), []);
  const body = p.source.replace(/^---[\s\S]*?\r?\n---/, '').replace(/<!--[\s\S]*?-->/g, '');
  assert.doesNotMatch(body, internalRoleLabel);
  assert.ok(p.data.weaknesses.includes('Keine Holzpellets oder nicht klumpende Streu'));
  assert.ok(p.data.weaknesses.includes('Sensorzahl ist in offiziellen Darstellungen nicht vollständig konsistent'));
});
