#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-mobile-decision-ux-4.1.0";
const here = path.dirname(fileURLToPath(import.meta.url));
const payloadRoot = path.join(here, "payload");
const args = process.argv.slice(2);

const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const hasFlag = (name) => args.includes(name);
const repo = path.resolve(valueAfter("--repo") || process.cwd());

const files = [
  {
    relative: "apps/pfotentechnik/src/components/product-experience-2/ProductDecisionAssistant.astro",
    requiredMarkers: [
      'data-decision-assistant',
      'profile.usesFoodQuestions !== false',
      'data-result-reasons'
    ]
  },
  {
    relative: "apps/pfotentechnik/src/styles/pfotentechnik-product-mobile-premium.css",
    requiredMarkers: [
      'data-product-experience="2.0"',
      '.px2-gallery__stage',
      '.px2-fit'
    ]
  }
].map((entry) => ({
  ...entry,
  target: path.join(repo, entry.relative),
  payload: path.join(payloadRoot, entry.relative)
}));

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
      `Befehl fehlgeschlagen (${result.status}): ${command} ${commandArgs.join(" ")}`
    );
  }
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

async function validateRepo() {
  if (!(await exists(path.join(repo, "package.json")))) {
    throw new Error(`Kein Repository-Root gefunden: ${repo}`);
  }

  for (const entry of files) {
    if (!(await exists(entry.target))) {
      throw new Error(`Zieldatei fehlt: ${entry.target}`);
    }
    if (!(await exists(entry.payload))) {
      throw new Error(`Payload fehlt: ${entry.payload}`);
    }

    const source = await fs.readFile(entry.target, "utf8");
    for (const marker of entry.requiredMarkers) {
      if (!source.includes(marker)) {
        throw new Error(
          `${entry.relative}: erwartete Architekturmarke fehlt: ${marker}`
        );
      }
    }
  }
}

async function createBackup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(
    repo,
    ".patch-backups",
    `${PATCH_ID}-${stamp}`
  );
  await fs.mkdir(backupDir, { recursive: true });

  const backups = [];
  for (const entry of files) {
    const backup = path.join(
      backupDir,
      entry.relative.replaceAll("/", "__")
    );
    await fs.copyFile(entry.target, backup);
    backups.push({ target: entry.target, backup });
  }

  const state = {
    patchId: PATCH_ID,
    installedAt: new Date().toISOString(),
    backupDir,
    backups
  };

  await fs.mkdir(path.dirname(statePointer), { recursive: true });
  await fs.writeFile(statePointer, JSON.stringify(state, null, 2), "utf8");
  return state;
}

async function restore(state) {
  for (const entry of state.backups) {
    await fs.copyFile(entry.backup, entry.target);
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
    for (const entry of files) {
      await fs.copyFile(entry.payload, entry.target);
    }

    console.log(`\n[${PATCH_ID}] Mobile-Decision-UX-Audit ...`);
    run(process.execPath, [
      path.join(here, "audit.mjs"),
      "--repo",
      repo
    ]);

    console.log(`\n[${PATCH_ID}] Astro-Build nach Installation ...`);
    run(npmCommand, ["run", "build:pfotentechnik"]);

    console.log(`\n[${PATCH_ID}] Installation abgeschlossen.`);
    console.log("- Frage-Icons für Tier, Anzahl, Futter, Budget, WLAN und Kamera");
    console.log("- Katze und Hund mit eigenen Auswahl-Icons");
    console.log("- Positive, neutrale und negative Gründe mit klarer Trennung");
    console.log("- Kompaktere mobile Fragen bei mindestens 44px Touchhöhe");
    console.log("- Kontraststärkerer Dark Mode");
    console.log("- Lesetext in Ideal-für-, Vor-/Nachteil- und Preisnotiz-Blöcken vergrößert");
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
