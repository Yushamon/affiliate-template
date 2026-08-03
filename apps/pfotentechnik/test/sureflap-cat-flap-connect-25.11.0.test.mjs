import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

const APP = path.join(
  ROOT,
  "apps",
  "pfotentechnik"
);

const PRODUCT = path.join(
  APP,
  "src/content/products/sureflap-mikrochip-katzenklappe-connect.md"
);

const MANUFACTURER = path.join(
  APP,
  "src/content/manufacturers/surefeed.md"
);

const product = fs.readFileSync(
  PRODUCT,
  "utf8"
);

const manufacturer = fs.readFileSync(
  MANUFACTURER,
  "utf8"
);

test("Produktseite enthält Modellkennung und Öffnungsmaße", () => {
  assert.match(product, /Modellkennung/);
  assert.match(product, /iDSCF/);
  assert.match(product, /142 × 120 mm/);
  assert.match(product, /165 × 171 mm/);
  assert.match(product, /212 mm/);
});

test("Hub-Abhängigkeit und Bundle-Abgrenzung sind eindeutig", () => {
  assert.match(product, /Sure Petcare Hub für App-Verbindung/);
  assert.match(product, /Einzelgerät und Bundle mit Hub/);
  assert.match(product, /bereits einen kompatiblen Sure Petcare Hub/);
});

test("Batterie, App-Funktionen und DualScan sind belegt", () => {
  assert.match(product, /4 AA-Batterien/);
  assert.match(product, /bis zu sechs Monaten/i);
  assert.match(product, /Fernverriegelung/);
  assert.match(product, /automatische Sperrzeiten/);
  assert.match(product, /Aktivitätsstatistiken/);
  assert.match(product, /DualScan/);
});

test("Einbauarten sind widerspruchsfrei beschrieben", () => {
  assert.match(product, /Türen, Glas und Wände/);
  assert.match(product, /Montageadapter/);
  assert.match(product, /Tunnelverlängerungen/);
});

test("Preis, Verfügbarkeit, Score und Empfehlung werden nicht erfunden", () => {
  assert.match(product, /^priceState: "unknown"$/m);
  assert.match(product, /^availability: "unknown"$/m);
  assert.doesNotMatch(product, /^score:/m);
  assert.doesNotMatch(product, /^recommendation:/m);

  const priceSection =
    product.match(
      /## Preis und Verfügbarkeit[\s\S]*?(?=\n## |$)/
    )?.[0] ?? "";

  assert.doesNotMatch(
    priceSection,
    /\b(?:160|254)[,.]\d{2}\s*€/
  );
});

test("Herstellerseite erklärt die Markenarchitektur zentral", () => {
  assert.match(
    manufacturer,
    /Markenarchitektur: Sure Petcare, SureFlap und SureFeed/
  );
  assert.match(
    manufacturer,
    /SureFlap Ltd/
  );
  assert.match(
    manufacturer,
    /gemeinsame App/
  );
  assert.match(
    manufacturer,
    /statt getrennte.*Herstellerprofile/s
  );
  assert.match(
    manufacturer,
    /\/produkt\/sureflap-mikrochip-katzenklappe-connect\//
  );
});

test("Primärquellen sind dokumentiert", () => {
  assert.match(
    product,
    /surepetcare\.com\/de-de\/haustierklappen\/mikrochip-katzenklappe-connect/
  );
  assert.match(
    product,
    /surepetcare\.com\/en-gb\/pdf\?country=81/
  );
});
