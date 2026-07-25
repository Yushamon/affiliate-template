import test from "node:test";
import assert from "node:assert/strict";

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  return Object.entries(value)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, entry]) => entry)
    .filter((entry) => entry && typeof entry === "object");
};

test("echte Arrays bleiben unverändert", () => {
  const input = [{ slug: "a" }, { slug: "b" }];
  assert.deepEqual(asList(input), input);
});

test("numerische Objektstruktur wird als Liste gelesen", () => {
  assert.deepEqual(
    asList({
      1: { slug: "b" },
      0: { slug: "a" }
    }),
    [{ slug: "a" }, { slug: "b" }]
  );
});

test("leere und ungültige Werte werden abgefangen", () => {
  assert.deepEqual(asList(null), []);
  assert.deepEqual(asList("text"), []);
});

test("unvollständige Objekteinträge werden verworfen", () => {
  assert.deepEqual(
    asList({
      0: { slug: "a" },
      1: null,
      2: "falsch"
    }),
    [{ slug: "a" }]
  );
});
