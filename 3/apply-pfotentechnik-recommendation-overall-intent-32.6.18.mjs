#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-recommendation-overall-intent-32.6.18";

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

const oldOverall = `  const overall = rankProducts(candidates, {
    key: "overall",
    label: "Gesamtempfehlung"
  }, family, audience);

  const scenarios = definitions.flatMap((definition) => {`;

const newOverall = `  /*
   * Overall Intent Guard 32.6.18
   *
   * Spezialisierte Futterautomaten-Vergleiche dürfen keinen automatischen
   * Gesamtsieger aus einem allgemeinen Produktscore ableiten, wenn die
   * eigentliche Suchintention darin nicht gewichtet wird.
   *
   * Breite Allround-Vergleiche behalten den automatischen Overall.
   * Spezialvergleiche behalten redaktionelle Sieger oder fallen später
   * auf die kuratierte item-Reihenfolge zurück.
   */
  const normalizedComparisonSlug = normalize(data.slug);
  const allowAutomaticOverall =
    family !== "feeder" ||
    normalizedComparisonSlug === "beste-futterautomaten-fuer-katzen" ||
    normalizedComparisonSlug === "beste-futterautomaten-fuer-hunde" ||
    normalizedComparisonSlug === "beste-futterautomaten";

  const overall = allowAutomaticOverall
    ? rankProducts(candidates, {
        key: "overall",
        label: "Gesamtempfehlung"
      }, family, audience)
    : [];

  const scenarios = definitions.flatMap((definition) => {`;

if (!raw.includes(oldOverall)) {
  throw new Error(
    `[${PATCH}] Erwarteter Overall-Block nicht gefunden. ` +
    `Der lokale Stand weicht vom geprüften recommendationEngine.ts ab.`
  );
}

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

raw = raw.replace(oldOverall, newOverall);
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
  "recommendation-overall-intent-32.6.18.md"
);

fs.writeFileSync(reportPath, `# Recommendation Overall Intent Guard 32.6.18

## Problem

Die Recommendation Engine berechnet bislang auch bei spezialisierten
Futterautomaten-Vergleichen einen automatischen Gesamtsieger.

Dieser Overall-Score berücksichtigt den konkreten Spezialintent nicht ausreichend.
Beispiele:

- mit Akku
- ohne WLAN
- Nassfutter
- Mehrtierhaushalt
- zwei Katzen
- Senioren
- kleine Hunde
- Edelstahl-Napf
- Budget

Damit konnte bei fehlendem redaktionellen winnerSlug ein allgemein gut
bewertetes Produkt gewinnen, obwohl es nicht zwingend die beste Wahl für den
konkreten Vergleichsintent ist.

## Neue Regel

Automatischer Overall bleibt aktiv für:

- beste-futterautomaten-fuer-katzen
- beste-futterautomaten-fuer-hunde
- beste-futterautomaten

Bei spezialisierten Futterautomaten-Vergleichen:

- kein generischer automatischer Overall-Sieger
- redaktioneller winnerSlug bleibt maßgeblich
- fehlt dieser, greift der bestehende sichere Fallback auf die kuratierte
  item-Reihenfolge
- explizit gepflegte automaticRecommendations.scenarios bleiben aktiv

## Unverändert

- Membership bleibt unverändert
- kein Produkt wird entfernt
- Filterlogik bleibt unverändert
- Trinkbrunnen- und GPS-Automatik werden durch diesen Patch nicht verändert
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Automatischen Overall bei spezialisierten Feedern deaktiviert.`);
console.log(`[${PATCH}] Allround-Feeder bleiben automatisch rankbar.`);
console.log(`[${PATCH}] Explizite Szenarien bleiben aktiv.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);
