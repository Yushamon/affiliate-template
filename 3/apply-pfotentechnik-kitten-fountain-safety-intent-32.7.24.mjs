#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const TAG = "[pfotentechnik-kitten-fountain-safety-intent-32.7.24]";
const root = process.cwd();
const file = path.join(root, "apps/pfotentechnik/src/content/pages/trinkbrunnen-fuer-kitten-sicher.md");

function fail(msg) {
  console.error(`${TAG} FEHLER: ${msg}`);
  process.exit(1);
}
function log(msg) {
  console.log(`${TAG} ${msg}`);
}
function replaceOnce(source, before, after, label) {
  if (source.includes(after)) {
    log(`${label}: bereits aktuell.`);
    return source;
  }
  const count = source.split(before).length - 1;
  if (count !== 1) fail(`${label}: Ausgangsmuster kommt ${count}× vor.`);
  log(`${label}: aktualisiert.`);
  return source.replace(before, after);
}
function atomicWrite(target, content) {
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, target);
}

if (!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root, file)}`);

let source = fs.readFileSync(file, "utf8");
const original = source;

// 1) Aktualität
source = replaceOnce(
  source,
  'updatedAt: "2026-07-23"',
  'updatedAt: "2026-08-19"',
  "updatedAt"
);

// 2) Snippet nur leicht schärfen
source = replaceOnce(
  source,
  'seo: { title: "Trinkbrunnen für Kitten: Sicherheit und Auswahl", description: "Ist ein Katzenbrunnen für Kitten sicher? Worauf bei Trinkfläche, Tank, Kabel, Stand, Reinigung und Einführung zu achten ist.", canonical: "/trinkbrunnen-fuer-kitten-sicher/", sitemap: true, priority: 0.75, changefreq: yearly }',
  'seo: { title: "Trinkbrunnen für Kitten: Sicherheit und Auswahl", description: "Ein Trinkbrunnen kann für Kitten sicher sein, wenn Trinkfläche flach, Stand stabil und Kabel geschützt sind. So führst du ihn sicher ein.", canonical: "/trinkbrunnen-fuer-kitten-sicher/", sitemap: true, priority: 0.75, changefreq: yearly }',
  "SEO-Description"
);

// 3) Answer-first: generischen Vorspann entfernen und Entscheidung direkt beantworten
source = replaceOnce(
  source,
  `Dieser Ratgeber vertieft die Auswahl innerhalb des Themenbereichs [Trinkbrunnen für Haustiere](/trinkbrunnen/) für Kitten und stellt Zugänglichkeit, Stand- und elektrische Sicherheit in den Mittelpunkt.

## Die kurze Antwort

Ein Trinkbrunnen kann für ein selbstständig trinkendes Kitten geeignet sein, wenn er standsicher, leicht zugänglich und elektrisch sicher aufgebaut ist. Er ist kein Muss. Frisches Wasser in einem breiten flachen Napf erfüllt den Grundbedarf ebenfalls.`,
  `## Die kurze Antwort

**Ja, ein Trinkbrunnen kann für ein selbstständig trinkendes Kitten sicher sein**, wenn die Trinkfläche flach und gut erreichbar ist, das Gerät stabil steht und Kabel oder elektrische Kontakte nicht frei erreichbar sind. Ein geschlossener Tank ist für neugierige Jungkatzen sinnvoller als eine tiefe offene Wasserwanne.

Ein Brunnen ist trotzdem kein Muss. Ein breiter, flacher Wassernapf deckt den Grundbedarf ebenfalls ab und sollte während der Eingewöhnung als unabhängige Reserve stehen bleiben. Grundlagen zu Bauformen und Betrieb bündelt der [Trinkbrunnen-Ratgeber](/trinkbrunnen/).`,
  "Answer-first Einstieg"
);

// 4) Kompakte Entscheidungsbox als Markdown-Section vor Bauform
const marker = "## Die Bauform entscheidet";
const block = `## Darauf würde ich bei Kitten besonders achten

