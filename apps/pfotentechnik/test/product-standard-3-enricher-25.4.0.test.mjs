import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const SCRIPT = path.join(APP, "scripts", "product-standard-3", "enrich.mjs");
const PACKAGE = path.join(APP, "package.json");

test("Enricher ist installiert", () => {
  assert.ok(fs.existsSync(SCRIPT));
});

test("Standardmodus ist Preview", () => {
  const source = fs.readFileSync(SCRIPT, "utf8");
  assert.match(source, /const WRITE = process\.argv\.includes\("--write"\)/);
  assert.match(source, /mode: WRITE \? "write" : "preview"/);
});

test("Nur Decision Facts werden automatisch geschrieben", () => {
  const source = fs.readFileSync(SCRIPT, "utf8");
  assert.match(source, /renderFacts/);
  assert.match(source, /decisionFacts:/);
  assert.doesNotMatch(source, /communityInsights:\\n/);
  assert.doesNotMatch(source, /purchaseMistakes:\\n/);
  assert.doesNotMatch(source, /testedHandsOn:\s*true/);
});

test("Unsichere Inhalte werden als Redaktionsaufgaben ausgegeben", () => {
  const source = fs.readFileSync(SCRIPT, "utf8");
  assert.match(source, /Community-Muster nur nach Mehrquellen-Auswertung/);
  assert.match(source, /Typische Fehlkäufe nur mit konkreter fachlicher Begründung/);
  assert.match(source, /Eigener Praxistest nur nach tatsächlicher Durchführung/);
});

test("Package Scripts sind vorhanden", () => {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
  assert.equal(pkg.scripts["product-standard-3:enrich"], "node scripts/product-standard-3/enrich.mjs");
  assert.equal(pkg.scripts["product-standard-3:enrich:write"], "node scripts/product-standard-3/enrich.mjs --write");
});
