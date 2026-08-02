#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const footerPath = path.join(
  root,
  "packages/affiliate-core/src/components/Footer.astro"
);
const sharedPath = path.join(
  root,
  "packages/affiliate-core/src/styles/header-footer.css"
);
const globalPath = path.join(
  root,
  "packages/affiliate-core/src/styles/global.css"
);

const footer = fs.readFileSync(footerPath, "utf8");
const globalCss = fs.readFileSync(globalPath, "utf8");
const errors = [];

if (fs.existsSync(sharedPath)) {
  errors.push("header-footer.css existiert weiterhin.");
}

if (/header-footer\.css/.test(globalCss)) {
  errors.push("global.css importiert weiterhin header-footer.css.");
}

const contracts = [
  ["Footer-Stilblock", /<style is:global>[\s\S]*?\.footer-v2\s*\{/],
  ["Footer-Grid", /\.footer-main-v2\s*\{[\s\S]*?grid-template-columns:/],
  ["Footer-Unterzeile", /\.footer-bottom-v2\s*\{/],
  ["Mobile Footer", /@media\s*\(max-width:\s*520px\)[\s\S]*?\.footer-main-v2/],
  ["Semantischer Vordergrund", /var\(--pt-color-on-brand-surface/]
];

for (const [label, pattern] of contracts) {
  if (!pattern.test(footer)) errors.push(`Footer.astro fehlt: ${label}.`);
}

if (/\.site-header-v2|\.main-nav-v2|\.nav-toggle-button/.test(footer)) {
  errors.push("Footer.astro enthält Header-Regeln.");
}

if (errors.length > 0) {
  console.error("Footer-Style-Ownership-Audit fehlgeschlagen:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Footer-Style-Ownership-Audit erfolgreich.");
console.log("Footer-Eigentümer: packages/affiliate-core/src/components/Footer.astro");
console.log("header-footer.css wurde entfernt.");
