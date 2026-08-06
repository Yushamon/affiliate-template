import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PRODUCTS = path.join(ROOT, "apps/pfotentechnik/src/content/products");

function split(source, file) {
  const match = source.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---(?:\\r?\\n|$)/);
  assert.ok(match, `${file}: Frontmatter fehlt`);
  return yaml.load(match[1]) || {};
}

test("Katzenklappen verwenden den kanonischen Preis- und Affiliate-Standard", () => {
  const files = fs.readdirSync(PRODUCTS)
    .filter((name) => /\\.mdx?$/.test(name))
    .map((name) => path.join(PRODUCTS, name));

  const catFlaps = files
    .map((file) => ({ file, data: split(fs.readFileSync(file, "utf8"), file) }))
    .filter(({ data }) => (data.category?.key || data.category) === "katzenklappen");

  assert.ok(catFlaps.length >= 3, "Keine belastbare Katzenklappen-Stichprobe gefunden.");

  for (const { file, data } of catFlaps) {
    assert.equal(typeof data.manufacturer, "object", `${file}: manufacturer muss Objekt sein`);
    assert.ok(data.manufacturer.name, `${file}: manufacturer.name fehlt`);
    assert.ok(data.manufacturer.slug, `${file}: manufacturer.slug fehlt`);
    assert.equal(typeof data.category, "object", `${file}: category muss Objekt sein`);
    assert.equal(data.category.key, "katzenklappen");
    assert.equal(data.price?.affiliateUrl, undefined, `${file}: price.affiliateUrl ist veraltet`);
    assert.equal(data.price?.source?.url, undefined, `${file}: price.source.url ist veraltet`);

    if (data.affiliate?.url) {
      assert.match(data.affiliate.url, /^https:\/\//);
      assert.ok(data.affiliate.provider, `${file}: affiliate.provider fehlt`);
      assert.ok(data.affiliate.label, `${file}: affiliate.label fehlt`);
      assert.equal(data.affiliateAvailable, true, `${file}: affiliateAvailable nicht synchron`);
    }
  }
});
