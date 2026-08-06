import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(
  path.join(app, "src/components/product-experience-2/product-gallery-29.css"),
  "utf8"
);
const gallery = fs.readFileSync(
  path.join(app, "src/components/product-experience-2/ProductGallery29.astro"),
  "utf8"
);

test("Thumbnail-Leiste beginnt links statt in der Mitte", () => {
  assert.match(css, /\.pg29-lightbox__thumbs\s*\{[\s\S]*?max\(12px, env\(safe-area-inset-left\)\)/);
  assert.match(css, /scroll-padding-inline:\s*12px/);
  assert.doesNotMatch(css, /calc\(50%\s*-\s*44px\)/);
});

test("Thumbnail-Inhalte bleiben innerhalb ihrer Buttons zentriert", () => {
  assert.match(css, /\.pg29-lightbox__thumb\s*\{[\s\S]*?place-items:\s*center/);
  assert.match(css, /\.pg29-lightbox__thumb img\s*\{[\s\S]*?object-fit:\s*contain[\s\S]*?object-position:\s*50% 50%/);
});

test("JavaScript zentriert die gesamte Thumbnail-Leiste nicht mehr", () => {
  assert.doesNotMatch(gallery, /inline:\s*"center"/);
  assert.equal((gallery.match(/inline:\s*"nearest"/g) || []).length, 2);
});

test("mobile Viewportbreite bleibt unverändert aktiv", () => {
  assert.match(css, /width:\s*100dvw/);
  assert.match(css, /margin-inline:\s*calc\(50%\s*-\s*50dvw\)/);
});

test("keine important-Regeln", () => {
  assert.doesNotMatch(css, /!important/);
});
