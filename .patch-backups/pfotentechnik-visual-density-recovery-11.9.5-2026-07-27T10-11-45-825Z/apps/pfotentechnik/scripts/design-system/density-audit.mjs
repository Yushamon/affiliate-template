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

if (!fs.existsSync(layoutFile)) {
  errors.push("ProjectLayout fehlt.");
}

if (!fs.existsSync(cssFile)) {
  errors.push("Visual-Density-Datei fehlt.");
}

if (fs.existsSync(layoutFile)) {
  const layout = fs.readFileSync(layoutFile, "utf8");
  const importMatches =
    layout.match(
      /^\\s*import\\s+["'][^"']*pfotentechnik-visual-density\\.css["'];?\\s*$/gm
    ) || [];

  if (importMatches.length !== 1) {
    errors.push(
      "Visual Density muss exakt einmal importiert werden."
    );
  }

  const densityIndex = layout.search(
    /^\\s*import\\s+["'][^"']*pfotentechnik-visual-density\\.css["'];?\\s*$/m
  );

  const anchorCandidates = [
    layout.indexOf("pfotentechnik-responsive-resilience.css"),
    layout.indexOf("pfotentechnik-ui-primitives.css"),
    layout.indexOf("pfotentechnik-primitives.css"),
    layout.indexOf("pfotentechnik-ui-system.css"),
  ].filter((index) => index >= 0);

  if (
    densityIndex >= 0 &&
    anchorCandidates.length > 0 &&
    densityIndex < Math.min(...anchorCandidates)
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

  if (/!important\\b/.test(css)) {
    errors.push(
      "Visual Density darf kein !important enthalten."
    );
  }

  if (/:root\\s*\\{/.test(css)) {
    errors.push(
      "Visual Density darf keine :root-Blöcke enthalten."
    );
  }

  if (/#[0-9a-fA-F]{3,8}\\b/.test(css)) {
    errors.push(
      "Visual Density enthält harte Hex-Farben."
    );
  }
}

if (errors.length > 0) {
  console.error(errors.join("\\n"));
  process.exit(1);
}

console.log("Visual-Density-Audit erfolgreich.");
