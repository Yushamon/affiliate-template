#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const layoutFile = path.join(
  appRoot,
  "src",
  "layouts",
  "ProjectLayout.astro"
);
const cssFile = path.join(
  appRoot,
  "src",
  "styles",
  "pfotentechnik-visual-density.css"
);

const errors = [];

function isDensityImport(line) {
  const trimmed = line.trim();

  return (
    trimmed.startsWith("import ") &&
    trimmed.includes("pfotentechnik-visual-density.css")
  );
}

function isCssImport(line, filename) {
  const trimmed = line.trim();

  return (
    trimmed.startsWith("import ") &&
    trimmed.includes(filename)
  );
}

if (!fs.existsSync(layoutFile)) {
  errors.push("ProjectLayout fehlt.");
}

if (!fs.existsSync(cssFile)) {
  errors.push("Visual-Density-Datei fehlt.");
}

if (fs.existsSync(layoutFile)) {
  const layout = fs.readFileSync(layoutFile, "utf8");
  const lines = layout.split(/\r?\n/);
  const densityImports = lines.filter(isDensityImport);

  if (densityImports.length !== 1) {
    errors.push(
      "Visual Density muss exakt einmal importiert werden. Gefunden: " +
        densityImports.length
    );
  }

  const densityIndex = lines.findIndex(isDensityImport);
  const anchorIndexes = [
    "pfotentechnik-responsive-resilience.css",
    "pfotentechnik-ui-primitives.css",
    "pfotentechnik-primitives.css",
    "pfotentechnik-ui-system.css",
  ]
    .map((filename) =>
      lines.findIndex((line) => isCssImport(line, filename))
    )
    .filter((index) => index >= 0);

  if (
    densityIndex >= 0 &&
    anchorIndexes.length > 0 &&
    densityIndex < Math.min(...anchorIndexes)
  ) {
    errors.push(
      "Visual Density wird vor der grundlegenden UI-Schicht importiert."
    );
  }
}

if (fs.existsSync(cssFile)) {
  const css = fs.readFileSync(cssFile, "utf8");

  const requiredFragments = [
    "--pt-section-gap",
    "--pt-content-gap",
    "--pt-card-padding",
    ".pt-page-flow",
    ".pt-section-flow",
    ".pt-card-grid",
    ".pt-actions",
  ];

  for (const fragment of requiredFragments) {
    if (!css.includes(fragment)) {
      errors.push("Density-Baustein fehlt: " + fragment);
    }
  }

  if (css.includes("!important")) {
    errors.push(
      "Visual Density darf kein !important enthalten."
    );
  }

  if (css.includes(":root")) {
    errors.push(
      "Visual Density darf keine :root-Blöcke enthalten."
    );
  }

  const hexColorPattern = /#[0-9a-fA-F]{3,8}\b/;
  if (hexColorPattern.test(css)) {
    errors.push(
      "Visual Density enthält harte Hex-Farben."
    );
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Visual-Density-Audit erfolgreich.");
