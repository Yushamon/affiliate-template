import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

test("Homepage bündelt vergleichbare Entscheidungen in einer gemeinsamen, flachen Surface", async () => {
  const source = await read(
    "packages/affiliate-core/src/components/home/HomePage.astro"
  );

  assert.match(source, /class="pt-home__decision-grid"/);
  assert.match(source, /class:list=\{\["pt-home__decision"/);
  assert.doesNotMatch(source, /pt-surface/);
});

test("Homepage verbindet Bild und Text ohne verschachtelte Card-Chrome", async () => {
  const source = await read(
    "packages/affiliate-core/src/components/home/home.css"
  );

  assert.match(source, /\.pt-home__decision-grid/);
  assert.match(source, /\.pt-home__guide-list/);
  assert.doesNotMatch(source, /!important/);
});

test("Mobile Top-Empfehlung bleibt über eine semantische Sticky-Bar steuerbar", async () => {
  const source = await read(
    "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro"
  );

  assert.match(source, /data-comparison-sticky="true"/);
  assert.match(source, /requestAnimationFrame\(update\)/);
  assert.match(source, /sticky\.hidden = !visible/);
});
