#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH_NAME = "pfotentechnik-seo-work-packages-2.0.0";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const payloadRoot = path.join(scriptDir, "payload");
const manifest = JSON.parse(fs.readFileSync(path.join(scriptDir, "manifest.json"), "utf8"));
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
const force = flags.has("--force");
const dryRun = flags.has("--dry-run");
const skipValidation = flags.has("--skip-validation");
const rollbackIndex = argv.indexOf("--rollback");

const normalizeLf = (buffer) => Buffer.from(buffer.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
const gitBlobSha = (buffer) => crypto.createHash("sha1")
  .update(Buffer.concat([Buffer.from(`blob ${buffer.length}\0`), buffer]))
  .digest("hex");
const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

function findRepoRoot(start) {
  let current = path.resolve(start);
  while (true) {
    const rootPackage = path.join(current, "package.json");
    const appPackage = path.join(current, "apps", "pfotentechnik", "package.json");
    if (fs.existsSync(rootPackage) && fs.existsSync(appPackage)) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden. Starte den Installer im Repository Yushamon/affiliate-template oder in einem Unterordner davon.");
}

function listPayloadFiles(directory, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    const relative = path.posix.join(prefix, entry.name);
    return entry.isDirectory() ? listPayloadFiles(absolute, relative) : [relative];
  }).sort();
}

function safeTarget(repoRoot, relativePath) {
  const target = path.resolve(repoRoot, relativePath);
  const prefix = `${path.resolve(repoRoot)}${path.sep}`;
  if (!target.startsWith(prefix)) throw new Error(`Unsicherer Zielpfad: ${relativePath}`);
  return target;
}

function restoreBackup(repoRoot, backupDirectory) {
  const backupRoot = path.resolve(repoRoot, backupDirectory);
  const stateFile = path.join(backupRoot, "patch-state.json");
  if (!fs.existsSync(stateFile)) throw new Error(`Rollback-Metadaten fehlen: ${stateFile}`);
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  for (const item of state.files.slice().reverse()) {
    const target = safeTarget(repoRoot, item.path);
    if (item.existed) {
      const source = path.join(backupRoot, "files", item.path);
      if (!fs.existsSync(source)) throw new Error(`Backup-Datei fehlt: ${source}`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    } else if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }
  }
  console.log(`[${PATCH_NAME}] Rollback abgeschlossen: ${path.relative(repoRoot, backupRoot)}`);
}

const repoRoot = findRepoRoot(process.cwd());
if (rollbackIndex >= 0) {
  const backup = argv[rollbackIndex + 1];
  if (!backup || backup.startsWith("--")) throw new Error("Nach --rollback muss der Backup-Ordner angegeben werden.");
  restoreBackup(repoRoot, backup);
  process.exit(0);
}

const files = listPayloadFiles(payloadRoot);
const baseFiles = manifest.baseFiles || {};
const newFiles = new Set(manifest.newFiles || []);
const changes = [];
const conflicts = [];

for (const relativePath of files) {
  const source = path.join(payloadRoot, relativePath);
  const target = safeTarget(repoRoot, relativePath);
  const desiredRaw = fs.readFileSync(source);
  const desiredNormalized = normalizeLf(desiredRaw);
  const desiredGitSha = gitBlobSha(desiredNormalized);
  const desiredSha256 = sha256(desiredRaw);
  const exists = fs.existsSync(target);
  if (!exists) {
    if (baseFiles[relativePath] && !force) {
      conflicts.push(`${relativePath}: bestehende Repository-Datei fehlt; erwarteter Git-Blob ${baseFiles[relativePath]}`);
      continue;
    }
    changes.push({ path: relativePath, source, target, existed: false, desiredGitSha, desiredSha256, state: "create" });
    continue;
  }
  const currentRaw = fs.readFileSync(target);
  const currentNormalized = normalizeLf(currentRaw);
  const currentGitSha = gitBlobSha(currentNormalized);
  if (currentNormalized.equals(desiredNormalized)) {
    changes.push({ path: relativePath, source, target, existed: true, desiredGitSha, desiredSha256, state: "current" });
    continue;
  }
  const expected = baseFiles[relativePath];
  if (expected && currentGitSha !== expected && !force) {
    conflicts.push(`${relativePath}: Repository-Stand weicht ab. Erwartet ${expected}, gefunden ${currentGitSha}`);
    continue;
  }
  if (!expected && newFiles.has(relativePath) && !force) {
    conflicts.push(`${relativePath}: neue Patch-Datei existiert bereits mit anderem Inhalt`);
    continue;
  }
  changes.push({ path: relativePath, source, target, existed: true, desiredGitSha, desiredSha256, state: "update", currentGitSha });
}

if (conflicts.length) {
  console.error(`[${PATCH_NAME}] Vorprüfung fehlgeschlagen. Es wurde nichts verändert.`);
  for (const conflict of conflicts) console.error(`- ${conflict}`);
  console.error("Aktualisiere den Patch gegen deinen Repository-Stand. --force ist nur sinnvoll, wenn du die Abweichungen bewusst geprüft hast.");
  process.exit(2);
}