- **Flache Trinkfläche:** Das Kitten sollte trinken können, ohne in einen tiefen Tank greifen zu müssen.
- **Stabiler Stand:** Leichte oder hoch bauende Geräte dürfen beim Spielen nicht leicht verrutschen oder kippen.
- **Geschütztes Kabel:** Stromkabel und Ladebereiche gehören außerhalb der Reichweite von Zähnen und Pfoten.
- **Geschlossener Tank:** Offene tiefe Vorratsbehälter vermeiden.
- **Gut zerlegbare Pumpe:** Haare und Schmutz müssen sich ohne schwer zugängliche Hohlräume entfernen lassen.
- **Leiser Start:** Ein sehr lauter Wasserlauf kann die Gewöhnung unnötig erschweren.

Für die konkrete Modellauswahl hilft der [Vergleich der besten Trinkbrunnen für Katzen](/vergleiche/beste-trinkbrunnen-fuer-katzen/). Die Vergleichsseite übernimmt die Produktauswahl; dieser Ratgeber bleibt bei der Kitten-Sicherheit.

`;

if (!source.includes("## Darauf würde ich bei Kitten besonders achten")) {
  const count = source.split(marker).length - 1;
  if (count !== 1) fail(`Kitten-Checkliste: Marker kommt ${count}× vor.`);
  source = source.replace(marker, block + marker);
  log("Kitten-Checkliste: ergänzt.");
} else {
  log("Kitten-Checkliste: bereits vorhanden.");
}

// 5) Hygiene-Link kontextuell ergänzen
source = replaceOnce(
  source,
  `Spiel mit Wasser bringt Pfoten, Haare und Bodenschmutz in die Trinkfläche. Kontrolliere den Brunnen deshalb häufiger als bei ruhiger Nutzung. Wasser regelmäßig vollständig erneuern, sichtbare Verschmutzung sofort entfernen und Pumpe sowie Auslauf nach Anleitung reinigen.`,
  `Spiel mit Wasser bringt Pfoten, Haare und Bodenschmutz in die Trinkfläche. Kontrolliere den Brunnen deshalb häufiger als bei ruhiger Nutzung. Wasser regelmäßig vollständig erneuern, sichtbare Verschmutzung sofort entfernen und Pumpe sowie Auslauf nach Anleitung reinigen. Für Tank, Leitungen und Pumpenraum hilft die [vollständige Reinigungsanleitung](/katzentrinkbrunnen-richtig-reinigen/).`,
  "Hygiene-Link"
);

// 6) Abschluss leicht schärfen, ohne medizinischen Inhalt auszubauen
source = replaceOnce(
  source,
  `Ein Kitten, das nicht trinkt, nicht frisst, erbricht, Durchfall hat oder ungewöhnlich ruhig ist, braucht rasch tierärztliche Beurteilung. Ein Trinkbrunnen löst keine Dehydrierung oder Erkrankung.`,
  `Ein Kitten, das nicht trinkt, nicht frisst, erbricht, Durchfall hat oder ungewöhnlich ruhig ist, braucht rasch tierärztliche Beurteilung. Ein Trinkbrunnen löst keine Dehydrierung oder Erkrankung. Sicherheit und Akzeptanz des Geräts sind deshalb nur ein Teil der Wasserversorgung.`,
  "Medizinischer Abschluss"
);

if (source === original) {
  log("Keine Änderungen nötig.");
  process.exit(0);
}

// Sicherheitschecks
const required = [
  "## Die kurze Antwort",
  "## Darauf würde ich bei Kitten besonders achten",
  "/trinkbrunnen/",
  "/vergleiche/beste-trinkbrunnen-fuer-katzen/",
  "/katzentrinkbrunnen-richtig-reinigen/"
];

for (const token of required) {
  if (!source.includes(token)) fail(`Sicherheitscheck fehlgeschlagen: ${token}`);
}

atomicWrite(file, source);

log(`Aktualisiert: ${path.relative(root, file)}`);
log("Keine .bak-Datei angelegt.");
console.log("");
console.log("Jetzt prüfen:");
console.log("  git diff -- apps/pfotentechnik/src/content/pages/trinkbrunnen-fuer-kitten-sicher.md");
console.log("  npm --workspace apps/pfotentechnik run build");
