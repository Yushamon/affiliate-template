#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const headerPath = path.join(
  root,
  "packages/affiliate-core/src/components/Header.astro"
);
const sharedPath = path.join(
  root,
  "packages/affiliate-core/src/styles/header-footer.css"
);

const header = fs.readFileSync(headerPath, "utf8");
const shared = fs.readFileSync(sharedPath, "utf8");
const errors = [];

const forbiddenSharedSelectors = [
  ".site-header-v2",
  ".header-container-v2",
  ".main-nav-v2",
  ".nav-toggle-button",
  ".logo-v2"
];

for (const selector of forbiddenSharedSelectors) {
  const escaped = selector.replace(/[-/\^$*+?.()|[]{}]/g, "\$&");
  if (new RegExp(`(^|[\\s}])${escaped}(?=[\\s.{:#[])`, "m").test(shared)) {
    errors.push(
      `header-footer.css besitzt weiterhin den Header-Selektor ${selector}.`
    );
  }
}

const requiredHeaderContracts = [
  [
    "eigener Container",
    /\.site-header-v2 \.header-container-v2\s*\{[\s\S]*?padding-inline:/
  ],
  [
    "Desktop-Burger verborgen",
    /@media\s*\(min-width:\s*48rem\)[\s\S]*?\.site-header-v2 \.nav-toggle-button\s*\{[\s\S]*?display:\s*none/
  ],
  [
    "Mobile-Burger sichtbar",
    /@media\s*\(max-width:\s*47\.99rem\)[\s\S]*?\.site-header-v2 \.nav-toggle-button\s*\{[\s\S]*?display:\s*grid/
  ],
  [
    "mobiles Außenpadding",
    /@media\s*\(max-width:\s*47\.99rem\)[\s\S]*?padding-inline:\s*1rem/
  ]
];

for (const [label, pattern] of requiredHeaderContracts) {
  if (!pattern.test(header)) errors.push(`Header.astro fehlt: ${label}.`);
}

if (!/\.footer-v2\s*\{/.test(shared)) {
  errors.push("header-footer.css enthält keinen Footer mehr.");
}

if (errors.length > 0) {
  console.error("Header-Style-Ownership-Audit fehlgeschlagen:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Header-Style-Ownership-Audit erfolgreich.");
console.log("Header-Eigentümer: packages/affiliate-core/src/components/Header.astro");
console.log("Shared Stylesheet enthält nur Footer-Regeln.");
