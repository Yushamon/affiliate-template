import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createInFlightDeduper,
  deriveProductOperations,
  parseLocalizedPrice,
  recommendationTieBreaker
} from "../src/lib/product-operations/policy.mjs";
import {
  readProductDocument,
  updateProductOperations,
  updateProductPrice
} from "../src/lib/price-intelligence/frontmatter-price.mjs";

const fixture = (overrides = "") => `---
type: product
layout: product
slug: test-product
title: Test Produkt
description: Test
publishedAt: 2026-07-01
updatedAt: 2026-07-01
tags: []
related:
  tags: []
  exclude: []
hub:
  sections: []
testStatus: editorial-review
productStatus: active
recommendation: Solide Wahl.
manufacturer:
  key: test
  name: Test
  slug: test
category:
  key: feeder
  label: Futterautomat
images:
  hero:
    src: ./test.webp
    alt: Test
  gallery: []
price:
  current: null
  currency: EUR
  status: unknown
rating: 4
ratings: {}
decision:
  bestFor: []
  attention: []
review:
  summary: Zusammenfassung
  verdict: Urteil
strengths: []
weaknesses: []
alternatives: []
comparisons: []
specs: []
faq: []
features: []
${overrides}---
Text
`;

const tempProduct = async (overrides = "") => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pt-ops-"));
  const file = path.join(dir, "test-product.md");
  await fs.writeFile(file, fixture(overrides));
  return { dir, file };
};

test("deutsches und internationales Preisformat werden identisch gespeichert", () => {
  assert.equal(parseLocalizedPrice("29,99"), 29.99);
  assert.equal(parseLocalizedPrice("29.99"), 29.99);
  assert.equal(parseLocalizedPrice("1.299,90 €"), 1299.9);
});

test("leere Eingaben werden niemals als 0 gespeichert", () => {
  assert.equal(parseLocalizedPrice(""), null);
  assert.equal(parseLocalizedPrice("   "), null);
  assert.equal(parseLocalizedPrice("0"), null);
});

test("Preis wird beim ersten atomaren Speichern übernommen und zurückgelesen", async (t) => {
  const { dir, file } = await tempProduct();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const persisted = await updateProductPrice(file, {
    current: 29.99,
    currency: "EUR",
    status: "unknown",
    checkedAt: "2026-07-27T10:00:00.000Z",
    source: { id: "manual", label: "Test", type: "manual" }
  }, {
    affiliateUrl: "https://example.com/product",
    syncAffiliateUrl: true,
    operations: { availability: "available" },
    now: "2026-07-27T10:00:00.000Z"
  });
  assert.equal(persisted.data.price.current, 29.99);
  assert.equal(persisted.data.priceAvailable, true);
  assert.equal(persisted.data.affiliateAvailable, true);
  assert.equal(persisted.data.availability, "available");
});

test("gleichzeitige Änderungen werden pro Produkt serialisiert und verlieren keine Daten", async (t) => {
  const { dir, file } = await tempProduct();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await Promise.all([
    updateProductOperations(file, { availability: "temporarily-unavailable", availabilityReason: "Lieferpause" }),
    updateProductOperations(file, { availability: "available", availabilityReason: "Wieder lieferbar" })
  ]);
  const persisted = await readProductDocument(file);
  assert.equal(persisted.data.availability, "available");
  assert.equal(persisted.data.availabilityReason, "Wieder lieferbar");
});

test("doppelte Preisprüfungen teilen denselben Request", async () => {
  const dedupe = createInFlightDeduper();
  let calls = 0;
  const task = () => dedupe("product", async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 15));
    return 42;
  });
  const [left, right] = await Promise.all([task(), task()]);
  assert.equal(left, 42);
  assert.equal(right, 42);
  assert.equal(calls, 1);
});

test("bewusst nicht verfügbare Produkte sind keine offene Aufgabe", () => {
  for (const availability of ["temporarily-unavailable", "out-of-stock", "discontinued"]) {
    const operations = deriveProductOperations({
      slug: "x", title: "X", recommendation: "X", manufacturer: { name: "X" }, category: { label: "X" },
      images: { hero: {} }, rating: 4, review: { summary: "X", verdict: "X" }, availability
    });
    assert.equal(operations.isTask, false);
    assert.equal(operations.warnings.length, 0);
  }
});

test("Preis verändert den redaktionellen Score nicht und dient nur als Tie-Breaker", () => {
  const base = {
    slug: "x", title: "X", score: 88, recommendation: "X", manufacturer: { name: "X" }, category: { label: "X" },
    images: { hero: {} }, rating: 4, review: { summary: "X", verdict: "X" }, availability: "available",
    affiliate: { url: "https://example.com" }
  };
  assert.equal(deriveProductOperations({ ...base, price: { current: 9.99, checkedAt: "2026-07-27" } }).current, 9.99);
  assert.equal(base.score, 88);
  assert.ok(recommendationTieBreaker({ ...base, price: { current: 9.99, checkedAt: "2026-07-27" } }) > recommendationTieBreaker({ ...base, price: { current: null } }));
});

test("archivierte Produkte erscheinen nicht als Aufgaben", () => {
  const operations = deriveProductOperations({
    slug: "x", title: "X", recommendation: "X", manufacturer: { name: "X" }, category: { label: "X" },
    images: { hero: {} }, rating: 4, review: { summary: "X", verdict: "X" }, maintenanceStatus: "archived"
  });
  assert.equal(operations.archived, true);
  assert.equal(operations.isTask, false);
});

test("SEO-Cockpit übernimmt die Serverantwort ohne Reload und speichert in einem Request", async () => {
  const source = await fs.readFile(new URL("../src/pages/admin/seo/prices.astro", import.meta.url), "utf8");
  assert.doesNotMatch(source, /location\.reload|setTimeout\(\s*\(\)\s*=>\s*location/);
  const saveBlock = source.slice(source.indexOf('runOnce(`save:${slug}`'), source.indexOf('document.querySelectorAll<HTMLButtonElement>("[data-check-price]")'));
  assert.equal((saveBlock.match(/\/api\/admin\/prices\/manual/g) || []).length, 1);
  assert.equal((saveBlock.match(/\/api\/admin\/products\/operations/g) || []).length, 0);
  assert.match(saveBlock, /applyServerResult\(result\)/);
});
