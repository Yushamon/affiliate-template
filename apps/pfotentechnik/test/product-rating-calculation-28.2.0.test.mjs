import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateProductScore } from "../src/domain/productScore.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCTS = path.join(APP, "src", "content", "products");

const expected = {
  "sureflap-mikrochip-katzenklappe": {
    "rating": 4.1,
    "score": 82
  },
  "sureflap-dualscan-mikrochip-katzenklappe": {
    "rating": 4.2,
    "score": 84
  },
  "sureflap-mikrochip-katzenklappe-connect": {
    "rating": 3.9,
    "score": 79
  },
  "petsafe-mikrochip-katzenklappe": {
    "rating": 3.8,
    "score": 77
  },
  "onlycat-mikrochip-katzenklappe": {
    "rating": 3.6,
    "score": 71
  },
  "petwalk-medium-tiertuer": {
    "rating": 3.7,
    "score": 75
  }
};

const readScoreData = (file) => {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert.ok(match, "Frontmatter fehlt: " + file);
  const frontmatter = match[1];
  const readNumber = (key) => {
    const value = frontmatter.match(new RegExp("^" + key + ":\\s*([0-9.]+)\\s*$", "m"));
    return value ? Number(value[1]) : null;
  };
  const block = frontmatter.match(/^ratings:\s*\n((?:\s{2}.+\n?)+)/m);
  const ratings = Object.fromEntries(
    [...(block?.[1] ?? "").matchAll(/^\s{2}([^:]+):\s*([0-9.]+)\s*$/gm)]
      .map((entry) => [entry[1].trim(), Number(entry[2])])
  );
  return { rating: readNumber("rating"), score: readNumber("score"), ratings };
};

test("Kriterien werden berechnet, wenn kein positiver Gesamtscore vorliegt", () => {
  assert.deepEqual(
    calculateProductScore({ rating: 0, ratings: { a: 4.0, b: 3.0 } }),
    { score: 70, rating: 3.5, criteriaCount: 2, source: "criteria" }
  );
});

test("Fehlende Bewertung bleibt unbewertet statt 0/100", () => {
  assert.deepEqual(
    calculateProductScore({ rating: 0, ratings: {} }),
    { score: null, rating: null, criteriaCount: 0, source: "unrated" }
  );
});

test("Katzenklappen besitzen synchronisierte Kriterien, Rating und Score", () => {
  for (const [slug, values] of Object.entries(expected)) {
    const data = readScoreData(path.join(PRODUCTS, slug + ".md"));
    assert.equal(data.rating, values.rating, slug + ": rating");
    assert.equal(data.score, values.score, slug + ": score");
    assert.equal(Object.keys(data.ratings ?? {}).length, 6, slug + ": Kriterienanzahl");
    assert.deepEqual(calculateProductScore(data).score, values.score, slug + ": Laufzeitberechnung");
  }
});

test("Hero zeigt unbewertete Produkte nicht als nicht empfohlen", () => {
  const source = fs.readFileSync(
    path.join(APP, "src", "components", "product-experience-2", "ProductHero2.astro"),
    "utf8"
  );
  assert.match(source, /model\.score != null && model\.score > 0/);
  assert.match(source, /Noch nicht bewertet/);
});

test("Route und Modell verwenden die zentrale Score-Berechnung", () => {
  const route = fs.readFileSync(path.join(APP, "src", "pages", "produkt", "[product].astro"), "utf8");
  const model = fs.readFileSync(path.join(APP, "src", "domain", "productExperience", "model.ts"), "utf8");
  assert.match(route, /calculateProductScore\(contentProduct\)/);
  assert.match(model, /calculateProductScore\(data\)\.score/);
});
