#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-comparison-cta-price-3.3.5";
const here = path.dirname(fileURLToPath(import.meta.url));
const payloadRoot = path.join(here, "payload");
const args = process.argv.slice(2);
const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const hasFlag = (name) => args.includes(name);
const repo = path.resolve(valueAfter("--repo") || process.cwd());

const cssRelative = "packages/affiliate-core/src/components/comparison/comparison-mobile-price-fix-4.0.1.css";
const shellRelative = "packages/affiliate-core/src/components/comparison/ComparisonShell.astro";
const cssFile = path.join(repo, cssRelative);
const shellFile = path.join(repo, shellRelative);
const payloadCss = path.join(payloadRoot, cssRelative);
const statePointer = path.join(repo, ".patch-backups", `${PATCH_ID}-latest.json`);

const exists = async (file) => {
  try { await fs.access(file); return true; } catch { return false; }
};

function quoteForCmd(value) {
  const text = String(value);
  if (!/[\s"&|<>^]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function run(command, commandArgs, { cwd = repo } = {}) {
  let executable = command;
  let finalArgs = commandArgs;
  if (process.platform === "win32" && /\.cmd$/i.test(command)) {
    executable = process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
    finalArgs = ["/d", "/s", "/c", [command, ...commandArgs].map(quoteForCmd).join(" ")];
  }
  const result = spawnSync(executable, finalArgs, { cwd, stdio: "inherit", shell: false, env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Befehl fehlgeschlagen (${result.status}): ${command} ${commandArgs.join(" ")}`);
  }
}
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

async function validateRepo() {
  const required = [
    path.join(repo, "package.json"),
    shellFile,
    cssFile,
    payloadCss
  ];
  for (const file of required) {
    if (!(await exists(file))) throw new Error(`Erforderliche Datei fehlt: ${file}`);
  }

  const shellSource = await fs.readFile(shellFile, "utf8");
  if (!shellSource.includes('comparison-mobile-price-fix-4.0.1.css')) {
    throw new Error('ComparisonShell.astro importiert den mobilen Preis-Fix noch nicht. Bitte zuerst 4.0.2 installieren.');
  }
}

async function createBackup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(repo, ".patch-backups", `${PATCH_ID}-${stamp}`);
  await fs.mkdir(backupDir, { recursive: true });
  const backup = path.join(backupDir, 'comparison-mobile-price-fix-4.0.1.css');
  await fs.copyFile(cssFile, backup);
  const state = { patchId: PATCH_ID, installedAt: new Date().toISOString(), backupDir, files: [{ file: cssFile, backup }] };
  await fs.mkdir(path.dirname(statePointer), { recursive: true });
  await fs.writeFile(statePointer, JSON.stringify(state, null, 2), 'utf8');
  return state;
}

async function restore(state) {
  for (const entry of state.files) {
    await fs.copyFile(entry.backup, entry.file);
  }
}

async function main() {
  await validateRepo();
  if (!hasFlag('--skip-baseline')) {
    console.log(`\n[${PATCH_ID}] Baseline-Build wird geprüft ...`);
    run(npmCommand, ['run', 'build:pfotentechnik']);
  }

  const state = await createBackup();
  try {
    await fs.copyFile(payloadCss, cssFile);

    console.log(`\n[${PATCH_ID}] Comparison-CTA- und Preis-Audit ...`);
    run(process.execPath, [path.join(here, 'audit.mjs'), '--repo', repo]);

    console.log(`\n[${PATCH_ID}] Astro-Build nach Installation ...`);
    run(npmCommand, ['run', 'build:pfotentechnik']);

    console.log(`\n[${PATCH_ID}] Installation abgeschlossen.`);
    console.log('- Preisblock im Vergleich ruhiger und besser lesbar');
    console.log('- CTA-Zeilen in Vergleichskarten und Winner-Bereichen optisch vereinheitlicht');
    console.log('- Primär- und Sekundär-CTA wieder klarer hierarchisiert');
    console.log('- Mobile Sticky-/Aktionszeilen brechen unter 380 px sauber einspaltig um');
  } catch (error) {
    await restore(state);
    await fs.rm(statePointer, { force: true });
    console.error(`\n[${PATCH_ID}] Installation fehlgeschlagen. Änderungen wurden zurückgesetzt.`);
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
