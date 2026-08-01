import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const COMPONENTS = path.join(APP, "src", "components", "product-experience-2");
const RECOMMENDATIONS = path.join(APP, "src", "domain", "recommendationLinks.ts");

const read = (name) => fs.readFileSync(path.join(COMPONENTS, name), "utf8");

test("Quellenbox ist kompakt und verwendet keine Hakenliste", () => {
  const source = read("ProductEvidence2.astro");
  assert.match(source, /Unsere Quellen/);
  assert.match(source, /So ist die Einordnung belegt/);
  assert.doesNotMatch(source, />✓</);
});

test("Decision Facts priorisieren Wert und Konsequenz", () => {
  const source = read("ProductDecisionFacts2.astro");
  assert.match(source, /Was die Daten wirklich bedeuten/);
  assert.match(source, /\{fact\.value\}/);
  assert.match(source, /→/);
});

test("Stärken und Schwächen vermeiden doppelte Symbole", () => {
  const source = read("ProductDetails2.astro");
  assert.doesNotMatch(source, />✓</);
  assert.doesNotMatch(source, />×</);
  assert.match(source, /details li::before/);
});

test("Neue Komponenten bleiben mobile-first und tokenbasiert", () => {
  for (const name of ["ProductEvidence2.astro", "ProductDecisionFacts2.astro", "ProductDetails2.astro"]) {
    const source = read(name);
    assert.doesNotMatch(source, /!important/);
    assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i);
    assert.doesNotMatch(source, /@media\s*\(max-width:/);
  }
});

test("Recommendation Engine enthält harte Themenkompatibilität", () => {
  const source = fs.readFileSync(RECOMMENDATIONS, "utf8");
  assert.match(source, /hasCompatibleRecommendationTopic/);
  assert.match(source, /source\.topics\.size/);
  assert.match(source, /candidate\.topics\.size/);
  assert.match(source, /hasCompatibleRecommendationTopic\(sourceContext, candidateContext\)/);
  assert.match(source, /Number\.NEGATIVE_INFINITY/);
});
