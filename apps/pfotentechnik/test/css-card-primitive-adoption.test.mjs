import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const app = path.join(ROOT, "apps", "pfotentechnik");
const script = path.join(app, "scripts", "design-system", "css-card-primitive-adoption.mjs");
const cards = path.join(app, "src", "styles", "components", "cards.css");
const index = path.join(app, "src", "styles", "components", "index.css");

test("Card-Adoption-Werkzeug und Primitive sind installiert", () => {
  assert.ok(fs.existsSync(script));
  assert.ok(fs.existsSync(cards));
  assert.ok(fs.existsSync(index));
});

test("Card-Primitives werden zentral geladen", () => {
  const componentIndex = fs.readFileSync(index, "utf8");
  assert.ok(componentIndex.includes('@import "./cards.css";'));
});

test("Card-Primitives enthalten Basis, Bewegung und Hover", () => {
  const css = fs.readFileSync(cards, "utf8");
  for (const marker of [
    ".product-card",
    ".comparison-card",
    ".guide-card",
    ".premium-block",
    ".faq-item",
    "border-radius: var(--pt-radius-lg)",
    "box-shadow: var(--pt-shadow-sm)",
    "transition: border-color 160ms ease",
    "transform: translateY(-2px)"
  ]) {
    assert.ok(css.includes(marker), "Fehlt: " + marker);
  }
});
