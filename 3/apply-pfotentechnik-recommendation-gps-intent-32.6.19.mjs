#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-recommendation-gps-intent-32.6.19";

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
  "recommendationEngine.ts"
);

if (!fs.existsSync(target)) {
  throw new Error(`[${PATCH}] Datei fehlt: ${path.relative(root, target)}`);
}

let raw = fs.readFileSync(target, "utf8");

const oldGpsScenarios = `  if (family === "gps-tracker") {
    return [
      { key: "lightweight", label: "Leichte Tiere", priority: "lightweight" },
      { key: "battery", label: "Lange Akkulaufzeit", priority: "battery" },
      { key: "no-subscription", label: "Ohne laufendes Mobilfunkabo", priority: "no-subscription" }
    ];
  }`;

const newGpsScenarios = `  if (family === "gps-tracker") {
    /*
     * GPS Intent Guard 32.6.19
     *
     * Die drei Default-Szenarien sind für breite GPS-Vergleiche sinnvoll,
     * aber nicht für Spezialseiten wie "lange Akkulaufzeit", "ohne Abo"
     * oder "kleine Tracker für Katzen".
     */
    const normalizedSlug = normalize(comparisonSlug);
    const broadGpsComparison =
      normalizedSlug === "beste-gps-tracker-fuer-hunde" ||
      normalizedSlug === "beste-gps-tracker-fuer-katzen" ||
      normalizedSlug === "beste-gps-tracker";

    if (!broadGpsComparison) {
      return [];
    }

    return [
      { key: "lightweight", label: "Leichte Tiere", priority: "lightweight" },
      { key: "battery", label: "Lange Akkulaufzeit", priority: "battery" },
      { key: "no-subscription", label: "Ohne laufendes Mobilfunkabo", priority: "no-subscription" }
    ];
  }`;

if (!raw.includes(oldGpsScenarios)) {
  throw new Error(`[${PATCH}] GPS-Szenarioblock nicht gefunden.`);
}

raw = raw.replace(oldGpsScenarios, newGpsScenarios);

const overallMarker = `  const normalizedComparisonSlug = normalize(data.slug);
  const allowAutomaticOverall =
    family !== "feeder" ||
    normalizedComparisonSlug === "beste-futterautomaten-fuer-katzen" ||
    normalizedComparisonSlug === "beste-futterautomaten-fuer-hunde" ||
    normalizedComparisonSlug === "beste-futterautomaten";

  const overall = allowAutomaticOverall`;

const overallReplacement = `  const normalizedComparisonSlug = normalize(data.slug);

  const broadFeederComparison =
    normalizedComparisonSlug === "beste-futterautomaten-fuer-katzen" ||
    normalizedComparisonSlug === "beste-futterautomaten-fuer-hunde" ||
    normalizedComparisonSlug === "beste-futterautomaten";

  const broadGpsComparison =
    normalizedComparisonSlug === "beste-gps-tracker-fuer-hunde" ||
    normalizedComparisonSlug === "beste-gps-tracker-fuer-katzen" ||
    normalizedComparisonSlug === "beste-gps-tracker";

  const allowAutomaticOverall =
    (family === "feeder" && broadFeederComparison) ||
    (family === "gps-tracker" && broadGpsComparison) ||
    family === "water-fountain";

  const overall = allowAutomaticOverall`;

if (!raw.includes(overallMarker)) {
  throw new Error(
    `[${PATCH}] Overall Intent Guard 32.6.18 nicht gefunden. ` +
    `Bitte 32.6.18 zuerst anwenden.`
  );
}

raw = raw.replace(overallMarker, overallReplacement);

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
  "recommendation-gps-intent-32.6.19.md"
);

fs.writeFileSync(reportPath, `# Recommendation GPS Intent Guard 32.6.19

## Repository-Befund

Breite GPS-Vergleiche:

- beste-gps-tracker-fuer-hunde
- beste-gps-tracker-fuer-katzen

Spezialisierte GPS-Vergleiche:

- gps-tracker-mit-langer-akkulaufzeit
- gps-tracker-ohne-abo
- kleine-gps-tracker-fuer-katzen

## Problem

Bislang erhielten auch GPS-Spezialvergleiche automatisch:

- einen allgemeinen Overall-Sieger
- Leichte Tiere
- Lange Akkulaufzeit
- Ohne laufendes Mobilfunkabo

Damit konkurrierten auf einer Spezialseite mehrere andere Intents mit dem
eigentlichen Seitenzweck.

## Neue Regel

Breite GPS-Vergleiche:

- automatischer Overall bleibt aktiv
- Default-Szenarien bleiben aktiv

GPS-Spezialvergleiche:

- kein generischer automatischer Overall
- keine pauschalen Default-Szenarien
- redaktioneller winnerSlug bleibt maßgeblich
- fehlt dieser, greift der bestehende Fallback auf die kuratierte item-Reihenfolge
- explizit konfigurierte automaticRecommendations.scenarios bleiben möglich

## Trinkbrunnen

Die aktuelle Vergleichsstruktur besitzt nur:

- beste-trinkbrunnen-fuer-katzen
- beste-trinkbrunnen-fuer-hunde

Beide sind breite Familienvergleiche. Die vorhandene kapazitäts- und
tierartspezifische Automatik bleibt deshalb unverändert aktiv.

## Sicherheit

- keine Membership-Änderung
- kein Produkt wird entfernt
- Filter bleiben unverändert
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] GPS-Spezialvergleiche gegen generischen Overall abgesichert.`);
console.log(`[${PATCH}] GPS-Default-Szenarien nur noch bei breiten Vergleichen.`);
console.log(`[${PATCH}] Trinkbrunnen-Automatik unverändert.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);
