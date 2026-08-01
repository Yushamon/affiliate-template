#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const authoritative = path.join(
  app,
  "src/styles/pfotentechnik-design-tokens.css"
);
const aliasOwner = path.join(app, "src/styles/foundation/tokens.css");

const publicRoots = [
  path.join(app, "src"),
  path.join(root, "packages/affiliate-core/src")
];

const extensions = new Set([".css", ".astro"]);

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return extensions.has(path.extname(entry.name)) ? [target] : [];
  });

const files = publicRoots.flatMap(walk);
const errors = [];

const authoritativeColorTokens = [
  "--pt-color-text",
  "--pt-color-text-muted",
  "--pt-color-border",
  "--pt-color-border-strong",
  "--pt-color-surface",
  "--pt-color-surface-soft",
  "--pt-color-surface-raised",
  "--pt-color-page",
  "--pt-color-accent-text",
  "--pt-color-action-bg",
  "--pt-color-action-bg-hover",
  "--pt-color-action-text"
];

const legacyThemeTokens = [
  "--pt-theme-canvas",
  "--pt-theme-canvas-elevated",
  "--pt-theme-surface",
  "--pt-theme-surface-2",
  "--pt-theme-surface-3",
  "--pt-theme-overlay",
  "--pt-theme-text",
  "--pt-theme-text-soft",
  "--pt-theme-text-muted",
  "--pt-theme-text-inverse",
  "--pt-theme-border",
  "--pt-theme-border-strong",
  "--pt-theme-divider",
  "--pt-theme-accent",
  "--pt-theme-accent-hover",
  "--pt-theme-accent-soft",
  "--pt-theme-accent-text"
];

const escape = (value) => value.replace(/[-/\^$*+?.()|[]{}]/g, "\$&");

for (const target of files) {
  const source = fs.readFileSync(target, "utf8");

  for (const token of authoritativeColorTokens) {
    const definition = new RegExp(`${escape(token)}\\s*:`, "g");
    if (target !== authoritative && definition.test(source)) {
      errors.push(
        `${path.relative(root, target)} definiert ${token} außerhalb der autoritativen Token-Datei.`
      );
    }
  }

  for (const token of legacyThemeTokens) {
    const definition = new RegExp(`${escape(token)}\\s*:`, "g");
    if (target !== aliasOwner && definition.test(source)) {
      errors.push(
        `${path.relative(root, target)} besitzt weiterhin die konkurrierende Theme-Definition ${token}.`
      );
    }
  }

  const darkMediaHeaders =
    source.match(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/g) ?? [];

  if (
    target !== authoritative &&
    darkMediaHeaders.length > 0 &&
    /--pt-theme-(?:canvas|text|surface)(?:-[a-z0-9-]+)?\s*:/.test(source)
  ) {
    errors.push(
      `${path.relative(root, target)} enthält eine zweite Dark-Mode-Palette.`
    );
  }
}

const tokenSource = fs.readFileSync(authoritative, "utf8");

if (
  (tokenSource.match(/@media\s*\(prefers-color-scheme:\s*dark\)/g) ?? []).length !== 1
) {
  errors.push("Die autoritative Token-Datei muss genau einen System-Dark-Mode-Block besitzen.");
}

for (const token of authoritativeColorTokens) {
  if (!new RegExp(`${escape(token)}\\s*:`).test(tokenSource)) {
    errors.push(`Autoritative Definition fehlt: ${token}`);
  }
}

if (errors.length > 0) {
  console.error("Theme-Ownership-Audit fehlgeschlagen:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Theme-Ownership-Audit erfolgreich.");
console.log("Palette: apps/pfotentechnik/src/styles/pfotentechnik-design-tokens.css");
console.log("Legacy-Aliase: apps/pfotentechnik/src/styles/foundation/tokens.css");
console.log(`Geprüfte öffentliche Quelldateien: ${files.length}`);
