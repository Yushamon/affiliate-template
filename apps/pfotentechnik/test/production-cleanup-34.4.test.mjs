import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const app = process.cwd().endsWith("apps/pfotentechnik")
  ? process.cwd()
  : path.join(process.cwd(), "apps/pfotentechnik");
const read = (relative) => fs.readFileSync(path.join(app, relative), "utf8");

const layout = read("src/layouts/ProjectLayout.astro");
const contracts = read("src/styles/pfotentechnik-foundation-contracts.css");
const tokens = read("src/styles/pfotentechnik-design-tokens.css");
const componentsIndex = read("src/styles/components/index.css");
const productMini = read("src/components/foundation/FoundationProductMini.astro");
const disclosure = read("src/components/foundation/FoundationDisclosure.astro");
const guide = read("src/components/guide/GuideExperience.astro");
const manufacturer = read("src/components/manufacturer/ManufacturerExperience.astro");
const details = read("src/components/product-experience-2/ProductDetails2.astro");
const category = read("src/components/category/CategoryExperience.astro");
const legal = read("src/layouts/LegalPageLayout.astro");
const productRoute = read("src/pages/produkt/[product].astro");

test("34.4 loads one final production Foundation contract", () => {
  assert.match(
    layout,
    /pfotentechnik-ui-system\.css";[\s\S]*pfotentechnik-foundation-contracts\.css";/,
  );
  assert.doesNotMatch(componentsIndex, /buttons\.css/);
  assert.ok(!fs.existsSync(path.join(app, "src/styles/components/buttons.css")));
  assert.match(contracts, /\.pt-reading-axis/);
  assert.match(contracts, /\.pt-decision-axis/);
  assert.match(contracts, /\.pt-button-primary/);
  assert.match(productRoute, /foundation=\{true\}/);
});

test("33 compatibility names alias the active semantic token contract", () => {
  assert.match(tokens, /--pt33-color-page:\s*var\(--pt-color-page\)/);
  assert.match(tokens, /--pt33-color-surface:\s*var\(--pt-color-surface\)/);
  assert.match(tokens, /--pt33-color-text-primary:\s*var\(--pt-color-text\)/);
  assert.match(tokens, /--pt33-color-action-primary:\s*var\(--pt-color-action-bg\)/);
  assert.doesNotMatch(contracts, /#[0-9a-f]{3,8}\b|\brgba?\(|\bwhite\b/i);
});

test("one domain media resolver serves every production experience", () => {
  assert.ok(fs.existsSync(path.join(app, "src/domain/mediaResolver.mjs")));
  assert.ok(!fs.existsSync(path.join(app, "src/domain/comparison/mediaResolver.mjs")));
  const consumers = [
    "src/domain/home/buildHomepageModel.ts",
    "src/domain/productExperience/model.ts",
    "src/domain/comparison/buildComparisonViewModel.ts",
    "src/domain/category/buildCategoryViewModel.ts",
    "src/domain/manufacturerExperience/model.ts",
    "src/domain/guideExperience/model.ts",
    "src/domain/productAlternatives/index.ts",
  ].map(read).join("\n");
  assert.doesNotMatch(consumers, /comparison\/mediaResolver/);
  assert.match(consumers, /mediaResolver\.mjs/);
});

test("compact product rows own canonical score and media presentation", () => {
  assert.match(productMini, /<ProductScore/);
  assert.match(productMini, /<OptimizedImage/);
  assert.match(productMini, /Interessant, wenn:/);
  assert.match(guide, /<FoundationProductMini/);
  assert.match(manufacturer, /<FoundationProductMini/);
  assert.match(category, /<ProductScore/);
});

test("secondary disclosure is shared without gating the primary Guide", () => {
  assert.match(disclosure, /<details class="pt-disclosure"/);
  assert.match(guide, /<FoundationDisclosure/);
  assert.match(manufacturer, /<FoundationDisclosure/);
  assert.match(details, /<FoundationDisclosure/);
  assert.match(guide, /<section id="guide-main" class="pt-guide__longform"/);
  assert.match(guide, /<article class="pt-guide__prose pt-reading-prose article-content">\s*<slot \/>/);
  assert.doesNotMatch(guide, /<details[^>]*id="guide-main"|Vollständigen Ratgeber/i);
});

test("reading and decision axes are consumed by the intended page roles", () => {
  assert.match(legal, /pt-legal-page pt-reading-axis/);
  assert.match(legal, /pt-legal-reading pt-reading-prose/);
  assert.match(guide, /pt-guide__reading pt-decision-axis/);
  assert.match(guide, /pt-guide__prose pt-reading-prose/);
  assert.match(contracts, /\.pt-reading-prose :where\(table\)/);
});
