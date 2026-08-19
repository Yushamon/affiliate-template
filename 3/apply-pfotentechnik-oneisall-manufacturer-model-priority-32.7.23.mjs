#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const TAG = "[pfotentechnik-oneisall-manufacturer-model-priority-32.7.23]";
const root = process.cwd();
const file = path.join(root, "apps/pfotentechnik/src/content/manufacturers/oneisall.md");

function fail(msg) {
  console.error(`${TAG} FEHLER: ${msg}`);
  process.exit(1);
}
function log(msg) {
  console.log(`${TAG} ${msg}`);
}
if (!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root, file)}`);

let source = fs.readFileSync(file, "utf8");
const original = source;

function getFrontmatter() {
  if (!source.startsWith("---\n")) fail("Frontmatter-Start fehlt.");
  const end = source.indexOf("\n---", 4);
  if (end < 0) fail("Frontmatter-Ende fehlt.");
  return { end, text: source.slice(0, end) };
}

function replaceTopScalar(label, key, oldValue, newValue) {
  const { end, text: fm } = getFrontmatter();
  const oldLine = `${key}: ${oldValue}`;
  const newLine = `${key}: ${newValue}`;

  if (fm.includes(newLine)) {
    log(`${label}: bereits aktuell.`);
    return;
  }

  const lines = fm.split("\n");
  const topMatches = lines
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => line.startsWith(`${key}: `));

  if (topMatches.length !== 1) {
    fail(`${label}: Top-Level-Feld ${key} kommt ${topMatches.length}× vor.`);
  }
  if (topMatches[0].line !== oldLine) {
    fail(`${label}: unerwarteter Ausgangswert: ${topMatches[0].line}`);
  }

  lines[topMatches[0].i] = newLine;
  source = lines.join("\n") + source.slice(end);
  log(`${label}: aktualisiert.`);
}

function replaceSeoScalar(label, key, oldValue, newValue) {
  const { end, text: fm } = getFrontmatter();
  const seoStart = fm.indexOf("\nseo:\n");
  if (seoStart < 0) fail("seo:-Block fehlt.");

  const bodyStart = seoStart + "\nseo:\n".length;
  const rest = fm.slice(bodyStart);
  const nextTop = rest.search(/\n(?=[A-Za-z0-9_-]+:\s)/);
  const bodyEnd = nextTop >= 0 ? bodyStart + nextTop : fm.length;
  const seo = fm.slice(bodyStart, bodyEnd);

  const oldLine = `  ${key}: ${oldValue}`;
  const newLine = `  ${key}: ${newValue}`;

  if (seo.includes(newLine)) {
    log(`${label}: bereits aktuell.`);
    return;
  }
  if (!seo.includes(oldLine)) fail(`${label}: erwarteter Ausgangswert fehlt im seo:-Block.`);

  const patchedFm = fm.slice(0, bodyStart) + seo.replace(oldLine, newLine) + fm.slice(bodyEnd);
  source = patchedFm + source.slice(end);
  log(`${label}: aktualisiert.`);
}

function replaceOnce(label, before, after) {
  if (source.includes(after)) {
    log(`${label}: bereits aktuell.`);
    return;
  }
  const count = source.split(before).length - 1;
  if (count !== 1) fail(`${label}: Ausgangsmuster kommt ${count}× vor.`);
  source = source.replace(before, after);
  log(`${label}: aktualisiert.`);
}

// Top-Level-Felder sauber scopen
replaceTopScalar("updatedAt", "updatedAt", '"2026-07-19"', '"2026-08-19"');

replaceTopScalar(
  "Description",
  "description",
  '"oneisall im Überblick: Futterautomaten und Trinkbrunnen für Hunde und Katzen, Zielgruppen, Ersatzteile, Garantie und Alternativen."',
  '"oneisall im Überblick: Futterautomaten und kabellose Trinkbrunnen für Katzen und Hunde nach Kapazität, Stromversorgung, Sensorik und Einsatzzweck einordnen."'
);

replaceTopScalar(
  "Recommendation",
  "recommendation",
  '"oneisall entwickelt vor allem Produkte für die Fellpflege von Hunden und Katzen und hat sein Sortiment in den vergangenen Jahren um automatische Futterautomaten erweitert. Die Marke richtet sich vor allem an preisbewusste Tierhalter, die moderne Funktionen zu einem attraktiven Preis suchen."',
  '"oneisall ist im PfotenTechnik-Bestand vor allem bei preisorientierten Futterautomaten und kabellosen Trinkbrunnen interessant. Der 7L Dog Water Fountain priorisiert große Kapazität, die Cordless-Modelle flexible Aufstellung und der 5L Automatic Cat Feeder planbare Trockenfutterrationen. Für RFID, Kamera oder ein geschlossenes App-Ökosystem sind andere Marken meist stärker."'
);

replaceTopScalar(
  "Summary",
  "summary",
  '"oneisall wird vor allem für das gute Preis-Leistungs-Verhältnis und die einfache Einrichtung gelobt. Käufer bewerten die Geräte häufig als unkompliziert und alltagstauglich. Kritik betrifft überwiegend den geringeren Funktionsumfang gegenüber Premium-Herstellern."',
  '"oneisall deckt im aktuellen PfotenTechnik-Bestand vor allem zwei Bereiche ab: automatische Trockenfutterautomaten sowie Akku- und Sensor-Trinkbrunnen. Die Stärke liegt weniger in einem einheitlichen Smart-Ökosystem als in Kapazität, einfacher Bedienung und vergleichsweise günstigen Speziallösungen. Modellwahl und Stromversorgung sind deshalb wichtiger als die Marke allein."'
);

// SEO-Felder ausschließlich im seo:-Block
replaceSeoScalar(
  "SEO-Title",
  "title",
  '"oneisall Erfahrungen: Produkte, Bewertung und Empfehlungen"',
  '"oneisall 2026: Futterautomaten & Trinkbrunnen im Vergleich"'
);

replaceSeoScalar(
  "SEO-Description",
  "description",
  '"oneisall im Überblick: Futterautomaten und Trinkbrunnen für Hunde und Katzen, Zielgruppen, Ersatzteile, Garantie und Alternativen."',
  '"oneisall 2026: 5L Feeder, 7L Dog Water Fountain und Cordless-Trinkbrunnen nach Kapazität, Akku, Sensorik und Einsatzzweck einordnen."'
);

// Strukturblöcke
replaceOnce(
  "Product Categories",
  `productCategories:
  - "Futterautomaten"
  - "Tierpflege"
  - "Haustierzubehör"`,
  `productCategories:
  - "Futterautomaten"
  - "Trinkbrunnen"
  - "Tierpflege"
  - "Haustierzubehör"`
);

replaceOnce(
  "Product Areas",
  `productAreas:
  - "Futterautomaten"
  - "Tierpflege"`,
  `productAreas:
  - "Automatische Futterautomaten"
  - "Kabellose Trinkbrunnen"
  - "Sensor-Trinkbrunnen"
  - "Trinkbrunnen für Hunde"
  - "Tierpflege"`
);

replaceOnce(
  "Focus",
  `focus:
  - "Automatische Futterautomaten"
  - "Tierpflege"
  - "Preis-Leistungs-Produkte"
  - "Haustierzubehör"`,
  `focus:
  - "Automatische Futterautomaten"
  - "Kabellose Trinkbrunnen"
  - "Große Wasserkapazität"
  - "Sensor- und Akkubetrieb"
  - "Preis-Leistungs-Produkte"`
);

replaceOnce(
  "Attention",
  `attention:
  - "Premiumsegment"
  - "RFID-Fütterung"
  - "Kameraüberwachung"`,
  `attention:
  - "kein einheitliches geräteübergreifendes Smart-Ökosystem"
  - "RFID-Fütterung im aktuellen PfotenTechnik-Bestand nicht abgedeckt"
  - "Kameraüberwachung im aktuellen PfotenTechnik-Bestand nicht abgedeckt"
  - "Filter, Pumpen und Stromversorgung unterscheiden sich je nach Brunnenmodell"`
);

replaceOnce(
  "Strengths",
  `strengths:
  - "Attraktives Preis-Leistungs-Verhältnis"
  - "Einfache Bedienung"
  - "Modernes Design"
  - "Großes Sortiment für Tierhalter"
  - "Leicht verständliche App"`,
  `strengths:
  - "Attraktives Preis-Leistungs-Verhältnis"
  - "Mehrere Akku- und Sensor-Trinkbrunnen"
  - "Große Kapazitäten bis 7 Liter im gepflegten Bestand"
  - "Einfache Bedienung"
  - "Modelle für Katzen und Hunde"`
);

replaceOnce(
  "Weaknesses",
  `weaknesses:
  - "Kleineres Sortiment an Futterautomaten"
  - "Weniger Premiumfunktionen"
  - "Noch geringe Markenbekanntheit im Bereich Fütterung"`,
  `weaknesses:
  - "Kein konsistentes App- und Datenökosystem über alle Modelle"
  - "Weniger Premiumfunktionen wie RFID oder integrierte Kamera"
  - "Modellnamen und Kapazitätsvarianten sind leicht zu verwechseln"
  - "Ersatzteile und Filter sind modellbezogen"`
);

replaceOnce(
  "Featured Products",
  `featuredProductSlugs:
  - "oneisall-5l-automatic-cat-feeder"
  - "oneisall-3-5l-cordless-fountain"
  - "oneisall-7l-dog-water-fountain"`,
  `featuredProductSlugs:
  - "oneisall-7l-dog-water-fountain"
  - "oneisall-3-5l-cordless-fountain"
  - "oneisall-5l-automatic-cat-feeder"
  - "oneisall-2-in-1-feeder-water"`
);

replaceOnce(
  "Series",
  `series:
  - key: "automatic-feeder"
    name: "Automatic Feeder"
    description: "Automatische Futterautomaten mit App und einfacher Bedienung."
    suitableFor:
      - "Preisbewusste Käufer"
    productSlugs: []`,
  `series:
  - key: "automatic-feeder"
    name: "Automatic Feeder"
    description: "Trockenfutterautomaten für planbare Mahlzeiten. Im gepflegten Bestand stehen der 5L Automatic Cat Feeder und die 2-in-1-Lösung für Futter und Wasser."
    suitableFor:
      - "Trockenfutter"
      - "Planbare Mahlzeiten"
      - "Preisbewusste Käufer"
    productSlugs:
      - "oneisall-5l-automatic-cat-feeder"
      - "oneisall-2-in-1-feeder-water"

  - key: "cordless-fountain"
    name: "Cordless Fountain"
    description: "Kabellose Trinkbrunnen mit unterschiedlichen Tankgrößen. Die Baureihen unterscheiden sich vor allem bei Kapazität, Sensorbetrieb und Filterversorgung."
    suitableFor:
      - "Flexible Aufstellung"
      - "Katzen"
      - "Akku- oder Sensorbetrieb"
    productSlugs:
      - "oneisall-2-2l-cordless-fountain"
      - "oneisall-3-2l-cordless-fountain"
      - "oneisall-3-5l-cordless-fountain"

  - key: "dog-water-fountain"
    name: "Dog Water Fountain"
    description: "Großvolumige Trinkbrunnen für Hunde. Der 7L Dog Water Fountain ist das zentrale Modell für Haushalte, die möglichst selten nachfüllen möchten."
    suitableFor:
      - "Hunde"
      - "Große Wasserkapazität"
      - "Längere Nachfüllintervalle"
    productSlugs:
      - "oneisall-7l-dog-water-fountain"`
);

replaceOnce(
  "Experience Summary",
  '  summary: "oneisall wird vor allem für das gute Preis-Leistungs-Verhältnis und die einfache Einrichtung gelobt. Käufer bewerten die Geräte häufig als unkompliziert und alltagstauglich. Kritik betrifft überwiegend den geringeren Funktionsumfang gegenüber Premium-Herstellern."',
  '  summary: "Die aktuelle PfotenTechnik-Einordnung stützt sich auf die gepflegten oneisall-Produktdaten und trennt Futterautomaten von Akku- und Sensor-Trinkbrunnen. Besonders relevant sind der 7L Dog Water Fountain, der 3,5L Cordless Fountain, der 5L Automatic Cat Feeder und die 2-in-1-Lösung. Der Markenvergleich sollte deshalb über Kapazität, Stromversorgung und Einsatzzweck laufen, nicht über eine pauschale Qualitätsaussage."'
);

replaceOnce(
  "Body Intro",
  `oneisall entwickelt vor allem Produkte für die Fellpflege von Hunden und Katzen und hat sein Sortiment in den vergangenen Jahren um automatische Futterautomaten erweitert. Die Marke richtet sich vor allem an preisbewusste Tierhalter, die moderne Funktionen zu einem attraktiven Preis suchen.`,
  `oneisall ist bei PfotenTechnik vor allem mit automatischen Futterautomaten sowie Akku- und Sensor-Trinkbrunnen vertreten. Für die Auswahl ist weniger die Marke als der Einsatzzweck entscheidend: großer Wasservorrat, kabellose Aufstellung oder planbare Trockenfutterrationen.`
);

replaceOnce(
  "Product Discovery",
  `## Weitere Produkte von oneisall

