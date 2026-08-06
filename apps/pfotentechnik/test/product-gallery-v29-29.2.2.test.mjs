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

test("mobile Galerie besitzt die Viewportbreite unabhängig vom Eltern-Gutter", () => {
  assert.match(css, /\.pg29\s*\{[\s\S]*?width:\s*100dvw[\s\S]*?margin-inline:\s*calc\(50%\s*-\s*50dvw\)/);
});

test("Slides und Bilder füllen die Galerie ohne eigenen Rand", () => {
  assert.match(css, /\.pg29__mobile,[\s\S]*?\.pg29__slide,[\s\S]*?\.pg29 \.pg29__image[\s\S]*?width:\s*100%[\s\S]*?margin-inline:\s*0/);
});

test("Thumbnailbilder werden vollständig und mittig dargestellt", () => {
  assert.match(css, /\.pg29-lightbox__thumb img\s*\{[\s\S]*?object-fit:\s*contain[\s\S]*?object-position:\s*50% 50%/);
});

test("aktive Thumbnails können exakt in die Mitte gescrollt werden", () => {
  assert.match(css, /\.pg29-lightbox__thumbs\s*\{[\s\S]*?padding:[\s\S]*?calc\(50% - 44px\)[\s\S]*?scroll-padding-inline:\s*50%/);
  assert.match(css, /\.pg29-lightbox__thumb\s*\{[\s\S]*?scroll-snap-align:\s*center/);
});

test("keine important-Regeln", () => {
  assert.doesNotMatch(css, /!important/);
});
