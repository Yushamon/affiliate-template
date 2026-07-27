import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

test("Homepage verwendet nur eine Surface pro Karte", async () => {
  const source = await read(
    "packages/affiliate-core/src/components/home/HomeSection.astro"
  );

  assert.match(source, /class="pt-surface home3-product-card"/);
  assert.doesNotMatch(
    source,
    /class="pt-surface home3-(?:product-card__media|editorial-card__media|card-content)"/
  );
});

test("Homepage verbindet Bild und Text ohne innere Kartenradien", async () => {
  const source = await read(
    "packages/affiliate-core/src/components/home/home.css"
  );

  assert.match(source, /PT_HOME_CARD_UNIFICATION_13_2_0_START/);
  assert.match(source, /\.home5 \.home3-card-content/);
  assert.match(source, /border-radius:\s*0\s*!important/);
  assert.match(source, /background:\s*transparent\s*!important/);
});

test("Mobile Top-Empfehlung hat kompakte, belastbare Abstände", async () => {
  const source = await read(
    "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro"
  );

  assert.match(source, /PT_STICKY_SPACING_13_2_0_START/);
  assert.match(source, /padding:\s*\.625rem\s*!important/);
  assert.match(source, /gap:\s*\.5rem\s*!important/);
  assert.match(source, /min-height:\s*3rem\s*!important/);
  assert.match(source, /-webkit-line-clamp:\s*2\s*!important/);
});
