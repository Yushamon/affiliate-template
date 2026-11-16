import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import yaml from 'js-yaml';

// Like the existing release tests, these inspect the real production build.
// Run `npm run build:pfotentechnik` before this file.
for (const slug of ['tractive-cat-6-mini', 'tractive-dog-6', 'tractive-dog-6-xl']) {
  test(`${slug}: gerenderte Entscheidungshilfe bewahrt die belegten Aussagen`, () => {
    const source = fs.readFileSync(new URL(`../src/content/products/${slug}.md`, import.meta.url), 'utf8');
    const data = yaml.load(source.match(/^---\s*\n([\s\S]*?)\n---/)[1]);
    const html = fs.readFileSync(new URL(`../dist/produkt/${slug}/index.html`, import.meta.url), 'utf8');
    const section = html.match(/<section\b[^>]*class="decision-facts"[^>]*>[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, 'Die echte Produktseite enthält die Entscheidungshilfe.');
    const visible = section.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    for (const spec of data.specs.filter(spec => /akku/i.test(spec.label))) {
      assert.ok(visible.includes(spec.value), `Sichtbarer Akkuwert: ${spec.value}`);
    }
    const consequences = [...section.matchAll(/<dd\b[^>]*>([\s\S]*?)<\/dd>/g)].map(match => match[1]);
    const batteryCount = 1; // 35.8.1: alle Akkuwerte teilen sich eine Konsequenz.
    assert.equal(new Set(consequences).size, consequences.length);
    assert.equal(consequences.filter(text => /reale Akkulaufzeit/.test(text)).length, batteryCount);
    assert.doesNotMatch(visible, /nachgefüllt/);
    assert.doesNotMatch(html, /Kein integrierter Akku|Ohne Netzstrom läuft das Gerät nur weiter/);
    // Missing details remain visible as uncertainty, rather than a claimed absence.
    assert.match(html, /Zellchemie und Austausch durch Nutzer/);
    assert.match(html, /nicht eindeutig dokumentiert/);
  });
}
