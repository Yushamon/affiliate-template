import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const read = (target) => fs.readFileSync(target, "utf8");

const layout = read(path.join(app, "src/layouts/ProjectLayout.astro"));
const tokens = read(path.join(app, "src/styles/pfotentechnik-design-tokens.css"));
const home = read(path.join(root, "packages/affiliate-core/src/components/home/home.css"));
const comparison = read(path.join(app, "src/pages/vergleiche/index.astro"));

const tokenIndex = layout.indexOf('import "../styles/pfotentechnik-design-tokens.css";');
const uiIndex = layout.indexOf('import "../styles/pfotentechnik-ui-system.css";');

test("the authoritative token source loads after every compatibility stylesheet", () => {
  assert.ok(tokenIndex > uiIndex);
  assert.equal(layout.match(/pfotentechnik-design-tokens\.css/g)?.length, 1);
});

test("the refreshed light and dark palette is present", () => {
  assert.match(tokens, /--pt-color-text:\s*#132019/);
  assert.match(tokens, /--pt-color-text:\s*#f2f8f4/);
  assert.match(tokens, /--pt-color-page:\s*#0b1510/);
  assert.match(tokens, /--pt-color-accent-text:\s*#78e7aa/);
  assert.match(tokens, /--pt-color-action-bg:\s*#2f8f5b/);
});

test("homepage titles, tile titles, copy and labels use semantic roles", () => {
  assert.match(home, /--home3-text:\s*var\(--pt-color-text\)/);
  assert.match(home, /--home3-muted:\s*var\(--pt-color-text-muted\)/);
  assert.match(home, /--home3-accent:\s*var\(--pt-color-accent-text\)/);
  assert.match(home, /\.home3-card-content h3[\s\S]*?color:\s*var\(--home3-text\)/);
  assert.match(home, /\.home3-card-content p[\s\S]*?color:\s*var\(--home3-muted\)/);
});

test("comparison overview headings and cards resolve through semantic roles", () => {
  assert.match(comparison, /--comparison-text:\s*var\(--pt-color-text\)/);
  assert.match(comparison, /--comparison-muted:\s*var\(--pt-color-text-muted\)/);
  assert.match(comparison, /--comparison-accent:\s*var\(--pt-color-accent-text\)/);
});

test("no new important declarations are introduced", () => {
  assert.doesNotMatch(tokens, /!important/);
});
