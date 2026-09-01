import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { resolveComparisonProductImage, resolveMediaSource } from "../src/domain/comparison/mediaResolver.mjs";

const yaml = createRequire(import.meta.url)("js-yaml");
const app = path.resolve(new URL("..", import.meta.url).pathname);
const readProduct = (slug) => {
  const file = path.join(app, "src/content/products", `${slug}.md`);
  const source = fs.readFileSync(file, "utf8");
  return yaml.load(source.match(/^---\n([\s\S]*?)\n---/)[1], { schema: yaml.JSON_SCHEMA });
};

test("comparison media resolver uses generic priority and nested Astro metadata", () => {
  const image = resolveComparisonProductImage({
    comparison: { src: { src: "/_astro/comparison.webp" }, alt: "comparison" },
    thumbnail: { src: "/_astro/thumbnail.webp" },
    hero: { src: "/_astro/hero.webp" }
  });
  assert.equal(resolveMediaSource(image), "/_astro/comparison.webp");
});

test("comparison media resolver falls back without product-specific branches", () => {
  assert.equal(
    resolveMediaSource(resolveComparisonProductImage({ comparison: null, thumbnail: { src: "/thumb.webp" }, hero: { src: "/hero.webp" } })),
    "/thumb.webp"
  );
  assert.equal(
    resolveMediaSource(resolveComparisonProductImage({ comparison: null, thumbnail: null, hero: "/hero.webp" })),
    "/hero.webp"
  );
  assert.equal(resolveComparisonProductImage({}), undefined);
});

test("comparison media resolver resolves real finalist media across categories", () => {
  const finalists = [
    "petkit-yumshare-dual-hopper",
    "petlibro-granary-camera-feeder",
    "tractive-dog-6",
    "weenect-xs",
    "oneisall-3-2l-cordless-fountain",
    "petkit-eversweet-solo-2-fountain"
  ];
  for (const slug of finalists) {
    const data = readProduct(slug);
    const media = resolveComparisonProductImage(data.images);
    const source = resolveMediaSource(media);
    assert.ok(source, `${slug}: resolver returned no media source`);
    assert.ok(fs.existsSync(path.resolve(app, "src/content/products", source)), `${slug}: media source is not emitted content`);
  }
});
