import assert from "node:assert/strict";
import test from "node:test";
import { evaluateProductDecision } from "../src/domain/productExperience/decisionEngine.ts";

const baseProfile = {
  productName: "Testprodukt",
  categoryKey: "gps-tracker",
  usesFoodQuestions: false,
  editorialScore: 80,
  animals: ["cat"],
  petSizes: ["small"],
  foodTypes: [],
  supportsMultiplePets: false,
  hasWifi: true,
  worksOffline: false,
  hasCamera: false,
  priceTier: "midrange"
};

test("Nicht-Futterautomaten verwenden nur fünf Fragen", () => {
  const result = evaluateProductDecision(baseProfile, {
    animal: "cat",
    animalCount: 1,
    dryFood: true,
    wetFood: true,
    budget: "midrange",
    wifi: "required",
    camera: "unwanted"
  });

  assert.equal(result.total, 5);
  assert.equal(result.completed, 5);
  assert.equal(result.isComplete, true);
  assert.equal(
    result.positives.some((item) => /Trockenfutter|Nassfutter/.test(item)),
    false
  );
  assert.equal(
    result.risks.some((item) => /Trockenfutter|Nassfutter/.test(item)),
    false
  );
});

test("Futterautomaten verwenden sieben Fragen", () => {
  const result = evaluateProductDecision(
    {
      ...baseProfile,
      categoryKey: "futterautomaten",
      usesFoodQuestions: true,
      foodTypes: ["dry"]
    },
    {
      animal: "cat",
      animalCount: 1,
      dryFood: true,
      wetFood: false,
      budget: "midrange",
      wifi: "required",
      camera: "unwanted"
    }
  );

  assert.equal(result.total, 7);
  assert.equal(result.completed, 7);
  assert.equal(result.isComplete, true);
});

test("Negative und neutrale Gründe bleiben semantisch getrennt", () => {
  const result = evaluateProductDecision(
    {
      ...baseProfile,
      animals: ["dog"],
      priceTier: "unknown",
      hasWifi: null
    },
    {
      animal: "cat",
      animalCount: 1,
      budget: "midrange",
      wifi: "optional",
      camera: "optional"
    }
  );

  assert.ok(result.risks.some((item) => item.includes("Tierart")));
  assert.ok(result.neutrals.some((item) => item.includes("Preis")));
  assert.ok(result.neutrals.some((item) => item.includes("WLAN")));
  assert.equal(
    result.positives.some((item) => item.includes("Tierart")),
    false
  );
});

test("Explizite Zielkonflikte senken den Score", () => {
  const positive = evaluateProductDecision(baseProfile, {
    animal: "cat",
    animalCount: 1,
    budget: "midrange",
    wifi: "required",
    camera: "unwanted"
  });
  const negative = evaluateProductDecision(baseProfile, {
    animal: "dog",
    animalCount: 3,
    budget: "premium",
    wifi: "offline",
    camera: "required"
  });

  assert.ok(positive.score > negative.score);
  assert.ok(negative.mismatchKeys.length >= 3);
});
