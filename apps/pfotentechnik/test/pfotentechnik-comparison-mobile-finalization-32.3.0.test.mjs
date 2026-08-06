import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) =>
  fs.readFileSync(path.join(root, relative), "utf8");

const css = read(
  "packages/affiliate-core/src/components/comparison/comparison-experience.css"
);
const explorer = read(
  "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro"
);
const methodology = read(
  "packages/affiliate-core/src/components/comparison/ComparisonMethodology.astro"
);
const sticky = read(
  "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro"
);

test("mobile Produktauswahl ist ein vollständiges Raster ohne abgeschnittene Karten", () => {
  assert.match(
    css,
    /\.comparison-lab__picker\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s
  );
  const pickerBlock =
    css.match(/\.comparison-lab__picker\s*\{[\s\S]*?\}/)?.[0] ?? "";
  assert.doesNotMatch(pickerBlock, /overflow-x:\s*auto/);
  assert.match(
    css,
    /\.comparison-pick-card\s*\{[^}]*grid-template-columns:\s*3\.5rem minmax\(0,\s*1fr\)/s
  );
});

test("Auswahlkarten und Tabelle beginnen nach Änderungen wieder am selben Produkt", () => {
  assert.match(explorer, /const stage = root\.querySelector\("\[data-comparison-stage\]"\)/);
  assert.match(explorer, /card\.style\.order = String\(/);
  assert.match(explorer, /requestAnimationFrame\(resetComparisonScroll\)/);
  assert.match(explorer, /stage\.scrollLeft = 0/);
});

test("zwei Produktspalten passen mobil gemeinsam mit der Kriterien-Spalte", () => {
  assert.match(
    css,
    /grid-template-columns:\s*minmax\(7rem,\s*7rem\)\s*repeat\(var\(--pt-comparison-selected-count\),\s*minmax\(7\.75rem,\s*1fr\)\)/
  );
  assert.match(
    css,
    /min-width:\s*calc\(7rem \+ var\(--pt-comparison-selected-count\) \* 7\.75rem\)/
  );
});

test("mobile Werkzeugleiste bleibt kompakt", () => {
  assert.match(
    css,
    /\/\* Toolbar \*\/[\s\S]*?\.comparison-lab__toolbar\s*\{[^}]*padding:\s*\.65rem/s
  );
  assert.match(
    css,
    /\.comparison-lab__filter-button\s*\{[^}]*min-height:\s*44px/s
  );
  assert.match(
    css,
    /\.comparison-lab__reset\s*\{[^}]*min-height:\s*32px/s
  );
});

test("Methodik-Zeile besitzt getrennte Typografie und nur ein Sprungziel", () => {
  assert.match(methodology, /comparison-methodology__summary-copy/);
  assert.match(methodology, /comparison-methodology__summary-icon/);
  assert.doesNotMatch(
    methodology,
    /<details[^>]*\sid="methodik"/
  );
  assert.match(
    css,
    /\.comparison-methodology__summary\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) 2rem/s
  );
});

test("Vergleichsinhalt erhält keinen künstlichen Leerraum für die Sticky-CTA", () => {
  assert.match(
    css,
    /\.comparison-shell\s*\{\s*padding-bottom:\s*0;\s*\}/
  );
  assert.doesNotMatch(css, /padding-bottom:\s*calc\(6rem/);
});

test("mobile Sticky-CTA ist nur noch ein kompakter Button", () => {
  assert.match(
    css,
    /@media \(max-width:\s*47\.99rem\)[\s\S]*?\.comparison-sticky-bar__identity\s*\{\s*display:\s*none;/s
  );
  assert.match(
    css,
    /@media \(max-width:\s*47\.99rem\)[\s\S]*?\.comparison-sticky-bar\s*\{[^}]*left:\s*auto/s
  );
  assert.match(sticky, /footerReached/);
  assert.match(sticky, /astro:before-swap/);
  assert.match(sticky, /AbortController/);
});

test("Sprungziele bleiben unter dem Sticky-Header sichtbar", () => {
  assert.match(
    css,
    /\.pt-page--comparison[\s\S]*scroll-margin-top:\s*5\.5rem/
  );
});

test("Patch führt keine neuen important-Regeln ein", () => {
  const cleaned = css.replace(/\.sr-only\s*\{[\s\S]*?\}/g, "");
  assert.doesNotMatch(cleaned, /!important/);
});
