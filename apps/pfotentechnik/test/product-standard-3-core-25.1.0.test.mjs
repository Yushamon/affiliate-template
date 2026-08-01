import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const COMPONENTS = path.join(APP, "src", "components", "product-experience-2");
const DOMAIN = path.join(APP, "src", "domain", "productExperience");

const readComponent = (name) => fs.readFileSync(path.join(COMPONENTS, name), "utf8");
const readDomain = (name) => fs.readFileSync(path.join(DOMAIN, name), "utf8");

test("Decision Facts werden vor Nutzung und Fit ausgespielt", () => {
  const source = readComponent("ProductExperience2.astro");
  const facts = source.indexOf("<ProductDecisionFacts2");
  const usage = source.indexOf("<ProductEverydayTimeline");
  const fit = source.indexOf("<ProductCategoryFitAssistant");
  assert.ok(facts >= 0);
  assert.ok(facts < usage);
  assert.ok(facts < fit);
});

test("Fehlkäufe erscheinen nur mit expliziten Daten", () => {
  const source = readDomain("model.ts");
  assert.match(source, /data\.purchaseMistakes/);
  assert.doesNotMatch(source, /purchaseMistakes\s*=\s*model\.notFor/);
});

test("Konsequenzen werden aus technischen Daten abgeleitet", () => {
  const source = readDomain("consequences.ts");
  assert.match(source, /buildDecisionFacts/);
  assert.match(source, /Kapazität|kapazitaet/i);
  assert.match(source, /App|WLAN/);
  assert.match(source, /material/i);
  assert.match(source, /gesamtkosten/i);
});

test("Neue Komponenten sind mobile-first, dark-mode-tokenbasiert und ohne important", () => {
  for (const name of ["ProductDecisionFacts2.astro", "ProductPurchaseMistakes2.astro"]) {
    const source = readComponent(name);
    assert.doesNotMatch(source, /!important/);
    assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i);
    assert.match(source, /@media \(min-width:/);
    assert.doesNotMatch(source, /@media \(max-width:/);
  }
});

test("Decision Facts erklären Konsequenzen statt nur Daten zu wiederholen", () => {
  const source = readComponent("ProductDecisionFacts2.astro");
  assert.match(source, /Was die Daten wirklich bedeuten/);
  assert.match(source, /\{fact\.consequence\}/);
});

test("Fehlkauf-Bereich begrenzt sich auf drei Fälle", () => {
  const source = readComponent("ProductPurchaseMistakes2.astro");
  assert.match(source, /items\.slice\(0,\s*3\)/);
});
