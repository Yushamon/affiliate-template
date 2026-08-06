import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const css = read("packages/affiliate-core/src/components/comparison/comparison-experience.css");
const filters = read("packages/affiliate-core/src/components/comparison/ComparisonHeroFilters.astro");
const guidance = read("packages/affiliate-core/src/components/comparison/ComparisonInsightSummary.astro");
const sticky = read("packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro");

test("mobile Filter ist standardmäßig kompakt", () => {
  assert.match(filters, /data-mobile-collapsed="true"/);
  assert.match(filters, /data-comparison-filter-toggle/);
  assert.match(filters, /data-comparison-filter-panel/);
  assert.match(css, /\[data-mobile-collapsed="true"\][^{]*\{[^}]*display:\s*none/s);
});

test("Filter besitzt eine klare mobile Primäraktion", () => {
  assert.match(filters, /Modelle anzeigen/);
  assert.match(filters, /Filter zurücksetzen/);
  assert.doesNotMatch(filters, /Vergleich anpassen/);
});

test("Kaufberatung verwendet echte mobile Entscheidungszeilen", () => {
  assert.match(guidance, /<ol class="comparison-buying-guidance__criteria">/);
  assert.match(guidance, /comparison-buying-guidance__criterion-copy/);
  assert.match(css, /grid-template-columns:\s*2\.25rem minmax\(0,\s*1fr\) auto/);
  assert.match(css, /text-decoration:\s*none/);
});

test("Sticky CTA verwendet globale Surfaces und Safe Areas", () => {
  assert.match(css, /\.comparison-sticky-bar\s*\{[^}]*background:\s*var\(--pt-color-surface-raised\)/s);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.comparison-sticky-bar__primary\s*\{[^}]*white-space:\s*nowrap/s);
});

test("Dark Mode bleibt vollständig tokenbasiert", () => {
  assert.doesNotMatch(css, /\.theme-dark\b|\.dark\b|\[data-theme/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
  assert.match(css, /var\(--pt-color-surface\)/);
  assert.match(css, /var\(--pt-color-text\)/);
  assert.match(css, /var\(--pt-color-border\)/);
});

test("kein neuer important-Einsatz", () => {
  const cleaned = css.replace(/\.sr-only\s*\{[\s\S]*?\}/g, "");
  assert.doesNotMatch(cleaned, /!important/);
});

test("Sticky wird erst nach der Empfehlung eingeblendet", () => {
  assert.match(sticky, /comparison-sticky/);
  assert.match(sticky, /vergleichssieger/);
});
