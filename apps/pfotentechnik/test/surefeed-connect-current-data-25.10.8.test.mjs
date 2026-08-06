import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import yaml from "js-yaml";
import { allowsAutomaticPriceCheck } from "../src/lib/price-intelligence/service.mjs";
import { deriveProductOperations } from "../src/lib/product-operations/policy.mjs";

const APP = process.cwd();
const read = (relative) => fs.readFileSync(path.join(APP, relative), "utf8");
const productSource = read("src/content/products/surefeed-microchip-pet-feeder-connect.md");
const product = yaml.load(productSource.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "");

test("widersprüchliche Variantenpreise bleiben redaktionell und dynamisch", () => {
  assert.equal(product.priceAutomation, "editorial");
  assert.equal(product.price?.current, undefined);
  assert.equal(product.priceState, "unknown");
  assert.equal(product.priceAvailable, false);
  assert.equal(product.availability, "unknown");
  assert.equal(allowsAutomaticPriceCheck(product), false);
  assert.equal(allowsAutomaticPriceCheck({}), true);
  assert.equal(product.maintenanceStatus, "complete");
  const operations = deriveProductOperations(product);
  assert.equal(operations.editorialPriceControl, true);
  assert.equal(operations.isTask, false);
  assert.deepEqual(operations.warnings, []);
  assert.equal(operations.recommendationStatus, "limited");
});

test("Hub, Bundle und App-Messwerte sind entscheidungsreif erklärt", () => {
  assert.match(productSource, /Gerät, Hub und Bundle/);
  assert.match(productSource, /bis zu zehn kompatible Connect-Geräte/);
  assert.match(productSource, /Fressmenge, Häufigkeit, Dauer und Tageszeiten/);
  assert.match(productSource, /1 Gramm genau/);
  assert.match(productSource, /400 ml/);
  assert.equal(product.score, 79);
  assert.match(product.recommendation, /Sinnvoll für getrennte Rationen/);
});

test("alle betroffenen Vergleiche trennen Gerät, Hub und Bundle", () => {
  const directory = path.join(APP, "src/content/comparisons");
  const comparisons = fs.readdirSync(directory).filter((name) => name.endsWith(".md"))
    .map((name) => read(path.join("src/content/comparisons", name)))
    .filter((source) => source.includes("slug: surefeed-microchip-pet-feeder-connect"));
  assert.ok(comparisons.length >= 2);
  for (const source of comparisons) {
    assert.match(source, /SureFeed Connect richtig einordnen/);
    assert.match(source, /Einzelgerät, Hub und Bundle sind getrennte Kaufvarianten/);
  }
});

test("erledigter Research-Auftrag fällt aus der Top-5-Auswahl", () => {
  const store = JSON.parse(read("research/research.json"));
  const item = store.items.find((entry) => entry.id === "surefeed-connect-verfuegbarkeit-und-hub-refresh");
  assert.equal(item?.status, "implemented");
  const activeTopFive = store.items.filter((entry) => entry.status === "open" || entry.status === "planned")
    .sort((left, right) => right.priority - left.priority || right.confidence - left.confidence)
    .slice(0, 5);
  assert.equal(activeTopFive.some((entry) => entry.id === item.id), false);
});
