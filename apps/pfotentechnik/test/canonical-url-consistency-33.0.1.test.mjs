import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(app, "../..");
const read = (file) => fs.readFileSync(file, "utf8");

const page = read(path.join(app, "src/pages/[slug].astro"));
const filters = read(path.join(repo, "packages/affiliate-core/src/components/comparison/ComparisonHeroFilters.astro"));
const redirects = read(path.join(app, "public/_redirects"));
const pkg = JSON.parse(read(path.join(app, "package.json")));
const preflight = read(path.join(app, "scripts/seo/release-preflight.mjs"));
const projectConfig = read(path.join(app, "src/project.config.ts"));

test("Projekt verwendet non-www als kanonischen Host", () => {
  assert.match(projectConfig, /domain:\s*"https:\/\/pfotentechnik\.de"/);
});

test("Money-Page baut Filterzustand im Fragment", () => {
  assert.match(page, /baseHref\s*\+\s*"#direktvergleich"/);
  assert.match(page, /serialized\s*\?\s*"\?"\s*\+\s*serialized/);
  assert.doesNotMatch(page, /comparisonHref\.includes\("\?"\)/);
});

test("ComparisonHeroFilters liest Fragmentzustand", () => {
  assert.match(filters, /parseFragmentState/);
  assert.match(filters, /window\.location\.hash/);
  assert.match(filters, /fromFragment/);
});

test("Legacy-Filterqueries werden aus der URL entfernt", () => {
  assert.match(filters, /legacyQuery/);
  assert.match(filters, /next\.searchParams\.delete\(key\)/);
  assert.match(filters, /hasLegacyFilterQuery/);
});

test("Filteränderungen erzeugen keine Queryparameter", () => {
  const start = filters.indexOf("const syncUrl =");
  const end = filters.indexOf("const hasLegacyFilterQuery", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const syncBlock = filters.slice(start, end);
  assert.doesNotMatch(syncBlock, /searchParams\.set/);
  assert.match(syncBlock, /next\.hash/);
});

test("historische kaputte Vergleichsroute wird umgeleitet", () => {
  assert.match(redirects, /\/vergleiche\/-fuer-katzen\/\s+\/vergleiche\/\s+301/);
});

test("URL-Konsistenz ist Release-Gate", () => {
  assert.equal(pkg.scripts["audit:url-consistency:strict"], "node scripts/seo/audit-url-consistency.mjs --strict");
  assert.match(preflight, /Kanonische URL-Konsistenz/);
  assert.match(preflight, /audit:url-consistency:strict/);
});

test("URL-Audit verlangt Canonicals nur für indexierbare Seiten", () => {
  const audit = read(path.join(app, "scripts/seo/audit-url-consistency.mjs"));
  assert.match(audit, /isAdminRoute/);
  assert.match(audit, /isNoindex/);
  assert.match(audit, /canonicalRequired/);
});
