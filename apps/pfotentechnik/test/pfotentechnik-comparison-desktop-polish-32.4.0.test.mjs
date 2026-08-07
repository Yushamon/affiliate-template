import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const css = read("packages/affiliate-core/src/components/comparison/comparison-experience.css");
const hero = read("packages/affiliate-core/src/components/comparison/ComparisonHero.astro");
const price = read("packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro");
const shell = read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro");

test("Hero-Facts besitzen sichtbare Icons", () => {
  assert.match(hero, /glyph: "▦"/);
  assert.match(hero, /glyph: "✓"/);
  assert.match(hero, />\{fact\.glyph\}<\/span>/);
});

test("Desktop-Filter nutzt volle Hero-Breite", () => {
  assert.match(css, /grid-column:\s*1 \/ -1/);
  assert.match(css, /repeat\(4, minmax\(10rem, 1fr\)\)/);
});

test("Standardpreis ist kollisionsfrei vertikal", () => {
  assert.match(price, /grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(price, /white-space:\s*normal/);
  assert.match(price, /text-align:\s*left/);
});

test("Vergleichscontent besitzt eigenen Editorial-Rhythmus", () => {
  assert.match(css, /\.pt-page--comparison \.comparison-content h2/);
  assert.match(css, /\.pt-page--comparison \.comparison-content table/);
});

test("Patch führt keine important-Regeln ein", () => {
  const section = css.split("/* Comparison Experience 32.4.0 desktop polish */")[1] ?? "";
  assert.doesNotMatch(section, /!important/);
});

test("Shell markiert Experience 32.4.0", () => {
  assert.match(shell, /data-comparison-experience="32\.4\.0"/);
});
