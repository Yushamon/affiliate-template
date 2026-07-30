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

test("globale Journey ist in Ratgeber, Vergleich und Produkt eingebaut", () => {
  const files = [
    "src/pages/[slug].astro",
    "src/pages/vergleiche/[comparison].astro",
    "src/pages/produkt/[product].astro",
  ];
  for (const file of files) {
    const source = read(file);
    assert.equal((source.match(/import DecisionJourney/g) ?? []).length, 1, file);
    assert.equal((source.match(/<DecisionJourney/g) ?? []).length, 1, file);
  }
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
