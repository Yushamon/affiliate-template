#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-app-camera-evidence-32.6.14";

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

const oldApp = `  if (/ohne app|keine app|nicht per app/.test(evidence)) {
    addValue(values, "app", "ohne-app");
  } else if (/app|wlan|wi-fi|wifi/.test(evidence)) {
    addValue(values, "app", "mit-app");
  }`;

const newApp = `  if (
    /ohne app|keine app|nicht per app|app nicht verfügbar|app nicht verfuegbar|keine app-steuerung|ohne app-steuerung/.test(evidence)
  ) {
    addValue(values, "app", "ohne-app");
  } else if (
    /app-steuerung|appsteuerung|per app|über die app|ueber die app|mit app|app-gesteuert|app gesteuert|steuerung via app|steuerung über app|steuerung ueber app/.test(evidence)
  ) {
    addValue(values, "app", "mit-app");
  }`;

const oldCamera = `  if (/ohne kamera|keine kamera/.test(evidence)) {
    addValue(values, "kamera", "ohne-kamera");
  } else if (/kamera|video|ueberwachung|überwachung/.test(evidence)) {
    addValue(values, "kamera", "mit-kamera");
  }`;

const newCamera = `  if (
    /ohne kamera|keine kamera|kamera fehlt|keine kamerafunktion|ohne kamerafunktion/.test(evidence)
  ) {
    addValue(values, "kamera", "ohne-kamera");
  } else if (
    /mit kamera|integrierte kamera|eingebaute kamera|videokamera|kamera[: ]|2k-kamera|2k kamera|1080p-kamera|1080p kamera|4k-kamera|4k kamera/.test(evidence)
  ) {
    addValue(values, "kamera", "mit-kamera");
  }`;

if (!raw.includes(oldApp)) {
  throw new Error(`[${PATCH}] Erwarteter App-Fallbackblock nicht gefunden.`);
}
if (!raw.includes(oldCamera)) {
  throw new Error(`[${PATCH}] Erwarteter Kamera-Fallbackblock nicht gefunden.`);
}

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

raw = raw.replace(oldApp, newApp).replace(oldCamera, newCamera);
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
  "comparison-app-camera-evidence-32.6.14.md"
);

fs.writeFileSync(reportPath, `# Comparison App & Camera Evidence 32.6.14

## Problem

Die Freitext-Fallbacks waren zu breit:

- WLAN / Wi-Fi allein erzeugte "mit-app"
- "Video" oder "Überwachung" allein erzeugte "mit-kamera"

Das kann Produkte falsch klassifizieren, obwohl die jeweilige Hardware- oder
Steuerungsfunktion nicht ausdrücklich bestätigt ist.

## Neue Regel

App:
- "mit-app" nur bei expliziter App-Steuerung / Steuerung per App
- "ohne-app" nur bei expliziter Negativaussage
- WLAN allein reicht nicht mehr

Kamera:
- "mit-kamera" nur bei explizitem Kamera-Hinweis
- "ohne-kamera" nur bei expliziter Negativaussage
- "Video" oder "Überwachung" allein reicht nicht mehr

## Unverändert

- comparisonFilters.app / comparisonFilters.camera bleiben autoritativ
- keine Produkte werden entfernt
- Membership bleibt unverändert
- fehlende Evidenz erzeugt keinen erfundenen Gegenwert
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] WLAN allein erzeugt nicht mehr mit-app.`);
console.log(`[${PATCH}] Video/Überwachung allein erzeugt nicht mehr mit-kamera.`);
console.log(`[${PATCH}] Strukturierte comparisonFilters bleiben autoritativ.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);
