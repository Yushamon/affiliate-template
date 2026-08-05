import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const galleryFile = path.join(app, "src/components/product-experience-2/ProductGallery29.astro");
const cssFile = path.join(app, "src/components/product-experience-2/product-gallery-29.css");
const premiumFile = path.join(app, "src/styles/pfotentechnik-product-mobile-premium.css");

const gallery = fs.readFileSync(galleryFile, "utf8");
const css = fs.readFileSync(cssFile, "utf8");
const premium = fs.readFileSync(premiumFile, "utf8");

test("Produktseitenwurzel entfernt horizontales Padding vollständig", () => {
  assert.match(
    premium,
    /\[data-product-page\]\.pt-product-detail\s*\{[\s\S]*?width:\s*100%[\s\S]*?margin:\s*0[\s\S]*?padding:\s*0/
  );
});

test("Galerie selbst besitzt keinen mobilen Außenabstand", () => {
  assert.match(css, /\.pg29\s*\{[\s\S]*?width:\s*100%[\s\S]*?margin:\s*0[\s\S]*?padding:\s*0/);
  assert.match(css, /\.pg29__mobile\s*\{[\s\S]*?width:\s*100%[\s\S]*?margin:\s*0[\s\S]*?padding:\s*0/);
});

test("Inhaltskarten behalten nur 12px Abstand", () => {
  assert.match(premium, /\[data-product-page\]\s*>\s*:not\(:first-child\)\s*\{[\s\S]*?margin-inline:\s*12px/);
});

test("aktive Lightbox-Thumbnails werden erst nach showModal zentriert", () => {
  const showPosition = gallery.indexOf("dialog.showModal()");
  const framePosition = gallery.indexOf("requestAnimationFrame", showPosition);
  const scrollPosition = gallery.indexOf("scrollIntoView", framePosition);
  assert.ok(showPosition >= 0);
  assert.ok(framePosition > showPosition);
  assert.ok(scrollPosition > framePosition);
  assert.match(gallery, /inline:\s*"center"/);
});

test("Thumbnailleiste zentriert nur solange sie in den Viewport passt", () => {
  assert.match(css, /\.pg29-lightbox__thumb-list\s*\{[\s\S]*?justify-content:\s*safe center/);
  assert.match(css, /\.pg29-lightbox__thumbs\s*\{[\s\S]*?overflow-x:\s*auto/);
});

test("keine important-Regeln oder Viewport-Ausbruchshacks", () => {
  assert.doesNotMatch(css, /!important/);
  assert.doesNotMatch(premium.slice(premium.lastIndexOf("V29.2.1")), /!important|100d?vw|left:\s*50%|margin-left:\s*-50vw|translateX/);
});
