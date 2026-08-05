import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/components/product-experience-2/ProductGallery2.astro",
  ),
  "utf8",
);

test("mobile Galerie orientiert sich an der Bildschirmhöhe", () => {
  assert.match(source, /height: clamp\(280px, 44svh, 520px\)/);
  assert.match(source, /max-height: 52svh/);
});

test("quadratische Mobile-Fläche ist aufgehoben", () => {
  assert.match(source, /aspect-ratio: auto/);
  assert.doesNotMatch(
    source,
    /\.px2-editorial-gallery__slide[^}]*aspect-ratio:\s*1\s*\/\s*1/s,
  );
});

test("kurze Displays erhalten eine niedrigere Galerie", () => {
  assert.match(source, /max-height: 700px/);
  assert.match(source, /height: clamp\(260px, 42svh, 340px\)/);
});

test("sehr hohe Displays werden nach oben begrenzt", () => {
  assert.match(source, /min-height: 900px/);
  assert.match(source, /height: min\(46svh, 480px\)/);
});

test("Bilder füllen die begrenzte Fläche weiterhin", () => {
  assert.match(source, /object-fit: cover/);
  assert.match(source, /object-position: center/);
  assert.match(source, /height: 100%/);
});

test("Swipe- und Einzelbildstruktur bleiben erhalten", () => {
  assert.match(source, /data-gallery-mobile-track/);
  assert.match(source, /"is-single": optimized\.length === 1/);
  assert.match(source, /scroll-snap-type: x mandatory/);
});
