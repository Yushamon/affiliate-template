import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

test("product experience restores the previous card hierarchy", async () => {
  const experience = await read("apps/pfotentechnik/src/components/product-experience-2/ProductExperience2.astro");
  const gallery = await read("apps/pfotentechnik/src/components/product-experience-2/ProductGallery2.astro");
  const timeline = await read("apps/pfotentechnik/src/components/product-experience-2/ProductEverydayTimeline.astro");
  const trust = await read("apps/pfotentechnik/src/components/product-experience-2/ProductTrust2.astro");

  assert.match(experience, /data-product-layout="cards-restored"/);
  assert.match(gallery, /border:\s*1px solid var\(--px2-border\)/);
  assert.match(gallery, /box-shadow:\s*var\(--px2-shadow\)/);
  assert.match(timeline, /border:\s*1px solid var\(--px2-border\)/);
  assert.match(timeline, /border-radius:24px/);
  assert.match(trust, /border:\s*1px solid var\(--px2-border\)/);
  assert.match(trust, /article\{[\s\S]*border:1px solid var\(--px2-border\)/);
});

test("decision questions are cards while result semantics use explicit marks", async () => {
  const source = await read("apps/pfotentechnik/src/components/product-experience-2/ProductDecisionAssistant.astro");
  assert.match(source, /fieldset\s*\{[\s\S]*border:\s*1px solid var\(--px2-border\)/);
  assert.match(source, /border-radius:\s*18px/);
  assert.match(source, /reasonMark:[\s\S]*positive:\s*"✓"[\s\S]*neutral:\s*"–"[\s\S]*negative:\s*"×"/);
  assert.match(source, /decision__reason-mark/);
  assert.doesNotMatch(source, /li\[data-kind="negative"\]::before/);
});

test("details preserve deduplication and restore card containers", async () => {
  const source = await read("apps/pfotentechnik/src/components/product-experience-2/ProductDetails2.astro");
  assert.match(source, /uniqueTextItems/);
  assert.match(source, /exclude:\s*warnings/);
  assert.match(source, /details\s*>\s*article[\s\S]*details\s*>\s*section[\s\S]*border:\s*1px solid var\(--px2-border\)/);
  assert.match(source, /details__list--negative[\s\S]*aria-hidden="true">×</);
  assert.match(source, /details__list--positive[\s\S]*aria-hidden="true">✓</);
});

test("alternatives use cards and the shared score where a score exists", async () => {
  const source = await read("apps/pfotentechnik/src/components/product-experience-2/ProductAlternatives2.astro");
  assert.match(source, /EditorialScore/);
  assert.match(source, /variant="ring-compact"/);
  assert.match(source, /article\{[\s\S]*border:1px solid var\(--px2-border\)[\s\S]*border-radius:20px/);
});
