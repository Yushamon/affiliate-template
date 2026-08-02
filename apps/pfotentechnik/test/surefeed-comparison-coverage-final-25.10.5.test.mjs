import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");

const read = (name) =>
  fs.readFileSync(
    path.join(APP, "src/content/comparisons", name),
    "utf8"
  );

test("Mehrtiervergleich belegt Tiertrennung und Zugangskontrolle", () => {
  const source = read("beste-futterautomaten-fuer-mehrtierhaushalte.md");

  assert.match(
    source,
    /tiertrennung: "Keine individuelle Tiertrennung; beide Tiere können beide Näpfe erreichen"/
  );

  assert.match(
    source,
    /zugangskontrolle: "Keine Mikrochip- oder RFID-Zugangskontrolle"/
  );
});

test("Seniorenvergleich belegt Napf und Reinigung für SureFeed", () => {
  const source = read("beste-futterautomaten-fuer-seniorenkatzen.md");

  assert.match(
    source,
    /napf: "Geschützter 400-ml-Einzelnapf für Nass- und Trockenfutter"/
  );

  assert.match(
    source,
    /reinigung: "Napf und zugängliche Futterflächen regelmäßig entnehmen beziehungsweise abwischen; elektrische Basis nicht eintauchen"/
  );
});

test("Overrides bleiben auf die zwei betroffenen Produkte und Vergleiche begrenzt", () => {
  const multipet = read("beste-futterautomaten-fuer-mehrtierhaushalte.md");
  const senior = read("beste-futterautomaten-fuer-seniorenkatzen.md");

  assert.equal(
    (multipet.match(/tiertrennung:/g) ?? []).length,
    1
  );

  assert.equal(
    (senior.match(/Geschützter 400-ml-Einzelnapf/g) ?? []).length,
    1
  );
});
