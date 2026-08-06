import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gallery = fs.readFileSync(
  path.join(app, "src/components/product-experience-2/ProductGallery29.astro"),
  "utf8"
);
const css = fs.readFileSync(
  path.join(app, "src/components/product-experience-2/product-gallery-29.css"),
  "utf8"
);

test("Thumbnail-Optimierung bewahrt das Seitenverhältnis der Quelldatei", () => {
  assert.match(gallery, /getCachedImage\(\{ src: item\.src, width: 240, quality: "mid" \}\)/);
  assert.doesNotMatch(gallery, /width: 240, height: 180/);
  assert.doesNotMatch(gallery, /width: 240[^\n]*fit: "contain"/);
});

test("jedes Thumbnail besitzt einen isolierten Contain-Rahmen", () => {
  assert.match(gallery, /class="pg29-lightbox__thumb-frame"/);
  assert.match(gallery, /class="pg29-lightbox__thumb-image"/);
  assert.match(gallery, /width=\{item\.width\}/);
  assert.match(gallery, /height=\{item\.height\}/);
});

test("Thumbnail-Bilder werden weder gestreckt noch abgeschnitten", () => {
  assert.match(css, /\.pg29-lightbox__thumb-frame\s*\{[\s\S]*?place-items:\s*center[\s\S]*?overflow:\s*hidden/);
  assert.match(
    css,
    /\.pg29 \.pg29-lightbox__thumb > \.pg29-lightbox__thumb-frame > \.pg29-lightbox__thumb-image\s*\{[\s\S]*?width:\s*auto[\s\S]*?max-width:\s*100%[\s\S]*?height:\s*auto[\s\S]*?max-height:\s*100%[\s\S]*?object-fit:\s*contain/
  );
  assert.doesNotMatch(css, /\.pg29-lightbox__thumb img\s*\{[\s\S]*?width:\s*100%[\s\S]*?height:\s*100%/);
});

test("linksbündige Thumbnail-Leiste und nearest-Scrolling bleiben erhalten", () => {
  assert.match(css, /\.pg29-lightbox__thumb-list\s*\{[\s\S]*?justify-content:\s*flex-start/);
  assert.equal((gallery.match(/inline:\s*"nearest"/g) || []).length, 2);
  assert.doesNotMatch(gallery, /inline:\s*"center"/);
});

test("keine important-Regeln", () => {
  assert.doesNotMatch(css, /!important/);
});
