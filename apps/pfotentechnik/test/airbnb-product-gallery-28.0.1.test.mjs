import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/product-experience-2/ProductGallery2.astro"),
  "utf8",
);

test("Desktop-Mosaik, mobile Snap-Gallery und Dialog sind vorhanden", () => {
  assert.match(source, /px2-editorial-gallery__desktop/);
  assert.match(source, /scroll-snap-type: x mandatory/);
  assert.match(source, /data-gallery-dialog/);
  assert.match(source, /Alle Bilder/);
});

test("Null- und Einzelbildfälle sind explizit behandelt", () => {
  assert.match(source, /"is-single": optimized\.length === 1/);
  assert.match(source, /"is-empty": !hasImages/);
  assert.match(source, /hasMultiple/);
  assert.match(source, /Produktbild wird geprüft/);
});

test("Tastatur, Swipe, Zoom und Fokus-Rückgabe sind vorhanden", () => {
  assert.match(source, /event\.key === "ArrowLeft"/);
  assert.match(source, /event\.key === "ArrowRight"/);
  assert.match(source, /pointerdown/);
  assert.match(source, /pointerup/);
  assert.match(source, /activeTrigger\?\.focus\(\)/);
  assert.match(source, /prefers-reduced-motion: reduce/);
});

test("Mobile Galerie ist full-bleed, Bedienelemente bleiben im Inhaltsraster", () => {
  assert.match(source, /width: 100vw/);
  assert.match(source, /margin-inline: calc\(50% - 50vw\)/);
  assert.match(source, /px2-editorial-gallery__mobile \{ border-radius: 0/);
  assert.match(source, /px2-editorial-gallery__mobile-meta \{ padding-inline: 16px/);
  assert.match(source, /px2-editorial-gallery__empty \{ margin-inline: 16px/);
});

test("Legacy Thumbnail-Swap wurde vollständig entfernt", () => {
  for (const marker of [
    "data-px2-gallery-main",
    "data-px2-gallery-thumb",
    "px2-gallery__thumbs",
    "touchStartX",
    "const select = (index: number)",
  ]) assert.equal(source.includes(marker), false, marker);
});
