#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-filter-coverage-32.6.15";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

const root = findRoot(process.cwd());
const target = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "domain",
  "comparison",
  "buildComparisonViewModel.ts"
);

if (!fs.existsSync(target)) {
  throw new Error(`[${PATCH}] Datei fehlt: ${path.relative(root, target)}`);
}

let raw = fs.readFileSync(target, "utf8");

const startMarker = `  const filterDefinitions: ComparisonFilter[] = isGpsComparison ? [`;
const endMarker = `  const filters = filterDefinitions`;

const start = raw.indexOf(startMarker);
const end = raw.indexOf(endMarker);

if (start < 0 || end < 0 || end <= start) {
  throw new Error(
    `[${PATCH}] Filterdefinitions-Block nicht gefunden. ` +
    `Der lokale Stand weicht vom erwarteten buildComparisonViewModel.ts ab.`
  );
}

const replacement = `  /*
   * Filter Coverage Gate 32.6.15
   *
   * Ein Filter ist nur dann hilfreich, wenn er im konkreten Vergleich
   * ausreichend belegt ist. Das gilt einheitlich für alle Filterfamilien,
   * nicht nur für Tier und Tiergröße.
   *
   * Mindestabdeckung:
   * - mindestens zwei sichtbare Produkte mit belastbarem Wert
   * - mindestens 50 % der sichtbaren Produkte abgedeckt
   *
   * Fehlt die Abdeckung, bleibt das Produkt sichtbar; lediglich der
   * unzuverlässige Filter wird nicht angeboten.
   */
  const coveredFilter = (
    key: string,
    label: string,
    options: ComparisonFilter["options"]
  ): ComparisonFilter[] =>
    hasUsefulFilterCoverage(key)
      ? [{ key, label, options }]
      : [];

  const filterDefinitions: ComparisonFilter[] = isGpsComparison
    ? [
        ...coveredFilter("tier", "Tier", [
          { value: "hund", label: "Hund" },
          { value: "katze", label: "Katze" }
        ]),
        ...coveredFilter("abo", "Laufender Dienst", [
          { value: "mit-abo", label: "Abo erforderlich" },
          { value: "ohne-abo", label: "Ohne Mobilfunkabo" }
        ]),
        ...coveredFilter("system", "Übertragung", [
          { value: "mobilfunk", label: "Mobilfunk und App" },
          { value: "vhf", label: "VHF und Handgerät" }
        ]),
        ...coveredFilter("gewicht", "Gerätegewicht", [
          { value: "bis-35-g", label: "Bis 35 g" },
          { value: "ueber-35-g", label: "Über 35 g" }
        ])
      ]
    : [
        ...coveredFilter("tier", "Tier", [
          { value: "hund", label: "Hund" },
          { value: "katze", label: "Katze" }
        ]),
        ...coveredFilter("tiergroesse", "Tiergröße", [
          { value: "klein", label: "Klein" },
          { value: "mittel", label: "Mittel" },
          { value: "gross", label: "Groß" }
        ]),
        ...coveredFilter("futterart", "Futterart", [
          { value: "trockenfutter", label: "Trockenfutter" },
          { value: "nassfutter", label: "Nassfutter" }
        ]),
        ...coveredFilter("app", "Steuerung", [
          { value: "mit-app", label: "Mit App" },
          { value: "ohne-app", label: "Ohne App" }
        ]),
        ...coveredFilter("kamera", "Kamera", [
          { value: "mit-kamera", label: "Mit Kamera" },
          { value: "ohne-kamera", label: "Ohne Kamera" }
        ]),
        ...coveredFilter("zugang", "Zugang", [
          { value: "mikrochip", label: "Mikrochipgesteuert" },
          { value: "freier-zugang", label: "Freier Zugang" }
        ]),
        ...coveredFilter("strombackup", "Stromversorgung", [
          { value: "mit-backup", label: "Mit Batterie-Backup" },
          { value: "ohne-backup", label: "Nur Netzbetrieb" }
        ]),
        ...coveredFilter("preisklasse", "Preisklasse", [
          { value: "budget", label: "Budget" },
          { value: "midrange", label: "Mittelklasse" },
          { value: "premium", label: "Premium" }
        ])
      ];

`;

raw = raw.slice(0, start) + replacement + raw.slice(end);

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

fs.writeFileSync(target, raw, "utf8");

const reportDir = path.join(
  root,
  "apps",
  "pfotentechnik",
  "reports",
  "comparison-selection"
);
fs.mkdirSync(reportDir, { recursive: true });

const reportPath = path.join(
  reportDir,
  "comparison-filter-coverage-32.6.15.md"
);

fs.writeFileSync(reportPath, `# Comparison Filter Coverage 32.6.15

## Problem

Die bestehende Abdeckungsprüfung wurde nur für Tier und Tiergröße verwendet.
Andere Filter konnten erscheinen, obwohl nur wenige Produkte dafür belastbare
Daten besaßen.

Betroffen waren insbesondere:

- Futterart
- App
- Kamera
- Zugang
- Strombackup
- Preisklasse
- GPS-Abo
- GPS-Übertragung
- GPS-Gewicht

## Neue Regel

Ein Filter wird nur angeboten, wenn:

1. mindestens zwei sichtbare Produkte einen belastbaren Wert besitzen
2. mindestens 50 Prozent der sichtbaren Produkte für diesen Filter abgedeckt sind
3. nach dem Entfernen nicht vorkommender Optionen mindestens zwei Optionen
   tatsächlich im Vergleich vorkommen

## Sicherheitswirkung

Fehlende Filterdaten entfernen niemals ein Produkt.
Sie führen nur dazu, dass der betreffende Filter nicht angezeigt wird.

Membership, Ranking und Vergleichstabellen bleiben unverändert.
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Coverage Gate für alle Vergleichsfilter aktiviert.`);
console.log(`[${PATCH}] Keine Produkte werden durch fehlende Filterdaten entfernt.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);
