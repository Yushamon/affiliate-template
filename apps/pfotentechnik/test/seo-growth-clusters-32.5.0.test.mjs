import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const taxonomy = read("apps/pfotentechnik/src/domain/content/linkTaxonomy.data.mjs");
const recommendations = read("apps/pfotentechnik/src/domain/recommendationLinks.ts");
const cameraHub = read("apps/pfotentechnik/src/content/pages/haustierkameras.md");
const litterHub = read("apps/pfotentechnik/src/content/pages/automatische-katzentoiletten.md");
const litterComparison = read("apps/pfotentechnik/src/content/comparisons/beste-automatische-katzentoiletten.md");
const preflight = read("apps/pfotentechnik/scripts/seo/release-preflight.mjs");
const packageJson = JSON.parse(read("apps/pfotentechnik/package.json"));

test("neue Kerncluster besitzen routbare Hub-Einträge", () => {
  for (const href of ["/haustierkameras/", "/automatische-katzentoiletten/", "/katzenklappen/"]) {
    assert.ok(taxonomy.includes(`href: "${href}"`), href);
  }
});

test("neue Kerncluster besitzen routbare Vergleichseinträge", () => {
  for (const href of [
    "/vergleiche/beste-haustierkameras/",
    "/vergleiche/beste-automatische-katzentoiletten/",
    "/vergleiche/beste-mikrochip-katzenklappen/"
  ]) {
    assert.ok(taxonomy.includes(`href: "${href}"`), href);
  }
});

test("Katzentoiletten sind eine echte Empfehlungsfamilie", () => {
  assert.match(recommendations, /\| "katzentoiletten"/);
  assert.match(recommendations, /\["katzentoiletten",/);
  assert.match(recommendations, /"katzentoiletten"\]\.includes\(topic\)/);
});

test("Haustierkamera-Hub besitzt Premium- und Intent-Struktur", () => {
  for (const marker of [
    "contentPlatform:",
    'cluster: "haustierkameras"',
    'intent: "buying-guide"',
    "premiumBlocks:",
    "decisionJourney:",
    "evidenceSources:",
    'canonical: "/haustierkameras/"'
  ]) assert.ok(cameraHub.includes(marker), marker);
});

test("Katzentoiletten-Hub führt fünf aktuelle Produkte", () => {
  for (const slug of [
    "litter-robot-5-pro",
    "petkit-purobot-max-pro-2",
    "neakasa-m1-plus",
    "neakasa-m1-lite",
    "devoko-90l-automatisches-katzenklo"
  ]) assert.ok(litterHub.includes(`"${slug}"`), slug);
});

test("Katzentoiletten-Vergleich enthält fünf Modelle", () => {
  for (const slug of [
    "litter-robot-5-pro",
    "petkit-purobot-max-pro-2",
    "neakasa-m1-plus",
    "neakasa-m1-lite",
    "devoko-90l-automatisches-katzenklo"
  ]) assert.ok(litterComparison.includes(`slug: "${slug}"`), slug);
  assert.match(litterComparison, /5 Modelle/);
});

test("Growth-Audit ist Teil des Release-Preflights", () => {
  assert.equal(packageJson.scripts["audit:seo-growth-clusters"], "node scripts/seo/audit-growth-clusters.mjs");
  assert.match(preflight, /SEO-Wachstumscluster/);
  assert.match(preflight, /audit:seo-growth-clusters/);
});
