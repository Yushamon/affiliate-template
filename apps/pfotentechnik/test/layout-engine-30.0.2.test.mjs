import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(testDir, '..');
const repoRoot = path.resolve(appRoot, '../..');
const readApp = (p) => fs.readFileSync(path.join(appRoot, p), 'utf8');
const readRepo = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

const globalCss = readRepo('packages/affiliate-core/src/styles/global.css');
const layout = readRepo('packages/affiliate-core/src/styles/layout.css');
const engine = readRepo('packages/affiliate-core/src/styles/page-layout-engine.css');
const productPage = readApp('src/pages/produkt/[product].astro');
const comparisonPage = readApp('src/pages/vergleiche/[comparison].astro');
const comparisonCss = readRepo('packages/affiliate-core/src/components/comparison/comparison-system.css');
const experience = readApp('src/components/product-experience-2/ProductExperience2.astro');
const hero = readApp('src/components/product-experience-2/ProductHero2.astro');

test('eine gemeinsame Layout Engine wird global geladen', () => {
  assert.match(globalCss, /page-layout-engine\.css/);
  assert.match(engine, /container\.container--page/);
  assert.equal((engine.match(/--pt-page-gutter:/g) || []).length, 1);
});

test('Produkt und Vergleich verwenden denselben Page Owner', () => {
  assert.match(productPage, /mainClass="container--page"/);
  assert.match(comparisonPage, /mainClass="container--page"/);
  assert.doesNotMatch(productPage + comparisonPage + layout, /container--immersive|container--product/);
});

test('Galerie bleibt mobile full bleed', () => {
  const galleryCss = readApp('src/components/product-experience-2/product-gallery-29.css');
  assert.doesNotMatch(hero, /data-mobile-gallery-full-bleed/);
  assert.doesNotMatch(engine, /data-mobile-gallery-full-bleed/);
  assert.match(galleryCss, /width:\s*100dvw/);
  assert.match(galleryCss, /margin-inline:\s*calc\(50%\s*-\s*50dvw\)/);
});

test('Produktinhalte nutzen exakt den globalen Gutter', () => {
  assert.match(experience, /calc\(100% - 2 \* var\(--pt-page-gutter\)\)/);
  assert.match(hero, /calc\(100% - 2 \* var\(--pt-page-gutter\)\)/);
});

test('Vergleich besitzt keinen eigenen Seitengutter', () => {
  assert.doesNotMatch(comparisonCss, /--comparison-page-gutter/);
  assert.doesNotMatch(comparisonCss, /padding-inline:\s*var\(--pt-page-gutter/);
  assert.match(engine, /pt-page--comparison \.comparison-shell > \*/);
});

test('keine neue important Regel und keine Viewport Hacks', () => {
  const sources = [layout, engine, experience, hero, comparisonCss].join('\n');
  assert.doesNotMatch(engine, /!important|100vw|left:\s*50%|margin-left:\s*-50vw|translateX/);
});
