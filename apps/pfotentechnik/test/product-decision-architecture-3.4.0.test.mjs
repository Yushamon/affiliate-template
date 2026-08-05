import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

const componentPath = (name) =>
  `apps/pfotentechnik/src/components/product-experience-2/${name}`;

test("Product Experience verwendet den aktuellen Decision-First-Vertrag", async () => {
  const source = await read(componentPath("ProductExperience2.astro"));

  assert.match(source, /data-product-experience="2\.1"/);
  assert.match(source, /data-product-layout="decision-first"/);
  assert.doesNotMatch(source, /data-product-layout="cards-restored"/);

  const orderedComponents = [
    "ProductHero2",
    "ProductVerdict2",
    "ProductEvidence2",
    "ProductCommunityInsights2",
    "ProductDecisionFacts2",
    "ProductPurchaseMistakes2",
    "ProductEverydayTimeline",
    "ProductCategoryFitAssistant",
    "ProductDetails2",
    "ProductAlternatives2",
  ];

  let previousIndex = -1;

  for (const component of orderedComponents) {
    assert.match(
      source,
      new RegExp(`import\\s+${component}\\s+from\\s+["']\\.\\/${component}\\.astro["']`),
      `${component} muss importiert sein`,
    );

    const currentIndex = source.indexOf(`<${component}`);
    assert.ok(currentIndex > previousIndex, `${component} steht in falscher Reihenfolge`);
    previousIndex = currentIndex;
  }
});

test("Decision-First bleibt responsiv, ohne einen zweiten Inhaltsgutter einzuführen", async () => {
  const source = await read(componentPath("ProductExperience2.astro"));

  assert.match(source, /\.px2\s*\{[\s\S]*display:\s*grid/);
  assert.match(source, /\.px2\s*\{[\s\S]*width:\s*100%/);
  assert.match(source, /\.px2\s*>\s*:not\(\.px2-hero\)\s*\{[\s\S]*margin-inline:\s*12px/);
  assert.doesNotMatch(source, /\.px2\s*>\s*:not\(\.px2-hero\)\s*\{[\s\S]*padding-inline:/);
});

test("Produktdetails deduplizieren die tatsächlich verwendeten Datenquellen", async () => {
  const source = await read(componentPath("ProductDetails2.astro"));

  assert.match(source, /uniqueTextItems\(model\.pros,\s*\{\s*exclude:\s*model\.cons,\s*limit:\s*6\s*\}\)/);
  assert.match(source, /uniqueTextItems\(model\.cons,\s*\{\s*exclude:\s*model\.notFor,\s*limit:\s*6\s*\}\)/);
  assert.doesNotMatch(source, /exclude:\s*warnings/);

  assert.match(source, /class="details__proscons"/);
  assert.match(source, /class="details__column details__column--positive"/);
  assert.match(source, /class="details__column details__column--negative"/);
  assert.match(
    source,
    /\.details\s*>\s*aside,[\s\S]*\.details\s*>\s*details,[\s\S]*\.details\s*>\s*section\s*\{[\s\S]*border:\s*1px solid var\(--px2-border\)/,
  );
});

test("Alternativen bleiben Karten und verwenden den gemeinsamen Editorial Score", async () => {
  const source = await read(componentPath("ProductAlternatives2.astro"));

  assert.match(source, /EditorialScore/);
  assert.match(source, /variant="ring-compact"/);
  assert.match(source, /<article>/);
  assert.match(
    source,
    /article\s*\{[\s\S]*border:\s*1px solid var\(--px2-border\)[\s\S]*border-radius:\s*20px/,
  );
});

test("Gallery V29 bleibt alleiniger Galerie-Owner im Hero", async () => {
  const hero = await read(componentPath("ProductHero2.astro"));
  const gallery = await read(componentPath("ProductGallery29.astro"));

  assert.match(
    hero,
    /import\s+ProductGallery29\s+from\s+["']\.\/ProductGallery29\.astro["']/,
  );
  assert.match(hero, /<ProductGallery29(?:\s|\/|>)/);
  assert.doesNotMatch(hero, /<ProductGallery2(?:\s|\/|>)/);
  assert.match(gallery, /data-product-gallery-v29/);
});
