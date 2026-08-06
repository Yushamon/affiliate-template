import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(
  root,
  "packages/affiliate-core/src/components/comparison/comparison-experience.css"
);
const css = fs.readFileSync(file, "utf8");

test("Checkboxen besitzen einen festen kompakten Owner", () => {
  assert.match(css, /\.comparison-control-box\s*\{[^}]*flex:\s*0 0 1\.25rem/s);
  assert.match(css, /\.comparison-control-box\s*\{[^}]*width:\s*1\.25rem/s);
  assert.match(css, /input:checked \+ \.comparison-control-box::after/);
});

test("native Checkboxen werden visuell verborgen", () => {
  assert.match(
    css,
    /\.comparison-lab__filter-groups label > input\s*\{[^}]*opacity:\s*0/s
  );
});

test("Filterzeilen sind zweispaltig statt pillenförmig", () => {
  assert.match(
    css,
    /\.comparison-lab__filter-groups label\s*\{[^}]*grid-template-columns:\s*1\.25rem minmax\(0,\s*1fr\)/s
  );
  assert.match(css, /\.comparison-lab__filter-groups fieldset\s*\{[^}]*background:\s*var\(--pt-color-surface-raised\)/s);
});

test("Sticky CTA verwendet im Light Mode globale helle Surface", () => {
  assert.match(
    css,
    /\.comparison-sticky-bar\s*\{[^}]*background:\s*var\(--pt-color-surface\)/s
  );
  assert.match(
    css,
    /\.comparison-sticky-bar__identity strong\s*\{[^}]*color:\s*var\(--pt-color-text\)/s
  );
});

test("keine Theme-Sonderselektoren", () => {
  const patch = css.split("/* Comparison controls and light sticky CTA 32.1.1 */").pop() ?? "";
  assert.doesNotMatch(patch, /\.theme-dark\b|\.dark\b|\[data-theme/);
});

test("keine neuen important-Regeln", () => {
  const patch = css.split("/* Comparison controls and light sticky CTA 32.1.1 */").pop() ?? "";
  assert.doesNotMatch(patch, /!important/);
});
