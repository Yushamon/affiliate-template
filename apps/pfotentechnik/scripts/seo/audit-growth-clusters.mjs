#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCT_COVERAGE } from "../../src/lib/seo/topical-authority/product-coverage.data.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ROOT = path.resolve(APP_ROOT, "../..");
const reportDir = path.join(APP_ROOT, "reports", "seo-growth");
const errors = [];
const warnings = [];

const read = (relative) => {
  const file = path.join(ROOT, relative);
  if (!fs.existsSync(file)) {
    errors.push(`Datei fehlt: ${relative}`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
};

const requireText = (text, needle, message) => {
  if (!text.includes(needle)) errors.push(message);
};

const taxonomy = read("apps/pfotentechnik/src/domain/content/linkTaxonomy.data.mjs");
const recommendations = read("apps/pfotentechnik/src/domain/recommendationLinks.ts");
const cameraHub = read("apps/pfotentechnik/src/content/pages/haustierkameras.md");
const litterHub = read("apps/pfotentechnik/src/content/pages/automatische-katzentoiletten.md");
const catFlapHub = read("apps/pfotentechnik/src/content/pages/katzenklappen.md");
const cameraComparison = read("apps/pfotentechnik/src/content/comparisons/beste-haustierkameras.md");
const litterComparison = read("apps/pfotentechnik/src/content/comparisons/beste-automatische-katzentoiletten.md");
const catFlapComparison = read("apps/pfotentechnik/src/content/comparisons/beste-mikrochip-katzenklappen.md");

const clusters = [
  ["Haustierkameras", cameraHub, cameraComparison, "/haustierkameras/", "/vergleiche/beste-haustierkameras/"],
  ["Automatische Katzentoiletten", litterHub, litterComparison, "/automatische-katzentoiletten/", "/vergleiche/beste-automatische-katzentoiletten/"],
  ["Katzenklappen", catFlapHub, catFlapComparison, "/katzenklappen/", "/vergleiche/beste-mikrochip-katzenklappen/"]
];

for (const [name, hub, comparison, hubPath, comparisonPath] of clusters) {
  requireText(hub, "contentPlatform:", `${name}: contentPlatform fehlt.`);
  requireText(hub, "decisionJourney:", `${name}: decisionJourney fehlt.`);
  requireText(hub, "linking:", `${name}: Linking-Kontext fehlt.`);
  requireText(hub, `canonical: "${hubPath}"`, `${name}: Hub-Canonical fehlt oder ist falsch.`);
  requireText(comparison, `canonical: "${comparisonPath}"`, `${name}: Vergleichs-Canonical fehlt oder ist falsch.`);
  requireText(taxonomy, `href: "${hubPath}"`, `${name}: Hub ist in der Link-Taxonomie nicht routbar.`);
  requireText(taxonomy, `href: "${comparisonPath}"`, `${name}: Vergleich ist in der Link-Taxonomie nicht routbar.`);
}

requireText(recommendations, '| "katzentoiletten"', "Empfehlungslogik kennt Katzentoiletten nicht als Familie.");
requireText(recommendations, '["katzentoiletten",', "Empfehlungslogik besitzt kein Katzentoiletten-Muster.");

const decisionCoverage = [
  ["Katzentoiletten", "katzentoiletten", litterHub, litterComparison, "beste-automatische-katzentoiletten"],
  ["Haustierkameras", "haustierkameras", cameraHub, cameraComparison, "beste-haustierkameras"],
  ["Katzenklappen", "katzenklappen", catFlapHub, catFlapComparison, "beste-mikrochip-katzenklappen"],
];

for (const [label, clusterId, hub, comparison, comparisonSlug] of decisionCoverage) {
  const coverage = PRODUCT_COVERAGE[clusterId];
  if (!coverage) {
    errors.push(`${label}: redaktionelle Product Coverage fehlt.`);
    continue;
  }
  if (coverage.confirmedAGaps.length) {
    errors.push(`${label}: bestätigte A-Gaps offen: ${coverage.confirmedAGaps.join(", ")}.`);
  }
  for (const slug of coverage.decisionProductSlugs) {
    const product = read(`apps/pfotentechnik/src/content/products/${slug}.md`);
    requireText(hub, `"${slug}"`, `${label}-Hub führt Decision-Produkt ${slug} nicht.`);
    requireText(comparison, `slug: "${slug}"`, `${label}-Vergleich enthält Decision-Produkt ${slug} nicht.`);
    requireText(product, comparisonSlug, `${slug}: Rückverweis auf Vergleich fehlt.`);
  }
}

for (const marker of ["seo:", "premiumBlocks:", "evidenceSources:", "faq:"]) {
  requireText(cameraHub, marker, `Haustierkamera-Hub: ${marker} fehlt.`);
}

fs.mkdirSync(reportDir, { recursive: true });
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: errors.length ? "error" : "ok",
  clusters: clusters.map(([name]) => name),
  errors,
  warnings
};

fs.writeFileSync(path.join(reportDir, "growth-clusters-latest.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportDir, "growth-clusters-latest.md"), [
  "# SEO Growth Clusters",
  "",
  `- Status: ${report.status.toUpperCase()}`,
  `- Cluster: ${report.clusters.join(", ")}`,
  `- Fehler: ${errors.length}`,
  `- Warnungen: ${warnings.length}`,
  "",
  "## Fehler",
  "",
  ...(errors.length ? errors.map((item) => `- ${item}`) : ["Keine."]),
  "",
  "## Warnungen",
  "",
  ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["Keine."]),
  ""
].join("\n"), "utf8");

console.log("# SEO Growth Clusters");
console.log(`Status: ${report.status.toUpperCase()}`);
console.log(`Fehler: ${errors.length}`);
console.log(`Warnungen: ${warnings.length}`);

if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}
