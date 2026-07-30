#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const findRepoRoot = (startDirectory) => {
  let current = path.resolve(startDirectory);
  while (true) {
    const appCandidate = path.join(current, "apps", "pfotentechnik");
    if (fs.existsSync(appCandidate)) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
};

const repoRoot = findRepoRoot(scriptDir);
if (!repoRoot) {
  console.error("[topical-authority-plan] FEHLER: Repository-Root mit apps/pfotentechnik wurde nicht gefunden.");
  process.exit(1);
}
const appRoot = path.join(repoRoot, "apps", "pfotentechnik");
const advisorDir = path.join(appRoot, "src", "lib", "seo", "advisor");
const loaderFile = path.join(advisorDir, "loadWorkPackages.ts");
const planFile = path.join(advisorDir, "topical-authority-plan.ts");
const sourcePlan = path.join(path.dirname(fileURLToPath(import.meta.url)), "topical-authority-plan.ts");

const fail = (message) => {
  console.error(`[topical-authority-plan] FEHLER: ${message}`);
  process.exit(1);
};

if (!fs.existsSync(loaderFile)) fail(`Loader fehlt: ${loaderFile}`);
if (!fs.existsSync(sourcePlan)) fail(`Planquelle fehlt: ${sourcePlan}`);

const loader = fs.readFileSync(loaderFile, "utf8");
const importLine = 'import { topicalAuthorityOpportunities } from "./topical-authority-plan";';
const opportunityAnchor = "  const opportunities = [";
const activeIdsAnchor = "    ...opportunities.map((item) => item.id),";

if (!loader.includes(opportunityAnchor)) fail("Opportunities-Anker im Loader nicht gefunden.");
if (!loader.includes(activeIdsAnchor)) fail("activeTaskIds-Anker im Loader nicht gefunden.");

let nextLoader = loader;
if (!nextLoader.includes(importLine)) {
  const importAnchor = 'import { readCopilotWorkspace } from "../../seo-copilot/store.mjs";';
  if (!nextLoader.includes(importAnchor)) fail("Import-Anker im Loader nicht gefunden.");
  nextLoader = nextLoader.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

if (!nextLoader.includes("...topicalAuthorityOpportunities,")) {
  nextLoader = nextLoader.replace(
    opportunityAnchor,
    `${opportunityAnchor}\n    ...topicalAuthorityOpportunities,`
  );
}

const backupDir = path.join(repoRoot, ".patch-backups", `pfotentechnik-topical-authority-${new Date().toISOString().replace(/[:.]/g, "-")}`);
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(loaderFile, path.join(backupDir, "loadWorkPackages.ts"));

fs.copyFileSync(sourcePlan, planFile);
fs.writeFileSync(loaderFile, nextLoader, "utf8");

console.log("[topical-authority-plan] Installiert:");
console.log(`- ${path.relative(repoRoot, planFile)}`);
console.log(`- ${path.relative(repoRoot, loaderFile)}`);
console.log(`Backup: ${path.relative(repoRoot, backupDir)}`);
console.log("");
console.log("Danach ausführen:");
console.log("npm --workspace apps/pfotentechnik run build");
