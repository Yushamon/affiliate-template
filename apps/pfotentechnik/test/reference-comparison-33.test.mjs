import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("33.3 comparison renderer is the shared production path", () => {
  const page = read("src/pages/vergleiche/[comparison].astro");
  assert.doesNotMatch(page, /comparison\.slug === "beste-futterautomaten-mit-kamera"/);
  assert.match(page, /<ComparisonProduction model=\{model\}/);
  assert.doesNotMatch(page, /<ComparisonShell model=\{model\}/);
  assert.match(page, /foundation=\{true\}/);
});

test("reference comparison reuses the existing comparison model and product data", () => {
  const component = read("src/components/comparison/ComparisonProduction.astro");
  assert.match(component, /ComparisonViewModel/);
  assert.match(component, /ComparisonExplorer/);
  assert.match(component, /getPriceDisplay/);
  assert.match(component, /model\.verdict\.winner/);
  assert.match(component, /model\.verdict\.alternative/);
  assert.match(component, /model\.rows\.filter\(\(row\) => row\.hasDifferences\)/);
});

test("reference comparison supplies a compact image-led decision flow without a parallel score or fit engine", () => {
  const component = read("src/components/comparison/ComparisonProduction.astro");
  for (const landmark of ["In 20 Sekunden entschieden", "Der Unterschied, der wirklich zählt", "Die entscheidenden Unterschiede", "Welcher passt zu dir?", "Alltag & Grenzen", "Weitere interessante Modelle", "Finale Entscheidung"]) {
    assert.match(component, new RegExp(landmark));
  }
  assert.match(component, /product\.image/);
  assert.match(component, /<EditorialScore/);
  assert.ok(component.indexOf('id="direktvergleich"') < component.indexOf('id="rc33-scenarios"'));
  assert.doesNotMatch(component, /ComparisonFit2|new Score|confidence calculation/i);
});

test("reference comparison keeps technical depth server-rendered behind native disclosure", () => {
  const page = read("src/pages/vergleiche/[comparison].astro");
  const component = read("src/components/comparison/ComparisonProduction.astro");
  assert.match(page, /comparison-content--production-depth/);
  assert.match(page, /<Content \/>/);
  assert.match(component, /Alle technischen Daten anzeigen/);
  assert.match(component, /model\.rows\.filter/);
  assert.match(component, /visibleAlternatives/);
});

test("reference comparison curates visible alternatives instead of rendering the complete data set", () => {
  const component = read("src/components/comparison/ComparisonProduction.astro");
  assert.match(component, /visibleAlternatives = alternatives\.slice/);
  assert.match(component, /visibleAlternatives\.map/);
  assert.doesNotMatch(component, /alternatives\.map/);
  assert.match(component, /Warum diese Auswahl\?/);
});
