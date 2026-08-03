import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PRODUCT = path.join(
  ROOT,
  "apps/pfotentechnik/src/content/products/sureflap-mikrochip-katzenklappe-connect.md"
);
const ASSET = path.join(
  ROOT,
  "apps/pfotentechnik/src/assets/images/products/sureflap-mikrochip-katzenklappe-connect/editorial-dimensions.svg"
);

const source = fs.readFileSync(PRODUCT, "utf8");

test("Pflichtfelder entsprechen dem aktuellen Produktschema", () => {
  assert.match(source, /^layout: product$/m);
  assert.match(source, /^testStatus: manufacturer-data$/m);
  assert.match(source, /^recommendation:/m);
  assert.match(source, /^rating: 0$/m);
  assert.match(source, /^editorialStatus: "required"$/m);
  assert.match(source, /^recommendationStatus: "limited"$/m);
  assert.match(source, /^maintenanceStatus: "required"$/m);
});

test("Herstellerobjekt enthält key, name und slug", () => {
  const block = source.match(/^manufacturer:\n(?: {2}.+\n?)+/m)?.[0] ?? "";
  assert.match(block, /key: surefeed/);
  assert.match(block, /name: SureFlap/);
  assert.match(block, /slug: surefeed/);
});

test("Bilderfeld verweist auf ein vorhandenes belegtes Editorial-Visual", () => {
  assert.ok(fs.existsSync(ASSET));
  assert.match(source, /^images:$/m);
  assert.match(source, /editorial-dimensions\.svg/);

  const svg = fs.readFileSync(ASSET, "utf8");
  assert.match(svg, /142 mm/);
  assert.match(svg, /120 mm/);
  assert.match(svg, /210 × 210 mm/);
});

test("Keine redaktionelle Bewertung wird vorgetäuscht", () => {
  assert.doesNotMatch(source, /^score:/m);
  assert.match(source, /Noch nicht abschließend redaktionell bewertet/);
  assert.match(source, /testedHandsOn: false/);
});
