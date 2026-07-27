#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const layoutFile = path.join(appRoot, "src", "layouts", "ProjectLayout.astro");
const cssFile = path.join(appRoot, "src", "styles", "pfotentechnik-responsive-resilience.css");

const errors = [];

if (!fs.existsSync(cssFile)) errors.push("Responsive-Resilience-Datei fehlt.");
if (!fs.existsSync(layoutFile)) errors.push("ProjectLayout fehlt.");

if (fs.existsSync(layoutFile)) {
  const layout = fs.readFileSync(layoutFile, "utf8");
  const primitiveIndex = layout.indexOf("pfotentechnik-primitives.css");
  const resilienceIndex = layout.indexOf("pfotentechnik-responsive-resilience.css");

  if (resilienceIndex < 0) errors.push("Responsive-Resilience-Import fehlt.");
  if (primitiveIndex >= 0 && resilienceIndex >= 0 && resilienceIndex < primitiveIndex) {
    errors.push("Responsive Resilience wird vor den Primitives importiert.");
  }
  if ((layout.match(/pfotentechnik-responsive-resilience\.css/g) || []).length !== 1) {
    errors.push("Responsive Resilience wird nicht exakt einmal importiert.");
  }
}

if (fs.existsSync(cssFile)) {
  const css = fs.readFileSync(cssFile, "utf8");
  for (const requirement of [
    "box-sizing: border-box",
    "min-width: 0",
    "overflow-wrap: break-word",
    ".pt-table-scroll",
    ".pt-safe-grid",
    ".pt-safe-split",
  ]) {
    if (!css.includes(requirement)) {
      errors.push("Resilience-Regel fehlt: " + requirement);
    }
  }

  if (/!important\b/.test(css)) {
    errors.push("Responsive Resilience darf kein !important enthalten.");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Responsive-Resilience-Audit erfolgreich.");
