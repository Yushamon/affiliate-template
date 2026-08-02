import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const product = fs.readFileSync(
  path.join(APP, "src/content/products/surefeed-microchip-pet-feeder-connect.md"),
  "utf8"
);

test("Hub und Bundle sind eindeutig", () => {
  assert.match(product, /Sure Petcare Hub für App-Verbindung/);
  assert.match(product, /Einzelgerät oder Bundle/);
  assert.match(product, /vorhandenen kompatiblen Sure Petcare Hub/);
});

test("Preis und Verfügbarkeit bleiben dynamisch", () => {
  const price = product.match(/^price:\n([\s\S]*?)(?=^[A-Za-z0-9_-]+:)/m)?.[1] ?? "";
  assert.doesNotMatch(price, /^\s+current:/m);
  assert.match(product, /^priceState: "unknown"$/m);
  assert.match(product, /^availability: "unknown"$/m);
});

test("App-Daten und Portionierung sind belegt", () => {
  assert.match(product, /Fressmenge, Häufigkeit, Dauer und Tageszeiten/);
  assert.match(product, /1 Gramm genau/);
  assert.match(product, /keine automatische Futterausgabe/i);
  assert.match(
    product,
    /surepetcare\.com\/de-de\/futterautomat\/microchip-pet-feeder-connect/
  );
});

test("Relevante Vergleiche sind konsistent", () => {
  const directory = path.join(APP, "src/content/comparisons");
  const relevant = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      file,
      source: fs.readFileSync(path.join(directory, file), "utf8")
    }))
    .filter((entry) => entry.source.includes("slug: surefeed-microchip-pet-feeder-connect"));

  assert.ok(relevant.length > 0);

  for (const entry of relevant) {
    assert.match(entry.source, /## SureFeed Connect richtig einordnen/, entry.file);
    assert.match(entry.source, /Sure Petcare Hub/, entry.file);
    assert.match(
      entry.source,
      /Preis und Lieferbarkeit werden nicht fest/,
      entry.file
    );

    const itemStart = entry.source.indexOf("  - slug: surefeed-microchip-pet-feeder-connect");
    const itemEnd = entry.source.indexOf("\n  - slug:", itemStart + 1);
    const item = entry.source.slice(
      itemStart,
      itemEnd >= 0 ? itemEnd : entry.source.length
    );

    assert.match(item, /recommendation: >-/);
    assert.match(item, /Bundle oder einen/);
  }
});
