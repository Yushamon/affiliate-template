import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const app = path.join(root, "apps/pfotentechnik");

test("Normalizer ist nach Installer synchron", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/seo/normalize-product-data.mjs", "--check"],
    { cwd: app, encoding: "utf8" }
  );
  assert.equal(result.status, 0, `${result.stdout || ""}\n${result.stderr || ""}`);
});

test("keine unbestätigten Fakten werden erfunden", () => {
  const source = fs.readFileSync(
    path.join(app, "scripts/seo/normalize-product-data.mjs"),
    "utf8"
  );
  assert.match(source, /UNKNOWN/);
  assert.doesNotMatch(source, /lautstärke.*=.*["'][0-9]/i);
  assert.doesNotMatch(source, /gewicht.*=.*["'][0-9]/i);
  assert.doesNotMatch(source, /uv.*=.*true/i);
});

test("Bildbindung verlangt tatsächlich vorhandene Assets", () => {
  const source = fs.readFileSync(
    path.join(app, "scripts/seo/normalize-product-data.mjs"),
    "utf8"
  );
  assert.match(source, /fs\.existsSync\(asset\)/);
  assert.match(source, /thumbnail\.webp/);
  assert.match(source, /comparison\.webp/);
  assert.match(source, /gallery-\\d\+\\\.webp/);
});

test("Vergleichsrelationen werden ergänzt, alte nur gemeldet", () => {
  const source = fs.readFileSync(
    path.join(app, "scripts/seo/normalize-product-data.mjs"),
    "utf8"
  );
  assert.match(source, /sync-comparison-relations/);
  assert.match(source, /staleComparisonRelations/);
});

test("capacity wird nur aus vorhandenem Wert gespiegelt", () => {
  const source = fs.readFileSync(
    path.join(app, "scripts/seo/normalize-product-data.mjs"),
    "utf8"
  );
  assert.match(source, /const capacity = topScalar\(frontmatter, "capacity"\)/);
  assert.match(source, /isKnown\(capacity\)/);
  assert.match(source, /appendCapacitySpec\(frontmatter, capacity\)/);
});

test("Release-Preflight schützt den Vertrag", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(app, "package.json"), "utf8"));
  const preflight = fs.readFileSync(
    path.join(app, "scripts/seo/release-preflight.mjs"),
    "utf8"
  );
  assert.equal(
    pkg.scripts["product:data:normalize"],
    "node scripts/seo/normalize-product-data.mjs --write"
  );
  assert.equal(
    pkg.scripts["product:data:normalize:check"],
    "node scripts/seo/normalize-product-data.mjs --check"
  );
  assert.match(preflight, /Produktdaten-Normalisierungsvertrag/);
});
