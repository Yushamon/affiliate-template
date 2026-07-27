#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-cta-system-4.2.0";
const here = path.dirname(fileURLToPath(import.meta.url));
const payloadRoot = path.join(here, "payload");
const args = process.argv.slice(2);

const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const hasFlag = (name) => args.includes(name);
const repo = path.resolve(valueAfter("--repo") || process.cwd());

const projectLayout = path.join(
  repo,
  "apps",
  "pfotentechnik",
  "src",
  "layouts",
  "ProjectLayout.astro"
);
const comparisonShell = path.join(
  repo,
  "packages",
  "affiliate-core",
  "src",
  "components",
  "comparison",
  "ComparisonShell.astro"
);

const appCssRelative =
  "apps/pfotentechnik/src/styles/pfotentechnik-cta-system.css";
const comparisonCssRelative =
  "packages/affiliate-core/src/components/comparison/comparison-cta-system.css";

const appCss = path.join(repo, appCssRelative);
const comparisonCss = path.join(repo, comparisonCssRelative);
const payloadAppCss = path.join(payloadRoot, appCssRelative);
const payloadComparisonCss = path.join(payloadRoot, comparisonCssRelative);

const appImport = 'import "../styles/pfotentechnik-cta-system.css";';
const comparisonImport = 'import "./comparison-cta-system.css";';

const statePointer = path.join(
  repo,
  ".patch-backups",
  `${PATCH_ID}-latest.json`
);

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function preserveEol(source, normalizedNext) {
  return source.includes("\r\n")
    ? normalizedNext.replace(/\r?\n/g, "\r\n")
    : normalizedNext.replace(/\r\n/g, "\n");
}

function addAstroImport(source, {
  importLine,
  preferredAnchors,
  fallbackPattern,
  fileLabel
}) {
  if (source.includes(importLine)) return source;

  const normalized = source.replace(/\r\n/g, "\n");
  const firstFence = normalized.indexOf("---\n");
  const secondFence = normalized.indexOf("\n---", firstFence + 4);

  if (firstFence !== 0 || secondFence < 0) {
    throw new Error(`${fileLabel}: gültiges Astro-Frontmatter fehlt.`);
  }

  const lines = normalized.slice(4, secondFence).split("\n");
  let insertAt = -1;

  for (const anchor of preferredAnchors) {
    insertAt = lines.findIndex((line) => line.includes(anchor));
    if (insertAt >= 0) break;
  }

  if (insertAt < 0) {
    const matches = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => fallbackPattern.test(line));

    if (!matches.length) {
      throw new Error(
        `${fileLabel}: kein semantischer Stylesheet-Importanker gefunden.`
      );
    }

    insertAt = matches.at(-1).index;
  }

  lines.splice(insertAt + 1, 0, importLine);

  const next =
    `---\n${lines.join("\n")}\n${normalized.slice(secondFence + 1)}`;

  return preserveEol(source, next);
}

function quoteForCmd(value) {
  const text = String(value);
  if (!/[\s"&|<>^]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function run(command, commandArgs, { cwd = repo } = {}) {
  let executable = command;
  let finalArgs = commandArgs;

  if (process.platform === "win32" && /\.cmd$/i.test(command)) {
    executable =
      process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
    finalArgs = [
      "/d",
      "/s",
      "/c",
      [command, ...commandArgs].map(quoteForCmd).join(" ")
    ];
  }

  const result = spawnSync(executable, finalArgs, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env
  });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    throw new Error(
      `Befehl fehlgeschlagen (${result.status}): ` +
      `${command} ${commandArgs.join(" ")}`
    );
  }
}

const npmCommand =
  process.platform === "win32" ? "npm.cmd" : "npm";

async function validateRepo() {
  const required = [
    path.join(repo, "package.json"),
    projectLayout,
    comparisonShell,
    payloadAppCss,
    payloadComparisonCss,
    path.join(
      repo,
      "apps",
      "pfotentechnik",
      "src",
      "pages",
      "[slug].astro"
    ),
    path.join(
      repo,
      "apps",
      "pfotentechnik",
      "src",
      "components",
      "product-experience-2",
      "PriceBox2.astro"
    ),
    path.join(
      repo,
      "packages",
      "affiliate-core",
      "src",
      "components",
      "comparison",
      "ComparisonStickyBar.astro"
    )
  ];

  for (const file of required) {
    if (!(await exists(file))) {
      throw new Error(`Erforderliche Datei fehlt: ${file}`);
    }
  }

  const articlePage = await fs.readFile(required[5], "utf8");
  const priceBox = await fs.readFile(required[6], "utf8");
  const sticky = await fs.readFile(required[7], "utf8");

  for (const [label, source, marker] of [
    ["Ratgeber-CTA", articlePage, "money-page-intent-actions"],
    ["Abschluss-CTA", articlePage, "pt-money-cta-actions"],
    ["Produktpreis-CTA", priceBox, "px2-price__cta"],
    ["Vergleich-Stickybar", sticky, "comparison-sticky-bar"]
  ]) {
    if (!source.includes(marker)) {
      throw new Error(`${label}: erwartete Architekturmarke fehlt.`);
    }
  }
}

