#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PATCH_ID = "pfotentechnik-topical-authority-runtime-fix-1.1.3";

function findRepoRoot(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Root nicht gefunden.");
}

function fail(message) {
  console.error(`[${PATCH_ID}] FEHLER: ${message}`);
  process.exit(1);
}

const repoRoot = findRepoRoot(process.cwd());
const appRoot = path.join(repoRoot, "apps", "pfotentechnik");
const pageFile = path.join(appRoot, "src", "pages", "admin", "seo", "topical-authority.astro");
const testFile = path.join(appRoot, "test", "topical-authority-center.test.mjs");
const loaderFile = path.join(appRoot, "src", "lib", "seo", "topical-authority", "loadTopicalAuthority.ts");

for (const file of [pageFile, testFile, loaderFile]) {
  if (!fs.existsSync(file)) fail(`Pflichtdatei fehlt: ${path.relative(repoRoot, file)}`);
}

let page = fs.readFileSync(pageFile, "utf8");
const originalPage = page;

const replacements = [
  ["{data.clusters.map((cluster) => (", "{(data.clusters ?? []).map((cluster) => ("],
  ["{cluster.gaps.map((gap) => <li>{gap}</li>)}", "{(cluster.gaps ?? []).map((gap) => <li>{gap}</li>)}"],
  ["{cluster.documents.map((document) => (", "{(cluster.documents ?? []).map((document) => ("],
  ["{data.opportunities.map((opportunity, index) => (", "{(data.opportunities ?? []).map((opportunity, index) => ("],
  ["{data.orphanCandidates.map((document) => (", "{(data.orphanCandidates ?? []).map((document) => ("],
  ["{Object.entries(cluster.coverage).map(([key, value]) => (", "{Object.entries(cluster.coverage ?? {}).map(([key, value]) => ("],
];

for (const [before, after] of replacements) {
  if (page.includes(before)) page = page.replaceAll(before, after);
}

// Absicherung von length-Zugriffen.
page = page
  .replaceAll("cluster.gaps.length", "(cluster.gaps ?? []).length")
  .replaceAll("cluster.documents.length", "(cluster.documents ?? []).length")
  .replaceAll("data.orphanCandidates.length", "(data.orphanCandidates ?? []).length");

if (page === originalPage) {
  const alreadySafe =
    page.includes("(data.clusters ?? []).map") &&
    page.includes("(data.opportunities ?? []).map") &&
    page.includes("(data.orphanCandidates ?? []).map");
  if (!alreadySafe) {
    fail("Die erwarteten Astro-Strukturen konnten nicht sicher erkannt werden.");
  }
}

const testSource = `import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), "utf8");

test("Navigation und Seite sind integriert", () => {
  const layout = read("src/layouts/SeoAdminLayout.astro");
  const page = read("src/pages/admin/seo/topical-authority.astro");

  assert.match(layout, /"topical-authority"/);
  assert.match(layout, /\\/admin\\/seo\\/topical-authority\\//);
  assert.match(page, /SeoAdminLayout/);
  assert.match(page, /active="topical-authority"/);
  assert.match(page, /@media \\(max-width:/);
  assert.match(page, /var\\(--seo-/);
});

test("Loader analysiert Cluster und Links mit strenger Taxonomie", () => {
  const loader = read("src/lib/seo/topical-authority/loadTopicalAuthority.ts");

  for (const token of [
    "CLUSTER_DEFINITIONS",
    "loadCollection",
    "belongsToCluster",
    "slugPatterns",
    "titlePatterns",
    "descriptionPatterns",
    "bodyPatterns",
    "excludePatterns",
    "calculateLinkCoverage",
    "buildOpportunities",
    "detectOrphans",
    "export function loadTopicalAuthority",
  ]) {
    assert.ok(loader.includes(token), \`Loader enthält: \${token}\`);
  }

  assert.match(loader, /if \\(document\\.type === "manufacturer"\\) return false;/);
  assert.match(loader, /const score = members\\.length === 0\\s*\\? 0/);
  assert.match(loader, /slugPatterns: \\[\\/katzentoilette\\/i/);
});

test("Topical-Authority-Seite toleriert fehlende optionale Arrays", () => {
  const page = read("src/pages/admin/seo/topical-authority.astro");

  assert.match(page, /\\(data\\.clusters \\?\\? \\[\\]\\)\\.map/);
  assert.match(page, /\\(data\\.opportunities \\?\\? \\[\\]\\)\\.map/);
  assert.match(page, /\\(data\\.orphanCandidates \\?\\? \\[\\]\\)\\.map/);
  assert.match(page, /Object\\.entries\\(cluster\\.coverage \\?\\? \\{\\}\\)\\.map/);
  assert.match(page, /\\(cluster\\.documents \\?\\? \\[\\]\\)\\.map/);
});
`;

const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function backup(file) {
  const target = path.join(backupRoot, path.relative(repoRoot, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

backup(pageFile);
backup(testFile);

fs.writeFileSync(pageFile, page, "utf8");
fs.writeFileSync(testFile, testSource, "utf8");

console.log(`[${PATCH_ID}] Korrigiert: ${path.relative(repoRoot, pageFile)}`);
console.log(`[${PATCH_ID}] Korrigiert: ${path.relative(repoRoot, testFile)}`);
console.log(`[${PATCH_ID}] Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Behoben:");
console.log("- Build-Abbruch durch .map() auf undefined");
console.log("- veralteter Test gegen alte Loader-Implementierung");
console.log("- fehlende Fallbacks für Cluster, Opportunities, Dokumente und Orphan-Kandidaten");
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run test:topical-authority");
console.log("npm --workspace apps/pfotentechnik run audit:topical-authority:strict");
console.log("npm --workspace apps/pfotentechnik run build");
