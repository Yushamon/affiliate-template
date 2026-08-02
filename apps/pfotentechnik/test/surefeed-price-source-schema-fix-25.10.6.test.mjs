import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PRODUCT = path.join(
  ROOT,
  "apps/pfotentechnik/src/content/products/surefeed-microchip-pet-feeder-connect.md"
);

const source = fs.readFileSync(PRODUCT, "utf8");

test("SureFeed-Preisquelle verwendet einen erlaubten Schematyp", () => {
  const priceBlock =
    source.match(/^price:\n([\s\S]*?)(?=^[A-Za-z0-9_-]+:)/m)?.[1] ?? "";

  assert.match(priceBlock, /^\s{4}type: "manual"$/m);
  assert.doesNotMatch(priceBlock, /^\s{4}type: "manufacturer"$/m);
});

test("Herstellerbezug bleibt über ID und Label erhalten", () => {
  const priceBlock =
    source.match(/^price:\n([\s\S]*?)(?=^[A-Za-z0-9_-]+:)/m)?.[1] ?? "";

  assert.match(priceBlock, /id: "sure-petcare-de"/);
  assert.match(priceBlock, /label: "Sure Petcare Deutschland"/);
});
