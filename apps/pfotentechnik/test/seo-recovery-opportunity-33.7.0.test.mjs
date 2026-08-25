import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(app, relative), "utf8");

const audit = read("scripts/seo/audit-search-recovery.mjs");
const loader = read("src/lib/seo/loadRecovery.ts");
const cockpit = read("src/pages/admin/seo/cockpit.astro");
const preflight = read("scripts/seo/release-preflight.mjs");
const pkg = JSON.parse(read("package.json"));

test("Recovery nutzt ausschließlich GSC für Opportunity-Signale", () => {
  assert.match(audit, /gsc-dashboard-ranges\.json/);
  assert.match(audit, /provider:\s*"google"/);
  assert.doesNotMatch(audit, /bing-dashboard|search-dashboard-ranges/);
});

test("Migration Recovery prüft Redirect, Build, Canonical, Sitemap und interne Links", () => {
  for (const token of [
    "public\", \"_redirects",
    "mehrstufige Redirect-Kette",
    "Ziel fehlt im Build",
    "Self-Canonical fehlt",
    "Ziel fehlt in Sitemap",
    "interne Links zeigen noch auf alte URL",
  ]) assert.ok(audit.includes(token), token);
});

test("Ranking-Transfer blockiert keinen Release", () => {
  assert.match(audit, /status = "watch"/);
  assert.match(audit, /STRICT && technicalErrors > 0/);
  assert.doesNotMatch(audit, /STRICT && .*migrationWatch/);
});

test("Opportunity Layer priorisiert bestehende Seiten", () => {
  for (const token of ["rankingScore", "ctrPotential", "queryMatch", "commercialScore", "context", "confidence"]) {
    assert.ok(audit.includes(token), token);
  }
  assert.match(audit, /opportunities\.sort/);
});

test("Cockpit zeigt Recovery und Google Opportunities", () => {
  assert.match(cockpit, /loadSeoRecovery/);
  assert.match(cockpit, /data-seo-recovery/);
  assert.match(cockpit, /Migration Recovery/);
  assert.match(cockpit, /Google Opportunities/);
  assert.match(loader, /recovery-dashboard\.json/);
  assert.match(loader, /gsc-dashboard-ranges\.json/);
  assert.match(loader, /recoveryIsStale/);
});

test("Scripts und Release-Gate sind verdrahtet", () => {
  assert.equal(pkg.scripts["seo:recovery"], "node scripts/seo/audit-search-recovery.mjs");
  assert.equal(pkg.scripts["seo:recovery:strict"], "node scripts/seo/audit-search-recovery.mjs --strict");
  assert.equal(pkg.scripts["test:seo-recovery"], "node --test test/seo-recovery-opportunity-33.7.0.test.mjs");
  assert.match(pkg.scripts["seo:sync"], /search:sync.*seo:recovery/);
  const buildIndex = preflight.indexOf('Produktionsnaher Astro-Build');
  const recoveryIndex = preflight.indexOf('Search-Recovery-Vertrag');
  assert.ok(buildIndex >= 0 && recoveryIndex > buildIndex, "Recovery strict muss nach dem Build laufen");
});
