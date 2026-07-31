import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = path.join(APP, "src", "styles");
const legacyFile = path.join(styles, "pfotentechnik-design-system.css");
const indexFile = path.join(styles, "components", "index.css");
const cardsFile = path.join(styles, "components", "cards.css");
const panelsFile = path.join(styles, "components", "panels.css");

const selectors = [
  ":where(.premium-block, .quick-answer, .short-answer, .key-takeaway, .summary-box, .info-box, .callout, .highlight-box) :where(h2, h3, h4, strong)",
  ":where(.premium-block, .quick-answer, .short-answer, .key-takeaway, .summary-box, .info-box, .callout, .highlight-box) :where(p, li)",
  ":where(.info, .callout-info, .premium-block--info)",
  ":where(.warning, .callout-warning, .premium-block--warning)",
  ":where(.danger, .callout-danger, .premium-block--danger)",
  ":where(.success, .callout-success, .premium-block--success)"
];

test("Panels werden nach Cards eingebunden", () => {
  const index = fs.readFileSync(indexFile, "utf8");
  assert.match(index, /@import "\.\/cards\.css";[\s\S]*@import "\.\/panels\.css";/);
  assert.ok(fs.existsSync(cardsFile));
  assert.ok(fs.existsSync(panelsFile));
});

test("gemeinsame Panelregeln wurden aus Legacy entfernt", () => {
  const legacy = fs.readFileSync(legacyFile, "utf8");
  for (const selector of selectors) {
    assert.ok(!legacy.includes(selector + " {"), "Legacy enthält weiterhin: " + selector);
  }
});

test("gemeinsame Panelregeln liegen im Komponenten-Layer", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  for (const selector of selectors) {
    assert.ok(panels.includes(selector + " {"), "Panel Layer fehlt: " + selector);
  }
});

test("alle semantischen Panelvarianten bleiben erhalten", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  for (const alias of [
    ".callout-info",
    ".callout-warning",
    ".callout-danger",
    ".callout-success",
    ".premium-block--info",
    ".premium-block--warning",
    ".premium-block--danger",
    ".premium-block--success"
  ]) {
    assert.ok(panels.includes(alias), "Panel-Alias fehlt: " + alias);
  }
});

test("Panel-Typografie bleibt auf Panel-Kontexte begrenzt", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.doesNotMatch(panels, /(^|\n)\s*:where\(h[1-6]|(^|\n)\s*p\s*\{/);
});

test("Panel Layer enthält keine Layout- oder Komponentenunterelemente", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.doesNotMatch(panels, /@media|\.container|__|\.product-price|\.comparison-winner/);
});

test("Panel Layer führt kein important ein", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.doesNotMatch(panels, /!important/);
});
