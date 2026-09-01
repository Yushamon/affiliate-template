import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  isResolvedProductImage,
  resolveProductHeroMedia
} from "../src/domain/mediaResolver.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(directory, "..");
const read = (relativePath) => fs.readFileSync(path.join(app, relativePath), "utf8");
const image = (name) => ({
  src: { src: `/_astro/${name}.hash.webp`, width: 1400, height: 1050, format: "webp" },
  alt: name
});

test("verified hero metadata wins the generic Product Hero resolution", () => {
  const hero = image("hero");
  const result = resolveProductHeroMedia({
    hero,
    gallery: [image("gallery-1")],
    comparison: image("comparison"),
    thumbnail: image("thumbnail")
  });

  assert.equal(isResolvedProductImage(hero), true);
  assert.deepEqual(result, { role: "hero", media: hero, fallback: false });
});

test("missing hero uses verified gallery media before compact derivatives", () => {
  const gallery = image("gallery-1");
  const result = resolveProductHeroMedia({
    gallery: [gallery],
    comparison: image("comparison"),
    thumbnail: image("thumbnail")
  });

  assert.deepEqual(result, { role: "gallery", media: gallery, fallback: true });
});

test("broken explicit media is rejected instead of being emitted blindly", () => {
  const broken = { src: "../../assets/images/products/example/missing.webp", alt: "missing" };
  const comparison = image("comparison");

  assert.equal(isResolvedProductImage(broken), false);
  assert.deepEqual(
    resolveProductHeroMedia({ hero: broken, comparison }),
    { role: "comparison", media: comparison, fallback: true }
  );
  assert.equal(resolveProductHeroMedia({ hero: broken }), undefined);
});

test("Product gallery emits Astro-generated results without product-specific branches", () => {
  const gallery = read("src/components/product-experience-2/ProductGallery29.astro");
  const model = read("src/domain/productExperience/model.ts");

  assert.match(gallery, /src: image\.src/);
  assert.match(gallery, /mobileSrc: mobileImage\.src/);
  assert.doesNotMatch(gallery, /reference && source|catch\s*\{[^}]*src:\s*fallback/);
  assert.doesNotMatch(`${gallery}\n${model}`, /neakasa-m1|petlibro-dockstream|data\.slug\s*===/i);
});

test("suitability and warning copy come only from the current Product model", () => {
  const verdict = read("src/components/product-experience-2/ProductVerdict2.astro");
  const experience = read("src/components/product-experience-2/ProductExperience2.astro");
  const neakasa = read("src/content/products/neakasa-m1-lite.md");
  const dockstream = read("src/content/products/petlibro-dockstream-rfid-smart.md");

  assert.match(verdict, /const primaryFit = model\.idealFor\[0\] \?\? model\.suitabilitySummary/);
  assert.match(verdict, /<dd>\{primaryFit\}<\/dd>/);
  assert.match(verdict, /<dd>\{model\.mainLimitation\}<\/dd>/);
  assert.match(verdict, /<p>\{limitationContext\}<\/p>/);
  assert.doesNotMatch(verdict, /PETLIBRO|Halsband nötig|Mehrkatzen|welches Tier den Brunnen/i);
  assert.doesNotMatch(neakasa, /PETLIBRO|Halsbandanhänger/i);
  assert.match(dockstream, /PETLIBRO-RFID-Halsbandanhänger/);
  assert.match(experience, /<div class="px2__verdict-fit">[\s\S]*ProductVerdict2[\s\S]*ProductCategoryFitAssistant/);
});

test("Decision Summary is one compact editorial unit without a card surface", () => {
  const verdict = read("src/components/product-experience-2/ProductVerdict2.astro");

  assert.match(verdict, /<dl class="verdict__decision-summary"/);
  assert.match(verdict, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(verdict, /border-block: 1px solid var\(--px2-border\)/);
  assert.doesNotMatch(verdict, /verdict__decision-summary[^}]*background:/);
  assert.match(verdict, /@media \(max-width: 719px\)[\s\S]*verdict__decision-summary \{ grid-template-columns: minmax\(0, 1fr\)/);
});
