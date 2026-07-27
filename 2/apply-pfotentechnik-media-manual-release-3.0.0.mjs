import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-media-manual-release-3.0.0";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const payloadRoot = path.join(scriptDir, "payload");
const skipBuild = process.argv.includes("--skip-build");
const skipTests = process.argv.includes("--skip-tests");

const targets = [
  "apps/pfotentechnik/src/lib/media-center/service.mjs",
  "apps/pfotentechnik/src/lib/media-center/markdown-images.mjs",
  "apps/pfotentechnik/src/lib/admin/operations-router.mjs",
  "apps/pfotentechnik/src/pages/admin/seo/media.astro",
  "apps/pfotentechnik/test/media-center.test.mjs"
];

const structuralChecks = new Map([
  [targets[0], ["export async function createMediaJob", "export async function approveMediaJob"]],
  [targets[1], ["updateProductImages"]],
  [targets[2], ["handleOperationsRoute", "/api/admin/media"]],
  [targets[3], ["data-media-import", "data-media-workspace"]],
  [targets[4], ["media-center", "node:test"]]
]);

function findRepoRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Root nicht gefunden. Führe den Installer im affiliate-template-Repository aus.");
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function assertPreflight(repoRoot) {
  const missingPayload = targets.filter((relative) => !fs.existsSync(path.join(payloadRoot, relative)));
  if (missingPayload.length) {
    throw new Error(`Payload unvollständig:\n- ${missingPayload.join("\n- ")}`);
  }

  for (const relative of targets) {
    const target = path.join(repoRoot, relative);
    if (!fs.existsSync(target)) throw new Error(`Zieldatei fehlt: ${relative}`);
    const source = await fsp.readFile(target, "utf8");
    for (const marker of structuralChecks.get(relative) || []) {
      if (!source.includes(marker)) {
        throw new Error(`Unerwartete Dateistruktur in ${relative}. Strukturmerkmal fehlt: ${marker}`);
      }
    }
  }
}

function run(repoRoot, command, args) {
  console.log(`\n[${PATCH}] $ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Befehl fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`);
  }
}

async function main() {
  const repoRoot = findRepoRoot(process.cwd());
  await assertPreflight(repoRoot);

  const changes = [];
  for (const relative of targets) {
    const current = await fsp.readFile(path.join(repoRoot, relative));
    const next = await fsp.readFile(path.join(payloadRoot, relative));
    if (!current.equals(next)) changes.push(relative);
  }

  if (!changes.length) {
    console.log(`[${PATCH}] Bereits vollständig installiert. Es wurden keine Dateien verändert.`);
  } else {
    const backupRoot = path.join(repoRoot, ".patch-backups", `${PATCH}-${timestamp()}`);
    for (const relative of changes) {
      const target = path.join(repoRoot, relative);
      const backup = path.join(backupRoot, relative);
      await fsp.mkdir(path.dirname(backup), { recursive: true });
      await fsp.copyFile(target, backup);
    }

    try {
      for (const relative of changes) {
        const source = path.join(payloadRoot, relative);
        const target = path.join(repoRoot, relative);
        await fsp.mkdir(path.dirname(target), { recursive: true });
        await fsp.copyFile(source, target);
      }
    } catch (error) {
      for (const relative of changes) {
        const backup = path.join(backupRoot, relative);
        if (fs.existsSync(backup)) await fsp.copyFile(backup, path.join(repoRoot, relative));
      }
      throw error;
    }

    console.log(`[${PATCH}] ${changes.length} Datei(en) aktualisiert:`);
    for (const relative of changes) console.log(`- ${relative}`);
    console.log(`Backup: ${path.relative(repoRoot, backupRoot)}`);
  }

  for (const relative of targets.filter((file) => /\.(mjs)$/.test(file))) {
    run(repoRoot, process.execPath, ["--check", relative]);
  }

  if (!skipTests) {
    run(repoRoot, "npm", ["--workspace", "apps/pfotentechnik", "run", "test:media-center"]);
  }
  if (!skipBuild) {
    run(repoRoot, "npm", ["run", "build:pfotentechnik"]);
  }

  console.log(`\n[${PATCH}] Abgeschlossen.`);
  console.log("Manuelle Bildfreigabe, eindeutige Zielauswahl und bestandserhaltende Veröffentlichung sind aktiv.");
}

main().catch((error) => {
  console.error(`\n[${PATCH}] FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
