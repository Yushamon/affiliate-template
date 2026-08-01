import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const COMPONENTS = path.join(APP, "src", "components", "product-experience-2");
const MODEL = path.join(APP, "src", "domain", "productExperience", "model.ts");

const read = (name) => fs.readFileSync(path.join(COMPONENTS, name), "utf8");

test("Produktseite nutzt die neue Decision-first-Reihenfolge", () => {
  const source = read("ProductExperience2.astro");
  const order = [
    "ProductHero2",
    "ProductVerdict2",
    "ProductEvidence2",
    "ProductCommunityInsights2",
    "ProductEverydayTimeline",
    "ProductDecisionAssistant",
    "ProductDetails2",
    "ProductAlternatives2"
  ].map((name) => source.indexOf("<" + name));
  assert.ok(order.every((value) => value >= 0));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test("Hero ist mobile-first und enthält keine doppelte Ideal/Nicht-ideal-Matrix", () => {
  const source = read("ProductHero2.astro");
  assert.match(source, /Geeignet für/);
  assert.match(source, /Wichtigster Vorteil/);
  assert.match(source, /Größte Einschränkung/);
  assert.doesNotMatch(source, /Nicht ideal für/);
  assert.match(source, /@media \(min-width: 980px\)/);
  assert.doesNotMatch(source, /grid-template-columns:\s*minmax\(0,\s*1\.12fr\)[\s\S]{0,120}@media/);
});

test("Evidence zeigt einen Praxistest ausschließlich positiv und optional", () => {
  const source = read("ProductEvidence2.astro");
  assert.match(source, /Eigener Praxistest durchgeführt/);
  assert.doesNotMatch(source, /nicht durchgeführt|offen/i);
  assert.match(source, /evidence\?\.handsOn/);
});

test("Community-Bereich behauptet keine eigenen Tests und keine ungesicherten Prozentwerte", () => {
  const source = read("ProductCommunityInsights2.astro");
  assert.match(source, /keine einzelnen Rezensionen/i);
  assert.doesNotMatch(source, /\d+\s*%/);
  assert.doesNotMatch(source, /unsere Erfahrung zeigt/i);
});

test("Dark Mode bleibt tokenbasiert und neue Komponenten enthalten keine lokalen Hex-Farben", () => {
  for (const name of [
    "ProductHero2.astro",
    "ProductVerdict2.astro",
    "ProductEvidence2.astro",
    "ProductCommunityInsights2.astro",
    "ProductEverydayTimeline.astro",
    "ProductDetails2.astro"
  ]) {
    assert.doesNotMatch(read(name), /#[0-9a-f]{3,8}\b/i, name);
  }
  assert.match(read("ProductExperience2.astro"), /html\[data-theme="dark"\]/);
});

test("Komponenten vermeiden globale Elementselektoren und important", () => {
  for (const name of [
    "ProductHero2.astro",
    "ProductVerdict2.astro",
    "ProductEvidence2.astro",
    "ProductCommunityInsights2.astro",
    "ProductEverydayTimeline.astro",
    "ProductDetails2.astro"
  ]) {
    const source = read(name);
    assert.doesNotMatch(source, /!important/);
    assert.doesNotMatch(source, /^\s*(?:h1|h2|h3|p|article|header|dt|dd)\s*\{/m);
  }
});

test("Modell enthält Evidence und Community ohne erfundene Fallback-Erfahrungen", () => {
  const source = fs.readFileSync(MODEL, "utf8");
  assert.match(source, /evidenceSummary/);
  assert.match(source, /communityInsights/);
  assert.match(source, /data\.communityInsights/);
  assert.doesNotMatch(source, /Häufig gelobt.*fallback/i);
});
