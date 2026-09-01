import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = path.join(APP, "src", "styles");
const legacyFile = path.join(styles, "pfotentechnik-design-system.css");
const foundationIndex = path.join(styles, "foundation", "index.css");
const componentIndex = path.join(styles, "components", "index.css");
const buttonsFile = path.join(styles, "pfotentechnik-foundation-contracts.css");

const exactSnippets = [
  ":where(.pt-button, .button-primary, .button-secondary, .cta-button, .affiliate-button)",
  ":where(.pt-button-primary, .button-primary, .cta-button, .affiliate-button)",
  ":where(.pt-button-primary, .button-primary, .cta-button, .affiliate-button):hover",
  ":where(.pt-button-secondary, .button-secondary)"
];

test("Komponenten-Layer wird nach Layout eingebunden", () => {
  const foundation = fs.readFileSync(foundationIndex, "utf8");
  assert.match(
    foundation,
    /@import "\.\.\/layout\/index\.css";[\s\S]*@import "\.\.\/components\/index\.css";/
  );
  assert.ok(fs.existsSync(componentIndex));
  assert.ok(fs.existsSync(buttonsFile));
  assert.ok(!fs.existsSync(path.join(styles, "components", "buttons.css")));
});

test("gemeinsame Buttonregeln wurden aus Legacy entfernt", () => {
  const legacy = fs.readFileSync(legacyFile, "utf8");
  for (const snippet of exactSnippets) {
    assert.ok(!legacy.includes(snippet + " {"), "Legacy enthält weiterhin: " + snippet);
  }
});

test("gemeinsame Buttonregeln liegen im Foundation-Vertrag", () => {
  const buttons = fs.readFileSync(buttonsFile, "utf8");
  assert.match(buttons, /\.pt-button,/);
  assert.match(buttons, /\.pt-button-primary,/);
  assert.match(buttons, /\.pt-button-secondary,/);
});

test("alle bisherigen Alias-Klassen bleiben erhalten", () => {
  const buttons = fs.readFileSync(buttonsFile, "utf8");
  for (const alias of [
    ".pt-button",
    ".pt-button-primary",
    ".pt-button-secondary",
    ".button-primary",
    ".button-secondary",
    ".cta-button",
    ".affiliate-button"
  ]) {
    assert.ok(buttons.includes(alias), "Alias fehlt: " + alias);
  }
});

test("Button-Layer enthält keine kontextspezifischen Komponenten", () => {
  const buttons = fs.readFileSync(buttonsFile, "utf8");
  assert.doesNotMatch(buttons, /\.nav-toggle-button|\.site-header-v2|\.sticky|\.comparison|\.product-card/);
});

test("Button-Vertrag enthält Interaktion und Reduced Motion", () => {
  const buttons = fs.readFileSync(buttonsFile, "utf8");
  assert.match(buttons, /:focus-visible/);
  assert.match(buttons, /prefers-reduced-motion/);
});
