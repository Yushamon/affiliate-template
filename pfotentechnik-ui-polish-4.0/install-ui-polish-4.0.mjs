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
const source = path.join(packageRoot, "ui-polish-4.0.css");
const backup = `${target}.before-ui-polish-4.0`;

const startMarker = "/* === PfotenTechnik UI Polish 4.0 === */";
const endMarker = "/* === End PfotenTechnik UI Polish 4.0 === */";

if (!fs.existsSync(target)) {
  console.error("Konsolidierte Design-System-CSS nicht gefunden.");
  console.error("Installer im Root von affiliate-template ausführen.");
  process.exit(1);
}

if (!fs.existsSync(source)) {
  console.error("ui-polish-4.0.css fehlt im Paket.");
  process.exit(1);
}

if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
}

let content = fs.readFileSync(target, "utf8");
const patch = fs.readFileSync(source, "utf8").trim();

const start = content.indexOf(startMarker);
const end = content.indexOf(endMarker);

if (start >= 0 && end >= start) {
  content =
    content.slice(0, start).trimEnd() +
    "\n\n" +
    patch +
    "\n";
} else {
  content = content.trimEnd() + "\n\n" + patch + "\n";
}

fs.writeFileSync(target, content, "utf8");

const verification = fs.readFileSync(target, "utf8");
const required = [
  startMarker,
  "--pt-polish-radius-card",
  "--pt-polish-icon-size",
  ".pt-product-health",
  ".manufacturer-card",
  "prefers-reduced-motion",
  endMarker
];

for (const item of required) {
  if (!verification.includes(item)) {
    fs.copyFileSync(backup, target);
    console.error("Verifikation fehlgeschlagen. Patch wurde zurückgerollt.");
    console.error("Fehlend:", item);
    process.exit(1);
  }
}

console.log("PfotenTechnik UI Polish 4.0 installiert.");
console.log("Jetzt: npm run build:pfotentechnik");
