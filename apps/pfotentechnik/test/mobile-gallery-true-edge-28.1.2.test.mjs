import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (name) =>
  fs.readFileSync(
    path.join(
      process.cwd(),
      "src/components/product-experience-2",
      name,
    ),
    "utf8",
  );

const experience = read("ProductExperience2.astro");
const hero = read("ProductHero2.astro");
const gallery = read("ProductGallery2.astro");

test("Produktseiten entfernen nur mobil den oberen Containerabstand", () => {
  assert.match(
    experience,
    /main\.container:has\(\[data-product-experience="2\.1"\]\)/,
  );
  assert.match(experience, /padding-top: 0/);
  assert.match(experience, /--px2-page-gutter: 24px/);
});

test("Media-Wrapper kompensiert exakt den Seiten-Gutter", () => {
  assert.match(
    hero,
    /width: calc\(100% \+ \(2 \* var\(--px2-page-gutter, 24px\)\)\)/,
  );
  assert.match(
    hero,
    /margin-inline: calc\(-1 \* var\(--px2-page-gutter, 24px\)\)/,
  );
  assert.match(hero, /left: auto/);
  assert.match(hero, /transform: none/);
});

test("alte viewportbasierte Verschiebung ist entfernt", () => {
  assert.doesNotMatch(hero, /left: 50%/);
  assert.doesNotMatch(hero, /margin-left: -50vw/);
  assert.doesNotMatch(hero, /margin-left: -50dvw/);
  assert.doesNotMatch(hero, /width: 100dvw/);
});

test("Galerie besitzt mobil keinerlei Außenrundung", () => {
  assert.match(gallery, /px2-editorial-gallery__slide img/);
  assert.match(gallery, /border-radius: 0/);
  assert.match(gallery, /px2-editorial-gallery__mobile/);
  assert.match(gallery, /margin: 0/);
});

test("übrige Produktinhalte behalten den Container-Gutter", () => {
  assert.doesNotMatch(
    experience,
    /main\.container:has\([^)]*\)[^{]*\{[^}]*padding-inline:\s*0/s,
  );
});
