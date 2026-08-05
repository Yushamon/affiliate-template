import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const layout = read("../../packages/affiliate-core/src/layouts/AffiliateLayout.astro");
const layoutCss = read("../../packages/affiliate-core/src/styles/layout.css");
const route = read("src/pages/produkt/[product].astro");
const renderer = read("src/components/product-standard-2/ProductRenderer.astro");
const experience = read("src/components/product-experience-2/ProductExperience2.astro");
const hero = read("src/components/product-experience-2/ProductHero2.astro");
const premium = read("src/styles/pfotentechnik-product-mobile-premium.css");

test("offizieller Produktcontainer", () => {
  assert.match(layout, /mainClass\?: string/);
  assert.match(layout, /mainClass\]\}/);
  assert.match(route, /mainClass="container--product"/);
  assert.match(layoutCss, /\.container--product/);
  assert.match(layoutCss, /padding:\s*0 12px calc\(64px \+ env\(safe-area-inset-bottom\)\)/);
});
test("kein Renderer-Layout-Hack", () => {
  assert.doesNotMatch(renderer, /px2-route-layout-owner|main\.container/);
});
test("kein zweiter Experience-Gutter", () => {
  assert.match(experience, /padding:\s*0/);
  assert.doesNotMatch(experience, /padding:\s*70px 24px|max-width:\s*1200px/);
});
test("Galerie bricht exakt um 12px aus", () => {
  const rule = hero.match(
    /\.px2-hero__media\[data-mobile-gallery-full-bleed\]\s*\{([^}]*)\}/s,
  );

  assert.ok(rule, "Mobile Full-Bleed-Regel fehlt.");
  assert.match(rule[1], /width:\s*calc\(100%\s*\+\s*24px\)/);
  assert.match(rule[1], /margin:\s*0\s+-12px/);
  assert.doesNotMatch(
    rule[1],
    /calc\(100%\s*\+\s*48px\)|margin:\s*0\s+-24px|100d?vw|left:\s*50%|translateX/,
  );
  assert.equal(
    (hero.match(/\.px2-hero__media\[data-mobile-gallery-full-bleed\]/g) ?? []).length,
    1,
  );
  assert.doesNotMatch(hero, /@media \(max-width: 759px\)\s*\{\s*\}/);
});
test("alte Produkt-Container-Regel entfernt", () => {
  assert.doesNotMatch(premium, /main\.container:has\(\[data-product-page\]\)/);
});
