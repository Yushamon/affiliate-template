import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), "utf8");

test("Topical Authority zeigt nur die fünf wichtigsten aktiven Chancen", () => {
  const page = read("src/pages/admin/seo/topical-authority.astro");
  assert.match(page, /data\.opportunities\.slice\(0, 5\)/);
  assert.match(page, /Top 5 aktive Chancen/);
  assert.match(page, /nächsthöher priorisierten Chancen rücken nach/);
});

test("Erledigte Futterautomaten-Konsolidierung verschwindet", () => {
  const loader = read("src/lib/seo/topical-authority/loadTopicalAuthority.ts");
  assert.match(loader, /feederConsolidationResolved/);
  assert.match(loader, /feeder-intent-owner: cluster-hub/);
  assert.match(loader, /feeder-intent-owner: compact-chooser/);
  assert.match(loader, /counts\.total >= 20 && !feederConsolidationResolved\(\)/);
});

test("Coverage-Chancen bilden eine rollierende Nachrückliste", () => {
  const loader = read("src/lib/seo/topical-authority/loadTopicalAuthority.ts");
  assert.match(loader, /pushCoverageOpportunities/);
  assert.match(loader, /coverage-\$\{cluster\.id\}/);
  assert.match(loader, /const deduplicated =/);
  assert.match(loader, /a\.title\.localeCompare/);
});
