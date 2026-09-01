import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  getEditorialScoreTone,
  toEditorialScore
} from "../../../packages/affiliate-core/src/utils/editorialScore.ts";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("Product and Comparison share one canonical semantic score mapping", () => {
  const expected = new Map([
    [91, "excellent"],
    [85, "excellent"],
    [79, "good"],
    [70, "good"],
    [69, "solid"],
    [65, "solid"],
    [50, "limited"]
  ]);

  for (const [value, tone] of expected) {
    assert.equal(toEditorialScore(value), value);
    assert.equal(getEditorialScoreTone(value), tone);
  }

  const primitive = read("packages/affiliate-core/src/components/ProductScore.astro");
  const editorial = read("packages/affiliate-core/src/components/EditorialScore.astro");
  const consumers = [
    "apps/pfotentechnik/src/components/product-experience-2/ProductHero2.astro",
    "apps/pfotentechnik/src/components/product-experience-2/ProductAlternatives2.astro",
    "apps/pfotentechnik/src/components/comparison/ComparisonProduction.astro",
    "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro"
  ].map(read);

  assert.match(primitive, /<EditorialScore \{\.\.\.props\} \/>/);
  assert.match(editorial, /getEditorialScoreTone\(score\)/);
  assert.match(editorial, /--pt-score-tone-accent/);
  for (const consumer of consumers) {
    assert.match(consumer, /ProductScore/);
    assert.doesNotMatch(consumer, /--score-accent/);
  }
});

test("comparison disclosure surfaces use semantic tokens and no hard-coded white background", () => {
  const sources = [
    "apps/pfotentechnik/src/components/comparison/ComparisonProduction.astro",
    "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro",
    "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro",
    "packages/affiliate-core/src/components/comparison/ComparisonMethodology.astro",
    "packages/affiliate-core/src/components/comparison/comparison-experience.css"
  ].map(read).join("\n");

  assert.doesNotMatch(sources, /background(?:-color)?\s*:[^;}]*(?:#fff(?:fff)?\b|\bwhite\b)/i);
  assert.match(sources, /background:var\(--pt33-color-surface-subtle\)/);
  assert.match(sources, /background:var\(--pt33-color-surface\)/);
  assert.match(sources, /background:\s*var\(--pt-color-surface(?:-soft|-raised)?\)/);
  assert.match(sources, /summary:focus-visible/);
  assert.doesNotMatch(sources, /<summary>Persönlichen Vergleich öffnen<\/summary>/);
});

test("Fit uses the comparison decision axis without compensating layout hacks", () => {
  const production = read("apps/pfotentechnik/src/components/comparison/ComparisonProduction.astro");

  assert.match(production, /\.rc33__fit\{[^}]*padding-inline:0/);
  assert.doesNotMatch(production, /\.rc33__fit\{[^}]*(?:margin-inline:\s*-|transform:|translate|calc\()/);
  assert.match(production, /rc33__explorer[^}]*overflow:clip/);
  assert.match(production, /rc33__technical-details[^}]*surface-subtle/);
});

test("selector score and price remain legible units", () => {
  const css = read("packages/affiliate-core/src/components/comparison/comparison-experience.css");

  assert.match(css, /\.comparison-pick-card__meta \.pt-score\.pt-score--ring-compact \.pt-score__ring \{ width: 2\.875rem/);
  assert.match(css, /\.comparison-pick-card__meta \.pt-score__copy \{ display: grid; min-width: 0; \}/);
  assert.match(css, /\.comparison-pick-card__price \{ white-space: nowrap; \}/);
  assert.match(css, /@media \(max-width: 26\.875rem\)/);
});
