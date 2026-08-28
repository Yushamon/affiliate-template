import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(app, relative), "utf8");

test("Failure Mode V1 defines only the approved statuses and remains optional", () => {
  const schema = read("src/content/schema/product.ts");
  for (const status of ["supported", "partial", "unavailable", "unknown", "notApplicable"]) {
    assert.match(schema, new RegExp(`"${status}"`));
  }
  assert.match(schema, /const productFailureModesSchema = z[\s\S]*\.optional\(\)/);
  assert.match(schema, /failureModes: productFailureModesSchema/);
});

test("sourced claims require a valid evidence triple while unknown may stay unsourced", () => {
  const schema = read("src/content/schema/product.ts");
  assert.match(schema, /z\.string\(\)\.url\(\)\.optional\(\)/);
  assert.match(schema, /\["unknown", "notApplicable"\]\.includes/);
  assert.match(schema, /sourceUrl, sourceType und verifiedAt/);
});

test("representative products use only V1 modes and preserve explicit unknowns", () => {
  const products = [
    "petlibro-polar-wet-food-feeder", "petkit-yumshare-solo-2", "petlibro-air-wifi-feeder",
    "tractive-dog-6", "weenect-xs", "pawfit-3",
    "pettec-cam-360", "furbo-360-katzenkamera", "reolink-e1-zoom"
  ];
  for (const product of products) {
    const source = read(`src/content/products/${product}.md`);
    assert.match(source, /^failureModes:/m, `${product}: failureModes fehlen`);
    assert.match(source, /status: (unknown|notApplicable|supported|partial|unavailable)/);
  }
});

test("legacy products without failureModes remain present for loader compatibility", () => {
  assert.doesNotMatch(read("src/content/products/cat-mate-c500.md"), /^failureModes:/m);
});
