import fs from "node:fs";
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
  assert.match(layout, /\/admin\/seo\/topical-authority\//);
  assert.match(page, /SeoAdminLayout/);
  assert.match(page, /active="topical-authority"/);
});

test("Loader nutzt strenge Cluster- und Linkanalyse", () => {
  const loader = read("src/lib/seo/topical-authority/loadTopicalAuthority.ts");
  for (const token of [
    "CLUSTER_DEFINITIONS",
    "belongsToCluster",
    "slugPatterns",
    "titlePatterns",
    "bodyPatterns",
    "excludePatterns",
    "calculateLinkCoverage",
    "buildOpportunities",
    "detectOrphans",
    "loadTopicalAuthority",
  ]) {
    assert.ok(loader.includes(token), `Loader enthält ${token}`);
  }
});

test("Seite schützt alle Listen vor undefined", () => {
  const page = read("src/pages/admin/seo/topical-authority.astro");
  for (const token of [
    "Array.isArray(loaded?.clusters)",
    "Array.isArray(loaded?.opportunities)",
    "Array.isArray(loaded?.orphanCandidates)",
    "Array.isArray(cluster?.gaps)",
    "Array.isArray(cluster?.documents)",
    "Object.entries(coverage)",
  ]) {
    assert.ok(page.includes(token), `Seite enthält ${token}`);
  }
});
