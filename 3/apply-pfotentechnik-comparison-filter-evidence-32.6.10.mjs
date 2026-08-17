#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-filter-evidence-32.6.10";

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

const oldAccess = `  if (/mikrochip|chip-erkennung|chipzugang/.test(evidence)) {
    addValue(values, "zugang", "mikrochip");
  } else {
    addValue(values, "zugang", "freier-zugang");
  }`;

const newAccess = `  if (/mikrochip|chip-erkennung|chipzugang/.test(evidence)) {
    addValue(values, "zugang", "mikrochip");
  } else if (
    /freier zugang|offener zugang|ohne mikrochip|keine zugangskontrolle|ohne zugangskontrolle/.test(evidence)
  ) {
    addValue(values, "zugang", "freier-zugang");
  }`;

const oldPower = `  if (/notstrom|backup|batteriebetrieb|batteriebackup|doppelte stromversorgung/.test(evidence)) {
    addValue(values, "strombackup", "mit-backup");
  } else if (/netzteil|netzbetrieb|stromanschluss/.test(evidence)) {
    addValue(values, "strombackup", "ohne-backup");
  }`;

const newPower = `  if (/notstrom|backup|batteriebetrieb|batteriebackup|doppelte stromversorgung/.test(evidence)) {
    addValue(values, "strombackup", "mit-backup");
  } else if (
    /nur netzbetrieb|ausschliesslich netzbetrieb|ausschließlich netzbetrieb|kein batterie-backup|kein batteriebackup|ohne batterie-backup|ohne batteriebackup|kein notstrom|ohne notstrom/.test(evidence)
  ) {
    addValue(values, "strombackup", "ohne-backup");
  }`;

if (!raw.includes(oldAccess)) {
  throw new Error(`[${PATCH}] Zugang-Fallbackblock nicht gefunden.`);
}
if (!raw.includes(oldPower)) {
  throw new Error(`[${PATCH}] Strombackup-Fallbackblock nicht gefunden.`);
}

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

raw = raw.replace(oldAccess, newAccess).replace(oldPower, newPower);

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
  "comparison-filter-evidence-32.6.10.md"
);

fs.writeFileSync(reportPath, `# Comparison Filter Evidence 32.6.10

## Änderung

Fallback-Filter dürfen negative Eigenschaften nicht mehr aus bloßer Abwesenheit
eines Merkmals ableiten.

Vorher:

- kein Mikrochip-Hinweis => automatisch "freier-zugang"
- Netzteil/Netzbetrieb => automatisch "ohne-backup"

Jetzt:

- "freier-zugang" nur bei explizitem Hinweis auf offenen/freien Zugang oder
  fehlende Zugangskontrolle
- "ohne-backup" nur bei explizitem Hinweis auf reinen Netzbetrieb bzw.
  fehlenden Notstrom/Batterie-Backup

## Priorität

Strukturierte comparisonFilters bleiben autoritativ.
Fallback-Inferenz ergänzt nur, wenn Textbelege tatsächlich vorhanden sind.

## Ziel

Keine Filteroption soll aus einer unbelegten Negativannahme entstehen.
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Unbelegte Negativ-Inferenz entfernt.`);
console.log(`[${PATCH}] Strukturierte comparisonFilters bleiben autoritativ.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);
