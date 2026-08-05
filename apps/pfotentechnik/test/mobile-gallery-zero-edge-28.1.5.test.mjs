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

test("Thumbnail-Leiste zentriert ihre Kacheln vertikal", () => {
  assert.match(
    source,
    /\.px2-editorial-lightbox__thumbs\s*\{[^}]*align-items:\s*center/s,
  );
});

test("Thumbnail-Button besitzt einen expliziten Zentrierungs-Owner", () => {
  assert.match(
    source,
    /\.px2-editorial-lightbox__thumb\s*\{[^}]*display:\s*grid/s,
  );
  assert.match(source, /place-items:\s*center/);
  assert.match(source, /line-height:\s*0/);
  assert.match(source, /vertical-align:\s*middle/);
});

test("Thumbnail-Bild füllt die Kachel mittig", () => {
  assert.match(
    source,
    /\.px2-editorial-lightbox__thumb img\s*\{[^}]*object-fit:\s*cover/s,
  );
  assert.match(source, /object-position:\s*center center/);
  assert.match(source, /height:\s*100%/);
  assert.match(source, /margin:\s*0/);
});

test("aktive Thumbnail-Markierung bleibt erhalten", () => {
  assert.match(
    source,
    /\.px2-editorial-lightbox__thumb\.is-active/,
  );
  assert.match(source, /aria-current/);
});

test("Zero-Edge- und Höhenregeln bleiben erhalten", () => {
  assert.match(source, /height: clamp\(280px, 44svh, 520px\)/);
  assert.match(source, /max-height: 52svh/);
  assert.match(source, /px2-editorial-gallery__slide img/);
  assert.match(source, /object-fit: cover/);
});

test("Lightbox-Navigation bleibt vollständig", () => {
  assert.match(source, /data-gallery-previous/);
  assert.match(source, /data-gallery-next/);
  assert.match(source, /data-gallery-zoom/);
  assert.match(source, /data-gallery-close/);
});
