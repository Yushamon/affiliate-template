#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const auditDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(auditDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");

const tokenFile = path.join(appRoot, "src", "styles", "pfotentechnik-design-tokens.css");
const primitivesFile = path.join(appRoot, "src", "styles", "pfotentechnik-primitives.css");
const layoutFile = path.join(appRoot, "src", "layouts", "ProjectLayout.astro");

const errors = [];

for (const file of [tokenFile, primitivesFile, layoutFile]) {
  if (!fs.existsSync(file)) {
    errors.push("Datei fehlt: " + path.relative(repoRoot, file));
  }
}

if (fs.existsSync(layoutFile)) {
  const layout = fs.readFileSync(layoutFile, "utf8");
  const tokenIndex = layout.indexOf("pfotentechnik-design-tokens.css");
  const primitivesIndex = layout.indexOf("pfotentechnik-primitives.css");

  if (tokenIndex < 0) errors.push("Token-Import fehlt.");
  if (primitivesIndex < 0) errors.push("Primitives-Import fehlt.");
  if (tokenIndex >= 0 && primitivesIndex >= 0 && primitivesIndex < tokenIndex) {
    errors.push("Primitives werden vor den Tokens importiert.");
  }

  if ((layout.match(/pfotentechnik-primitives\.css/g) || []).length !== 1) {
    errors.push("Primitives-Datei wird nicht exakt einmal importiert.");
  }
}

if (fs.existsSync(tokenFile)) {
  const tokens = fs.readFileSync(tokenFile, "utf8");
  const required = [
    "--pt-font-sans",
    "--pt-font-size-base",
    "--pt-line-height-body",
    "--pt-content-wide",
    "--pt-page-gutter",
    "--pt-focus-ring",
  ];
  for (const token of required) {
    if (!tokens.includes(token + ":")) {
      errors.push("Token fehlt: " + token);
    }
  }
}

if (fs.existsSync(primitivesFile)) {
  const css = fs.readFileSync(primitivesFile, "utf8");
  const requiredSelectors = [
    ".pt-page-shell",
    ".pt-button-primary",
    ".pt-chip",
    ".pt-control",
    ".pt-surface",
  ];
  for (const selector of requiredSelectors) {
    if (!css.includes(selector)) {
      errors.push("Primitive fehlt: " + selector);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Design-Primitives-Audit erfolgreich.");
