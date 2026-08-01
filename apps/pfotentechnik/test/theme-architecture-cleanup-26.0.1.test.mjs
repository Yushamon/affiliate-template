import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const read = (target) => fs.readFileSync(target, "utf8");

const tokens = read(path.join(app, "src/styles/pfotentechnik-design-tokens.css"));
const foundation = read(path.join(app, "src/styles/foundation/tokens.css"));
const designSystem = read(path.join(app, "src/styles/pfotentechnik-design-system.css"));
const legacyProject = read(path.join(app, "src/styles/pfotentechnik.css"));
const coreTheme = read(path.join(root, "packages/affiliate-core/src/styles/theme.css"));
const headerFooter = read(path.join(root, "packages/affiliate-core/src/styles/header-footer.css"));
const home = read(path.join(root, "packages/affiliate-core/src/components/home/home.css"));
const comparison = read(path.join(app, "src/pages/vergleiche/index.astro"));

test("one authoritative system dark-mode block exists", () => {
  assert.equal(
    (tokens.match(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/g) ?? []).length,
    1
  );
  assert.match(tokens, /:root\[data-theme="dark"\]/);
  assert.match(tokens, /:root\[data-theme="light"\]/);
});

test("alias layers contain no fixed palette", () => {
  assert.doesNotMatch(foundation, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(coreTheme, /#[0-9a-f]{3,8}\b/i);
  assert.match(foundation, /--pt-theme-text:\s*var\(--pt-color-text\)/);
  assert.match(coreTheme, /--text:\s*var\(--pt-color-text\)/);
});

test("design-system no longer defines theme variables", () => {
  assert.doesNotMatch(designSystem, /--pt-theme-(?:text|surface|canvas|accent)[a-z0-9-]*\s*:/);
  const darkBlocks = [];
  const mediaHeader = /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{/g;
  let match;

  while ((match = mediaHeader.exec(designSystem))) {
    let depth = 0;
    let end = match.index;

    for (let index = designSystem.indexOf("{", match.index); index < designSystem.length; index += 1) {
      if (designSystem[index] === "{") depth += 1;
      if (designSystem[index] === "}") {
        depth -= 1;
        if (depth === 0) {
          end = index + 1;
          break;
        }
      }
    }

    darkBlocks.push(designSystem.slice(match.index, end));
    mediaHeader.lastIndex = end;
  }

  assert.equal(
    darkBlocks.filter((block) => /--pt-theme-[a-z0-9-]+\s*:/.test(block)).length,
    0
  );
});

test("shared shell is semantic in both public global stylesheets", () => {
  for (const source of [designSystem, legacyProject]) {
    assert.match(source, /\.site-header-v2[\s\S]*?var\(--pt-color-surface\)/);
    assert.match(source, /\.main-nav-v2 a[\s\S]*?var\(--pt-color-text-muted\)/);
  }
  assert.match(
    headerFooter,
    /\.site-header-v2 \.brand-name[\s\S]*?var\(--pt-color-text\)/
  );
  assert.match(headerFooter, /var\(--pt-color-on-brand-surface/);
});

test("selector migration does not mutate pseudo-elements or state variants", () => {
  assert.doesNotMatch(
    designSystem,
    /\.nav-toggle-button::(?:before|after)[^{]*\{[^}]*background:\s*var\(--pt-color-surface\)/
  );
  assert.doesNotMatch(
    designSystem,
    /\.brand-name::after[^{]*\{[^}]*color:\s*var\(--pt-color-text\)/
  );
  assert.doesNotMatch(
    designSystem,
    /\.main-nav-v2 a:hover[^{]*\{[^}]*background:\s*var\(--pt-color-surface\)/
  );
});

test("homepage and comparison titles use the authoritative foreground", () => {
  assert.match(home, /--home3-text:\s*var\(--pt-color-text\)/);
  assert.match(home, /\.home3-card-content h3[\s\S]*?var\(--home3-text\)/);
  assert.match(comparison, /--comparison-text:\s*var\(--pt-color-text\)/);
  assert.match(comparison, /\.comparison-card h3[\s\S]*?var\(--comparison-text\)/);
});

test("cleanup introduces no important declarations into architecture files", () => {
  assert.doesNotMatch(tokens, /!important/);
  assert.doesNotMatch(foundation, /!important/);
  assert.doesNotMatch(coreTheme, /!important/);
  assert.doesNotMatch(headerFooter, /!important/);
});
