import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const shell = read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro");
const explorer = read("packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro");

test("Top-Empfehlung bleibt im Direktvergleich enthalten", () => {
  assert.match(shell, /const comparisonProducts = model\.products;/);
  assert.doesNotMatch(shell, /comparisonProducts = model\.products\.filter\([\s\S]*winner/);
});

test("Alternativenbereich schließt den Sieger weiterhin aus", () => {
  assert.match(shell, /const alternativeProducts = model\.recommendationProducts\.filter\(\(product\) => product\.slug !== winner\?\.slug\);/);
});

test("Auswahlmaximum entspricht höchstens vier vorhandenen Modellen", () => {
  assert.match(explorer, /const maximumSelection = Math\.min\(4, products\.length\);/);
  assert.match(explorer, /data-max-selection=\{maximumSelection\}/);
});

test("Überschrift und Zähler verwenden das dynamische Limit", () => {
  assert.match(explorer, /<h2>Wähle bis zu \{maximumSelection\} Modelle<\/h2>/);
  assert.match(explorer, /<span>von \{maximumSelection\} gewählt<\/span>/);
  assert.doesNotMatch(explorer, /von 4 gewählt/);
  assert.doesNotMatch(explorer, /Wähle bis zu vier Modelle/);
});

test("Client-Limit ist dynamisch", () => {
  assert.match(explorer, /Number\(root\.dataset\.maxSelection \?\? "4"\)/);
  assert.doesNotMatch(explorer, /const MAX_SELECTION = 4;/);
});

test("Standardauswahl bleibt auf maximal drei Modelle begrenzt", () => {
  assert.match(explorer, /slice\(0, Math\.min\(3, maximumSelection\)\)/);
});
