#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-recommendation-family-guard-32.6.16";

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

const oldBlock = `  const family = resolveFamily(data.group, candidates);
  const audience = resolveAudience(data.slug, candidates);
  const definitions = buildScenarioDefinitions(family, audience, config?.scenarios);

  const overall = rankProducts(candidates, {
    key: "overall",
    label: "Gesamtempfehlung"
  }, family, audience);`;

const newBlock = `  const family = resolveFamily(data.group, candidates);

  /*
   * Recommendation Family Guard 32.6.16
   *
   * Automatische Sieger werden nur erzeugt, wenn für die Produktfamilie
   * tatsächlich eine fachlich definierte Scoring-Logik existiert.
   *
   * "generic" ist kein Bewertungsmodell. Haustierkameras,
   * automatische Katzentoiletten, Katzenklappen und andere bislang
   * nicht modellierte Familien behalten deshalb ihre redaktionelle
   * Empfehlung, statt über einen allgemeinen Produktscore künstlich
   * gerankt zu werden.
   */
  if (family === "generic") {
    return {
      enabled: false,
      winnerSlug: data.recommendation.winnerSlug,
      alternativeSlug: data.recommendation.alternativeSlug,
      title: data.recommendation.title,
      text: data.recommendation.text,
      scenarios: []
    };
  }

  const audience = resolveAudience(data.slug, candidates);
  const definitions = buildScenarioDefinitions(family, audience, config?.scenarios);

  const overall = rankProducts(candidates, {
    key: "overall",
    label: "Gesamtempfehlung"
  }, family, audience);`;

if (!raw.includes(oldBlock)) {
  throw new Error(
    `[${PATCH}] Erwarteter Family/Ranking-Block nicht gefunden. ` +
    `Der lokale Stand weicht vom geprüften recommendationEngine.ts ab.`
  );
}

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

raw = raw.replace(oldBlock, newBlock);
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
  "recommendation-family-guard-32.6.16.md"
);

fs.writeFileSync(reportPath, `# Recommendation Family Guard 32.6.16

## Befund

Die automatische Recommendation Engine besitzt derzeit eigene fachliche
Scoring-Logik für:

- Futterautomaten
- Trinkbrunnen
- GPS-Tracker

Andere Produktfamilien fallen auf "generic" zurück.

Der Generic-Pfad besitzt keine belastbare familienspezifische Bewertung.
Insbesondere automatische Katzentoiletten, Haustierkameras und Katzenklappen
würden überwiegend aus allgemeinem Produktscore, Tierart und einfachen
Preis-Szenarien gerankt.

## Änderung

Für family === "generic":

- kein automatischer Gesamtsieger
- keine automatischen Szenario-Sieger
- vorhandener redaktioneller winnerSlug bleibt maßgeblich
- vorhandener redaktioneller alternativeSlug bleibt maßgeblich
- vorhandener Empfehlungstext bleibt erhalten

## Unverändert

Automatische Recommendation bleibt aktiv für:

- feeder
- water-fountain
- gps-tracker

Neue Produktfamilien können später gezielt mit eigener Scoring-Logik ergänzt
werden, ohne die sichere redaktionelle Basis zu verändern.
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Generic-Automatismus deaktiviert.`);
console.log(`[${PATCH}] Redaktionelle Empfehlungen bleiben für nicht modellierte Familien maßgeblich.`);
console.log(`[${PATCH}] Feeder, Trinkbrunnen und GPS bleiben automatisch bewertbar.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);
