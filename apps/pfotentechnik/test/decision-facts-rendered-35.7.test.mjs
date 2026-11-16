import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parse as parseStore } from 'devalue';
import { parse as parseHtml } from 'parse5';
import yaml from 'js-yaml';
import { buildDecisionFacts } from '../src/domain/productExperience/consequences.ts';
import { buildLitterCompatibilityModel } from '../src/domain/litterCompatibility.ts';
import { decisionFactApprovals } from '../src/domain/productExperience/decisionFactReview.mjs';

// Requires the real production build and generated quality reports.
const products = parseStore(fs.readFileSync(new URL('../.astro-cache/data-store.json', import.meta.url), 'utf8')).get('products');
const walk = function* (node) { yield node; for (const child of node.childNodes ?? []) yield* walk(child); };
const text = node => [...walk(node)].filter(item => item.nodeName === '#text').map(item => item.value).join('').replace(/\s+/g, ' ').trim();
const tidy = value => value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('de-DE');
const directory = new URL('../src/content/products/', import.meta.url);
const affected = fs.readdirSync(directory).filter(file => /\.mdx?$/.test(file)).flatMap(file => {
  const raw = fs.readFileSync(new URL(file, directory), 'utf8');
  const data = yaml.load(raw.match(/^---\s*\n([\s\S]*?)\n---/)[1], { schema: yaml.JSON_SCHEMA });
  return data.decisionFacts?.length ? [data] : [];
});

test('73 Produkte behalten alle 437 redaktionellen Hinweise exakt im gebauten Speicher', () => {
  assert.equal(affected.length, 73);
  let count = 0;
  for (const data of affected) {
    assert.deepEqual(products.get(data.slug)?.data?.decisionFacts, data.decisionFacts, data.slug);
    count += data.decisionFacts.length;
  }
  assert.equal(count, 437);
});

test('alle 73 echten Produktseiten veröffentlichen ohne Freigabe ausschließlich den Fallback', () => {
  assert.deepEqual(decisionFactApprovals, []);
  for (const original of affected) {
    const data = products.get(original.slug).data;
    const base = buildDecisionFacts({ ...data, decisionFacts: [] }, data.specs);
    const compatibility = buildLitterCompatibilityModel(data.litterCompatibility);
    const expected = base; // 35.9: Streu wird zentral priorisiert und dedupliziert.
    const html = fs.readFileSync(new URL(`../dist/produkt/${original.slug}/index.html`, import.meta.url), 'utf8');
    const section = [...walk(parseHtml(html))].find(node => node.tagName === 'section' && node.attrs.some(attr => attr.name === 'class' && attr.value.split(' ').includes('decision-facts')));
    if (!expected.length) { assert.equal(section, undefined, original.slug); continue; }
    assert.ok(section, original.slug);
    const actual = [...walk(section)].filter(node => node.tagName === 'dt').map(node => ({
      label: text(node.childNodes.find(child => child.tagName === 'span')),
      value: text(node.childNodes.find(child => child.tagName === 'strong'))
    }));
    const consequences = [...walk(section)].filter(node => node.tagName === 'dd').map(text);
    assert.deepEqual(actual.map(item => ({ label: tidy(item.label), value: tidy(item.value) })), expected.map(item => ({ label: tidy(item.label), value: tidy(item.value) })), original.slug);
    assert.deepEqual(consequences, expected.map(item => item.consequence), original.slug);
  }
});

test('vollständiger Qualitätsreport ist reproduzierbar und erteilt keine Freigaben', () => {
  const report = JSON.parse(fs.readFileSync(new URL('../reports/decision-facts-quality-35.7.json', import.meta.url), 'utf8'));
  assert.equal(report.summary.products, 73);
  assert.equal(report.summary.facts, 437);
  assert.equal(report.summary.retainedProducts, 73);
  assert.equal(report.summary.approvedFacts, 0);
  for (const product of report.products) {
    const data = affected.find(data => data.slug === product.slug);
    assert.deepEqual(product.facts.map(fact => fact.original), data.decisionFacts);
    assert.ok(product.facts.every(fact => fact.editorialReview === 'unreviewed' && fact.publication === 'blocked-fallback-only'));
  }
  execFileSync(process.execPath, [new URL('../scripts/product-experience/audit-decision-facts.mjs', import.meta.url).pathname, '--check'], { stdio: 'pipe' });
});
