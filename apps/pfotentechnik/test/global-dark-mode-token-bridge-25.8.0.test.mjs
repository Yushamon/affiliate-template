import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const tokens = fs.readFileSync(path.join(APP, "src/styles/pfotentechnik-design-tokens.css"), "utf8");
const experience = fs.readFileSync(path.join(APP, "src/components/product-experience-2/ProductExperience2.astro"), "utf8");

test("Legacy-Aliasse nutzen globale PfotenTechnik-Tokens", () => {
  assert.match(tokens, /--color-text:\s*var\(--pt-color-text\)/);
  assert.match(tokens, /--color-surface:\s*var\(--pt-color-surface\)/);
  assert.match(tokens, /--color-surface-subtle:\s*var\(--pt-color-surface-soft\)/);
  assert.match(tokens, /--color-border:\s*var\(--pt-color-border\)/);
});

test("Statusflächen besitzen zentrale Dark-Mode-Tokens", () => {
  assert.match(tokens, /--pt-color-success-soft:\s*#153126/);
  assert.match(tokens, /--pt-color-danger-soft:\s*#382023/);
  assert.match(tokens, /--pt-color-warning-soft:\s*#332b1c/);
});

test("Product Experience verwendet keine eigene Farbpalette mehr", () => {
  assert.match(experience, /--px2-surface:\s*var\(--pt-color-surface\)/);
  assert.match(experience, /--px2-text:\s*var\(--pt-color-text\)/);
  assert.match(experience, /--px2-red-soft:\s*var\(--pt-color-danger-soft\)/);
  assert.doesNotMatch(experience, /:global\(html\[data-theme="dark"\]\) \.px2/);
  assert.doesNotMatch(experience.split("<style>")[1] ?? "", /--px2-[a-z-]+:\s*#[0-9a-f]{3,8}/i);
});
