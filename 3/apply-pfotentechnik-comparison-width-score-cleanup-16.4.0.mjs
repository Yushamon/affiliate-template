#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "16.4.0";
const LABEL = `pfotentechnik-comparison-width-score-cleanup-${VERSION}`;
const rootArg = process.argv.find((value) => value.startsWith("--root="));
const root = resolve(rootArg ? rootArg.slice("--root=".length) : process.cwd());
const skipChecks = process.argv.includes("--skip-checks");

const GRID = "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro";
const CSS = "packages/affiliate-core/src/components/comparison/comparison-editorial-cover.css";
const backupRoot = join(root, ".patch-backups", `${LABEL}-${new Date().toISOString().replaceAll(":", "-")}`);

for (const path of [GRID, CSS]) {
  const target = join(backupRoot, path);
  await mkdir(dirname(target), { recursive: true });
  await cp(join(root, path), target);
}

let grid = await readFile(join(root, GRID), "utf8");
grid = grid.replace(
  /variant="ring-compact"\s+description="Redaktioneller Gesamtscore"/g,
  'variant="ring-compact"\n                label=""'
);
if (!grid.includes('label=""')) throw new Error("Score-Label konnte nicht entfernt werden.");
await writeFile(join(root, GRID), grid, "utf8");
console.log(`Geändert: ${GRID}`);

const block = `
/* PT_COMPARISON_WIDTH_SCORE_CLEANUP_16_4_0_START */
.comparison-shell[data-comparison-cover-version="16.1.0"],
.comparison-shell[data-comparison-cover-version="16.2.0"] {
  --comparison-content-width: min(calc(100% - 2rem), 72rem);
}

.comparison-shell[data-comparison-cover-version="16.1.0"] > .comparison-cover,
.comparison-shell[data-comparison-cover-version="16.2.0"] > .comparison-cover,
.comparison-shell[data-comparison-cover-version="16.1.0"] > .comparison-editorial-recommendation,
.comparison-shell[data-comparison-cover-version="16.2.0"] > .comparison-editorial-recommendation,
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-decision-flow > .comparison-premium-section,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-decision-flow > .comparison-premium-section,
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-decision-flow > .comparison-explorer,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-decision-flow > .comparison-explorer {
  box-sizing: border-box;
  width: var(--comparison-content-width);
  max-width: none;
  margin-inline: auto;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] > .comparison-cover,
.comparison-shell[data-comparison-cover-version="16.2.0"] > .comparison-cover,
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-decision-flow > .comparison-premium-section,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-decision-flow > .comparison-premium-section,
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-decision-flow > .comparison-explorer,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-decision-flow > .comparison-explorer {
  padding-inline: 0;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternatives,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternatives {
  width: 100%;
  margin-inline: 0;
  padding-inline: 0;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__meta .pt-score__label,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__meta .pt-score__label {
  display: none;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__meta .pt-score__copy,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__meta .pt-score__copy {
  display: flex;
  align-items: center;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__meta .pt-score__verdict,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__meta .pt-score__verdict {
  white-space: nowrap;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__meta,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__meta {
  grid-template-columns: minmax(7.5rem, 1fr) minmax(8.5rem, auto) 2.75rem;
}

@media (max-width: 25.875rem) {
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__meta,
  .comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__meta {
    grid-template-columns: minmax(6.8rem, 1fr) minmax(7.5rem, auto) 2.5rem;
  }
}

@media (min-width: 48rem) {
  .comparison-shell[data-comparison-cover-version="16.1.0"],
  .comparison-shell[data-comparison-cover-version="16.2.0"] {
    --comparison-content-width: min(calc(100% - 3rem), 72rem);
  }
}
/* PT_COMPARISON_WIDTH_SCORE_CLEANUP_16_4_0_END */
`;

let css = await readFile(join(root, CSS), "utf8");
css = css.replace(
  /\/\* PT_COMPARISON_WIDTH_SCORE_CLEANUP_16_4_0_START \*\/[\s\S]*?\/\* PT_COMPARISON_WIDTH_SCORE_CLEANUP_16_4_0_END \*\//g,
  ""
).trimEnd();
await writeFile(join(root, CSS), `${css}\n\n${block}\n`, "utf8");
console.log(`Geändert: ${CSS}`);

if (!skipChecks) {
  const scripts = [
    "design-system:tokens:audit",
    "design-system:components:audit",
    "design-system:responsive:audit",
    "design-system:visual-qa:strict",
    "build"
  ];

  for (const script of scripts) {
    const result = spawnSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", script],
      { cwd: root, shell: process.platform === "win32", stdio: "inherit" }
    );
    if (result.status !== 0) throw new Error(`Check fehlgeschlagen: ${script}`);
  }

  spawnSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"],
    { cwd: root, shell: process.platform === "win32", stdio: "inherit" }
  );
}

console.log(`\n[${LABEL}] ABGESCHLOSSEN.`);
console.log("- gleiche Breite für Hero, Top-Empfehlung, Alternativen und Direktvergleich");
console.log("- 16 px Außenränder auf Mobile");
console.log("- 'Redaktioneller Gesamtscore' entfernt");
console.log("- kompaktere Meta-Zeile");
