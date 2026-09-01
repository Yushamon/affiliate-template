import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const comparisonDir = path.join(ROOT, "packages", "affiliate-core", "src", "components", "comparison");
const read = (relative) => fs.readFileSync(path.join(comparisonDir, relative), "utf8");

const shell = read("ComparisonShell.astro");
const explorer = read("ComparisonExplorer.astro");
const experience = read("comparison-experience.css");
const retiredFiles = [
  "comparison-system.css",
  "comparison-tokens.css",
  "comparison-explorer-v2.css",
];

test("Comparison has one active production CSS owner", () => {
  assert.equal((shell.match(/import "\.\/comparison-experience\.css";/g) ?? []).length, 1);
  assert.equal((explorer.match(/import "\.\/comparison-experience\.css";/g) ?? []).length, 1);
  assert.doesNotMatch(shell + explorer, /comparison-(?:system|tokens|explorer-v2)\.css/);
});

test("retired Comparison token and tombstone layers are absent", () => {
  for (const file of retiredFiles) {
    assert.equal(fs.existsSync(path.join(comparisonDir, file)), false, file);
  }
});

test("Comparison consumes the shared semantic Foundation contract", () => {
  for (const token of [
    "--pt-color-surface",
    "--pt-color-surface-soft",
    "--pt-color-surface-raised",
    "--pt-color-text",
    "--pt-color-text-muted",
    "--pt-color-border",
    "--pt-color-action-bg",
    "--pt-color-action-bg-hover",
    "--pt-color-action-text",
  ]) {
    assert.ok(experience.includes(token), `Shared token missing: ${token}`);
  }
  assert.doesNotMatch(experience, /--comparison-[a-z0-9-]+\s*:/i);
  assert.doesNotMatch(experience, /var\(--comparison-/i);
});

test("Comparison has no retired palette or local theme branch", () => {
  assert.doesNotMatch(experience, /#(?:13231e|66766f|238341|0f5d2d|dce6e0|f2f8f4|ffffff)\b/i);
  assert.doesNotMatch(experience, /\.theme-dark\b|\.dark\b|\[data-theme/);
});
