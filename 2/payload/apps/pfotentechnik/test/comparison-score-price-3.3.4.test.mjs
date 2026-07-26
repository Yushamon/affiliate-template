import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");

const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

test("shared score exposes the circular product-grade variants", async () => {
  const source = await read("packages/affiliate-core/src/components/EditorialScore.astro");
  assert.match(source, /"ring" \| "ring-compact"/);
  assert.match(source, /conic-gradient/);
  assert.match(source, /\/100/);
});

test("product and comparison pages use the same score component", async () => {
  const productHero = await read("apps/pfotentechnik/src/components/product-experience-2/ProductHero2.astro");
  const comparisonShell = await read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro");
  const recommendationGrid = await read("packages/affiliate-core/src/components/comparison/RecommendationGrid.astro");
  assert.match(productHero, /EditorialScore/);
  assert.match(productHero, /variant="ring"/);
  assert.match(comparisonShell, /variant="ring"/);
  assert.match(recommendationGrid, /variant="ring-compact"/);
});

test("comparison view model consumes the central price engine", async () => {
  const source = await read("apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts");
  assert.match(source, /buildPriceIndex/);
  assert.match(source, /toComparisonPrice/);
  assert.match(source, /kind: "value-only"/);
  assert.match(source, /formattedRange/);
});

test("price is visible in overview, winner, mobile cards and direct table", async () => {
  const files = await Promise.all([
    read("packages/affiliate-core/src/components/comparison/RecommendationGrid.astro"),
    read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro"),
    read("packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro"),
    read("packages/affiliate-core/src/components/comparison/ComparisonTable.astro"),
    read("packages/affiliate-core/src/components/comparison/ComparisonVerdict.astro")
  ]);
  for (const source of files) assert.match(source, /ComparisonPriceSignal|Aktueller Preis/);
  assert.match(files[3], /Redaktioneller Score/);
  assert.match(files[3], /Typisch:/);
});

test("comparison breadcrumb stays in schema but is no longer visible", async () => {
  const source = await read("apps/pfotentechnik/src/pages/vergleiche/[comparison].astro");
  assert.doesNotMatch(source, /import Breadcrumbs/);
  assert.doesNotMatch(source, /<Breadcrumbs/);
  assert.match(source, /breadcrumbs=\{breadcrumbs\}/);
  assert.match(source, /comparisonAdvisorText/);
});

test("comparison CTAs use the central PfotenTechnik accent", async () => {
  const source = await read("packages/affiliate-core/src/components/comparison/comparison-ux-polish-3.2.css");
  assert.match(source, /comparison-score-price-3\.3\.4/);
  assert.match(source, /--pt-cta-primary-bg/);
  assert.match(source, /--pt-theme-accent/);
});
