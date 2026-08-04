import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("Petporte besitzt eigenständige belegte Produktdaten", () => {
  const product = read("src/content/products/petsafe-petporte-smart-flap.md");
  assert.match(product, /slug: "petsafe-petporte-smart-flap"/);
  assert.match(product, /160 × 160 mm/);
  assert.match(product, /EU-Netzanschluss/);
  assert.match(product, /Bis zu 25 Katzen/);
  assert.match(product, /Metalltür/);
  assert.match(product, /testedHandsOn: false/);
  assert.doesNotMatch(product, /^rating:/m);
  assert.doesNotMatch(product, /wir haben (das Produkt|die Klappe) getestet/i);
  assert.doesNotMatch(product, /unser Praxistest/i);
});

test("Mikrochip-Vergleich integriert Petporte als siebtes System", () => {
  const comparison = read("src/content/comparisons/beste-mikrochip-katzenklappen.md");
  assert.match(comparison, /7 Systeme im Vergleich/);
  assert.match(comparison, /slug: "petsafe-petporte-smart-flap"/);
  assert.match(comparison, /Netzbetriebene Klappe/);
});

test("Hub und Hersteller verlinken die neue Produktrolle", () => {
  const hub = read("src/content/pages/katzenklappen.md");
  const manufacturer = read("src/content/manufacturers/petsafe.md");
  for (const content of [hub, manufacturer]) {
    assert.match(content, /\/produkt\/petsafe-petporte-smart-flap\//);
  }
});

test("Web-Audit und Visual-Prompt sind vorhanden", () => {
  const audit = JSON.parse(read("research/katzenklappen-phase-2-web-audit-2026-08-04.json"));
  assert.equal(audit.finding.decision, "create-product-and-integrate");
  const prompt = read("research/visual-prompts/petsafe-petporte-smart-flap-master-prompt.txt");
  assert.match(prompt, /nach "weiter" exakt das nächste/);
  assert.match(prompt, /keine App darstellen/);
});
