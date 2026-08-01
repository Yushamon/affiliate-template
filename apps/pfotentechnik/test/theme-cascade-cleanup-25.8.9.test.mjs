import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const read = (target) => fs.readFileSync(target, "utf8");

const layout = read(path.join(app, "src/layouts/ProjectLayout.astro"));
const foundation = read(path.join(app, "src/styles/foundation/tokens.css"));
const core = read(path.join(root, "packages/affiliate-core/src/styles/theme.css"));

test("tokens load before consumers because ownership no longer depends on cascade order", () => {
  const tokenIndex = layout.indexOf(
    'import "../styles/pfotentechnik-design-tokens.css";'
  );
  const designSystemIndex = layout.indexOf(
    'import "../styles/pfotentechnik-design-system.css";'
  );

  assert.ok(tokenIndex >= 0);
  assert.ok(designSystemIndex > tokenIndex);
  assert.doesNotMatch(layout, /semantic token source is deliberately last/);
});

test("foundation contains aliases but no owned palette values", () => {
  assert.match(foundation, /--pt-theme-text:\s*var\(--pt-color-text\)/);
  assert.match(foundation, /--pt-ink-950:\s*var\(--pt-theme-text\)/);
  assert.match(foundation, /--pt-green-600:\s*var\(--pt-theme-accent\)/);
  assert.doesNotMatch(foundation, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(foundation, /rgba?\(/i);
  assert.doesNotMatch(foundation, /--pt-color-text\s*:/);
});

test("affiliate core defines aliases only", () => {
  assert.match(core, /--text:\s*var\(--pt-color-text\)/);
  assert.match(core, /--surface:\s*var\(--pt-color-surface\)/);
  assert.match(core, /--primary:\s*var\(--pt-color-action-bg\)/);
  assert.doesNotMatch(core, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(core, /rgba?\(/i);
});

test("no important declarations are introduced", () => {
  assert.doesNotMatch(foundation, /!important/);
  assert.doesNotMatch(core, /!important/);
});
