import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const AUDIT = path.join(APP, "scripts", "product-standard-3", "audit.mjs");
const PACKAGE = path.join(APP, "package.json");

test("Product-Standard-3-Audit ist installiert", () => {
  assert.ok(fs.existsSync(AUDIT));
});

test("Audit prüft Decision Facts, Community und Fehlkäufe", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /decisionFacts/);
  assert.match(source, /communityInsights/);
  assert.match(source, /purchaseMistakes/);
});

test("Community und Fehlkäufe sind keine harten Pflichtfelder", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /COMMUNITY_EMPTY/);
  assert.match(source, /PURCHASE_MISTAKES_MISSING/);
  assert.doesNotMatch(source, /add\("error",\s*"COMMUNITY_EMPTY"/);
  assert.doesNotMatch(source, /add\("error",\s*"PURCHASE_MISTAKES_MISSING"/);
});

test("Strict blockiert nur Fehler", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /STRICT && summary\.errors > 0/);
});

test("Package Scripts sind vorhanden", () => {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
  assert.equal(pkg.scripts["audit:product-standard-3"], "node scripts/product-standard-3/audit.mjs");
  assert.equal(pkg.scripts["audit:product-standard-3:strict"], "node scripts/product-standard-3/audit.mjs --strict");
});
