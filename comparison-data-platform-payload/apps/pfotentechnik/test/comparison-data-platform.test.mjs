import test from "node:test";
import assert from "node:assert/strict";
import { resolveComparisonValue } from "../scripts/comparison-platform/data-platform.mjs";

const product = {
  title: "Testautomat",
  recommendation: "Automatisch erzeugte Empfehlung",
  manufacturer: { name: "Test" },
  comparisonData: {
    version: 1,
    custom: {
      kuehlung: "Aktive Kühlung",
      mahlzeiten: 3
    }
  },
  comparisonFilters: {
    animal: ["cat"],
    petSize: ["small"],
    foodType: ["wet"],
    app: true,
    camera: false,
    access: "open",
    backupPower: false
  },
  specs: [
    { label: "Reinigung", value: "Schale entnehmbar" }
  ],
  rating: 4.2,
  score: 84
};

test("custom comparisonData ist die zentrale Quelle", () => {
  assert.equal(resolveComparisonValue({
    product,
    item: { slug: "test" },
    criterion: { key: "kuehlung", label: "Kühlung" }
  }), "Aktive Kühlung");
});

test("Overrides haben Vorrang", () => {
  assert.equal(resolveComparisonValue({
    product,
    item: { slug: "test", overrides: { kuehlung: "Vergleichsspezifische Einordnung" } },
    criterion: { key: "kuehlung", label: "Kühlung" }
  }), "Vergleichsspezifische Einordnung");
});

test("strukturierte Filter werden automatisch formatiert", () => {
  assert.equal(resolveComparisonValue({
    product,
    item: { slug: "test" },
    criterion: { key: "futterart", label: "Futterart" }
  }), "Nassfutter");
  assert.equal(resolveComparisonValue({
    product,
    item: { slug: "test" },
    criterion: { key: "app", label: "App" }
  }), "Ja");
});

test("Specs bleiben ein kompatibler Fallback", () => {
  assert.equal(resolveComparisonValue({
    product,
    item: { slug: "test" },
    criterion: { key: "reinigung", label: "Reinigung" }
  }), "Schale entnehmbar");
});
