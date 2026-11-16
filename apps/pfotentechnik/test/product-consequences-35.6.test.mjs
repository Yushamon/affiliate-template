import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { buildDecisionFacts } from '../src/domain/productExperience/consequences.ts';

const derive = (label, value, category = 'GPS-Tracker') =>
  buildDecisionFacts({ category }, [{ label, value }]);

for (const value of [
  'Integrierter Akku',
  'Integrierter Akku, keine Angaben zur Austauschbarkeit',
  'Akku vorhanden, Zellchemie nicht dokumentiert',
  'Integrierter, wiederaufladbarer Akku; Laufzeit nicht dokumentiert',
]) {
  test(`Akku vorhanden: ${value}`, () => {
    const facts = derive('Akku', value);
    assert.equal(facts.length, 1);
    assert.match(facts[0].consequence, /reale Akkulaufzeit/);
    assert.doesNotMatch(facts[0].consequence, /Kein integrierter Akku/);
  });
}

for (const value of ['Kein integrierter Akku', 'Ohne Akku', 'Nein', 'Akku nicht vorhanden', 'Akku nicht vorgesehen']) {
  test(`Akku fehlt: ${value}`, () => {
    assert.match(derive('Akku', value)[0]?.consequence ?? '', /Kein integrierter Akku/);
  });
}

for (const value of ['Akkustatus unbekannt', 'Keine Angaben zur Austauschbarkeit', 'Zellchemie nicht dokumentiert', 'Keine Angaben zur Laufzeit', 'Keine Angaben, ob ein Akku vorhanden ist', 'Nicht dokumentiert', '']) {
  test(`Unbekannt erzeugt keine Akkueigenschaft: ${value}`, () => {
    assert.deepEqual(derive('Akku', value), []);
    assert.deepEqual(derive('Akku', value, 'Trinkbrunnen'), []);
  });
}

for (const label of ['App', 'WLAN', 'Kamera']) {
  for (const value of [`Keine Angaben zur ${label}`, `${label}status unbekannt`, `Unbekannt, ob ${label} vorhanden`, 'Nicht dokumentiert']) {
    test(`${label}: fehlende Angaben bleiben unbekannt (${value})`, () => {
      assert.deepEqual(derive(label, value), []);
    });
  }
  for (const value of [`Ohne ${label}`, `${label} nicht vorhanden`]) {
    test(`${label}: tatsächliche Negation (${value})`, () => {
      assert.match(derive(label, value, 'Futterautomaten')[0]?.consequence ?? '', label === 'Kamera' ? /keine visuelle Kontrolle/ : /nicht zur Verfügung/);
    });
  }
  test(`${label}: vorhandene Funktion trotz fehlender Detailangaben`, () => {
    assert.match(derive(label, `${label} vorhanden, keine Angaben zur Version`, 'Futterautomaten')[0]?.consequence ?? '', label === 'Kamera' ? /Bildbereich/ : /App.*Kontovoraussetzungen/);
  });
  test(`${label}: eindeutige Kurzantwort mit zusätzlichen Details`, () => {
    assert.match(derive(label, 'Ja, weitere Details nicht dokumentiert', 'Futterautomaten')[0]?.consequence ?? '', label === 'Kamera' ? /Bildbereich/ : /App.*Kontovoraussetzungen/);
    assert.match(derive(label, 'Nein, weitere Details nicht dokumentiert', 'Futterautomaten')[0]?.consequence ?? '', label === 'Kamera' ? /keine visuelle Kontrolle/ : /nicht zur Verfügung/);
  });
}

const slugs = ['tractive-cat-6-mini', 'tractive-dog-6', 'tractive-dog-6-xl'];
test('Akkukapazität beschreibt keinen nachfüllbaren Vorratsbehälter', () => {
  assert.match(derive('Akkukapazität', '450 mAh')[0]?.consequence ?? '', /reale Akkulaufzeit/);
  assert.deepEqual(derive('Akkukapazität', 'Keine Angaben'), []);
});
for (const category of ['Trinkbrunnen', 'Futterautomaten']) {
  test(`mAh-Akkukapazität bleibt von Volumenregeln ausgeschlossen: ${category}`, () => {
    const facts = derive('Akkukapazität', '2150 mAh laut Hersteller', category);
    assert.equal(facts.length, 1);
    assert.match(facts[0].consequence, /Akkuangabe allein belegt keine Laufzeit/);
    assert.doesNotMatch(facts[0].consequence, /Volumen|Nachfüllen|nachgefüllt|Futterdichte|Portionsgröße/);
    assert.deepEqual(derive('Akkukapazität', 'Keine Angaben', category), []);
  });
}

for (const slug of slugs) {
  test(`${slug}: echte Produktdaten und automatische Laufzeitableitung`, () => {
    const source = fs.readFileSync(new URL(`../src/content/products/${slug}.md`, import.meta.url), 'utf8');
    const data = yaml.load(source.match(/^---\s*\n([\s\S]*?)\n---/)[1]);
    const batterySpecs = data.specs.filter(spec => /akku/i.test(spec.label));
    for (const spec of batterySpecs) {
      assert.match(derive(spec.label, spec.value)[0]?.consequence ?? '', /reale Akkulaufzeit/);
    }
    const facts = buildDecisionFacts(data, data.specs);
    assert.ok(facts.length > 0);
    assert.ok(facts.every(fact => !fact.consequence.includes('Kein integrierter Akku')));
  });
}
