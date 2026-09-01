import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (file) => fs.readFileSync(path.join(repoRoot, file), "utf8");

const page = read("packages/affiliate-core/src/components/home/HomePage.astro");
const styles = read("packages/affiliate-core/src/components/home/home.css");
const model = read("apps/pfotentechnik/src/domain/home/buildHomepageModel.ts");
const route = read("apps/pfotentechnik/src/pages/index.astro");

test("34.1 composes discovery from the existing homepage model", () => {
  for (const section of [
    "pt-home__hero",
    "pt-home__needs",
    "pt-home__decisions",
    "pt-home__method",
    "pt-home__categories",
    "pt-home__technology",
    "pt-home__guides",
    "pt-home__trust",
    "pt-home__closing"
  ]) assert.match(page, new RegExp(section));

  for (const field of ["useCases", "decisionComparisons", "categories", "methods", "products", "guides", "transparency"]) {
    assert.match(page, new RegExp(`model\\.${field}`));
  }
  assert.doesNotMatch(page, /beste-[a-z-]+/);
});

test("34.1 uses a concise, data-backed decision curation", () => {
  assert.match(model, /const decisionComparisonDefinitions = \[/);
  assert.equal((model.match(/slug: "/g) ?? []).length, 4);
  assert.match(model, /selectDiverseProducts\(sortedProducts, 1\)/);
});

test("homepage metadata ownership and accessible primary structure remain on the route", () => {
  assert.match(route, /<ProjectLayout/);
  assert.match(route, /canonical="\/"/);
  assert.match(route, /<HomePage model=\{model\} \/>/);
  assert.match(page, /<h1 id="pt-home-title">/);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
});

test("homepage CSS stays inside the shared foundation and has a mobile composition", () => {
  assert.match(styles, /var\(--pt-color-brand-surface\)/);
  assert.match(styles, /@media \(max-width: 780px\)/);
  assert.match(styles, /overflow-wrap: anywhere/);
  assert.doesNotMatch(styles, /!important/);
  assert.doesNotMatch(styles, /overflow-x:\s*hidden/);
});
