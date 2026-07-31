import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_FILE = fileURLToPath(import.meta.url);
const APP = path.resolve(path.dirname(TEST_FILE), "..");

test("CSS-Architecture-Werkzeuge sind installiert", () => {
  assert.ok(fs.existsSync(path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs")));
  assert.ok(fs.existsSync(path.join(APP, "scripts", "design-system", "css-safe-cleanup.mjs")));
});

test("package.json enthält CSS-Architecture-Skripte", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(APP, "package.json"), "utf8"));
  assert.equal(pkg.scripts["css:architecture:audit"], "node scripts/design-system/css-architecture-audit.mjs");
  assert.equal(pkg.scripts["css:architecture:check"], "node scripts/design-system/css-architecture-audit.mjs --strict");
  assert.equal(pkg.scripts["css:cleanup:safe"], "node scripts/design-system/css-safe-cleanup.mjs");
  assert.equal(pkg.scripts["css:cleanup:safe:write"], "node scripts/design-system/css-safe-cleanup.mjs --write");
});
