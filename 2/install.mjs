#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-mobile-product-layout-4.0.1";
const here = path.dirname(fileURLToPath(import.meta.url));
const payloadRoot = path.join(here, "payload");
const args = process.argv.slice(2);

const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const hasFlag = (name) => args.includes(name);
const repo = path.resolve(valueAfter("--repo") || process.cwd());
const appRoot = path.join(repo, "apps", "pfotentechnik");

const layoutFile = path.join(appRoot, "src", "layouts", "ProjectLayout.astro");
const shellFile = path.join(
  repo,
  "packages",
  "affiliate-core",
  "src",
  "components",
  "comparison",
  "ComparisonShell.astro"
);

const productCssRelative =
  "apps/pfotentechnik/src/styles/pfotentechnik-product-mobile-premium.css";
const comparisonCssRelative =
  "packages/affiliate-core/src/components/comparison/comparison-mobile-price-fix-4.0.1.css";

const productCssFile = path.join(repo, productCssRelative);
const comparisonCssFile = path.join(repo, comparisonCssRelative);
const payloadProductCss = path.join(payloadRoot, productCssRelative);
const payloadComparisonCss = path.join(payloadRoot, comparisonCssRelative);

const layoutImport =
  'import "../styles/pfotentechnik-product-mobile-premium.css";';
const comparisonImport =
  'import "./comparison-mobile-price-fix-4.0.1.css";';

const statePointer = path.join(
  repo,
  ".patch-backups",
  `${PATCH_ID}-latest.json`
);

const exists = async (file) => {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};

const preserveEol = (source, normalizedNext) =>
  source.includes("\r\n")
    ? normalizedNext.replace(/\r?\n/g, "\r\n")
    : normalizedNext.replace(/\r\n/g, "\n");

function addAstroImport(source, {
  importLine,
  preferredAnchor,
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

  const frontmatter = normalized.slice(4, secondFence);
  const lines = frontmatter.split("\n");

  let insertAt = lines.findIndex((line) => line.includes(preferredAnchor));

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
  const next = `---\n${lines.join("\n")}\n${normalized.slice(secondFence + 1)}`;
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

  /*
   * Node 24/26 kann unter Windows beim direkten spawnSync von npm.cmd mit
   * shell:false EINVAL liefern. cmd.exe ist dort der stabile, dokumentierte
   * Einstieg für .cmd-Dateien.
   */
  if (process.platform === "win32" && /\.cmd$/i.test(command)) {
    executable = process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
    const commandLine = [command, ...commandArgs]
      .map(quoteForCmd)
      .join(" ");
    finalArgs = ["/d", "/s", "/c", commandLine];
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
      `Befehl fehlgeschlagen (${result.status}): ${command} ${commandArgs.join(" ")}`
    );
  }
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

async function validateRepo() {
  const required = [
    path.join(repo, "package.json"),
    layoutFile,
    shellFile,
    payloadProductCss,
    payloadComparisonCss,
    path.join(
      appRoot,
      "src",
      "components",
      "product-experience-2",
      "ProductExperience2.astro"
    ),
    path.join(
      repo,
      "packages",
      "affiliate-core",
      "src",
      "components",
      "comparison",
      "ComparisonPriceSignal.astro"
    )
  ];

  for (const file of required) {
    if (!(await exists(file))) {
      throw new Error(`Erforderliche Datei fehlt: ${file}`);
    }
  }
}

async function backupFile(file, backupDir, label) {
  const existed = await exists(file);
  const backup = path.join(backupDir, label);
  if (existed) await fs.copyFile(file, backup);
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
    await backupFile(layoutFile, backupDir, "ProjectLayout.astro"),
    await backupFile(shellFile, backupDir, "ComparisonShell.astro"),
    await backupFile(
      productCssFile,
      backupDir,
      "pfotentechnik-product-mobile-premium.css"
    ),
    await backupFile(
      comparisonCssFile,
      backupDir,
      "comparison-mobile-price-fix-4.0.1.css"
    )
  ];

  const state = {
    patchId: PATCH_ID,
    installedAt: new Date().toISOString(),
    backupDir,
    files
  };

  await fs.mkdir(path.dirname(statePointer), { recursive: true });
  await fs.writeFile(statePointer, JSON.stringify(state, null, 2), "utf8");
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
      fs.readFile(layoutFile, "utf8"),
      fs.readFile(shellFile, "utf8")
    ]);

    const nextLayout = addAstroImport(layoutSource, {
      importLine: layoutImport,
      preferredAnchor: "pfotentechnik-theme-fixes.css",
      fallbackPattern:
        /^\s*import\s+["'][^"']*styles\/[^"']+["'];?\s*$/,
      fileLabel: "ProjectLayout.astro"
    });

    const nextShell = addAstroImport(shellSource, {
      importLine: comparisonImport,
      preferredAnchor: "comparison-ux-polish-3.2.css",
      fallbackPattern:
        /^\s*import\s+["']\.\/comparison[^"']+\.css["'];?\s*$/,
      fileLabel: "ComparisonShell.astro"
    });

    await Promise.all([
      fs.mkdir(path.dirname(productCssFile), { recursive: true }),
      fs.mkdir(path.dirname(comparisonCssFile), { recursive: true })
    ]);

    await Promise.all([
      fs.copyFile(payloadProductCss, productCssFile),
      fs.copyFile(payloadComparisonCss, comparisonCssFile),
      fs.writeFile(layoutFile, nextLayout, "utf8"),
      fs.writeFile(shellFile, nextShell, "utf8")
    ]);

    console.log(`\n[${PATCH_ID}] Mobile-UI- und Preis-Audit ...`);
    run(process.execPath, [
      path.join(here, "audit.mjs"),
      "--repo",
      repo
    ]);

    console.log(`\n[${PATCH_ID}] Astro-Build nach Installation ...`);
    run(npmCommand, ["run", "build:pfotentechnik"]);

    console.log(`\n[${PATCH_ID}] Installation abgeschlossen.`);
    console.log("- Produktseiten: mobile Premium-Layoutschicht installiert");
    console.log("- Vergleich: Preisblock belegt mobil immer die volle Kartenbreite");
    console.log("- Preislabel und Eurobetrag bleiben horizontal lesbar");
    console.log("- Windows: npm wird stabil über cmd.exe gestartet");
  } catch (error) {
    await restore(state);
    await fs.rm(statePointer, { force: true });
    console.error(
      `\n[${PATCH_ID}] Installation fehlgeschlagen. Änderungen wurden zurückgesetzt.`
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
