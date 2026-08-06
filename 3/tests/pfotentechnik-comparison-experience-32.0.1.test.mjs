import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const shell = read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro");
const explorer = read("packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro");
const css = read("packages/affiliate-core/src/components/comparison/comparison-experience.css");
const system = read("packages/affiliate-core/src/components/comparison/comparison-system.css");
const explorerCss = read("packages/affiliate-core/src/components/comparison/comparison-explorer-v2.css");
const tokens = read("packages/affiliate-core/src/components/comparison/comparison-tokens.css");

test("genau ein aktiver Vergleichs-CSS-Owner", () => {
  assert.equal(shell.includes('import "./comparison-experience.css";'), true);
  assert.doesNotMatch(shell, /comparison-system\.css|comparison-tokens\.css/);
  assert.doesNotMatch(explorer, /comparison-explorer-v2\.css/);
  assert.match(system, /TOMBSTONE/);
  assert.match(explorerCss, /TOMBSTONE/);
  assert.match(tokens, /TOMBSTONE/);
});

test("mobile first und 16px Grundabstand", () => {
  assert.match(css, /\.comparison-cover\s*\{[\s\S]*padding:\s*1rem/);
  assert.match(css, /\.comparison-shell\s*\{[\s\S]*min-width:\s*0/);
  assert.match(css, /@media\s*\(min-width:\s*48rem\)/);
  assert.doesNotMatch(css, /@media\s*\(max-width:/);
});

test("Dark Mode läuft ausschließlich über globale Tokens", () => {
  assert.doesNotMatch(css, /\.theme-dark\b|\.dark\b|\[data-theme/);
  assert.doesNotMatch(css, /--comparison-/);
  assert.doesNotMatch(css, /var\(--comparison-/);
  for (const token of [
    "--pt-color-surface",
    "--pt-color-surface-soft",
    "--pt-color-surface-raised",
    "--pt-color-text",
    "--pt-color-text-muted",
    "--pt-color-border",
    "--pt-color-action-bg",
    "--pt-color-action-bg-hover",
    "--pt-color-action-text"
  ]) assert.equal(css.includes(token), true, "Globales Token fehlt: " + token);
});

test("keine feste Vergleichspalette und keine grünen Vollflächen", () => {
  assert.doesNotMatch(css, /#(?:16302b|18743b|0f5d2d|e5f5e8)\b/i);
  assert.doesNotMatch(css, /linear-gradient\([^)]*(?:16,\s*48,\s*43|24,\s*116,\s*59)/i);
  assert.doesNotMatch(css, /background:\s*(?:green|#(?:0[0-9a-f]{5}|1[0-9a-f]{5}|2[0-9a-f]{5}|3[0-9a-f]{5}))\b/i);
});

test("Explorer bleibt semantische horizontale Matrix", () => {
  assert.match(css, /\.comparison-lab__compare\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(css, /\.comparison-lab__criterion\s*\{[\s\S]*position:\s*sticky/);
  assert.match(css, /\.comparison-lab__sticky-products\s*\{[\s\S]*position:\s*sticky/);
  assert.doesNotMatch(css, /\.comparison-table[^{]*\{[^}]*display:\s*block/s);
});

test("keine neuen important-Regeln außerhalb sr-only", () => {
  const withoutSrOnly = css.replace(/\.sr-only\s*\{[\s\S]*?\}/, "");
  assert.doesNotMatch(withoutSrOnly, /!important/);
});

test("Shell ist auf Experience 32 markiert", () => {
  assert.match(shell, /data-comparison-experience="32\.0\.1"/);
});
