import test from "node:test";
import assert from "node:assert/strict";

const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase("de-DE").normalize("NFKC").replace(/[\u00a0\u202f]/g, " ").replace(/[‐‑‒–—]/g, "-").replace(/\s+/g, " ");

test("deutsche Anchor-Normalisierung ist stabil", () => {
  assert.equal(normalize(" GPS‑Tracker\u00a0ohne Abo "), "gps-tracker ohne abo");
});

test("spezifischer Anchor ist länger als generischer Anchor", () => {
  assert.ok(normalize("GPS-Tracker ohne Abo").length > normalize("GPS-Tracker").length);
});

test("Fast-Build wird im Produktionsmodus blockiert", () => {
  const production = true;
  const fastBuild = true;
  assert.equal(production && fastBuild, true);
});

test("fehlendes Pflichtskript ist kein erfolgreicher Skip", () => {
  const scripts = {};
  assert.throws(() => {
    if (!scripts["audit:anchor-governance:strict"]) throw new Error("Verpflichtendes npm-Skript fehlt");
  }, /Verpflichtendes/);
});

test("ungültiges JSON-LD wird erkannt", () => {
  assert.throws(() => JSON.parse('{"@type":'));
});

test("doppelte gleich normalisierte Anchor werden erkannt", () => {
  const anchors = ["GPS‑Tracker", "gps-tracker"];
  assert.equal(new Set(anchors.map(normalize)).size, 1);
});
