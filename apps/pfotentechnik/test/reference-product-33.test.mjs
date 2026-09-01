import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(app, file), "utf8");
const experience = read("src/components/product-experience-2/ProductExperience2.astro");
const hero = read("src/components/product-experience-2/ProductHero2.astro");
const verdict = read("src/components/product-experience-2/ProductVerdict2.astro");
const product = read("src/content/products/petlibro-dockstream-rfid-smart.md");

test("33.3 product renderer uses the shared foundation for every product", () => {
  assert.doesNotMatch(experience, /model\.slug === "petlibro-dockstream-rfid-smart"/);
  assert.match(experience, /const reference33 = true/);
  assert.match(experience, /data-product-experience=\{reference33 \? "33\.0\.1" : "2\.2"\}/);
  assert.match(experience, /data-pt-foundation=\{reference33 \? true : undefined\}/);
  assert.match(product, /canonical: \/produkt\/petlibro-dockstream-rfid-smart\//);
});

test("reference hero separates editorial score, suitability and one purchase CTA", () => {
  assert.match(hero, /Redaktionelle Einordnung/);
  assert.match(hero, /Passt besonders zu/);
  assert.match(hero, /suitabilitySignals = model\.idealFor\.slice\(0, 3\)/);
  assert.match(hero, /<PriceBox2/);
});

test("mobile reference hero has one gallery width owner and a non-clipping score row", () => {
  const gallery = read("src/components/product-experience-2/product-gallery-29.css");
  const layout = read("../../packages/affiliate-core/src/styles/page-layout-engine.css");
  assert.doesNotMatch(hero, /data-mobile-gallery-full-bleed/);
  assert.doesNotMatch(layout, /data-mobile-gallery-full-bleed/);
  assert.match(gallery, /width:\s*100dvw/);
  assert.match(hero, /px2-hero--reference33 \.px2-hero__scoreline\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(gallery, /\.pg29__mobile-controls > span,[\s\S]*?\.pg29__mobile-controls button\s*\{[\s\S]*?min-height:\s*44px/);
});

test("mobile reference hero starts with the single V29 gallery and keeps icon styling on the control", () => {
  const gallery = read("src/components/product-experience-2/product-gallery-29.css");
  assert.match(hero, /px2-hero--reference33 \.px2-hero__media \{ order: 1; \}/);
  assert.match(hero, /px2-hero--reference33 \.px2-hero__meta \{ order: 2; \}/);
  assert.match(gallery, /\.pg29__mobile-controls > span,/);
  assert.doesNotMatch(gallery, /\.pg29__mobile-controls span,\n\.pg29__mobile-controls button/);
});

test("reference full bleed removes only the inherited page clipping context", () => {
  const experience = read("src/components/product-experience-2/ProductExperience2.astro");
  assert.match(experience, /\.pt-page:has\(\.px2--reference33\)\) \{ overflow-x: visible; \}/);
});

test("reference longform keeps interactive controls but removes editorial card chrome", () => {
  const experience = read("src/components/product-experience-2/ProductExperience2.astro");
  const fit = read("src/components/product-experience-2/ProductCategoryFitAssistant.astro");
  const alternatives = read("src/components/product-experience-2/ProductAlternatives2.astro");
  assert.match(experience, /\.category-fit\) \{[\s\S]*border: 1px solid var\(--px2-border\);/);
  assert.match(experience, /\.decision-facts dl > div\),[\s\S]*border-top: 1px solid var\(--px2-border\)/);
  assert.match(fit, /fieldset:not\(:first-child\) \{ display: none; \}/);
  assert.match(alternatives, /src=\{reference && item\.source \? item\.source : item\.optimized\?\.src\}/);
});

test("mobile reference gallery uses an emitted Astro source and standard SVG gallery icons", () => {
  const gallery = read("src/components/product-experience-2/ProductGallery29.astro");
  assert.match(gallery, /mobileSrc: reference && source \? source : mobileImage\.src/);
  assert.match(gallery, /src=\{item\.mobileSrc\}/);
  assert.doesNotMatch(gallery, /▦/);
  assert.equal((gallery.match(/class="pg29__gallery-icon"/g) || []).length, 2);
  assert.match(gallery, /src: reference && source \? source : image\.src/);
  assert.match(gallery, /srcset: reference \? "" : image\.srcSet\.attribute/);
});

test("reference verdict presents one benefit, one compromise and one DecisionLine", () => {
  assert.match(verdict, /Der wichtigste Vorteil/);
  assert.match(verdict, /Was du vor dem Kauf wissen solltest/);
  assert.match(verdict, /verdict__decision-line/);
});

test("reference FAQ and transparency use editorial dividers without changing native semantics", () => {
  const page = read("src/pages/produkt/[product].astro");
  assert.match(experience, /\.details__faq > details\) \{[\s\S]*border-top: 1px solid var\(--px2-border\)/);
  assert.match(experience, /\.details__faq > details > summary:focus-visible\)/);
  assert.match(page, /\.editorial-transparency__facts > div\) \{[\s\S]*border-bottom: 1px solid var\(--pt33-color-border-subtle\)/);
  assert.match(page, /\.editorial-transparency__evidence\) \{[\s\S]*border-left: 0/);
  assert.match(page, /\.pt-page--reference33 :global\(\.editorial-transparency\),[\s\S]*width: 100%/);
});

test("reference mobile decision zone has one content-width owner", () => {
  assert.match(experience, /\.px2--reference33 \.px2__decision-zone \{ width: 100%; margin-inline: 0; \}/);
});

test("reference visual gate declares one mobile content axis and an explicit full-bleed gallery exception", () => {
  const gate = read("scripts/design-system/capture-reference-release.mjs");
  assert.match(gate, /width: 320/);
  assert.match(gate, /width: 360/);
  assert.match(gate, /width: 390/);
  assert.match(gate, /width: 430/);
  assert.match(gate, /classification: "full-bleed"/);
  assert.match(gate, /Math\.abs\(rect\.left - axis\.left\) <= 1/);
  assert.match(gate, /Reference geometry gate failed/);
  assert.match(gate, /galleryImages/);
  assert.match(gate, /image\.decode\(\)/);
});

test("reference product fit is the single emphasized interactive decision module", () => {
  assert.match(experience, /\.category-fit\) \{[\s\S]*padding: var\(--pt33-space-6\);[\s\S]*background: var\(--px2-surface-soft\)/);
  assert.match(experience, /\.category-fit > form\) \{ padding-top: var\(--pt33-space-2\); \}/);
});

test("reference closing inherits graphite theme variables instead of legacy navy surfaces", () => {
  const page = read("src/pages/produkt/[product].astro");
  const nextSteps = read("src/components/DecisionNextSteps.astro");
  assert.match(page, /--pt-theme-surface: var\(--pt33-color-surface-raised\)/);
  assert.match(page, /referenceSurface=\{contentProduct\.slug === "petlibro-dockstream-rfid-smart"\}/);
  assert.match(nextSteps, /referenceSurface\?: boolean/);
  assert.match(nextSteps, /referenceSurface = false/);
  assert.match(nextSteps, /style=\{referenceSurface \? "--next-bg: transparent;/);
  assert.match(nextSteps, /--next-card: var\(--pt33-color-surface-raised\)/);
});
