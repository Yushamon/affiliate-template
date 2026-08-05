import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const experience = read(
  "src/components/product-experience-2/ProductExperience2.astro",
);
const hero = read(
  "src/components/product-experience-2/ProductHero2.astro",
);
const gallery = read(
  "src/components/product-experience-2/ProductGallery2.astro",
);

test("ProductExperience2 ist der einzige mobile Viewport-Owner", () => {
  assert.match(
    experience,
    /\.px2\s*\{[^}]*position:\s*relative[^}]*left:\s*50%[^}]*width:\s*100vw[^}]*margin-left:\s*-50vw/s,
  );
  assert.equal((experience.match(/width:\s*100vw/g) ?? []).length, 1);
  assert.equal((experience.match(/margin-left:\s*-50vw/g) ?? []).length, 1);
});

test("Hero fügt keinen weiteren Viewport-Ausbruch hinzu", () => {
  const mediaRule = hero.match(
    /\.px2-hero__media\[data-mobile-gallery-full-bleed\]\s*\{([^}]*)\}/s,
  );

  assert.ok(mediaRule, "Mobile Galerieregel fehlt.");
  assert.match(mediaRule[1], /width:\s*100%/);
  assert.match(mediaRule[1], /margin:\s*0/);
  assert.doesNotMatch(
    mediaRule[1],
    /100d?vw|calc\(|left:|translate|-[0-9]+px/,
  );
});

test("Hero-Karte besitzt exakt 12px mobilen Außenabstand", () => {
  const mobileContent = hero.match(
    /@media \(max-width: 759px\)[\s\S]*?\.px2-hero__content\s*\{([^}]*)\}/,
  );

  assert.ok(mobileContent, "Mobile Inhaltsregel fehlt.");
  assert.match(mobileContent[1], /margin-inline:\s*12px/);
});

test("Galeriewurzel und Track sind vollständig randlos", () => {
  const rootRule = gallery.match(
    /\.px2-editorial-gallery\s*\{([^}]*)\}/s,
  );
  const trackRule = gallery.match(
    /\.px2-editorial-gallery__mobile\s*\{([^}]*)\}/s,
  );

  assert.ok(rootRule, "Galeriewurzel fehlt.");
  assert.ok(trackRule, "Mobile Track-Regel fehlt.");

  for (const rule of [rootRule[1], trackRule[1]]) {
    assert.match(rule, /width:\s*100%/);
    assert.match(rule, /margin:\s*0/);
    assert.match(rule, /padding:\s*0/);
    assert.doesNotMatch(rule, /max-width:\s*[0-9]|calc\(|100d?vw/);
  }
});

test("weitere Produktabschnitte verwenden 12px statt verschachtelter Gutter", () => {
  assert.match(
    experience,
    /\.px2 > :not\(\.px2-hero\)\s*\{[^}]*margin-inline:\s*12px/s,
  );
});

test("alte Galerie-Ausbrüche fehlen", () => {
  const combined = experience + hero + gallery;

  assert.doesNotMatch(
    combined,
    /width:\s*calc\(100%\s*\+\s*(?:24|48)px\)|margin:\s*0\s+-(?:12|24)px|--px2-page-gutter|margin-block-start:\s*-90px/,
  );
});
