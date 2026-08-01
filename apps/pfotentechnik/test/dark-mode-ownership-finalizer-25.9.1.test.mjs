import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const read = (target) => fs.readFileSync(target, "utf8");

const tokens = read(path.join(app, "src/styles/pfotentechnik-design-tokens.css"));
const designSystem = read(path.join(app, "src/styles/pfotentechnik-design-system.css"));
const headerFooter = read(path.join(root, "packages/affiliate-core/src/styles/header-footer.css"));
const home = read(path.join(root, "packages/affiliate-core/src/components/home/home.css"));
const comparison = read(path.join(app, "src/pages/vergleiche/index.astro"));

const contrast = (foreground, background) => {
  const toRgb = (hex) => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ];

  const luminance = (hex) => {
    const channels = toRgb(hex).map((value) => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };

  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

test("there is one deterministic system dark-mode block", () => {
  assert.equal(
    (tokens.match(/@media\s*\(prefers-color-scheme:\s*dark\)/g) ?? []).length,
    1
  );
  assert.match(tokens, /:root\[data-theme="dark"\]/);
  assert.match(tokens, /:root\[data-theme="light"\]/);
  assert.doesNotMatch(tokens, /:root:not\(\[data-theme="light"\]\)/);
});

test("dark foreground contrast is readable", () => {
  assert.ok(contrast("#f2f8f4", "#0b1510") >= 7);
  assert.ok(contrast("#b6c7bc", "#0b1510") >= 4.5);
  assert.ok(contrast("#78e7aa", "#0b1510") >= 4.5);
});

test("the legacy design system no longer owns a dark palette", () => {
  assert.doesNotMatch(
    designSystem,
    /@media\s*\(prefers-color-scheme:\s*dark\)[\s\S]*?--pt-theme-canvas\s*:/
  );
  assert.doesNotMatch(designSystem, /--pt-theme-canvas\s*:/);
  assert.doesNotMatch(designSystem, /--pt-theme-text\s*:/);
});

test("header and footer use explicit semantic foreground roles", () => {
  assert.match(
    headerFooter,
    /\.site-header-v2 \.brand-name[\s\S]*?color:\s*var\(--pt-color-text\)/
  );
  assert.match(
    headerFooter,
    /\.footer-v2[\s\S]*?var\(--pt-color-on-brand-surface/
  );
  assert.doesNotMatch(
    headerFooter,
    /\.site-header-v2 \.brand-name[\s\S]*?color:\s*var\(--text\)/
  );
});

test("homepage and comparison headings consume the authoritative text token", () => {
  assert.match(home, /--home3-text:\s*var\(--pt-color-text\)/);
  assert.match(
    home,
    /\.home3-card-content h3[\s\S]*?color:\s*var\(--home3-text\)/
  );
  assert.match(
    comparison,
    /--comparison-text:\s*var\(--pt-color-text\)/
  );
  assert.match(
    comparison,
    /\.comparison-card h3[\s\S]*?color:\s*var\(--comparison-text\)/
  );
});

test("the finalizer introduces no important declarations", () => {
  assert.doesNotMatch(tokens, /!important/);
  assert.doesNotMatch(headerFooter, /!important/);
});
