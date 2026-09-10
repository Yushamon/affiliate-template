import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productPath = path.join(APP, "src/content/products/surefeed-microchip-pet-feeder-connect.md");
const comparisonDirectory = path.join(APP, "src/content/comparisons");
const source = fs.readFileSync(productPath, "utf8").replace(/\r\n/g, "\n");

test("Hub und Bundle", () => {
  assert.match(source, /Gerät, Hub und Bundle/);
  assert.match(source, /bis zu zehn kompatible Connect-Geräte/);
});

test("Preis dynamisch", () => {
  const priceBlock = source.match(/\nprice:\n([\s\S]*?)\n[a-zA-Z0-9_-]+:/)?.[1] ?? "";
  assert.doesNotMatch(priceBlock, /^\s*current:/m);
  assert.match(source, /priceState: "unknown"/);
  assert.match(source, /priceAvailable: false/);
  assert.match(source, /availability: "unknown"/);
});

test("App-Daten", () => {
  assert.match(source, /Fressmenge, Häufigkeit, Dauer und Tageszeiten/);
  assert.match(source, /1 Gramm genau/);
  assert.match(source, /400 ml/);
  assert.doesNotMatch(source, /Statistiken als PDF/);
});

test("Score und Empfehlung", () => {
  assert.match(source, /\nscore: 79\n/);
  assert.match(source, /recommendation: Sinnvoll für getrennte Rationen/);
});

test("Vergleiche", () => {
  const files = fs.readdirSync(comparisonDirectory)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(comparisonDirectory, name))
    .filter((file) => fs.readFileSync(file, "utf8").includes("slug: surefeed-microchip-pet-feeder-connect"));
  assert.ok(files.length > 0);
  for (const file of files) {
    const comparison = fs.readFileSync(file, "utf8");
    assert.match(comparison, /SureFeed Connect richtig einordnen/);
    assert.match(comparison, /Einzelgerät, Hub und Bundle sind getrennte Kaufvarianten/);
  }
});
