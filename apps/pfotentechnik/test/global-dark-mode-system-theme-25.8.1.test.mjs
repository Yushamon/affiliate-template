import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const TOKENS = fs.readFileSync(
  path.join(APP, "src/styles/pfotentechnik-design-tokens.css"),
  "utf8"
);
const LAYOUT = fs.readFileSync(
  path.join(ROOT, "packages/affiliate-core/src/layouts/AffiliateLayout.astro"),
  "utf8"
);

test("Dark Mode folgt zentral der Systempräferenz", () => {
  assert.match(TOKENS, /@media\s*\(prefers-color-scheme:\s*dark\)/);
  assert.match(TOKENS, /:root:not\(\[data-theme="light"\]\)/);
  assert.match(TOKENS, /--pt-color-surface:\s*#16221a/);
  assert.match(TOKENS, /--pt-color-text:\s*#edf5ef/);
  assert.match(TOKENS, /--pt-color-page:\s*#101a14/);
});

test("Aktuelles Layout setzt keinen Runtime-Dark-Selektor", () => {
  assert.doesNotMatch(LAYOUT, /<html[^>]+data-theme=/);
  assert.doesNotMatch(LAYOUT, /<html[^>]+class=.*dark/);
});

test("Globale Legacy-Aliasse bleiben an aktive Tokens gebunden", () => {
  assert.match(TOKENS, /--color-text:\s*var\(--pt-color-text\)/);
  assert.match(TOKENS, /--color-surface:\s*var\(--pt-color-surface\)/);
  assert.match(TOKENS, /--color-surface-subtle:\s*var\(--pt-color-surface-soft\)/);
});
