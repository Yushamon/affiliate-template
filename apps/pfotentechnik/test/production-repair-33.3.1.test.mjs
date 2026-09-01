import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  resolveMediaSource,
  resolveProductMedia
} from "../src/domain/mediaResolver.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(directory, "..");
const read = (relativePath) => fs.readFileSync(path.join(appRoot, relativePath), "utf8");

test("product media resolver uses semantic compact-media priority with gallery fallback", () => {
  const image = (src) => ({ src, alt: src });

  assert.equal(resolveMediaSource(image("/hero.webp")), "/hero.webp");
  assert.equal(resolveProductMedia({ comparison: image("/comparison.webp"), thumbnail: image("/thumbnail.webp") }).src, "/comparison.webp");
  assert.equal(resolveProductMedia({ thumbnail: image("/thumbnail.webp"), hero: image("/hero.webp") }).src, "/thumbnail.webp");
  assert.equal(resolveProductMedia({ hero: image("/hero.webp") }).src, "/hero.webp");
  assert.equal(resolveProductMedia({ gallery: [image("/gallery-1.webp")] }).src, "/gallery-1.webp");
  assert.equal(resolveProductMedia({ comparison: { src: "" }, gallery: [image("/gallery-1.webp")] }).src, "/gallery-1.webp");
  assert.equal(resolveProductMedia({}), undefined);
});

test("product alternatives retain Astro media metadata and render a deliberate no-media state", () => {
  const source = read("src/components/product-experience-2/ProductAlternatives2.astro");

  assert.match(source, /OptimizedImage/);
  assert.doesNotMatch(source, /getCachedImage/);
  assert.match(source, /alternatives__image--fallback/);
  assert.match(source, /Produktbild nicht verfügbar/);
});

test("comparison explorer owns its styles and exposes one responsive selection control", () => {
  const component = read("../../packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro");
  const css = read("../../packages/affiliate-core/src/components/comparison/comparison-experience.css");

  assert.match(component, /import "\.\/comparison-experience\.css"/);
  assert.match(component, /comparison-pick-card__control/);
  assert.doesNotMatch(component, /comparison-pick-card__check/);
  assert.match(component, /von \{maximumSelection\} gewählt/);
  assert.match(component, /\$\{selected\.length\} von \$\{MAX_SELECTION\} gewählt/);
  assert.match(component, /ProductScore/);
  assert.match(css, /grid-template-columns:\s*1\.35rem 3\.5rem minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 47\.99rem\)/);
});

test("production Product and Comparison surfaces use the canonical ProductScore primitive", () => {
  for (const file of [
    "src/components/product-experience-2/ProductHero2.astro",
    "src/components/product-experience-2/ProductAlternatives2.astro",
    "src/components/comparison/ComparisonProduction.astro",
    "../../packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro"
  ]) {
    const source = read(file);
    assert.match(source, /ProductScore/);
    assert.doesNotMatch(source, /EditorialScore/);
  }
});
