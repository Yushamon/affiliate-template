import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const renderer = read(
  "src/components/product-standard-2/ProductRenderer.astro",
);
const experience = read(
  "src/components/product-experience-2/ProductExperience2.astro",
);
const hero = read(
  "src/components/product-experience-2/ProductHero2.astro",
);
const gallery = read(
  "src/components/product-experience-2/ProductGallery2.astro",
);

test("Produkt-Route besitzt den eindeutigen Layout-Owner", () => {
  assert.match(renderer, /class="px2-route-layout-owner"/);
  assert.match(renderer, /:global\(main\.container\)/);
  assert.match(renderer, /max-width:\s*none/);
  assert.match(renderer, /padding:\s*0/);
  assert.doesNotMatch(renderer, /main\.container:has/);
});

test("Experience besitzt den einzigen Inhaltsgutter", () => {
  assert.match(experience, /max-width:\s*1200px/);
  assert.match(experience, /padding:\s*70px 24px/);
  assert.match(experience, /padding-top:\s*0/);
  assert.doesNotMatch(experience, /margin-block-start:\s*-90px/);
});

test("Galerie bricht exakt um den eigenen 24px-Gutter aus", () => {
  assert.match(
    hero,
    /width:\s*calc\(100%\s*\+\s*48px\)/,
  );
  assert.match(hero, /margin:\s*0\s+-24px/);
  assert.doesNotMatch(hero, /100d?vw|translateX|left:\s*50%/);
});

test("Bild füllt den Slide vollständig", () => {
  assert.match(
    gallery,
    /\.px2-editorial-gallery__slide img\s*\{[^}]*position:\s*absolute/s,
  );
  assert.match(gallery, /inset:\s*0/);
  assert.match(gallery, /object-fit:\s*cover/);
});

test("alte Full-Bleed-Korrekturen fehlen", () => {
  const combined = renderer + experience + hero + gallery;
  assert.doesNotMatch(
    combined,
    /px2-page-gutter|calc\(50%\s*-\s*50vw\)|100dvw|translateX\(-50%\)|main\.container:has/,
  );
});

test("Thumbnail-Zentrierung bleibt erhalten", () => {
  assert.match(gallery, /px2-editorial-lightbox__thumb/);
  assert.match(gallery, /place-items:\s*center/);
  assert.match(gallery, /object-position:\s*center/);
});
