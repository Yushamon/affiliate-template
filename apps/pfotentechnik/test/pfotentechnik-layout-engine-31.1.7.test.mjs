import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const css = read("packages/affiliate-core/src/components/comparison/comparison-system.css");
const hero = read("packages/affiliate-core/src/components/comparison/ComparisonHero.astro");
const layout = read("packages/affiliate-core/src/styles/page-layout-engine.css");
const route = read("apps/pfotentechnik/src/pages/vergleiche/[comparison].astro");

test("Tests prüfen den aktuell gerenderten Cover-DOM", () => {
  assert.match(hero, /class="comparison-cover"/);
  assert.match(hero, /comparison-cover__copy/);
  assert.match(hero, /comparison-cover__media/);
  assert.match(hero, /comparison-cover__facts/);
  assert.match(hero, /data-layout-engine="31\.1\.7"/);
});

test("sichtbarer Cover verwendet globale Layout- und Theme-Tokens", () => {
  assert.match(css, /\.comparison-cover\s*\{[\s\S]*grid-template-columns:/);
  assert.match(css, /\.comparison-cover\s*\{[\s\S]*background:\s*var\(--pt-color-surface\)/);
  assert.match(css, /\.comparison-cover\s*\{[\s\S]*border:\s*1px solid var\(--pt-color-border\)/);
  assert.match(css, /\.comparison-cover__copy h1\s*\{[\s\S]*color:\s*var\(--pt-color-text\)/);
  assert.match(css, /\.comparison-cover__copy\s*>\s*p\s*\{[\s\S]*color:\s*var\(--pt-color-text-muted\)/);
});

test("mobile Cover hat 16px Innenabstand und einspaltige Struktur", () => {
  assert.match(css, /@media\s*\(max-width:\s*759px\)[\s\S]*\.comparison-cover\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /@media\s*\(max-width:\s*759px\)[\s\S]*\.comparison-cover\s*\{[\s\S]*padding:\s*1rem/);
  assert.match(layout, /--pt-page-gutter:\s*16px/);
});

test("tote Hero-Basis und alte Hero-Elemente wurden entfernt", () => {
  const selectors = [...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].map((match) => match[1].trim());
  const legacySelectors = selectors.filter((selector) =>
    selector.split(",").some((part) =>
      /.comparison-hero(?=$|s|__|--)/.test(part.trim())
    )
  );
  assert.deepEqual(legacySelectors, []);
  assert.match(css, /\.comparison-hero-filters/);
});

test("sichtbare Cards und Tabellen verwenden globale Tokens", () => {
  assert.match(css, /\.recommendation-card[\s\S]*background:\s*var\(--pt-color-surface\)/);
  assert.match(css, /\.comparison-table thead th[\s\S]*background:\s*var\(--pt-color-surface-soft\)/);
  assert.match(css, /\.comparison-button[\s\S]*color:\s*var\(--pt-color-action-text\)/);
});

test("keine Vergleichs-Theme-Sonderselektoren", () => {
  for (const block of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    const selector = block[1];
    if (/.comparison-/.test(selector)) {
      assert.doesNotMatch(selector, /\.theme-dark\b|\.dark\b|\[data-theme/);
    }
  }
});

test("Vergleichsroute bleibt am gemeinsamen Layout-Owner", () => {
  assert.match(route, /mainClass="container--page"/);
  assert.match(route, /class="pt-page pt-page--comparison"/);
});
