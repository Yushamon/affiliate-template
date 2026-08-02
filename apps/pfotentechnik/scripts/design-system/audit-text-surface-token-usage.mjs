#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const roots = [
  path.join(app, "src"),
  path.join(root, "packages/affiliate-core/src")
];

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return /\.(css|astro)$/.test(entry.name) ? [target] : [];
  });

const files = roots.flatMap(walk);
const foregroundProperties =
  "(?:color|-webkit-text-fill-color|text-decoration-color|caret-color|fill|stroke)";
const surfaceTokens =
  "(?:--pt-color-page|--pt-color-surface(?:-soft|-raised)?|--pt-theme-canvas|--pt-theme-surface(?:-2|-3)?)";

const misuse = new RegExp(
  `${foregroundProperties}\\s*:\\s*var\\(\\s*${surfaceTokens}\\s*\\)`,
  "g"
);

const errors = [];

for (const target of files) {
  const source = fs.readFileSync(target, "utf8");
  const matches = source.match(misuse) ?? [];

  for (const match of matches) {
    errors.push(`${path.relative(root, target)}: ${match}`);
  }
}

if (errors.length > 0) {
  console.error("Text-Surface-Token-Audit fehlgeschlagen:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Text-Surface-Token-Audit erfolgreich.");
console.log(`Öffentliche Quelldateien geprüft: ${files.length}`);
