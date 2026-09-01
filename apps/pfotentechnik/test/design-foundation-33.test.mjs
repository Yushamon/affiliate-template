import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(app, file), "utf8");
const tokens = read("src/styles/pfotentechnik-design-tokens.css");
const foundation = read("src/styles/foundation/foundation-33.css");
const preview = read("src/pages/foundation.astro");

test("33.0.0 tokens are opt-in and preserve legacy theme tokens", () => {
  assert.match(tokens, /\[data-pt-foundation\]/);
  assert.match(tokens, /\[data-pt-foundation\]\[data-pt-mode="dark"\]/);
  assert.match(tokens, /--pt33-color-action-primary:/);
  assert.match(tokens, /--pt33-color-status-positive:/);
  assert.match(tokens, /--pt33-color-evidence-verified:/);
  assert.match(tokens, /--pt-color-action-bg:/);
});

test("foundation primitives use semantic tokens and support accessibility guards", () => {
  assert.match(foundation, /--pt33-button-primary-background/);
  assert.match(foundation, /:focus-visible/);
  assert.match(foundation, /prefers-reduced-motion/);
  assert.match(foundation, /min-height: 2\.75rem/);
  assert.doesNotMatch(foundation, /!important/);
});

test("internal preview is noindex and renders both theme modes", () => {
  assert.match(preview, /noindex=\{true\}/);
  assert.match(preview, /data-pt-mode=\{mode\}/);
  assert.match(preview, /pt33-decision-line/);
  assert.match(preview, /pt33-image-surface/);
});