async function backupFile(file, backupDir, label) {
  const existed = await exists(file);
  const backup = path.join(backupDir, label);

  if (existed) {
    await fs.copyFile(file, backup);
  }

  return { file, backup, existed };
}

async function createBackup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(
    repo,
    ".patch-backups",
    `${PATCH_ID}-${stamp}`
  );

  await fs.mkdir(backupDir, { recursive: true });

  const files = [
    await backupFile(
      projectLayout,
      backupDir,
      "ProjectLayout.astro"
    ),
    await backupFile(
      comparisonShell,
      backupDir,
      "ComparisonShell.astro"
    ),
    await backupFile(
      appCss,
      backupDir,
      "pfotentechnik-cta-system.css"
    ),
    await backupFile(
      comparisonCss,
      backupDir,
      "comparison-cta-system.css"
    )
  ];

  const state = {
    patchId: PATCH_ID,
    installedAt: new Date().toISOString(),
    backupDir,
    files
  };

  await fs.mkdir(path.dirname(statePointer), { recursive: true });
  await fs.writeFile(
    statePointer,
    JSON.stringify(state, null, 2),
    "utf8"
  );

  return state;
}

async function restore(state) {
  for (const entry of state.files) {
    if (entry.existed) {
      await fs.copyFile(entry.backup, entry.file);
    } else {
      await fs.rm(entry.file, { force: true });
    }
  }
}

async function main() {
  await validateRepo();

  if (!hasFlag("--skip-baseline")) {
    console.log(`\n[${PATCH_ID}] Baseline-Build wird geprüft ...`);
    run(npmCommand, ["run", "build:pfotentechnik"]);
  }

  const state = await createBackup();

  try {
    const [layoutSource, shellSource] = await Promise.all([
      fs.readFile(projectLayout, "utf8"),
      fs.readFile(comparisonShell, "utf8")
    ]);

    const nextLayout = addAstroImport(layoutSource, {
      importLine: appImport,
      preferredAnchors: [
        "pfotentechnik-product-mobile-premium.css",
        "pfotentechnik-theme-fixes.css"
      ],
      fallbackPattern:
        /^\s*import\s+["'][^"']*styles\/[^"']+\.css["'];?\s*$/,
      fileLabel: "ProjectLayout.astro"
    });

    const nextShell = addAstroImport(shellSource, {
      importLine: comparisonImport,
      preferredAnchors: [
        "comparison-mobile-price-fix-4.0.1.css",
        "comparison-ux-polish-3.2.css"
      ],
      fallbackPattern:
        /^\s*import\s+["']\.\/comparison[^"']+\.css["'];?\s*$/,
      fileLabel: "ComparisonShell.astro"
    });

    await Promise.all([
      fs.mkdir(path.dirname(appCss), { recursive: true }),
      fs.mkdir(path.dirname(comparisonCss), { recursive: true })
    ]);

    await Promise.all([
      fs.copyFile(payloadAppCss, appCss),
      fs.copyFile(payloadComparisonCss, comparisonCss),
      fs.writeFile(projectLayout, nextLayout, "utf8"),
      fs.writeFile(comparisonShell, nextShell, "utf8")
    ]);

    console.log(`\n[${PATCH_ID}] CTA-System-Audit ...`);
    run(process.execPath, [
      path.join(here, "audit.mjs"),
      "--repo",
      repo
    ]);

    console.log(`\n[${PATCH_ID}] Astro-Build nach Installation ...`);
    run(npmCommand, ["run", "build:pfotentechnik"]);

    console.log(`\n[${PATCH_ID}] Installation abgeschlossen.`);
    console.log("- Navigation, Homepage und UI-Callouts vereinheitlicht");
    console.log("- Ratgeber-Direkteinstiege und Abschluss-CTAs modernisiert");
    console.log("- Produktpreis- und Vergleichs-CTA hierarchisiert");
    console.log("- Vergleichskarten, Winner und Sticky Bar vereinheitlicht");
    console.log("- Preiszeile im Vergleich neu ausgerichtet");
    console.log("- Dark Mode, Fokuszustände und Reduced Motion berücksichtigt");
  } catch (error) {
    await restore(state);
    await fs.rm(statePointer, { force: true });

    console.error(
      `\n[${PATCH_ID}] Installation fehlgeschlagen. ` +
      "Änderungen wurden zurückgesetzt."
    );

    throw error;
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.stack || error.message
      : String(error)
  );
  process.exitCode = 1;
});
