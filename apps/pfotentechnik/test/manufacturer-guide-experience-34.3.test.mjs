import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const app = process.cwd().endsWith("apps/pfotentechnik") ? process.cwd() : path.join(process.cwd(), "apps/pfotentechnik");
const read = (relative) => fs.readFileSync(path.join(app, relative), "utf8");
const manufacturerRoute = read("src/pages/hersteller/[manufacturer].astro");
const manufacturerComponent = read("src/components/manufacturer/ManufacturerExperience.astro");
const manufacturerModel = read("src/domain/manufacturerExperience/model.ts");
const guideRoute = read("src/pages/[slug].astro");
const guideComponent = read("src/components/guide/GuideExperience.astro");
const guideModel = read("src/domain/guideExperience/model.ts");
const pageSchema = read("src/content/schema/page.ts");

test("Manufacturer 34.3 has one generic portfolio journey", () => {
  assert.match(manufacturerRoute, /<ManufacturerExperience model=\{model\}/);
  assert.match(manufacturerComponent, /Wo solltest du anfangen\?/);
  assert.match(manufacturerComponent, /Portfolio nach Aufgabe/);
  assert.match(manufacturerComponent, /Editorial unabhängig bleiben/);
  assert.match(manufacturerComponent, /<ProductScore/);
  assert.match(manufacturerModel, /resolveProductMedia/);
  assert.doesNotMatch(`${manufacturerRoute}\n${manufacturerModel}\n${manufacturerComponent}`, /case\s+["'][a-z0-9-]+["']|switch\s*\(manufacturer/);
});

test("Manufacturer product selection is current, score-aware and category-diverse", () => {
  assert.match(manufacturerModel, /isCurrentProduct/);
  assert.match(manufacturerModel, /selectedFamilies/);
  assert.match(manufacturerModel, /externalEvidence/);
  assert.match(manufacturerModel, /toEditorialScore/);
  assert.doesNotMatch(manufacturerModel, /featuredProductSlugs/);
});

test("Guide 34.3 derives four compositions from existing metadata", () => {
  assert.match(guideModel, /"problem" \| "buying" \| "how-to" \| "explanation"/);
  assert.match(guideModel, /contentPlatform\?\.intent/);
  assert.match(guideModel, /classifyGuide/);
  assert.doesNotMatch(pageSchema, /guideType/);
  assert.doesNotMatch(guideModel, /page\.data\.slug\s*===|switch\s*\(page\.data\.slug/);
});

test("Guide answers early, preserves long-form content and uses contextual discovery", () => {
  assert.match(guideComponent, /pt-guide__answer/);
  assert.match(guideComponent, /pt-guide__summary/);
  assert.match(guideComponent, /Ausführlicher Ratgeber/);
  assert.match(guideRoute, /<Content \/>/);
  assert.match(guideRoute, /<FAQ items=\{assembledPage\.faq\}/);
  assert.match(guideModel, /kind === "buying" \? productCandidates/);
  assert.match(guideModel, /getBestComparison/);
  assert.doesNotMatch(`${guideRoute}\n${guideComponent}`, /Passende Kaufberatung öffnen|Geeignete Modelle gegenüberstellen|futterautomat-richtig-reinigen/);
});

test("Guide media is optional and never replaced by a generic rendered hero", () => {
  assert.match(guideModel, /heroImage: page\.data\.heroImage/);
  assert.match(guideComponent, /model\.heroImage &&/);
  assert.doesNotMatch(guideComponent, /hero-fallback|Bild nicht verfügbar[^\n]*hero/);
});

test("34.3 stays server-rendered, token-based and mobile-safe", () => {
  for (const source of [manufacturerComponent, guideComponent]) {
    assert.doesNotMatch(source, /<script|client:/);
    assert.doesNotMatch(source, /!important/);
    assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i);
    assert.match(source, /focus-visible/);
  }
  assert.match(guideComponent, /overflow-x: auto/);
  assert.match(guideComponent, /<details id="guide-main"/);
  assert.match(manufacturerComponent, /Quellen und Datengrundlage/);
});

test("Frozen Category route remains on the 34.2 Experience branch", () => {
  assert.match(guideRoute, /categoryModel \? \(/);
  assert.match(guideRoute, /<CategoryExperience model=\{categoryModel\} authorName=\{author\.name\} updatedAt=\{updatedAt\} \/>/);
});
