import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const layoutCss = read(
  "../../packages/affiliate-core/src/styles/layout.css",
);
const route = read("src/pages/produkt/[product].astro");
const experience = read(
  "src/components/product-experience-2/ProductExperience2.astro",
);
const hero = read(
  "src/components/product-experience-2/ProductHero2.astro",
);

test("Produkt-Route verwendet den expliziten Produktcontainer", () => {
  assert.match(route, /mainClass="container--product"/);
});

test("mobile Produktseite neutralisiert den allgemeinen Container vollständig", () => {
  const rules = [
    ...layoutCss.matchAll(
      /\.container\.container--product\s*\{([^}]*)\}/gs,
    ),
  ];

  assert.equal(rules.length, 2);
  const mobileRule = rules[1][1];

  assert.match(mobileRule, /width:\s*100%/);
  assert.match(mobileRule, /max-width:\s*none/);
  assert.match(mobileRule, /margin:\s*0/);
  assert.match(
    mobileRule,
    /padding:\s*0 0 calc\(64px \+ env\(safe-area-inset-bottom\)\)/,
  );
});

test("keine schwächere container--product-Regel konkurriert mehr", () => {
  const selectors = [
    ...layoutCss.matchAll(/(^|})\s*([^@{}][^{}]*)\{/gm),
  ]
    .map((match) => match[2].trim())
    .flatMap((selectorList) =>
      selectorList.split(",").map((selector) => selector.trim()),
    );

  assert.equal(
    selectors.filter((selector) => selector === ".container--product").length,
    0,
  );

  assert.equal(
    selectors.filter(
      (selector) => selector === ".container.container--product",
    ).length,
    2,
  );
});

test("Galerie ist ohne Ausgleichshack tatsächlich randlos", () => {
  const rule = hero.match(
    /\.px2-hero__media\[data-mobile-gallery-full-bleed\]\s*\{([^}]*)\}/s,
  );

  assert.ok(rule, "Galerieregel fehlt.");
  assert.match(rule[1], /width:\s*100%/);
  assert.match(rule[1], /margin:\s*0/);
  assert.doesNotMatch(
    rule[1],
    /calc\(|-[0-9]+px|100d?vw|left:|translate/,
  );
});

test("Hero-Inhalt verwendet nur 12px Außenabstand", () => {
  const mobileContent = hero.match(
    /@media \(max-width: 759px\)[\s\S]*?\.px2-hero__content\s*\{([^}]*)\}/,
  );

  assert.ok(mobileContent, "Mobile Hero-Inhaltsregel fehlt.");
  assert.match(mobileContent[1], /margin-inline:\s*12px/);
});

test("weitere Produktabschnitte verwenden denselben 12px-Gutter", () => {
  assert.match(
    experience,
    /\.px2 > :not\(\.px2-hero\)\s*\{[^}]*margin-inline:\s*12px/s,
  );
  assert.match(experience, /padding:\s*0/);
});

test("alte Full-Bleed- und Doppelgutter-Regeln fehlen", () => {
  const combined = layoutCss + experience + hero;

  assert.doesNotMatch(
    combined,
    /width:\s*calc\(100%\s*\+\s*(?:24|48)px\)|margin:\s*0\s+-(?:12|24)px|margin-block-start:\s*-90px|--px2-page-gutter/,
  );
});
