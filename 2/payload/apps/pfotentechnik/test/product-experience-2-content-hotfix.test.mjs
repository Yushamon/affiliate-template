import test from "node:test";
import assert from "node:assert/strict";
import { cleanTextItem, textItemKey, uniqueTextItems } from "../src/domain/productExperience/contentLists.ts";

test("identische Vorteile werden nur einmal ausgegeben", () => {
  assert.deepEqual(
    uniqueTextItems([
      "7 Liter Wasserreserve",
      "✓ 7 Liter Wasserreserve",
      "  7   Liter Wasserreserve  ",
      "breite Trinkfläche"
    ]),
    ["7 Liter Wasserreserve", "breite Trinkfläche"]
  );
});

test("Deduplizierung ignoriert Großschreibung, Satzzeichen und Umlaute", () => {
  assert.equal(textItemKey("Große Hunde"), textItemKey("GROSSE-HUNDE!"));
  assert.equal(cleanTextItem("× Abo erforderlich"), "Abo erforderlich");
});

test("Nachteile können aus Vorteilen ausgeschlossen werden", () => {
  assert.deepEqual(
    uniqueTextItems(
      ["Leise Pumpe", "Abo erforderlich", "Großer Tank"],
      { exclude: ["Abo erforderlich"] }
    ),
    ["Leise Pumpe", "Großer Tank"]
  );
});
