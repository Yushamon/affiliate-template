#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const TAG = "[pfotentechnik-water-fountain-commercial-journey-32.8.3]";
const root = process.cwd();
const file = path.join(root, "apps/pfotentechnik/src/content/pages/trinkbrunnen.md");

const changes = [
  {
    label: "Hub zu Material-Owner",
    before: "Eine pauschale Rangliste nach Material wäre deshalb zu simpel. **Die Konstruktion entscheidet.**",
    after: "Eine pauschale Rangliste nach Material wäre deshalb zu simpel. **Die Konstruktion entscheidet.**\n\nWenn du die Werkstoffe vor der Modellauswahl genauer abwägen möchtest, vergleicht der [Materialratgeber für Katzenbrunnen](/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/) Edelstahl, Keramik und Kunststoff nach wasserberührten Flächen, Reinigung, Gewicht und Bruchrisiko."
  },
  {
    label: "Hub zu Filter-Owner",
    before: "Filter können Haare und Partikel auffangen. Sie sind Verbrauchsmaterial. Deshalb solltest du vor dem Kauf nicht nur das Wechselintervall, sondern auch Preis und Verfügbarkeit prüfen.",
    after: "Filter können Haare und Partikel auffangen. Sie sind Verbrauchsmaterial. Deshalb solltest du vor dem Kauf nicht nur das Wechselintervall, sondern auch Preis und Verfügbarkeit prüfen.\n\nWie Filtertyp, Wechselintervall und laufende Kosten zusammenhängen, erklärt der Ratgeber [Filter im Katzenbrunnen wechseln](/filter-im-katzentrinkbrunnen-wechseln/). Die konkrete Modellbewertung bleibt anschließend Aufgabe des Katzenbrunnen-Vergleichs."
  }
];

const fail = (message) => { console.error(`${TAG} FEHLER: ${message}`); process.exit(1); };
const log = (message) => console.log(`${TAG} ${message}`);

if (!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root, file)}`);
let source = fs.readFileSync(file, "utf8");
const original = source;

for (const { label, before, after } of changes) {
  if (source.includes(after)) { log(`${label}: bereits aktuell.`); continue; }
  const count = source.split(before).length - 1;
  if (count !== 1) fail(`${label}: Ausgangsmuster kommt ${count}× vor.`);
  source = source.replace(before, after);
  log(`${label}: aktualisiert.`);
}

for (const target of [
  "/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/",
  "/filter-im-katzentrinkbrunnen-wechseln/",
  "/vergleiche/beste-trinkbrunnen-fuer-katzen/"
]) {
  if (!source.includes(target)) fail(`Sicherheitscheck fehlgeschlagen: ${target}`);
}

if (source === original) { log("Keine Änderungen nötig."); process.exit(0); }
const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
fs.writeFileSync(temporary, source, "utf8");
fs.renameSync(temporary, file);
log(`Aktualisiert: ${path.relative(root, file)}`);
log("Keine .bak-Datei angelegt.");
