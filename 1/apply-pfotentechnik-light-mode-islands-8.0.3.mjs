#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const PATCH_NAME = "pfotentechnik-light-mode-islands-8.0.3";
const TARGET = path.join(
  "apps",
  "pfotentechnik",
  "src",
  "styles",
  "pfotentechnik-theme-fixes.css"
);
const START = "/* BEGIN pfotentechnik-light-mode-islands-8.0.3 */";
const END = "/* END pfotentechnik-light-mode-islands-8.0.3 */";
const PATCH_CSS = "/* BEGIN pfotentechnik-light-mode-islands-8.0.3 */\n/*\n * Theme-safe editorial islands.\n * These components previously kept fixed dark backgrounds while the global\n * light theme already switched their text to dark colors.\n */\n\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"] {\n  --next-bg: linear-gradient(\n    145deg,\n    var(--pt-theme-surface-2),\n    var(--pt-theme-surface)\n  ) !important;\n  --next-card: var(--pt-theme-surface) !important;\n  --next-border: var(--pt-theme-border) !important;\n  --next-text: var(--pt-theme-text) !important;\n  --next-muted: var(--pt-theme-text-soft) !important;\n  --next-accent: var(--pt-theme-accent) !important;\n\n  border-color: var(--pt-theme-border) !important;\n  background: var(--next-bg) !important;\n  color: var(--pt-theme-text) !important;\n  box-shadow: var(--pt-theme-shadow-md) !important;\n}\n\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__header h2,\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__card h3,\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__score strong,\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__stat strong {\n  color: var(--pt-theme-text) !important;\n}\n\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__header > p:last-child,\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__card p,\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__highlights li,\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  :is(.pt-next-steps__score, .pt-next-steps__stat) small {\n  color: var(--pt-theme-text-soft) !important;\n}\n\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__card {\n  border-color: var(--pt-theme-border) !important;\n  background: var(--pt-theme-surface) !important;\n  color: var(--pt-theme-text) !important;\n  box-shadow: var(--pt-theme-shadow-xs) !important;\n}\n\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__card--product {\n  border-color: color-mix(\n    in srgb,\n    var(--pt-theme-accent) 38%,\n    var(--pt-theme-border)\n  ) !important;\n  background: linear-gradient(\n    145deg,\n    var(--pt-theme-accent-soft),\n    var(--pt-theme-surface) 68%\n  ) !important;\n}\n\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__media {\n  border-right-color: var(--pt-theme-divider) !important;\n  background: var(--pt-theme-surface-2) !important;\n}\n\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  :is(\n    .pt-next-steps__eyebrow,\n    .pt-next-steps__label,\n    .pt-next-steps__score,\n    .pt-next-steps__stat,\n    .pt-next-steps__cta,\n    .pt-next-steps__highlights li::before\n  ) {\n  color: var(--pt-theme-accent) !important;\n}\n\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__card:hover,\nbody .pt-next-steps[data-feature=\"recommendation-cards-2.0\"]\n  .pt-next-steps__card:focus-visible {\n  border-color: var(--pt-theme-accent) !important;\n  box-shadow: var(--pt-theme-shadow-sm) !important;\n}\n\nbody .home3-method {\n  border: 1px solid var(--pt-theme-border) !important;\n  background:\n    radial-gradient(\n      circle at 8% 0%,\n      color-mix(in srgb, var(--pt-theme-accent) 9%, transparent),\n      transparent 34%\n    ),\n    linear-gradient(\n      145deg,\n      var(--pt-theme-surface),\n      var(--pt-theme-surface-2)\n    ) !important;\n  color: var(--pt-theme-text) !important;\n  box-shadow: var(--pt-theme-shadow-sm) !important;\n}\n\nbody .home3-method .home3-eyebrow--light,\nbody .home3-method .home3-method__intro a,\nbody .home3-method li > span {\n  color: var(--pt-theme-accent) !important;\n}\n\nbody .home3-method .home3-method__intro h2,\nbody .home3-method li h3 {\n  color: var(--pt-theme-text) !important;\n}\n\nbody .home3-method .home3-method__intro > p:last-of-type,\nbody .home3-method li p {\n  color: var(--pt-theme-text-soft) !important;\n}\n\nbody .home3-method li {\n  border-bottom-color: var(--pt-theme-divider) !important;\n}\n\nbody .home3-method li:last-child {\n  border-bottom: 0 !important;\n}\n/* END pfotentechnik-light-mode-islands-8.0.3 */";

const args = process.argv.slice(2);
const runBuild = args.includes("--build");
const explicitRoot = args.find((arg) => !arg.startsWith("--"));

const fail = (message) => {
  console.error(`\n[${PATCH_NAME}] ${message}\n`);
  process.exit(1);
};

const findRepoRoot = (startPath) => {
  let current = path.resolve(startPath);
  while (true) {
    if (fs.existsSync(path.join(current, TARGET))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
};

const repoRoot = findRepoRoot(explicitRoot ?? process.cwd());
if (!repoRoot) {
  fail(
    "Die bereits installierte Theme-Datei wurde nicht gefunden: " + TARGET +
      "\nStarte den Installer im affiliate-template-Ordner. Dieser Nachpatch setzt Theme-Fix 8.0.2 voraus."
  );
}

const targetPath = path.join(repoRoot, TARGET);
const original = fs.readFileSync(targetPath, "utf8");
const newline = original.includes("\r\n") ? "\r\n" : "\n";

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const blockPattern = new RegExp(
  `${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}\\s*`,
  "g"
);

const withoutOldBlock = original.replace(blockPattern, "").trimEnd();
const normalizedPatch = PATCH_CSS.replace(/\n/g, newline);
const next = `${withoutOldBlock}${newline}${newline}${normalizedPatch}${newline}`;

if (next === original) {
  console.log(`\n[${PATCH_NAME}] bereits vollständig aktiv.`);
} else {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    repoRoot,
    ".patch-backups",
    `${PATCH_NAME}-${timestamp}`,
    TARGET
  );

  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, original, "utf8");

  try {
    fs.writeFileSync(targetPath, next, "utf8");
  } catch (error) {
    fs.writeFileSync(targetPath, original, "utf8");
    fail(`Schreiben fehlgeschlagen. Die Datei wurde zurückgesetzt.\n${error.message}`);
  }

  console.log(`\n[${PATCH_NAME}] angewendet.`);
  console.log(`Geändert: ${TARGET}`);
  console.log(`Sicherung: ${backupPath}`);
}

if (runBuild) {
  console.log("\nStarte npm run build:pfotentechnik ...");
  const result = spawnSync("npm", ["run", "build:pfotentechnik"], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    fail("CSS-Nachpatch wurde angewendet, aber der Astro-Build ist fehlgeschlagen.");
  }

  console.log("Build erfolgreich.");
} else {
  console.log("\nValidierung: npm run build:pfotentechnik");
  console.log(
    "Oder automatisch: node .\\1\\apply-pfotentechnik-light-mode-islands-8.0.3.mjs --build"
  );
}
