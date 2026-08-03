import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const APP = process.cwd();
const files = {
  material: path.join(APP, "src/content/pages/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff.md"),
  cleaning: path.join(APP, "src/content/pages/katzentrinkbrunnen-richtig-reinigen.md"),
  filter: path.join(APP, "src/content/pages/filter-im-katzentrinkbrunnen-wechseln.md"),
  comparison: path.join(APP, "src/content/comparisons/beste-trinkbrunnen-fuer-katzen.md"),
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, fs.readFileSync(file, "utf8")]),
);

test("alle drei Intent-Owner führen strukturell zum Katzenvergleich", () => {
  for (const key of ["material", "cleaning", "filter"]) {
    assert.match(source[key], /recommendationJourney:/);
    assert.match(
      source[key],
      /comparisonHref: \/vergleiche\/beste-trinkbrunnen-fuer-katzen\//,
    );
  }
});

test("Journey-Labels benennen das jeweilige Entscheidungskriterium", () => {
  assert.match(
    source.material,
    /comparisonLabel: Modelle nach tatsächlichen Wasserflächen vergleichen/,
  );
  assert.match(
    source.cleaning,
    /comparisonLabel: Brunnen mit gut zugänglicher Pumpe vergleichen/,
  );
  assert.match(
    source.filter,
    /comparisonLabel: Filtertyp und Folgekosten im Modellvergleich prüfen/,
  );
});

test("Ratgeber besitzen Rückweg, nächste Entscheidung und fachliche Vertiefung", () => {
  for (const key of ["material", "cleaning", "filter"]) {
    assert.match(source[key], /\(\/trinkbrunnen\/\)/);
    assert.match(
      source[key],
      /\(\/vergleiche\/beste-trinkbrunnen-fuer-katzen\/\)/,
    );
  }
  assert.match(
    source.material,
    /\(\/katzentrinkbrunnen-richtig-reinigen\/\)/,
  );
  assert.match(
    source.cleaning,
    /\(\/filter-im-katzentrinkbrunnen-wechseln\/\)/,
  );
  assert.match(
    source.filter,
    /\(\/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff\/\)/,
  );
});

test("Katzenvergleich erklärt Kriterien und verlinkt zurück", () => {
  assert.match(
    source.comparison,
    /## So werden Material, Reinigung und Filter bewertet/,
  );
  assert.match(
    source.comparison,
    /\(\/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff\/\)/,
  );
  assert.match(
    source.comparison,
    /\(\/katzentrinkbrunnen-richtig-reinigen\/\)/,
  );
  assert.match(
    source.comparison,
    /\(\/filter-im-katzentrinkbrunnen-wechseln\/\)/,
  );
});

test("Patch erzeugt keine künstliche neue Vergleichsroute", () => {
  const all = Object.values(source).join("\n");
  assert.doesNotMatch(all, /\/vergleiche\/katzenbrunnen-(?:material|edelstahl|filter|hygiene)\//);
});