Diese Produktseiten ergänzen das Herstellerprofil und führen zu den jeweiligen redaktionellen Einordnungen.

- [Oneisall 2-in-1 Automatic Cat Feeder and Water Dispenser](/produkt/oneisall-2-in-1-feeder-water/)
- [oneisall 2,2L Cordless Cat Fountain](/produkt/oneisall-2-2l-cordless-fountain/)
- [oneisall 3,2L Cordless Cat Fountain](/produkt/oneisall-3-2l-cordless-fountain/)
- [oneisall 3,5L Cordless Fountain](/produkt/oneisall-3-5l-cordless-fountain/)
- [oneisall 5L Automatic Cat Feeder](/produkt/oneisall-5l-automatic-cat-feeder/)
- [oneisall 7L Dog Water Fountain](/produkt/oneisall-7l-dog-water-fountain/)`,
  `## Die wichtigsten oneisall-Modelle

- [oneisall 7L Dog Water Fountain](/produkt/oneisall-7l-dog-water-fountain/): Priorität, wenn große Wasserkapazität und längere Nachfüllintervalle wichtiger sind als Smart-Funktionen.
- [oneisall 3,5L Cordless Fountain](/produkt/oneisall-3-5l-cordless-fountain/): sinnvoll, wenn ein kabelloser Katzenbrunnen mit größerem Tank gesucht wird.
- [oneisall 5L Automatic Cat Feeder](/produkt/oneisall-5l-automatic-cat-feeder/): klassische Wahl für planbare Trockenfutterrationen.
- [Oneisall 2-in-1 Automatic Cat Feeder and Water Dispenser](/produkt/oneisall-2-in-1-feeder-water/): Kombilösung, wenn Futter und Wasser in einem System wichtiger sind als maximale Spezialisierung.

