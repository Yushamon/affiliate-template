import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const app = path.join(root, "apps/pfotentechnik");

test("Content-Discovery Sync ist nach dem Installer aktuell", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/seo/sync-content-discovery-links.mjs", "--check"],
    { cwd: app, encoding: "utf8" }
  );

  assert.equal(
    result.status,
    0,
    `${result.stdout || ""}\n${result.stderr || ""}`
  );
});

test("Discovery-Report enthält keine Produkt- oder Hersteller-Orphans", () => {
  const report = JSON.parse(
    fs.readFileSync(
      path.join(app, "reports/internal-linking/content-discovery-latest.json"),
      "utf8"
    )
  );

  assert.equal(report.summary.orphanProducts, 0);
  assert.equal(report.summary.orphanManufacturers, 0);
});

test("Release-Preflight schützt den Discovery-Link-Vertrag", () => {
  const preflight = fs.readFileSync(
    path.join(app, "scripts/seo/release-preflight.mjs"),
    "utf8"
  );
  const pkg = JSON.parse(fs.readFileSync(path.join(app, "package.json"), "utf8"));

  assert.equal(
    pkg.scripts["seo:discovery:sync"],
    "node scripts/seo/sync-content-discovery-links.mjs --write"
  );
  assert.equal(
    pkg.scripts["seo:discovery:check"],
    "node scripts/seo/sync-content-discovery-links.mjs --check"
  );
  assert.match(preflight, /Content-Discovery-Link-Vertrag/);
  assert.match(preflight, /seo:discovery:check/);
});

test("generierte Links besitzen kontrollierte Marker", () => {
  const script = fs.readFileSync(
    path.join(app, "scripts/seo/sync-content-discovery-links.mjs"),
    "utf8"
  );

  assert.match(script, /pt:content-discovery:category-products:start/);
  assert.match(script, /pt:content-discovery:manufacturer-products:start/);
  assert.match(script, /pt:content-discovery:manufacturer-directory:start/);
});
