#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-gps-evidence-32.6.13";

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

const oldGps = `    if (/katze/.test(suitability)) addValue(values, "tier", "katze");
    if (/hund/.test(suitability)) addValue(values, "tier", "hund");
    addValue(
      values,
      "abo",
      /nicht erforderlich/.test(subscription) ? "ohne-abo" : "mit-abo"
    );
    addValue(
      values,
      "system",
      /vhf/.test(transmission) ? "vhf" : "mobilfunk"
    );
    if (Number.isFinite(weight)) {
      addValue(values, "gewicht", weight <= 35 ? "bis-35-g" : "ueber-35-g");
    }`;

const newGps = `    if (/katze/.test(suitability)) addValue(values, "tier", "katze");
    if (/hund/.test(suitability)) addValue(values, "tier", "hund");

    /*
     * GPS Evidence Guard 32.6.13
     *
     * Fehlende oder unklare Angaben dürfen nicht als positives Gegenstück
     * interpretiert werden. Nur explizit belegte Aussagen erzeugen
     * Filterwerte.
     */
    if (
      /nicht erforderlich|kein abo|ohne abo|abo-frei|abofrei/.test(subscription)
    ) {
      addValue(values, "abo", "ohne-abo");
    } else if (
      /abo erforderlich|abonnement erforderlich|subscription required|monatlich|jahresabo|laufende gebuehr|laufende gebühr/.test(subscription)
    ) {
      addValue(values, "abo", "mit-abo");
    }

    if (/vhf/.test(transmission)) {
      addValue(values, "system", "vhf");
    } else if (
      /mobilfunk|lte|4g|5g|sim|cellular/.test(transmission)
    ) {
      addValue(values, "system", "mobilfunk");
    }

    if (Number.isFinite(weight)) {
      addValue(values, "gewicht", weight <= 35 ? "bis-35-g" : "ueber-35-g");
    }`;

if (!raw.includes(oldGps)) {
  throw new Error(
    `[${PATCH}] Erwarteter GPS-Fallbackblock nicht gefunden. ` +
    `Bitte aktuellen buildComparisonViewModel.ts-Stand prüfen.`
  );
}

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

raw = raw.replace(oldGps, newGps);
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
  "comparison-gps-evidence-32.6.13.md"
);

fs.writeFileSync(reportPath, `# Comparison GPS Evidence Guard 32.6.13

## Problem

Der GPS-Fallback hat bislang fehlende oder unklare Angaben automatisch
klassifiziert:

- kein explizites "nicht erforderlich" beim Abo => "mit-abo"
- kein VHF-Hinweis => "mobilfunk"

Das erzeugt falsche Filterwerte, sobald Specs unvollständig sind.

## Neue Regel

Abo:
- "ohne-abo" nur bei expliziter Aussage wie "nicht erforderlich", "kein Abo"
  oder "ohne Abo"
- "mit-abo" nur bei explizitem Hinweis auf erforderliches Abo oder laufende
  Gebühren
- sonst kein Fallback-Filterwert

Übertragung:
- "vhf" nur bei explizitem VHF-Hinweis
- "mobilfunk" nur bei explizitem Mobilfunk/LTE/4G/5G/SIM-Hinweis
- sonst kein Fallback-Filterwert

Strukturierte gps-Felder bleiben weiterhin autoritativ.
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] GPS-Abo und Übertragung nur noch evidenzbasiert inferiert.`);
console.log(`[${PATCH}] Strukturierte gps-Daten bleiben autoritativ.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);
