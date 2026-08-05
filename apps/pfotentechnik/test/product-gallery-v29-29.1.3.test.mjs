import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const hero = read(
  "src/components/product-experience-2/ProductHero2.astro",
);
const gallery = read(
  "src/components/product-experience-2/ProductGallery29.astro",
);
const css = read(
  "src/components/product-experience-2/product-gallery-29.css",
);

test("ProductHero2 verwendet ausschließlich Gallery V29", () => {
  assert.match(
    hero,
    /import\s+ProductGallery29\s+from\s+["']\.\/ProductGallery29\.astro["']/,
  );
  assert.match(hero, /<ProductGallery29(?:\s|\/|>)/);
  assert.doesNotMatch(
    hero,
    /import\s+ProductGallery2\s+from\s+["'][^"']*ProductGallery2\.astro["']/,
  );
  assert.doesNotMatch(hero, /<ProductGallery2(?:\s|\/|>)/);
});

test("Gallery V29 besitzt getrennte Mobile- und Desktop-Strukturen", () => {
  assert.match(gallery, /class="pg29__mobile"/);
  assert.match(gallery, /class="pg29__desktop"/);
  assert.match(gallery, /data-product-gallery-v29/);
});

test("Mobile Gallery besitzt eine garantierte sichtbare Höhe", () => {
  const rule = css.match(/\.pg29__mobile\s*\{([^}]*)\}/s);

  assert.ok(rule);
  assert.match(rule[1], /display:\s*flex/);
  assert.match(rule[1], /height:\s*clamp\(280px, 42svh, 440px\)/);
  assert.match(rule[1], /min-height:\s*280px/);
});

test("Ein-Bild-Fall erzeugt keine Mehrbildsteuerung", () => {
  assert.match(gallery, /\{hasMultiple && \(/);
  assert.match(gallery, /class="pg29__mobile-controls"/);
  assert.match(gallery, /class="pg29-lightbox__thumbs"/);
});

test("Desktop besitzt Layouts für 1, 2, 3 und mehrere Bilder", () => {
  for (const selector of [
    ".pg29--single",
    ".pg29--double",
    ".pg29--triple",
    ".pg29--mosaic",
  ]) {
    assert.ok(css.includes(selector), selector);
  }
});

test("V29 enthält keine aktive Legacy-Galeriestruktur", () => {
  assert.equal(gallery.includes('class="px2-editorial-gallery'), false);
  assert.equal(gallery.includes("data-gallery-mobile-track"), false);
  assert.equal(gallery.includes("data-gallery-data"), false);
});

test("V29 verwendet keine Viewport-Ausbruchshacks", () => {
  const combined = gallery + css;

  assert.doesNotMatch(
    combined,
    /100dvw|left:\s*50%|margin-left:\s*-50vw|translateX\s*\(|calc\(50%\s*-\s*50vw\)/,
  );
  assert.doesNotMatch(
    css,
    /width:\s*100vw|margin(?:-inline|-left|-right)?:\s*[^;]*-\s*50vw/,
  );
});

test("Lightbox und Tastatursteuerung bleiben vorhanden", () => {
  assert.match(gallery, /<dialog class="pg29-lightbox"/);
  assert.match(gallery, /ArrowLeft/);
  assert.match(gallery, /ArrowRight/);
  assert.match(gallery, /data-pg29-close/);
});

test("CSS besitzt nur die vorgesehenen drei mobilen Höhenregeln", () => {
  assert.equal(
    (css.match(/\.pg29__mobile\s*\{/g) ?? []).length,
    3,
  );
});
