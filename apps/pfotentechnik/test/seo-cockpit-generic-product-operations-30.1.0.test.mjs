import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { splitFrontmatter, updateProductOperations, updateProductPrice } from "../src/lib/price-intelligence/frontmatter-price.mjs";

const fixture = `---
title: "OnlyCat Mikrochip Katzenklappe"
slug: "onlycat-mikrochip-katzenklappe"
type: "product"
layout: "product"
manufacturer: { key: "legacy", name: "Legacy", slug: "legacy" }
category: { key: "katzenklappen", label: "Katzenklappen", path: "/katzenklappen/" }
images: { hero: { src: "../../assets/images/products/onlycat/hero.webp", alt: "OnlyCat" } }
price: { current: null, currency: "EUR", status: "unknown" }
priceState: "unknown"
availability: "unknown"
recommendation: "Datencheck"
review: { summary: "Zusammenfassung", verdict: "Fazit" }
rating: 3.6
---

Inhalt.
`;

async function parsed(file) {
  const source = await fs.readFile(file, "utf8");
  const parts = splitFrontmatter(source, file);
  return { source, data: yaml.load(parts.yaml) };
}

test("Inline-YAML wird ohne doppelte Top-Level-Keys aktualisiert", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "pt-product-ops-"));
  const file = path.join(directory, "onlycat-mikrochip-katzenklappe.md");
  await fs.writeFile(file, fixture);

  await updateProductOperations(file, {
    affiliateUrl: "https://www.onlycat.com/de/store/onlycat/",
    sourceLabel: "OnlyCat Deutschland",
    manufacturer: { key: "onlycat", name: "OnlyCat", slug: "onlycat" },
    availability: "available",
    availabilityReason: "Im Hersteller-Shop verfügbar.",
    now: "2026-08-06T08:00:00.000Z"
  });

  await updateProductPrice(file, {
    current: 299,
    currency: "EUR",
    status: "unknown",
    checkedAt: "2026-08-06T08:00:00.000Z",
    source: { id: "onlycat", label: "OnlyCat Deutschland", type: "merchant" }
  }, { affiliateUrl: "https://www.onlycat.com/de/store/onlycat/", syncAffiliateUrl: true, now: "2026-08-06T08:00:00.000Z" });

  const { source, data } = await parsed(file);
  assert.equal(data.manufacturer.name, "OnlyCat");
  assert.equal(data.manufacturer.slug, "onlycat");
  assert.equal(data.price.current, 299);
  assert.equal(data.affiliate.url, "https://www.onlycat.com/de/store/onlycat/");
  assert.equal(data.availability, "available");
  assert.equal((source.match(/^price:/gm) || []).length, 1);
  assert.equal((source.match(/^manufacturer:/gm) || []).length, 1);
  assert.equal((source.match(/^affiliate:/gm) || []).length, 1);
});
