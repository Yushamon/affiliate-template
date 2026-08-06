import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();
const page = path.join(root, "apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro");
const component = path.join(root, "apps/pfotentechnik/src/components/manufacturer/ManufacturerOverviewHero.astro");

test("Herstellerseite nutzt ausschließlich den neuen Overview-Hero", () => {
  const pageSource = fs.readFileSync(page, "utf8");
  assert.match(pageSource, /<ManufacturerOverviewHero/);
  assert.doesNotMatch(pageSource, /<header class="manufacturer-hero"/);
  assert.doesNotMatch(pageSource, /PT manufacturer hero media 4\.2\.0/);
  assert.doesNotMatch(pageSource, /PT manufacturer media and score 4\.3\.0/);
  assert.doesNotMatch(pageSource, /pfotentechnik-manufacturer-hero-layout-30\.0\.[0-9]+/);
});

test("Neuer Hero besitzt eigene, kollisionsfreie CSS-Ownership", () => {
  const source = fs.readFileSync(component, "utf8");
  assert.match(source, /class="pt-manufacturer-overview"/);
  assert.match(source, /class="pt-manufacturer-overview__image"/);
  assert.match(source, /grid-template-areas:[\s\S]*"heading"[\s\S]*"visual"[\s\S]*"copy"/);
  assert.doesNotMatch(source, /!important/);
});
