#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(
  root,
  "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
);
const source = path.join(packageRoot, "dark-mode-3.6.1.css");
const backup = `${target}.before-dark-mode-3.6.1`;

const startMarker =
  "/* === PfotenTechnik Dark Mode 3.6.1 Corrective Layer === */";
const endMarker =
  "/* === End PfotenTechnik Dark Mode 3.6.1 Corrective Layer === */";

if (!fs.existsSync(target)) {
  console.error("Konsolidierte CSS-Datei nicht gefunden:");
  console.error(target);
  console.error(
    "Bitte zuerst Design System 3.6 Consolidated installieren oder den Installer im Repository-Root ausführen."
  );
  process.exit(1);
}

if (!fs.existsSync(source)) {
  console.error("dark-mode-3.6.1.css fehlt im Patch.");
  process.exit(1);
}

if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
}

let current = fs.readFileSync(target, "utf8");
const corrective = fs.readFileSync(source, "utf8").trim();

const start = current.indexOf(startMarker);
const end = current.indexOf(endMarker);

if (start >= 0 && end >= start) {
  current =
    current.slice(0, start).trimEnd() +
    "\n\n" +
    corrective +
    "\n";
} else {
  current = current.trimEnd() + "\n\n" + corrective + "\n";
}

fs.writeFileSync(target, current, "utf8");

const verification = fs.readFileSync(target, "utf8");
const checks = [
  startMarker,
  "--pt-theme-surface: #101f32 !important",
  ".home3-editorial-card",
  ".recommendation-card",
  ".product-review-v4",
  ".pt-trust-panel",
  ".alternative-recommendation-card",
  ".footer-brand-lockup .brand-mark"
];

const missing = checks.filter((value) => !verification.includes(value));

if (missing.length) {
  fs.copyFileSync(backup, target);
  console.error("Verifikation fehlgeschlagen. Änderung wurde zurückgesetzt.");
  console.error("Fehlend:", missing.join(", "));
  process.exit(1);
}

console.log("");
console.log("Dark Mode 3.6.1 erfolgreich installiert.");
console.log("Die korrigierende Schicht wurde ans Ende der konsolidierten CSS-Datei geschrieben.");
console.log(`Backup: ${path.relative(root, backup)}`);
console.log("");
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");
console.log("");
console.log("Optional prüfen:");
console.log(
  '  tail -n 30 apps/pfotentechnik/src/styles/pfotentechnik-design-system.css'
);