### Weitere Trinkbrunnen

- [oneisall 2,2L Cordless Cat Fountain](/produkt/oneisall-2-2l-cordless-fountain/)
- [oneisall 3,2L Cordless Cat Fountain](/produkt/oneisall-3-2l-cordless-fountain/)`
);

// Safety
const required = [
  'title: "oneisall 2026: Futterautomaten & Trinkbrunnen im Vergleich"',
  'description: "oneisall im Überblick: Futterautomaten und kabellose Trinkbrunnen',
  '  - "Trinkbrunnen"',
  'oneisall-7l-dog-water-fountain',
  'oneisall-3-5l-cordless-fountain',
  'oneisall-5l-automatic-cat-feeder',
  'oneisall-2-in-1-feeder-water'
];
for (const token of required) {
  if (!source.includes(token)) fail(`Sicherheitscheck fehlgeschlagen: ${token}`);
}

if (source === original) {
  log("Keine Änderungen nötig.");
  process.exit(0);
}

const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
try {
  fs.writeFileSync(tmp, source, "utf8");
  fs.renameSync(tmp, file);
} catch (err) {
  try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch {}
  fail(`Schreiben fehlgeschlagen: ${err.message}`);
}

log(`Geschrieben: ${path.relative(root, file)}`);
log("Nur Herstellerseite geändert.");
log("Keine .bak-Datei angelegt.");
console.log("");
console.log("Jetzt prüfen:");
console.log("  npm --workspace apps/pfotentechnik run build");
console.log("  git diff -- apps/pfotentechnik/src/content/manufacturers/oneisall.md");
