import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalizeProductPriceUrlSource } from "../src/lib/price-intelligence/frontmatter-price.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

test("duplicate price URLs migrate to the single affiliate.url source", () => {
  const source = `---\ntitle: Test\nslug: test\nprice:\n  current: 49.9\n  currency: EUR\n  status: unknown\n  affiliateUrl: https://shop.example/product\n  source:\n    id: manual\n    label: Händler\n    type: manual\n    url: https://shop.example/product\naffiliate:\n  provider: shop\n  label: Preis prüfen\n  url: https://shop.example/product\nrating: 4.2\n---\nText\n`;
  const next = canonicalizeProductPriceUrlSource(source, "test.md");
  assert.match(next, /affiliate:\n[\s\S]*url: "https:\/\/shop\.example\/product"/);
  const priceBlock = next.match(/price:\n([\s\S]*?)\naffiliate:/)?.[1] ?? "";
  assert.doesNotMatch(priceBlock, /^\s+affiliateUrl:/m);
  assert.doesNotMatch(priceBlock, /^\s{4}url:/m);
});

test("a legacy price URL creates the canonical affiliate CTA", () => {
  const source = `---\ntitle: Test\nslug: test\nprice:\n  current: 79\n  currency: EUR\n  status: unknown\n  affiliateUrl: https://merchant.example/item\n  source:\n    id: manual\n    label: Merchant\n    type: manual\nrating: 4.1\n---\nText\n`;
  const next = canonicalizeProductPriceUrlSource(source, "test.md");
  assert.match(next, /affiliate:/);
  assert.match(next, /url: "https:\/\/merchant\.example\/item"/);
  assert.match(next, /label: "Preis und Verfügbarkeit prüfen"/);
  assert.doesNotMatch(next, /affiliateUrl:/);
});

test("manual price UI exposes one target URL and explains CTA synchronization", async () => {
  const source = await read("apps/pfotentechnik/src/pages/admin/seo/prices.astro");
  assert.match(source, /name="targetUrl"/);
  assert.match(source, /Produkt- und Vergleichs-CTA/);
  assert.doesNotMatch(source, /name="affiliateUrl"/);
});

test("manual price service synchronizes the canonical affiliate CTA", async () => {
  const source = await read("apps/pfotentechnik/src/lib/price-intelligence/service.mjs");
  assert.match(source, /input\.targetUrl \?\? input\.affiliateUrl/);
  assert.match(source, /syncAffiliateUrl: Boolean\(targetUrl\)/);
  assert.match(source, /ctaUpdated: Boolean\(targetUrl\)/);
});

test("price adapter prefers canonical affiliate.url and keeps legacy fallback", async () => {
  const source = await read("apps/pfotentechnik/src/domain/price/adapters/contentPriceAdapter.ts");
  const canonicalIndex = source.indexOf("data.affiliate?.url");
  const legacyIndex = source.indexOf("raw.affiliateUrl");
  assert.ok(canonicalIndex >= 0 && legacyIndex > canonicalIndex);
});
