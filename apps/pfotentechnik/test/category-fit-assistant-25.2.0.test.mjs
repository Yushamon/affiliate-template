import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const COMPONENT = path.join(APP, "src", "components", "product-experience-2", "ProductCategoryFitAssistant.astro");
const ENGINE = path.join(APP, "src", "domain", "productExperience", "categoryFitEngine.ts");
const EXPERIENCE = path.join(APP, "src", "components", "product-experience-2", "ProductExperience2.astro");
const MODEL = path.join(APP, "src", "domain", "productExperience", "model.ts");

const read = (file) => fs.readFileSync(file, "utf8");

test("Fit-Assistent ersetzt den generischen Assistenten", () => {
  const source = read(EXPERIENCE);
  assert.match(source, /ProductCategoryFitAssistant/);
  assert.doesNotMatch(source, /<ProductDecisionAssistant/);
});

test("Vier kategoriespezifische Fragensätze sind vorhanden", () => {
  const source = read(ENGINE);
  assert.match(source, /feeder:/);
  assert.match(source, /fountain:/);
  assert.match(source, /tracker:/);
  assert.match(source, /"cat-flap":/);
});

test("Tracker fragt nicht nach Futter oder Kamera", () => {
  const source = read(ENGINE);
  const tracker = source.slice(source.indexOf("tracker:"), source.indexOf('"cat-flap":'));
  assert.match(tracker, /key:\s*"petSize"/);
  assert.match(tracker, /Abo akzeptabel/);
  assert.doesNotMatch(tracker, /Trockenfutter|Nassfutter|Kamera/);
});

test("Trinkbrunnen berücksichtigt Material und Stromversorgung", () => {
  const source = read(ENGINE);
  const fountain = source.slice(source.indexOf("fountain:"), source.indexOf("tracker:"));
  assert.match(fountain, /Material/);
  assert.match(fountain, /Stromversorgung/);
});

test("Komponente ist mobile-first, tokenbasiert und ohne important", () => {
  const source = read(COMPONENT);
  assert.match(source, /@media \(min-width:/);
  assert.doesNotMatch(source, /@media \(max-width:/);
  assert.doesNotMatch(source, /!important/);
  assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b/i);
  assert.match(source, /min-height:\s*44px/);
});

test("Modell erzeugt ein Category-Fit-Profil", () => {
  const source = read(MODEL);
  assert.match(source, /categoryFitProfile/);
  assert.match(source, /subscriptionRequired/);
  assert.match(source, /supportsChip/);
});
