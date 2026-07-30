#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-feeder-cluster-consolidation-1.0.0";
const here = path.dirname(fileURLToPath(import.meta.url));
const payloadRoot = path.join(here, "payload");

function findRepoRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) throw new Error("Repository-Root nicht gefunden.");
    current = parent;
  }
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const repoRoot = findRepoRoot(process.cwd());
const appRoot = path.join(repoRoot, "apps", "pfotentechnik");
const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

const payloadFiles = walk(payloadRoot);
for (const source of payloadFiles) {
  const relative = path.relative(payloadRoot, source);
  const target = path.join(repoRoot, relative);

  if (fs.existsSync(target)) {
    const backup = path.join(backupRoot, relative);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(target, backup);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`[${PATCH_ID}] Geschrieben: ${relative}`);
}

const pageFile = path.join(appRoot, "src", "pages", "[slug].astro");
let page = fs.readFileSync(pageFile, "utf8");

const importLine =
  'import FeederIntentJourney from "../components/FeederIntentJourney.astro";';
if (!page.includes(importLine)) {
  const marker =
    'import DecisionNextSteps from "../components/DecisionNextSteps.astro";';
  if (!page.includes(marker)) throw new Error("Import-Einfügepunkt fehlt.");
  page = page.replace(marker, `${marker}\n${importLine}`);
}

const journeyMarkup = `    <FeederIntentJourney
      slug={page.data.slug}
      pages={pages}
      products={products}
      comparisons={comparisons}
      manufacturers={manufacturers}
    />

`;

if (!page.includes("<FeederIntentJourney")) {
  const marker = `    {
      isRecommendationPage && moneyPageNextSteps.length > 0 && (`;
  if (!page.includes(marker)) throw new Error("Journey-Einfügepunkt fehlt.");
  page = page.replace(marker, journeyMarkup + marker);
}

fs.writeFileSync(pageFile, page, "utf8");
console.log(`[${PATCH_ID}] Geändert: apps/pfotentechnik/src/pages/[slug].astro`);

const packageFile = path.join(appRoot, "package.json");
const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
pkg.scripts["audit:feeder-intent"] =
  "node --experimental-strip-types scripts/seo/audit-feeder-intent.mjs";
pkg.scripts["audit:feeder-intent:strict"] =
  "node --experimental-strip-types scripts/seo/audit-feeder-intent.mjs --strict";
pkg.scripts["test:feeder-intent"] =
  "node --test test/feeder-intent.test.mjs";
fs.writeFileSync(packageFile, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log(`[${PATCH_ID}] Geändert: apps/pfotentechnik/package.json`);

console.log("");
console.log("Umgesetzt:");
console.log("- zentrale Intent-Matrix für den Futterautomaten-Cluster");
console.log("- Intent-spezifische Hauptfragen und Zielseiten");
console.log("- Journey-Navigation Ratgeber → Vergleich → Produkt → Hersteller");
console.log("- automatische Filterung auf tatsächlich vorhandene Routen");
console.log("- Duplicate-Intent- und Journey-Audit");
console.log("- maschinenlesbare Intent-Matrix");
console.log("- SEO-Copilot-Aufgabenreport");
console.log("- Regressionstests");
console.log("");
console.log(`Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Validierung:");
console.log("npm --workspace apps/pfotentechnik run test:feeder-intent");
console.log("npm --workspace apps/pfotentechnik run audit:feeder-intent");
console.log("npm --workspace apps/pfotentechnik run audit:feeder-intent:strict");
console.log("npm --workspace apps/pfotentechnik run build");
