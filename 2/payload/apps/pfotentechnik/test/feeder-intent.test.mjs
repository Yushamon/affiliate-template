import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(appRoot, file), "utf8");

test("Decision Journey verwendet Entscheidungsstufen statt Dokumenttypen", () => {
  const source = read("src/domain/seo/feederIntentMatrix.ts");
  assert.match(source, /"orientation"/);
  assert.match(source, /"problem"/);
  assert.match(source, /"evaluation"/);
  assert.match(source, /"decision"/);
  assert.match(source, /"support"/);
});

test("Hersteller sind kein Pflichtschritt der Journey", () => {
  const component = read("src/components/FeederIntentJourney.astro");
  const matrix = read("src/domain/seo/feederIntentMatrix.ts");
  assert.doesNotMatch(component, /manufacturers/);
  assert.doesNotMatch(component, /kind:\s*"Hersteller"/);
  assert.doesNotMatch(matrix, /\/hersteller\//);
});

test("Journey priorisiert Vergleich, Produkt und Wissen", () => {
  const source = read("src/components/FeederIntentJourney.astro");
  assert.match(source, /comparisonStep/);
  assert.match(source, /topProduct/);
  assert.match(source, /knowledgeStep/);
});

test("Produktwahl ist strikt auf Futterautomaten begrenzt", () => {
  const source = read("src/components/FeederIntentJourney.astro");
  assert.match(source, /category\?\.key === "futterautomaten"/);
});

test("Audit erkennt Sackgassen und doppelte Intent-Owner", () => {
  const source = read("scripts/seo/audit-feeder-intent.mjs");
  assert.match(source, /DECISION_DEAD_END/);
  assert.match(source, /MULTIPLE_INFORMATION_OWNERS/);
  assert.match(source, /MULTIPLE_COMPARISON_OWNERS/);
});

test("Ratgeber-Template rendert Journey exakt einmal", () => {
  const source = read("src/pages/[slug].astro");
  assert.equal(
    (source.match(/import FeederIntentJourney/g) ?? []).length,
    1,
  );
  assert.equal(
    (source.match(/<FeederIntentJourney/g) ?? []).length,
    1,
  );
  assert.doesNotMatch(source, /manufacturers=\{manufacturers\}/);
});
