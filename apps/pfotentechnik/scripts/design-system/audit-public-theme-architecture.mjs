#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const authoritative = path.join(app, "src/styles/pfotentechnik-design-tokens.css");
const aliasOwners = new Set([
  path.join(app, "src/styles/foundation/tokens.css"),
  path.join(root, "packages/affiliate-core/src/styles/theme.css")
]);

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

const sources = roots.flatMap(walk);
const errors = [];

const ownedColors = [
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

const legacyTheme = [
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

const escape = (value) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

for (const target of sources) {
  const source = fs.readFileSync(target, "utf8");

  for (const token of ownedColors) {
    if (
      target !== authoritative &&
      new RegExp(`${escape(token)}\\s*:`).test(source)
    ) {
      errors.push(
        `${path.relative(root, target)} definiert den autoritativen Token ${token} erneut.`
      );
    }
  }

  for (const token of legacyTheme) {
    if (
      !aliasOwners.has(target) &&
      new RegExp(`${escape(token)}\\s*:`).test(source)
    ) {
      errors.push(
        `${path.relative(root, target)} definiert den Legacy-Theme-Token ${token} außerhalb der Alias-Schicht.`
      );
    }
  }

  if (
    target !== authoritative &&
    /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)[\s\S]*?--pt-(?:theme|color)-(?:text|surface|page|canvas)\s*:/.test(source)
  ) {
    errors.push(
      `${path.relative(root, target)} enthält eine konkurrierende Dark-Mode-Palette.`
    );
  }
}

const tokenSource = fs.readFileSync(authoritative, "utf8");
const darkBlocks =
  tokenSource.match(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/g) ?? [];

if (darkBlocks.length !== 1) {
  errors.push(
    `Die autoritative Token-Datei besitzt ${darkBlocks.length} statt genau eines System-Dark-Mode-Blocks.`
  );
}

const contracts = [
  {
    file: path.join(root, "packages/affiliate-core/src/styles/header-footer.css"),
    checks: [
      ["Header-Marke", /\.site-header-v2 \.brand-name[\s\S]*?var\(--pt-color-text\)/],
      ["Footer-Marke", /\.footer-v2[\s\S]*?var\(--pt-color-on-brand-surface/]
    ]
  },
  {
    file: path.join(root, "packages/affiliate-core/src/components/home/home.css"),
    checks: [
      ["Homepage-Titel", /--home3-text:\s*var\(--pt-color-text\)/],
      ["Homepage-Tile-Titel", /\.home3-card-content h3[\s\S]*?var\(--home3-text\)/]
    ]
  },
  {
    file: path.join(app, "src/pages/vergleiche/index.astro"),
    checks: [
      ["Vergleichstitel", /--comparison-text:\s*var\(--pt-color-text\)/],
      ["Vergleichskarten", /\.comparison-card h3[\s\S]*?var\(--comparison-text\)/]
    ]
  },
  {
    file: path.join(app, "src/pages/hersteller/index.astro"),
    checks: [
      ["Hersteller-Score", /var\(--pt-color-accent-text\) !important/]
    ]
  }
];

for (const contract of contracts) {
  const source = fs.readFileSync(contract.file, "utf8");
  for (const [label, pattern] of contract.checks) {
    if (!pattern.test(source)) {
      errors.push(`${label} verwendet nicht den erwarteten Theme-Vertrag.`);
    }
  }
}

if (errors.length > 0) {
  console.error("Public-Theme-Architecture-Audit fehlgeschlagen:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Public-Theme-Architecture-Audit erfolgreich.");
console.log(`Öffentliche Quelldateien geprüft: ${sources.length}`);
console.log("Autoritative Palette: pfotentechnik-design-tokens.css");
console.log("Alias-Schichten: foundation/tokens.css, affiliate-core/theme.css");
