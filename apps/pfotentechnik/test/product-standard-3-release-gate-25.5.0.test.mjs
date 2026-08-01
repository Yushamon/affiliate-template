import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const SCRIPT = path.join(APP, "scripts", "product-standard-3", "release-gate.mjs");
const PACKAGE = path.join(APP, "package.json");

test("Release-Gate ist installiert", () => {
  assert.ok(fs.existsSync(SCRIPT));
});

test("Release-Gate bündelt Tests, Strict-Audit, Enricher und Build", () => {
  const source = fs.readFileSync(SCRIPT, "utf8");
  assert.match(source, /test:product-standard-3/);
  assert.match(source, /test:product-standard-3:enricher/);
  assert.match(source, /audit:product-standard-3:strict/);
  assert.match(source, /product-standard-3:enrich/);
  assert.match(source, /\["--workspace", "apps\/pfotentechnik", "run", "build"\]/);
});

test("Build kann bewusst übersprungen werden", () => {
  const source = fs.readFileSync(SCRIPT, "utf8");
  assert.match(source, /--skip-build/);
});

test("Release-Gate schreibt einen dauerhaften Report", () => {
  const source = fs.readFileSync(SCRIPT, "utf8");
  assert.match(source, /product-standard-3-release-latest\.json/);
  assert.match(source, /product-standard-3-release-latest\.md/);
});

test("Package Scripts sind vorhanden", () => {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
  assert.equal(pkg.scripts["product-standard-3:release"], "node scripts/product-standard-3/release-gate.mjs");
  assert.equal(pkg.scripts["product-standard-3:release:no-build"], "node scripts/product-standard-3/release-gate.mjs --skip-build");
});
