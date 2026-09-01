import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(appRoot, file), "utf8");

test("globale Engine kennt alle Kerncluster", () => {
  const source = read("src/domain/decisionJourney/registry.ts");
  for (const cluster of ["futterautomaten", "trinkbrunnen", "gps-tracker", "katzenklappen"]) {
    assert.match(source, new RegExp(`id: "${cluster}"`));
  }
});

test("Hersteller sind kein Standard-Schritt", () => {
  const source = read("src/domain/decisionJourney/registry.ts");
  const component = read("src/components/DecisionJourney.astro");
  assert.doesNotMatch(source, /"manufacturer"/);
  assert.doesNotMatch(component, /Hersteller/);
});

test("current experiences expose a contextual next-step journey", () => {
  const guideRoute = read("src/pages/[slug].astro");
  const guide = read("src/components/guide/GuideExperience.astro");
  const comparison = read("src/pages/vergleiche/[comparison].astro");
  const product = read("src/pages/produkt/[product].astro");

  assert.match(guideRoute, /<GuideExperience/);
  assert.match(guide, /model\.nextSteps\.map/);
  assert.equal((comparison.match(/import DecisionJourney/g) ?? []).length, 1);
  assert.equal((comparison.match(/<DecisionJourney/g) ?? []).length, 1);
  assert.match(product, /import DecisionNextSteps/);
  assert.match(product, /<DecisionNextSteps/);
});

test("Strict blockiert nur technische Fehler", () => {
  const source = read("scripts/seo/audit-decision-journeys.mjs");
  assert.match(source, /strict && technical\.length > 0/);
  assert.doesNotMatch(source, /strict && editorial\.length/);
});

test("alte Feeder-Sonderlogik wird nicht mehr gerendert", () => {
  const source = read("src/pages/[slug].astro");
  assert.doesNotMatch(source, /FeederIntentJourney/);
});