const pending = changes.filter((item) => item.state !== "current");
console.log(`[${PATCH_NAME}] Vorprüfung erfolgreich: ${pending.length} Änderung(en), ${changes.length - pending.length} bereits aktuell.`);
for (const item of pending) console.log(`- ${item.state === "create" ? "neu" : "ändern"}: ${item.path}`);
if (dryRun) {
  console.log(`[${PATCH_NAME}] Dry-Run beendet. Es wurde nichts verändert.`);
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(repoRoot, ".patch-backups", `${PATCH_NAME}-${stamp}`);
const backupState = { patch: PATCH_NAME, createdAt: new Date().toISOString(), files: pending.map((item) => ({ path: item.path, existed: item.existed })) };
if (pending.length) {
  fs.mkdirSync(path.join(backupRoot, "files"), { recursive: true });
  for (const item of pending) {
    if (!item.existed) continue;
    const backupTarget = path.join(backupRoot, "files", item.path);
    fs.mkdirSync(path.dirname(backupTarget), { recursive: true });
    fs.copyFileSync(item.target, backupTarget);
  }
  fs.writeFileSync(path.join(backupRoot, "patch-state.json"), `${JSON.stringify(backupState, null, 2)}\n`, { mode: 0o600 });
}

for (const item of pending) {
  fs.mkdirSync(path.dirname(item.target), { recursive: true });
  const temporary = `${item.target}.${process.pid}.${Date.now()}.tmp`;
  fs.copyFileSync(item.source, temporary);
  try {
    fs.renameSync(temporary, item.target);
  } catch (error) {
    if (!["EEXIST", "EPERM"].includes(error?.code)) throw error;
    fs.rmSync(item.target, { force: true });
    fs.renameSync(temporary, item.target);
  }
}

for (const item of changes) {
  const installed = normalizeLf(fs.readFileSync(item.target));
  if (gitBlobSha(installed) !== item.desiredGitSha) throw new Error(`Nachprüfung fehlgeschlagen: ${item.path}`);
}

console.log(`[${PATCH_NAME}] Dateien installiert.${pending.length ? ` Backup: ${path.relative(repoRoot, backupRoot)}` : ""}`);

if (skipValidation) {
  console.log(`[${PATCH_NAME}] Validierung wurde mit --skip-validation übersprungen.`);
  process.exit(0);
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const validations = [
  ["npm --workspace apps/pfotentechnik run test:seo-copilot", ["--workspace", "apps/pfotentechnik", "run", "test:seo-copilot"]],
  ["npm --workspace apps/pfotentechnik run build:content-graph", ["--workspace", "apps/pfotentechnik", "run", "build:content-graph"]],
  ["npm --workspace apps/pfotentechnik run lint:content", ["--workspace", "apps/pfotentechnik", "run", "lint:content"]],
  ["npm --workspace apps/pfotentechnik run audit:repository", ["--workspace", "apps/pfotentechnik", "run", "audit:repository"]],
  ["npm --workspace apps/pfotentechnik run audit:products:strict", ["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"]],
  ["npm --workspace apps/pfotentechnik run seo:release:check:no-build", ["--workspace", "apps/pfotentechnik", "run", "seo:release:check:no-build"]],
  ["npm run build:pfotentechnik", ["run", "build:pfotentechnik"]],
];
const results = [];
for (const [label, args] of validations) {
  console.log(`\n[${PATCH_NAME}] ${label}`);
  const result = spawnSync(npm, args, { cwd: repoRoot, stdio: "inherit", windowsHide: true });
  const status = result.error ? "failed-to-start" : result.status === 0 ? "passed" : "failed";
  results.push({ command: label, status, exitCode: result.status ?? null, error: result.error?.message ?? null });
  if (status !== "passed") break;
}

const validationFile = pending.length ? path.join(backupRoot, "validation-results.json") : path.join(repoRoot, ".patch-backups", `${PATCH_NAME}-validation-${stamp}.json`);
fs.mkdirSync(path.dirname(validationFile), { recursive: true });
fs.writeFileSync(validationFile, `${JSON.stringify({ patch: PATCH_NAME, finishedAt: new Date().toISOString(), results }, null, 2)}\n`, { mode: 0o600 });
const failed = results.find((item) => item.status !== "passed");
if (failed) {
  console.error(`\n[${PATCH_NAME}] Validierung fehlgeschlagen: ${failed.command}`);
  console.error(`Ergebnisse: ${path.relative(repoRoot, validationFile)}`);
  if (pending.length) console.error(`Rollback: node ${path.relative(repoRoot, path.join(scriptDir, path.basename(import.meta.url)))} --rollback ${path.relative(repoRoot, backupRoot)}`);
  process.exit(1);
}
console.log(`\n[${PATCH_NAME}] Abgeschlossen. Alle ${results.length} Validierungen bestanden.`);
console.log(`Ergebnisse: ${path.relative(repoRoot, validationFile)}`);
