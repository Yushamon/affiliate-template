#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const layoutPath = path.join(
  root,
  "packages/affiliate-core/src/styles/layout.css"
);
const homePath = path.join(
  root,
  "packages/affiliate-core/src/components/home/home.css"
);
const pagePath = path.join(
  root,
  "packages/affiliate-core/src/components/home/HomePage.astro"
);

const layout = fs.readFileSync(layoutPath, "utf8");
const home = fs.readFileSync(homePath, "utf8");
const page = fs.readFileSync(pagePath, "utf8");
const errors = [];

if (/\.home3(?:-|\b)/.test(layout)) {
  errors.push("layout.css enthält weiterhin home3-spezifische Selektoren.");
}

if (/\.container--home/.test(layout)) {
  errors.push("layout.css enthält weiterhin den Homepage-Container.");
}

if (/@media\s*\([^)]*\)\s*\{\s*\}/.test(layout)) {
  errors.push("layout.css enthält einen leeren Media-Block.");
}

const required = [
  ["Homepage-Container", /\.container--home\s*\{[\s\S]*?padding-top:\s*0/],
  ["Hero-Abstand", /\.container--home \.home3-hero\s*\{[\s\S]*?margin-top:\s*0/],
  ["Hero-Innenabstand", /\.container--home \.home3-hero__content\s*\{[\s\S]*?padding-bottom:/],
  ["Kanonischer Import", /import "\.\/home\.css";/]
];

for (const [label, pattern] of required.slice(0, 3)) {
  if (!pattern.test(home)) errors.push(`home.css fehlt: ${label}.`);
}

if (!required[3][1].test(page)) {
  errors.push("HomePage.astro importiert home.css nicht.");
}

if (errors.length > 0) {
  console.error("Home-Layout-Ownership-Audit fehlgeschlagen:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Home-Layout-Ownership-Audit erfolgreich.");
console.log("Generisches Layout: packages/affiliate-core/src/styles/layout.css");
console.log("Homepage-Layout: packages/affiliate-core/src/components/home/home.css");
