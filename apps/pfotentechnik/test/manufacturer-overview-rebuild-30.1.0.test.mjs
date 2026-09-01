import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd().endsWith("apps/pfotentechnik") ? process.cwd() : path.join(process.cwd(), "apps/pfotentechnik");
const page = path.join(root, "src/pages/hersteller/[manufacturer].astro");
const component = path.join(root, "src/components/manufacturer/ManufacturerExperience.astro");
const model = path.join(root, "src/domain/manufacturerExperience/model.ts");

test("Herstellerseite nutzt ausschließlich die systemische 34.3 Experience", () => {
  const pageSource = fs.readFileSync(page, "utf8");
  assert.match(pageSource, /<ManufacturerExperience/);
  assert.match(pageSource, /buildManufacturerExperienceModel/);
  assert.doesNotMatch(pageSource, /<header class="manufacturer-hero"/);
  assert.doesNotMatch(pageSource, /MutationObserver|ptScoreNormalized|featuredProductSlugs/);
});

test("Manufacturer Experience besitzt eigene, kollisionsfreie CSS-Ownership", () => {
  const source = fs.readFileSync(component, "utf8");
  assert.match(source, /data-manufacturer-experience="34\.3"/);
  assert.match(source, /pt-manufacturer__hero/);
  assert.match(source, /pt-manufacturer__start/);
  assert.doesNotMatch(source, /!important/);
  assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i);
});

test("Portfolio, Produktauswahl und Unterschiede werden generisch aus Daten gebaut", () => {
  const source = fs.readFileSync(model, "utf8");
  assert.match(source, /familyMap/);
  assert.match(source, /resolveProductMedia/);
  assert.match(source, /relevantComparisons/);
  assert.match(source, /differenceLabels/);
  assert.doesNotMatch(source, /case\s+["']|switch\s*\(manufacturer/);
});
