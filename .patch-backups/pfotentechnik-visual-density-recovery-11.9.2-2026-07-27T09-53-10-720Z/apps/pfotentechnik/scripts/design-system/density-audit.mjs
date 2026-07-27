#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const layoutFile = path.join(appRoot, "src", "layouts", "ProjectLayout.astro");
const cssFile = path.join(appRoot, "src", "styles", "pfotentechnik-visual-density.css");

const errors = [];

if (!fs.existsSync(layoutFile)) errors.push("ProjectLayout fehlt.");
if (!fs.existsSync(cssFile)) errors.push("Visual-Density-Datei fehlt.");

if (fs.existsSync(layoutFile)) {
  const layout = fs.readFileSync(layoutFile, "utf8");
  const matches = layout.match(/pfotentechnik-visual-density\.css/g) || [];
  if (matches.length !== 1) {
    errors.push("Visual Density muss exakt einmal importiert werden.");
  }

  const densityIndex = layout.indexOf("pfotentechnik-visual-density.css");
  const primitiveIndex = layout.indexOf("pfotentechnik-primitives.css");
  if (primitiveIndex >= 0 && densityIndex >= 0 && densityIndex < primitiveIndex) {
    errors.push("Visual Density wird vor den Primitives importiert.");
  }
}

if (fs.existsSync(cssFile)) {
  const css = fs.readFileSync(cssFile, "utf8");

  for (const token of [
    "--pt-section-gap",
    "--pt-content-gap",
    "--pt-card-padding",
    ".pt-page-flow",
    ".pt-section-flow",
    ".pt-card-grid",
    ".pt-actions",
  ]) {
    if (!css.includes(token)) errors.push("Density-Baustein fehlt: " + token);
  }

  if (/!important\b/.test(css)) {
    errors.push("Visual Density darf kein !important enthalten.");
  }

  const rawColors = css.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  if (rawColors.length) {
    errors.push("Visual Density enthält harte Hex-Farben.");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Visual-Density-Audit erfolgreich.");
