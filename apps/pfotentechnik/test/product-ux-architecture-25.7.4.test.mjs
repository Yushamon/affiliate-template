import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const COMPONENTS = path.join(APP, "src", "components", "product-experience-2");
const DOMAIN = path.join(APP, "src", "domain", "productExperience");

const read = (file) => fs.readFileSync(file, "utf8");
const component = (name) => read(path.join(COMPONENTS, name));

test("Legacy-Produktlisten wirken nur auf direkte alte Inhaltslisten", () => {
  const files = [
    path.join(ROOT, "packages", "affiliate-core", "src", "styles", "product.css"),
    path.join(APP, "src", "styles", "pfotentechnik.css")
  ].filter(fs.existsSync);
  const css = files.map(read).join("\n");
  assert.doesNotMatch(css, /\.product-detail\s+li::before\s*\{/);
  assert.doesNotMatch(css, /\.product-detail\s+li\s*\{/);
  assert.doesNotMatch(css, /\.product-detail\s+ul\s*\{/);
  assert.match(css, /\.product-detail\s*>\s*ul\s*>\s*li::before\s*\{/);
});

test("Verdict besitzt seine Marker selbst und verwendet keine Gegenregel", () => {
  const source = component("ProductVerdict2.astro");
  assert.match(source, /is-positive li::before[\s\S]*content:\s*"✓"/);
  assert.match(source, /is-negative li::before[\s\S]*content:\s*"×"/);
  assert.doesNotMatch(source, /verdict__card\.verdict__card li::before/);
  assert.doesNotMatch(source, /verdict__marker/);
});

test("Timeline und Produkt-Fit benötigen keine Marker-Resets", () => {
  assert.doesNotMatch(component("ProductEverydayTimeline.astro"), /timeline\.timeline li::before/);
  assert.doesNotMatch(component("ProductCategoryFitAssistant.astro"), /category-fit\.category-fit li::before/);
});

test("Gallery V29 besitzt eine sichtbare mobile Bildfläche und Airbnb-Crop", () => {
  const componentSource = component("ProductGallery29.astro");
  const css = component("product-gallery-29.css");
  assert.match(componentSource, /data-product-gallery-v29/);
  assert.match(css, /height:\s*clamp\(280px, 42svh, 440px\)/);
  assert.match(css, /min-height:\s*280px/);
  assert.match(css, /object-fit:\s*cover/);
  assert.match(css, /object-position:\s*center/);
});

test("Hero nutzt die zentral berechnete Eignungszusammenfassung", () => {
  const source = component("ProductHero2.astro");
  assert.match(source, /model\.suitabilitySummary/);
  assert.doesNotMatch(source, /idealFor\[0\]|idealFor\.slice/);
});

test("Produktmodell leitet Eignung und technische Fähigkeiten strukturiert ab", () => {
  const source = read(path.join(DOMAIN, "model.ts"));
  assert.match(source, /const buildSuitabilitySummary =/);
  assert.match(source, /kleine bis mittelgroße Hunde/);
  assert.match(source, /foodTypesFromData/);
  assert.match(source, /booleanFromSpecs/);
  assert.match(source, /batteryCapabilityFromSpecs/);
  assert.match(source, /const decisionProfile = decisionProfileFor\(data, price\)/);
  assert.doesNotMatch(source, /decisionProfileFor\(data, price\)\./);
});

test("Akku, Backup-Batterie und Netzbetrieb erhalten unterschiedliche Folgen", () => {
  const source = read(path.join(DOMAIN, "consequences.ts"));
  assert.match(source, /Kein integrierter Akku:/);
  assert.match(source, /Batterien oder Notstrom überbrücken/);
  assert.match(source, /am Netz, kabellos oder nur mit einer Backup-Lösung/);
  assert.match(source, /supplied === GENERIC_POWER_CONSEQUENCE/);
  assert.doesNotMatch(source, /key\.includes\("akku"\) \|\| key\.includes\("batterie"\)/);
});
