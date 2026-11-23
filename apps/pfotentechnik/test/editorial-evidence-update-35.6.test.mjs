import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import yaml from 'js-yaml';
import {validateFindings} from '../scripts/product-evidence/check-findings.mjs';
import {buildDecisionFacts} from '../src/domain/productExperience/consequences.ts';

const ledger = JSON.parse(fs.readFileSync(new URL('../research/editorial-findings.json', import.meta.url)));
const clone = () => structuredClone(ledger);
const products = new URL('../src/content/products/', import.meta.url);
const read = file => yaml.load(fs.readFileSync(new URL(file, products), 'utf8').match(/^---\s*\n([\s\S]*?)\n---/)[1]);

test('Befunde enthalten eindeutige IDs, Quellen und belegte Statushistorie', () => {
  assert.deepEqual(validateFindings(ledger), []);
});
test('Eine lokale Korrektur darf nicht ohne Live-Body-Beleg hochgestuft werden', () => {
  const copy = clone(), finding = copy.findings.find(f => f.status === 'Korrigiert, aber unveröffentlicht');
  finding.status = 'Live verifiziert';
  finding.history.push({status: finding.status, date: '2026-11-23', evidence: 'Only local build'});
  finding.liveVerifiedOn = '2026-11-23';
  assert.ok(validateFindings(copy).some(e => e.includes('HTTP 200 body')));
});
test('Unbekannte Statuswerte und widersprüchliche Historie werden abgewiesen', () => {
  const copy = clone();
  copy.findings[0].status = 'Done';
  assert.ok(validateFindings(copy).some(e => e.includes('Invalid status')));
  assert.ok(validateFindings(copy).some(e => e.includes('history')));
});
test('Alle tatsächlichen GPS-Produkte bleiben im generierten Entscheidungskontext ohne Netzstrom-Fehlbehauptung', () => {
  let count = 0;
  for (const file of fs.readdirSync(products).filter(f => f.endsWith('.md'))) {
    const data = read(file);
    if (!/gps|tracker/i.test(JSON.stringify(data.category))) continue;
    count++;
    const facts = buildDecisionFacts(data, data.specs ?? []);
    for (const fact of facts) {
      assert.doesNotMatch(fact.consequence, /Kein integrierter Akku|Ohne Netzstrom|Notstrom|nachgefüllt|nachfüllen|Stellplatz/i, `${data.slug}: ${fact.label}`);
    }
  }
  assert.ok(count >= 12, 'GPS-Inventur darf nicht durch einen leeren Filter bestehen');
});
test('Firmwarebelege bleiben auf die ausdrücklich dokumentierten Modelle begrenzt', () => {
  const one = read('petlibro-one-rfid-smart-feeder.md');
  const wifi = read('petlibro-granary-wifi-feeder.md');
  assert.match(one.experience.reliability, /V2\.0\.27/);
  assert.match(wifi.experience.reliability, /AF103\/PLAF103.*V1\.0\.58/);
  for (const name of ['petlibro-granary-camera-feeder.md', 'petlibro-granary-dual-feeder.md', 'petlibro-granary-2.md', 'petlibro-granary-2-vision.md', 'petlibro-granary-2-vision-duo.md']) {
    assert.doesNotMatch(JSON.stringify(read(name)), /V1\.0\.58/);
  }
});
