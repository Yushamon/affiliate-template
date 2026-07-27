import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

test("price metadata is hidden and amounts are right aligned", async () => {
  const [signal, productBox, table] = await Promise.all([
    read("packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro"),
    read("apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro"),
    read("packages/affiliate-core/src/components/comparison/ComparisonTable.astro")
  ]);

  for (const source of [signal, productBox, table]) {
    assert.doesNotMatch(source, /Zuletzt geprüft|Preisstand|letzter Prüfstand/i);
  }

  assert.match(signal, /grid-template-columns:s*minmax(0, 1fr) auto/);
  assert.match(signal, /text-align:s*right/);
  assert.match(productBox, /justify-content:s*flex-end/);
  assert.match(productBox, /text-align:s*right/);
});

test("product and comparison price formatters preserve the same cents", async () => {
  const [engine, comparisonPrice] = await Promise.all([
    read("apps/pfotentechnik/src/domain/price/engine.ts"),
    read("packages/affiliate-core/src/comparison/price.ts")
  ]);

  const centsRule = /maximumFractionDigits:s*Number.isInteger(amount)s*?s*0s*:s*2/;
  assert.match(engine, centsRule);
  assert.match(comparisonPrice, centsRule);
});

test("list prices sit directly above their CTAs", async () => {
  const [mobileCards, recommendationGrid] = await Promise.all([
    read("packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro"),
    read("packages/affiliate-core/src/components/comparison/RecommendationGrid.astro")
  ]);

  const valuesEnd = mobileCards.indexOf("</dl>");
  const price = mobileCards.indexOf("<ComparisonPriceSignal price={product.price} />");
  const actions = mobileCards.indexOf('<div class="comparison-mobile-product__actions">');

  assert.ok(valuesEnd !== -1 && price > valuesEnd && actions > price);
  assert.match(recommendationGrid, /flex-direction:s*columns*!important/);
  assert.match(recommendationGrid, /margin-top:s*autos*!important/);
});
