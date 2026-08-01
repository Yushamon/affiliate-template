import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const core = path.join(root, "packages", "affiliate-core");
const read = (target) => fs.readFileSync(target, "utf8");

test("core theme aliases resolve through project semantic tokens", () => {
  const source = read(path.join(core, "src/styles/theme.css"));
  assert.match(source, /--text:\s*var\(--pt-color-text/);
  assert.match(source, /--surface:\s*var\(--pt-color-surface/);
  assert.match(source, /--primary-text:\s*var\(--pt-color-accent-text/);
  assert.doesNotMatch(source, /--text:\s*#[0-9a-f]{3,8}/i);
});

test("dark mode is token-driven without a late override stylesheet", () => {
  const layout = read(path.join(app, "src/layouts/ProjectLayout.astro"));
  const tokens = read(path.join(app, "src/styles/pfotentechnik-design-tokens.css"));
  assert.doesNotMatch(layout, /pfotentechnik-dark-mode-contract\.css/);
  assert.match(tokens, /prefers-color-scheme:\s*dark/);
  assert.match(tokens, /--pt-color-accent-text:\s*#72e6a6/);
  assert.match(tokens, /--pt-color-brand-surface:/);
});

test("shared cards and header surfaces use semantic colors", () => {
  const ui = read(path.join(core, "src/styles/ui.css"));
  const chrome = read(path.join(core, "src/styles/header-footer.css"));
  assert.doesNotMatch(ui, /background:\s*white;/);
  assert.match(ui, /background:\s*var\(--surface\)/);
  assert.match(chrome, /var\(--pt-color-brand-surface/);
  assert.match(chrome, /\.site-header-v2 \.brand-name/);
});

test("homepage and comparison headings own the correct foreground", () => {
  const home = read(path.join(core, "src/components/home/home.css"));
  const comparison = read(path.join(app, "src/pages/vergleiche/index.astro"));
  assert.match(home, /\.home3\s*\{[\s\S]*?--home3-text:/);
  assert.doesNotMatch(home, /:root\s*\{[\s\S]*?--home3-text:/);
  assert.match(home, /\.home3-category-card h3[\s\S]*?color:\s*var\(--pt-color-text-inverse\)/);
  assert.match(home, /\.home3-method li h3[\s\S]*?color:\s*var\(--pt-color-text-inverse\)/);
  assert.match(comparison, /--comparison-text:\s*var\(--pt-color-text\)/);
  assert.match(comparison, /color:\s*var\(--comparison-text\)/);
  assert.doesNotMatch(comparison, /--text:/);
});

test("recommendations reject cross-category candidates", () => {
  const source = read(path.join(app, "src/domain/recommendationLinks.ts"));
  assert.match(source, /type RecommendationFamily/);
  assert.match(source, /source\.family && candidate\.family && source\.family !== candidate\.family/);
  assert.match(source, /\["trinkbrunnen",/);
  assert.match(source, /\["futterautomaten",/);
});

test("product pages have one primary continuation and complementary reading", () => {
  const product = read(path.join(app, "src/pages/produkt/[product].astro"));
  assert.doesNotMatch(product, /<DecisionJourney/);
  assert.doesNotMatch(product, /import DecisionJourney/);
  assert.match(product, /entry\.type !== "product" && entry\.type !== "comparison"/);
  assert.match(product, /title="Passend zum Produkt weiterlesen"/);
});

test("technical values receive sentence casing at rendering time", () => {
  const source = read(path.join(app, "src/components/product-experience-2/ProductDecisionFacts2.astro"));
  assert.match(source, /const sentenceCase/);
  assert.match(source, /sentenceCase\(fact\.value\)/);
});
