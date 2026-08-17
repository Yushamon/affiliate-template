#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-ready-gate-32.6.5";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

const root = findRoot(process.cwd());
const file = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "domain",
  "comparison",
  "buildComparisonViewModel.ts"
);

if (!fs.existsSync(file)) {
  throw new Error(`[${PATCH}] Datei fehlt: ${path.relative(root, file)}`);
}

let raw = fs.readFileSync(file, "utf8");

const importNeedle = `import { deriveProductOperations } from "../../lib/product-operations/policy.mjs";`;
const importReplacement = `${importNeedle}
import { getComparisonSelectionRule } from "./comparisonSelectionRegistry";`;

if (!raw.includes(`getComparisonSelectionRule`)) {
  if (!raw.includes(importNeedle)) {
    throw new Error(`[${PATCH}] Import-Anker nicht gefunden.`);
  }
  raw = raw.replace(importNeedle, importReplacement);
}

const oldBlock = `  const backlinkItems = products
    .filter((product) =>
      product.data.comparisons.includes(data.slug) &&
      !explicitSlugs.has(product.data.slug)
    )
    .map((product) => ({
      slug: product.data.slug,
      label: product.data.title,
      type: "product" as const,
      recommendation: product.data.recommendation,
      values: {}
    }));

  const items = [...explicitItems, ...backlinkItems];`;

const newBlock = `  const selectionRule = getComparisonSelectionRule(data.slug);
  const hybridMembershipEnabled = selectionRule?.mode === "ready";

  const backlinkItems = hybridMembershipEnabled
    ? products
        .filter((product) =>
          product.data.comparisons.includes(data.slug) &&
          !explicitSlugs.has(product.data.slug)
        )
        .map((product) => ({
          slug: product.data.slug,
          label: product.data.title,
          type: "product" as const,
          recommendation: product.data.recommendation,
          values: {}
        }))
    : [];

  /*
   * Safety Gate 32.6.5
   *
   * Nur Vergleiche mit Registry-Status "ready" dürfen zusätzliche
   * product.comparisons[]-Backlinks automatisch übernehmen.
   *
   * Alle needs-data/backlink-transition Vergleiche bleiben vollständig
   * kuratiert über items[].
   */
  const items = [...explicitItems, ...backlinkItems];`;

if (!raw.includes(oldBlock)) {
  throw new Error(
    `[${PATCH}] Erwarteter Hybrid-Membership-Block aus 32.6.4 nicht gefunden.`
  );
}

const backup = `${file}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(file, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

raw = raw.replace(oldBlock, newBlock);
fs.writeFileSync(file, raw, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, file)}`);
console.log(`[${PATCH}] Hybrid-Mitgliedschaft nur noch für mode=ready aktiv.`);
console.log(`[${PATCH}] needs-data/backlink-transition bleiben kuratiert.`);
console.log(`[${PATCH}] Fertig.`);
