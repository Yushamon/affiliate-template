import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(app, "../..");
const read = (file) => fs.readFileSync(file, "utf8");

const layout = read(path.join(repo, "packages/affiliate-core/src/styles/layout.css"));
const productRoute = read(path.join(app, "src/pages/produkt/[product].astro"));
const comparisonRoute = read(path.join(app, "src/pages/vergleiche/[comparison].astro"));
const comparisonCss = read(path.join(repo, "packages/affiliate-core/src/components/comparison/comparison-system.css"));
const experience = read(path.join(app, "src/components/product-experience-2/ProductExperience2.astro"));
const hero = read(path.join(app, "src/components/product-experience-2/ProductHero2.astro"));
const galleryCss = read(path.join(app, "src/components/product-experience-2/product-gallery-29.css"));

test("beide Seitentypen verwenden denselben Layout-Owner", () => {
  assert.match(productRoute, /mainClass="container--immersive"/);
  assert.match(comparisonRoute, /mainClass="container--immersive"/);
  assert.doesNotMatch(layout, /container--product/);
});

test("layout.css enthält genau einen kanonischen Gutter-Owner", () => {
  assert.equal((layout.match(/--pt-page-gutter:\s*12px/g) || []).length, 1);
  assert.equal((layout.match(/\.container\.container--immersive\s*\{/g) || []).length, 1);
});

test("Vergleich trennt Struktur und Außenabstand", () => {
  assert.match(
    comparisonCss,
    /\.comparison-detail,\s*\.comparison-shell\s*\{\s*display:\s*grid;\s*width:\s*100%;\s*min-width:\s*0;/
  );
  assert.match(
    comparisonCss,
    /\.comparison-detail\s*\{\s*--comparison-readable-width:\s*76rem;\s*padding-inline:\s*var\(--pt-page-gutter, 12px\);\s*\}/
  );
  assert.equal(
    (comparisonCss.match(/padding-inline:\s*var\(--pt-page-gutter, 12px\)/g) || []).length,
    1
  );
  assert.doesNotMatch(comparisonCss, /--comparison-page-gutter/);
});

test("lesbare Vergleichsbereiche erzeugen keinen zweiten Gutter", () => {
  assert.match(
    comparisonCss,
    /\.comparison-detail > \.comparison-content,\s*\.comparison-detail > #faq\s*\{\s*width:\s*min\(100%, var\(--comparison-readable-width\)\);\s*margin-inline:\s*auto;/
  );
});

test("Produktinhalte verwenden den globalen Token", () => {
  assert.match(experience + hero, /var\(--pt-page-gutter, 12px\)/);
});

test("Galerie bleibt vom Seitengutter entkoppelt", () => {
  assert.match(galleryCss, /width:\s*100dvw/);
  assert.match(galleryCss, /margin-inline:\s*calc\(50%\s*-\s*50dvw\)/);
  assert.doesNotMatch(
    hero,
    /\.px2-hero__media[^}]*?(?:padding-inline|margin-inline):\s*var\(--pt-page-gutter/
  );
});
