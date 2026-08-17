#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-recommendation-scenario-intent-32.6.17";

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

const oldCall = `  const audience = resolveAudience(data.slug, candidates);
  const definitions = buildScenarioDefinitions(family, audience, config?.scenarios);`;

const newCall = `  const audience = resolveAudience(data.slug, candidates);
  const definitions = buildScenarioDefinitions(
    family,
    audience,
    data.slug,
    config?.scenarios
  );`;

const oldSignature = `function buildScenarioDefinitions(
  family: string,
  audience: string,
  configured?: Array<{ key: string; label: string }>
): ScenarioDefinition[] {
  if (configured?.length) return configured;`;

const newSignature = `function buildScenarioDefinitions(
  family: string,
  audience: string,
  comparisonSlug: string,
  configured?: Array<{ key: string; label: string }>
): ScenarioDefinition[] {
  if (configured?.length) return configured;`;

const oldFeeder = `  if (family === "feeder") {
    return [
      { key: "value", label: "Preis-Leistung", priority: "value" },
      { key: "smart", label: "App und smarte Funktionen", priority: "smart" },
      { key: "camera", label: "Kamera und Kontrolle", priority: "camera" }
    ];
  }`;

const newFeeder = `  if (family === "feeder") {
    /*
     * Scenario Intent Guard 32.6.17
     *
     * Die bisherigen Default-Szenarien "Preis-Leistung", "Smart" und
     * "Kamera" passen nur zu breiten Allround-Vergleichen. Bei
     * Spezialvergleichen würden sie den eigentlichen Suchintent verwässern.
     *
     * Spezialvergleiche erhalten deshalb nur dann automatische Szenarien,
     * wenn diese explizit in automaticRecommendations.scenarios gepflegt sind.
     */
    const normalizedSlug = normalize(comparisonSlug);
    const broadFeederComparison =
      normalizedSlug === "beste-futterautomaten-fuer-katzen" ||
      normalizedSlug === "beste-futterautomaten-fuer-hunde" ||
      normalizedSlug === "beste-futterautomaten";

    if (!broadFeederComparison) {
      return [];
    }

    return [
      { key: "value", label: "Preis-Leistung", priority: "value" },
      { key: "smart", label: "App und smarte Funktionen", priority: "smart" },
      { key: "camera", label: "Kamera und Kontrolle", priority: "camera" }
    ];
  }`;

const required = [
  [oldCall, "Aufruf"],
  [oldSignature, "Funktionssignatur"],
  [oldFeeder, "Feeder-Szenarioblock"]
];

for (const [needle, label] of required) {
  if (!raw.includes(needle)) {
    throw new Error(`[${PATCH}] Erwarteter Block fehlt: ${label}`);
  }
}

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

raw = raw.replace(oldCall, newCall);
raw = raw.replace(oldSignature, newSignature);
raw = raw.replace(oldFeeder, newFeeder);
fs.writeFileSync(target, raw, "utf8");

const reportDir = path.join(root, "apps", "pfotentechnik", "reports", "comparison-selection");
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, "recommendation-scenario-intent-32.6.17.md");

fs.writeFileSync(reportPath, `# Recommendation Scenario Intent Guard 32.6.17

## Problem

Für jeden Futterautomaten-Vergleich wurden bislang dieselben Default-Szenarien
erzeugt:

- Preis-Leistung
- App und smarte Funktionen
- Kamera und Kontrolle

Das ist bei Spezialvergleichen wie "mit Akku", "ohne WLAN", "Nassfutter",
"Mehrtierhaushalt", "Seniorenkatzen" oder "unter 100 Euro" nicht sauber.

## Neue Regel

Default-Szenarien werden nur noch für breite Allround-Vergleiche erzeugt:

- beste-futterautomaten-fuer-katzen
- beste-futterautomaten-fuer-hunde
- beste-futterautomaten

Alle anderen Futterautomaten-Vergleiche erhalten automatische Szenario-Sieger
nur dann, wenn automaticRecommendations.scenarios explizit gepflegt ist.

## Unverändert

- Redaktioneller winnerSlug bleibt maßgeblich.
- Automatische Membership bleibt unverändert.
- Produkte werden nicht entfernt.
- Feeder-Gesamtscore bleibt als Fallback verfügbar.
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Feeder-Default-Szenarien auf Allround-Vergleiche begrenzt.`);
console.log(`[${PATCH}] Spezialvergleiche benötigen explizite Szenarien.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);
