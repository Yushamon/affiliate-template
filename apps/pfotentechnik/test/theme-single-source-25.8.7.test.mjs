import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (target) => fs.readFileSync(target, "utf8");

const tokens = read(path.join(app, "src/styles/pfotentechnik-design-tokens.css"));
const foundation = read(path.join(app, "src/styles/foundation/tokens.css"));
const designSystem = read(path.join(app, "src/styles/pfotentechnik-design-system.css"));
const px2Root = read(path.join(
  app,
  "src/components/product-experience-2/ProductExperience2.astro"
));
const px2Dir = path.join(app, "src/components/product-experience-2");

const astroFiles = fs.readdirSync(px2Dir)
  .filter((name) => name.endsWith(".astro"))
  .map((name) => read(path.join(px2Dir, name)))
  .join("\n");

test("the foundation theme aliases the central semantic palette", () => {
  assert.match(foundation, /--pt-theme-text:\s*var\(--pt-color-text\)/);
  assert.match(foundation, /--pt-theme-surface:\s*var\(--pt-color-surface\)/);
  assert.match(foundation, /--pt-theme-accent-text:\s*var\(--pt-color-accent-text\)/);
  assert.match(foundation, /--pt-theme-accent:\s*var\(--pt-color-action-bg\)/);
  assert.doesNotMatch(
    foundation,
    /--pt-theme-text:\s*#[0-9a-f]{3,8}/i
  );
});

test("the competing legacy dark mode no longer overrides the semantic theme", () => {
  assert.doesNotMatch(
    designSystem,
    /--pt-ink-950:\s*#f8fafc/
  );
  assert.doesNotMatch(
    designSystem,
    /(^|[;{]\s*)color\s*:\s*var\(--pt-theme-accent\)\s*;/m
  );
});

test("interactive foreground and background roles are explicit", () => {
  assert.match(tokens, /--pt-color-action-bg:\s*#2e7d32/);
  assert.match(tokens, /--pt-color-action-text:\s*#ffffff/);
  assert.doesNotMatch(tokens, /--pt-color-on-accent:\s*#07120a/);
});

test("Product Experience does not reuse action green as a text color", () => {
  assert.match(px2Root, /--px2-action-bg:\s*var\(--pt-color-action-bg\)/);
  assert.match(px2Root, /--px2-accent-text:\s*var\(--pt-color-accent-text\)/);
  assert.match(px2Root, /--px2-on-accent:\s*var\(--px2-action-text\)/);
  assert.doesNotMatch(
    astroFiles,
    /color\s*:\s*var\(--px2-green(?:-strong)?\)/
  );
  assert.match(astroFiles, /color:\s*var\(--px2-accent-text\)/);
});

test("header and global headings resolve through the semantic theme bridge", () => {
  assert.match(designSystem, /\.brand-lockup, \.brand-name \{ color: var\(--pt-theme-text\); \}/);
  assert.match(
    designSystem,
    /:where\(h1, h2, h3, h4, h5, h6, strong, b\) \{ color: var\(--pt-theme-text\); \}/
  );
});
