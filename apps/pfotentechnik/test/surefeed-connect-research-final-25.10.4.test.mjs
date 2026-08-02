import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCT = path.join(
  APP,
  "src/content/products/surefeed-microchip-pet-feeder-connect.md"
);
const COMPARISONS = path.join(
  APP,
  "src/content/comparisons"
);

const product = fs.readFileSync(PRODUCT, "utf8");

const scalar = (key) => {
  const line = product
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(key + ":"));
  return line?.slice(line.indexOf(":") + 1).trim();
};

test("Hub-Abhängigkeit und Bundle-Abgrenzung sind eindeutig", () => {
  assert.match(product, /Sure Petcare Hub für App-Verbindung und Fressprotokolle erforderlich/);
  assert.match(product, /Einzelgerät und Bundle sind getrennte Kaufvarianten/);
  assert.match(product, /Bis zu zehn kompatible SureFeed- und SureFlap-Connect-Geräte/);
});

test("Preis und Verfügbarkeit bleiben dynamische Zustände", () => {
  assert.equal(scalar("priceState"), '"unknown"');
  assert.equal(scalar("availability"), '"unknown"');

  const priceBlock =
    product.match(/^price:\n([\s\S]*?)(?=^[A-Za-z0-9_-]+:)/m)?.[1] ?? "";

  assert.doesNotMatch(priceBlock, /^\s+(current|amount|value):/m);

  const section =
    product.match(/## Preis und Verfügbarkeit[\s\S]*?(?=\n## |$)/)?.[0] ?? "";

  assert.match(section, /kein fester Preis gespeichert/);
  assert.doesNotMatch(section, /\b(?:210|305)[,.]00\s*€/);
});

test("App-Funktionen und gemessene Fressdaten sind konkret", () => {
  assert.match(product, /Fressmenge, Häufigkeit, Dauer und Tageszeiten/);
  assert.match(product, /1 Gramm genau/);
  assert.match(product, /Statistiken als PDF/);
  assert.match(product, /kein zeitgesteuerter Vorratsautomat/);
});

test("Editorial Score und Produktempfehlung bleiben vorhanden", () => {
  assert.ok(scalar("score"));
  assert.ok(scalar("recommendation"));
});

test("Herstellerquelle ist dokumentiert", () => {
  assert.match(
    product,
    /surepetcare\.com\/de-de\/futterautomat\/microchip-pet-feeder-connect/
  );
});

test("Alle relevanten Vergleiche verwenden dieselbe Abgrenzung", () => {
  const relevant = fs
    .readdirSync(COMPARISONS)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      file,
      source: fs.readFileSync(path.join(COMPARISONS, file), "utf8")
    }))
    .filter((entry) => entry.source.includes("slug: surefeed-microchip-pet-feeder-connect"));

  assert.ok(relevant.length > 0);

  for (const entry of relevant) {
    assert.match(entry.source, /## SureFeed Connect richtig einordnen/, entry.file);
    assert.match(entry.source, /Sure Petcare Hub/, entry.file);
    assert.match(entry.source, /Bundle oder separater Hub/, entry.file);
    assert.match(
      entry.source,
      /Preis und Lieferbarkeit werden nicht statisch genannt/,
      entry.file
    );
  }
});
