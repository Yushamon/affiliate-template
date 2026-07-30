import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(appRoot, file), "utf8");

test("Intent-Matrix besitzt eindeutige IDs", () => {
  const source = read("src/domain/seo/feederIntentMatrix.ts");
  const ids = [...source.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.ok(ids.length >= 10);
  assert.equal(new Set(ids).size, ids.length);
});

test("Futterautomaten-Hub ist die zentrale Rückfallebene", () => {
  const source = read("src/domain/seo/feederIntentMatrix.ts");
  assert.match(source, /FEEDER_HUB_ROUTE = "\/smarte-futterautomaten\/"/);
  assert.match(source, /buildFeederJourney/);
});

test("Journey-Komponente verknüpft Ratgeber, Vergleiche, Produkte und Hersteller", () => {
  const source = read("src/components/FeederIntentJourney.astro");
  assert.match(source, /kind: "Produkt"/);
  assert.match(source, /kind: "Hersteller"/);
  assert.match(source, /buildFeederJourney/);
  assert.match(source, /category\?\.key === "futterautomaten"/);
});

test("Intent-Audit erzeugt Matrix und SEO-Copilot-Aufgaben", () => {
  const source = read("scripts/seo/audit-feeder-intent.mjs");
  assert.match(source, /intent-matrix\.json/);
  assert.match(source, /seo-copilot-tasks\.json/);
  assert.match(source, /MULTIPLE_INFORMATION_OWNERS/);
  assert.match(source, /JOURNEY_MISSING/);
});

test("Ratgeber-Template rendert die Intent-Journey", () => {
  const source = read("src/pages/[slug].astro");
  assert.match(source, /FeederIntentJourney/);
  assert.match(source, /slug=\{page\.data\.slug\}/);
});
