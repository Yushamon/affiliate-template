#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(root,"apps/pfotentechnik/src/styles/pfotentechnik-design-system.css");
const source = path.join(packageRoot,"ui-fix-3.6.2.css");
const backup = `${target}.before-ui-fix-3.6.2`;
const startMarker = "/* === PfotenTechnik UI Fix 3.6.2 === */";
const endMarker = "/* === End PfotenTechnik UI Fix 3.6.2 === */";

if (!fs.existsSync(target)) {
  console.error("Konsolidierte Design-System-CSS nicht gefunden.");
  process.exit(1);
}
if (!fs.existsSync(source)) {
  console.error("ui-fix-3.6.2.css fehlt.");
  process.exit(1);
}
if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);

let content = fs.readFileSync(target,"utf8");
const patch = fs.readFileSync(source,"utf8").trim();
const start = content.indexOf(startMarker);
const end = content.indexOf(endMarker);

if (start >= 0 && end >= start) {
  content = content.slice(0,start).trimEnd() + "\n\n" + patch + "\n";
} else {
  content = content.trimEnd() + "\n\n" + patch + "\n";
}

fs.writeFileSync(target,content,"utf8");
const verification = fs.readFileSync(target,"utf8");
for (const required of [startMarker,".home41-decision__card","white-space:normal !important",".product-hero-v4__mobile-carousel",endMarker]) {
  if (!verification.includes(required)) {
    fs.copyFileSync(backup,target);
    console.error("Verifikation fehlgeschlagen.");
    process.exit(1);
  }
}
console.log("PfotenTechnik UI Fix 3.6.2 installiert.");
console.log("Jetzt: npm run build:pfotentechnik");
