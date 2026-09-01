import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const source = fs.readFileSync(
  path.join(root, "apps/pfotentechnik/src/components/comparison/ComparisonProduction.astro"),
  "utf8"
);

test("Personal Fit keeps native disclosure semantics and the canonical icon", () => {
  assert.match(
    source,
    /<details class="rc33__explorer"[^>]*><summary><span>Persönlichen Vergleich öffnen<\/span><svg class="rc33__disclosure-icon"[^>]*aria-hidden="true">/
  );
  assert.doesNotMatch(source, /<summary[^>]*role=/);
  assert.doesNotMatch(source, /rc33__explorer[^\n]*[+−]/);
});

test("closed Personal Fit trigger is content-owned and token-driven", () => {
  assert.match(source, /\.rc33__explorer:not\(\[open\]\)\{width:fit-content;max-width:var\(--pt33-reading-width\)\}/);
  assert.match(source, /@media\(max-width:700px\)\{[^\n]*\.rc33__explorer:not\(\[open\]\)\{width:100%;max-width:none\}/);
  assert.match(source, /\.rc33__explorer\{[^}]*border:1px solid var\(--rc-line\)[^}]*background:var\(--pt33-color-surface-subtle\)/);
  assert.match(source, /\.rc33__explorer>summary:hover\{background:var\(--pt33-color-surface-raised\)\}/);
  assert.match(source, /\.rc33__explorer>summary:focus-visible/);
  assert.match(source, /\.rc33__explorer>summary\{[^}]*min-height:3\.25rem[^}]*font-weight:700/);
  assert.doesNotMatch(source, /\.rc33__explorer:not\(\[open\]\)\{width:fit-content[^}]*(?:px|calc\()/);
});

test("open Personal Fit panel keeps the frozen full decision axis", () => {
  assert.match(source, /\.rc33__explorer\{[^}]*overflow:clip/);
  assert.match(source, /\.rc33__explorer :global\(\.comparison-lab\)\{padding:1rem;background:var\(--pt33-color-surface\)\}/);
  assert.doesNotMatch(source, /\.rc33__explorer\[open\][^{]*\{[^}]*(?:width|max-width)/);
});
