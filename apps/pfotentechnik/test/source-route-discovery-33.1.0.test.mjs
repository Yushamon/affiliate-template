import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(app, "../..");
const auditPath = path.join(repo, "scripts", "audit-internal-links.mjs");
const audit = fs.readFileSync(auditPath, "utf8");

test("Source-Link-Audit erkennt statische src/pages-Routen ohne dist-Abhängigkeit", () => {
  assert.match(audit, /const routeForSourcePage = \(file\) =>/);
  assert.match(audit, /sourcePageRouteSet/);
  assert.match(audit, /\.\.\.sourcePageRouteSet/);
});

test("dynamische Astro-Routen werden nicht pauschal als existierend gewertet", () => {
  assert.match(audit, /segment\.includes\("\["\)/);
  assert.match(audit, /segment\.includes\("\]"\)/);
});

test("statische Hub-Routen existieren im Source-Bestand", () => {
  for (const relative of [
    "src/pages/vergleiche/index.astro",
    "src/pages/wissen.astro",
    "src/pages/redaktion.astro"
  ]) {
    assert.ok(
      fs.existsSync(path.join(app, relative)),
      `Erwartete statische Route fehlt: ${relative}`
    );
  }
});
