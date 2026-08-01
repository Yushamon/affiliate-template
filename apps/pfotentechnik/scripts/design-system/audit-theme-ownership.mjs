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

const inspected = [
  path.join(app, "src/styles/foundation/tokens.css"),
  path.join(root, "packages/affiliate-core/src/styles/theme.css")
];

const forbiddenOwnedTokens = [
  "--pt-color-text",
  "--pt-color-text-muted",
  "--pt-color-border",
  "--pt-color-border-strong",
  "--pt-color-surface",
  "--pt-color-surface-soft",
  "--pt-color-surface-raised",
  "--pt-color-page",
  "--pt-color-brand-700",
  "--pt-color-brand-600",
  "--pt-color-brand-500",
  "--pt-color-accent-text",
  "--pt-color-action-bg",
  "--pt-color-action-bg-hover",
  "--pt-color-action-text"
];

const errors = [];

for (const target of inspected) {
  const source = fs.readFileSync(target, "utf8");

  for (const token of forbiddenOwnedTokens) {
    const definition = new RegExp(
      `${token.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&")}\\s*:`
    );

    if (definition.test(source)) {
      errors.push(
        `${path.relative(root, target)} definiert den autoritativen Token ${token} erneut.`
      );
    }
  }

  const rawColors = source.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) ?? [];
  if (rawColors.length > 0) {
    errors.push(
      `${path.relative(root, target)} enthält feste Farbwerte: ${[
        ...new Set(rawColors)
      ].join(", ")}`
    );
  }
}

const tokenSource = fs.readFileSync(authoritative, "utf8");
for (const token of forbiddenOwnedTokens) {
  if (!new RegExp(
    `${token.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&")}\\s*:`
  ).test(tokenSource)) {
    errors.push(`Autoritative Definition fehlt: ${token}`);
  }
}

if (errors.length > 0) {
  console.error("Theme-Ownership-Audit fehlgeschlagen:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Theme-Ownership-Audit erfolgreich.");
console.log("Autoritative Palette: apps/pfotentechnik/src/styles/pfotentechnik-design-tokens.css");
console.log("Geprüfte Alias-Schichten: 2");
