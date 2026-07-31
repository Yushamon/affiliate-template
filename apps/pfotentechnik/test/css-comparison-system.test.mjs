import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const comparisonDir = path.join(
  ROOT,
  "packages",
  "affiliate-core",
  "src",
  "components",
  "comparison"
);
const systemFile = path.join(comparisonDir, "comparison-system.css");
const tokensFile = path.join(comparisonDir, "comparison-tokens.css");

const coreTokens = [
  "--comparison-text",
  "--comparison-muted",
  "--comparison-accent",
  "--comparison-accent-dark",
  "--comparison-line",
  "--comparison-soft",
  "--comparison-surface",
  "--comparison-shadow"
];
const expectedValues = {
  "--comparison-text": "#13231e",
  "--comparison-muted": "#66766f",
  "--comparison-accent": "#238341",
  "--comparison-accent-dark": "#0f5d2d",
  "--comparison-line": "#dce6e0",
  "--comparison-soft": "#f2f8f4",
  "--comparison-surface": "#ffffff",
  "--comparison-shadow": "0 14px 38px rgba(20, 32, 26, 0.07)"
};

test("Comparison Tokens werden vor dem System importiert", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  assert.ok(system.startsWith('@import "./comparison-tokens.css";'));
  assert.ok(fs.existsSync(tokensFile));
});

test("Token-Datei enthält die zuvor wirksamen Kaskadenwerte", () => {
  const tokens = fs.readFileSync(tokensFile, "utf8");
  for (const [token, value] of Object.entries(expectedValues)) {
    assert.ok(tokens.includes(token + ": " + value + ";"), token + " hat nicht den erwarteten Wert");
  }
});

test("Token-Datei enthält exakt die acht Core-Tokens", () => {
  const tokens = fs.readFileSync(tokensFile, "utf8");
  const body = tokens.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? "";
  const properties = [...body.matchAll(/(--comparison-[a-z0-9-]+)\s*:/g)].map((m) => m[1]);
  assert.deepEqual(properties, coreTokens);
});

test("Token Layer enthält keine Komponentenregeln oder important", () => {
  const tokens = fs.readFileSync(tokensFile, "utf8");
  assert.doesNotMatch(tokens, /\.comparison-|@media|!important/);
});

test("Systemdatei beginnt ohne leere Präfixzeilen", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  assert.doesNotMatch(system, /^\s*\n/);
});
