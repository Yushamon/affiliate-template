#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(
  root,
  "packages/affiliate-core/src/renderer/PremiumRenderer.astro"
);
const backup = `${target}.before-ui-polish-4.1.1`;

if (!fs.existsSync(target)) {
  console.error("PremiumRenderer.astro nicht gefunden.");
  console.error("Installer im Root von affiliate-template ausführen.");
  process.exit(1);
}

if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
}

let content = fs.readFileSync(target, "utf8");

const oldDestructure = `const {
  blocks = [],
  products = []
} = Astro.props;`;

const newDestructure = `const {
  blocks = [],
  products = [],
  project
} = Astro.props;`;

if (!content.includes(newDestructure)) {
  if (!content.includes(oldDestructure)) {
    console.error("Erwartetes Astro.props-Destructuring wurde nicht gefunden.");
    process.exit(1);
  }

  content = content.replace(oldDestructure, newDestructure);
}

fs.writeFileSync(target, content, "utf8");

const verification = fs.readFileSync(target, "utf8");

const required = [
  "products = [],",
  "project",
  'premium-v3--pfotentechnik'
];

for (const item of required) {
  if (!verification.includes(item)) {
    fs.copyFileSync(backup, target);
    console.error("Verifikation fehlgeschlagen. Änderung wurde zurückgerollt.");
    console.error("Fehlend:", item);
    process.exit(1);
  }
}

console.log("UI Polish 4.1.1 Hotfix installiert.");
console.log("PremiumRenderer liest `project` jetzt korrekt aus Astro.props.");
console.log("");
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");
