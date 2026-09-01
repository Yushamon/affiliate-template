import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = path.join(APP, "src", "styles");
const legacyFile = path.join(styles, "pfotentechnik-design-system.css");
const componentsIndex = path.join(styles, "components", "index.css");
const cardsFile = path.join(styles, "components", "cards.css");

const selectors = [
  ":where(.pt-category-card, .pt-value-card, .pt-product-card, .product-card, .comparison-card, .guide-card, .result-card, .premium-block, .faq-item)",
  ":where(.pt-category-card, .pt-value-card, .pt-product-card, .product-card, .comparison-card, .guide-card)",
  ":where(.pt-category-card, .pt-value-card, .pt-product-card, .product-card, .comparison-card, .guide-card):hover"
];

test("Cards werden im Komponenten-Layer eingebunden", () => {
  const index = fs.readFileSync(componentsIndex, "utf8");
  assert.match(index, /@import "\.\/cards\.css";/);
  assert.doesNotMatch(index, /buttons\.css/);
  assert.ok(fs.existsSync(cardsFile));
});

test("gemeinsame Kartenregeln wurden aus Legacy entfernt", () => {
  const legacy = fs.readFileSync(legacyFile, "utf8");
  for (const selector of selectors) {
    assert.ok(!legacy.includes(selector + " {"), "Legacy enthält weiterhin: " + selector);
  }
});

test("gemeinsame Kartenregeln liegen im Komponenten-Layer", () => {
  const cards = fs.readFileSync(cardsFile, "utf8");
  for (const selector of selectors) {
    assert.ok(cards.includes(selector + " {"), "Cards Layer fehlt: " + selector);
  }
});

test("alle bisherigen Karten-Aliase bleiben erhalten", () => {
  const cards = fs.readFileSync(cardsFile, "utf8");
  for (const alias of [
    ".pt-category-card",
    ".pt-value-card",
    ".pt-product-card",
    ".product-card",
    ".comparison-card",
    ".guide-card",
    ".result-card",
    ".premium-block",
    ".faq-item"
  ]) {
    assert.ok(cards.includes(alias), "Alias fehlt: " + alias);
  }
});

test("nicht interaktive Karten erhalten keinen gemeinsamen Hover-Zwang", () => {
  const cards = fs.readFileSync(cardsFile, "utf8");
  const hoverStart = cards.indexOf("):hover {");
  assert.notEqual(hoverStart, -1);
  const hoverSelectorStart = cards.lastIndexOf(":where(", hoverStart);
  const hoverSelector = cards.slice(hoverSelectorStart, hoverStart);
  assert.ok(!hoverSelector.includes(".result-card"));
  assert.ok(!hoverSelector.includes(".premium-block"));
  assert.ok(!hoverSelector.includes(".faq-item"));
});

test("Card Layer enthält keine kontextspezifischen Unterelemente", () => {
  const cards = fs.readFileSync(cardsFile, "utf8");
  assert.doesNotMatch(
    cards,
    /__|\.card-title|\.card-image|\.card-body|\.product-price|\.comparison-winner/
  );
});

test("Card Layer führt kein important ein", () => {
  const cards = fs.readFileSync(cardsFile, "utf8");
  assert.doesNotMatch(cards, /!important/);
});
