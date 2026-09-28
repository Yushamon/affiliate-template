import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {inspectPublicText, publicText, walkFiles, htmlRoute} from '../scripts/content-quality/editorial-leakage.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('editorial gate inspects reader text and editorial metadata, not implementation attributes', () => {
  const html = `<head><meta name="description" content="Cornerstone zur Kaufentscheidung">
    <script type="application/ld+json">{"@type":"Product","url":"https://example.test/frontmatter","description":"Evidence Status: PARTIAL"}</script></head>
    <body><!-- TODO internal note --><main data-owner="Lifecycle Owner" id="information-gain">
    <h2>Information <em>Gain</em>: Wasser messen</h2><details><summary>Belege</summary><p>externalEvidence dokumentiert die Quellen.</p></details>
    <img alt="Temporärer Platzhalter für Produktfoto"><script>const owner = 'Lifecycle Owner';</script></main></body>`;
  const findings = inspectPublicText(html, '/fixture/');
  assert.equal(findings.length, 5);
  assert.ok(findings.some(f => f.surface === 'PUBLIC_METADATA' && f.location.startsWith('jsonld')));
  assert.ok(findings.some(f => f.location.includes('[alt]')));
  assert.equal(inspectPublicText(html, '/admin/fixture/').length, 0);
  assert.equal(inspectPublicText(html, '/foundation/').length, 0);
});

test('ordinary product terminology, citations and commercial disclosures remain permitted', () => {
  const html = `<main><p>Das Modell zeigt den Status der Verbindung. Wir erhalten eine Provision.</p>
    <p>Bei der Route helfen GPS und ein 2G-Fallback. FEDIAF: Complete and Complementary Pet Food.</p>
    <p>Die Herstellerangaben sind nicht vollständig belegt.</p><a href="/produkt/unknown/">Produkt prüfen</a></main>`;
  assert.deepEqual(inspectPublicText(html), []);
});

test('publication artifacts include escaped template instructions and unrendered Markdown', () => {
  const findings = inspectPublicText('<main><p>**Praktisch geprüft**: Eigene Nutzung</p><p>[Produktname]</p><p>{{ title }}</p></main>');
  assert.equal(findings.length, 3);
  assert.ok(findings.every(f => f.rule === 'publication-artifact'));
});

test('production public HTML has no known editorial leakage or publication artifacts', () => {
  const dist = path.join(app, 'dist');
  const files = walkFiles(dist).filter(file => file.endsWith('.html'));
  assert.ok(files.length > 0, 'Run the production build before this test.');
  const findings = files.flatMap(file => inspectPublicText(fs.readFileSync(file, 'utf8'), htmlRoute(path.relative(dist, file))));
  assert.deepEqual(findings, []);
});

test('guide table summaries expose plain reader labels and preserve the source table emphasis', () => {
  const html = fs.readFileSync(path.join(app, 'dist/so-bewerten-wir/index.html'), 'utf8');
  assert.match(html, /<strong>Praktisch geprüft<\/strong>/);
  const texts = publicText(html).surfaces.map(s => s.text);
  assert.ok(texts.some(t => t.includes('Praktisch geprüft: Eigene Nutzung')));
  assert.ok(texts.every(t => !t.includes('**Praktisch geprüft**')));
});
