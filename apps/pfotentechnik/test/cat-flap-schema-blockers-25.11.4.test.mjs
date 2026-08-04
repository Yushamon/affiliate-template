import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const sureflap = fs.readFileSync(
  path.join(process.cwd(), "src/content/products/sureflap-mikrochip-katzenklappe-connect.md"),
  "utf8",
);
const petporte = fs.readFileSync(
  path.join(process.cwd(), "src/content/products/petsafe-petporte-smart-flap.md"),
  "utf8",
);

test("SureFlap besitzt gültige Statuswerte", () => {
  assert.match(sureflap, /^availability: "temporarily-unavailable"$/m);
  assert.match(sureflap, /^maintenanceStatus: "required"$/m);
  assert.match(sureflap, /^rating: 0$/m);
  assert.doesNotMatch(sureflap, /^score:/m);
});

test("Petporte besitzt gültige Preis- und Wartungswerte", () => {
  assert.match(petporte, /^priceState: "unknown"$/m);
  assert.match(petporte, /^maintenanceStatus: "required"$/m);
  assert.match(petporte, /^rating: 0$/m);
  assert.match(petporte, /^  status: "unknown"$/m);
  assert.match(petporte, /^    type: "manual"$/m);
  assert.doesNotMatch(petporte, /^score:/m);
});

test("ungültige Altwerte sind entfernt", () => {
  assert.doesNotMatch(sureflap, /^availability: "unavailable"$/m);
  assert.doesNotMatch(sureflap, /^maintenanceStatus: "monitored"$/m);
  assert.doesNotMatch(petporte, /^maintenanceStatus: "monitored"$/m);
});
