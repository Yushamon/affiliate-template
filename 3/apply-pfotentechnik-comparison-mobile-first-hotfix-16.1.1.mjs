#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "16.1.1";
const LABEL = `pfotentechnik-comparison-mobile-first-hotfix-${VERSION}`;
const rootArg = process.argv.find((value) => value.startsWith("--root="));
const root = resolve(rootArg ? rootArg.slice("--root=".length) : process.cwd());
const skipChecks = process.argv.includes("--skip-checks");

const relativeCss =
  "packages/affiliate-core/src/components/comparison/comparison-editorial-cover.css";
const cssPath = join(root, relativeCss);
const backupPath = join(
  root,
  ".patch-backups",
  `${LABEL}-${new Date().toISOString().replaceAll(":", "-")}`,
  relativeCss
);

const run = (script, required = true) => {
  const result = spawnSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", script],
    {
      cwd: root,
      shell: process.platform === "win32",
      stdio: "inherit"
    }
  );

  if (required && result.status !== 0) {
    throw new Error(`Check fehlgeschlagen: ${script}`);
  }
};

await mkdir(dirname(backupPath), { recursive: true });
await cp(cssPath, backupPath);

let css = await readFile(cssPath, "utf8");

const replacements = [
  ["color:#f8fafc", "color:var(--comparison-surface)"],
  ["color: #f8fafc", "color: var(--comparison-surface)"],
  [
    "background:color-mix(in srgb,#071426 94%,transparent)",
    "background:color-mix(in srgb,var(--comparison-text) 94%,transparent)"
  ],
  [
    "background: color-mix(in srgb, #071426 94%, transparent)",
    "background: color-mix(in srgb, var(--comparison-text) 94%, transparent)"
  ],
  ["color:#77d58a", "color:var(--comparison-accent)"],
  ["color: #77d58a", "color: var(--comparison-accent)"],
  ["color:#fff", "color:var(--comparison-surface)"],
  ["color: #fff", "color: var(--comparison-surface)"]
];

let changed = 0;
for (const [from, to] of replacements) {
  if (css.includes(from)) {
    css = css.split(from).join(to);
    changed += 1;
  }
}

if (changed === 0 && !css.includes("PT_COMPARISON_MOBILE_FIRST_16_1_0_START")) {
  throw new Error(
    "Der erwartete Mobile-First-Block 16.1.0 wurde nicht gefunden."
  );
}

const rawHexInReleaseBlock =
  css.match(
    /\/\* PT_COMPARISON_MOBILE_FIRST_16_1_0_START \*\/([\s\S]*?)\/\* PT_COMPARISON_MOBILE_FIRST_16_1_0_END \*\//
  )?.[1]?.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];

if (rawHexInReleaseBlock.length > 0) {
  throw new Error(
    `Im Mobile-First-Block sind weiterhin Rohfarben vorhanden: ${[
      ...new Set(rawHexInReleaseBlock)
    ].join(", ")}`
  );
}

await writeFile(cssPath, css, "utf8");

console.log(`[${LABEL}] Design-Tokens korrigiert.`);
console.log(`Geändert: ${relativeCss}`);
console.log(`Backup: ${backupPath.replace(`${root}/`, "")}`);

if (!skipChecks) {
  run("design-system:tokens:audit");
  run("design-system:components:audit");
  run("design-system:responsive:audit");
  run("design-system:visual-qa:strict");
  run("build");
  run("comparison:audit:strict", false);
}

console.log(`\n[${LABEL}] ABGESCHLOSSEN.`);
console.log(
  "HERO_IMAGE_MISSING und PRODUCT_NOT_COVERED bleiben Vergleichsdaten-Befunde und sind nicht Ursache dieses Token-Fehlers."
);
