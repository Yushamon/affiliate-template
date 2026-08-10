import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const r=(p)=>fs.readFileSync(path.join(app,p),"utf8");

test("Mehrkatzen-Seite beantwortet Anzahl direkt",()=>{
  const s=r("src/content/pages/trinkbrunnen-fuer-mehrere-katzen.md");
  assert.match(s,/zwei Katzen sind drei räumlich getrennte Wasserstellen/);
  assert.match(s,/\| 2 Katzen \| 3 Wasserstellen \|/);
  assert.match(s,/Wie viele Wasserstellen für 2 Katzen\?/);
});
test("Filterlos-Seite trennt Filterkosten von Verschleißteilen",()=>{
  const s=r("src/content/pages/katzentrinkbrunnen-ohne-filter.md");
  assert.match(s,/Filterlos heißt nicht automatisch verbrauchsmaterialfrei/);
  assert.match(s,/Pumpen, Vorfilter oder Siebe, Dichtungen/);
});
test("Wasserwechsel-Seite enthält kompakte Antworttabelle",()=>{
  const s=r("src/content/pages/katzenwasser-taeglich-wechseln.md");
  assert.match(s,/Wasserwechsel auf einen Blick/);
  assert.match(s,/Wassernapf \| mindestens täglich vollständig erneuern/);
});
test("Offline-Vergleich bleibt fokussiert und behält Kernentscheidung",()=>{
  const s=r("src/content/comparisons/beste-futterautomaten-ohne-wlan.md");
  assert.doesNotMatch(s,/## Lokale Zeitsteuerung reicht für viele Routinen/);
  for(const m of ["## Schnellentscheidung in 30 Sekunden","## Drei unterschiedliche Offline-Konzepte","## Offline bedeutet nicht ausfallsicher","## SureFeed Connect richtig einordnen","## Quellen"])
    assert.ok(s.includes(m), "Kernabschnitt fehlt: " + m);
});
