import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const devoko = read("apps/pfotentechnik/src/content/manufacturers/devoko.md");
const devokoProduct = read("apps/pfotentechnik/src/content/products/devoko-90l-automatisches-katzenklo.md");
const neakasa = read("apps/pfotentechnik/src/content/manufacturers/neakasa.md");

test("Devoko-Produkt besitzt ein auflösbares Herstellerprofil", () => {
  assert.match(devokoProduct, /slug:\s*"devoko"/);
  assert.match(devoko, /^slug:\s*"devoko"$/m);
  assert.match(devoko, /^type:\s*"manufacturer"$/m);
});

test("Devoko-Herstellerprofil verweist auf Produkt und Vergleich", () => {
  assert.match(devoko, /devoko-90l-automatisches-katzenklo/);
  assert.match(devoko, /\/vergleiche\/beste-automatische-katzentoiletten\//);
});

test("Neakasa-Herstellerprofil kennt M1 Plus und M1 Lite", () => {
  assert.match(neakasa, /productSlugs:\s*\["neakasa-m1-plus",\s*"neakasa-m1-lite"\]/);
});
