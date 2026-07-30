#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-comparison-information-gain-20.1.0";
const EXPECTED_FILE_COUNT = 24;
const PATCH_ROOT = path.dirname(fileURLToPath(import.meta.url));
const PAYLOAD_BEFORE = path.join(PATCH_ROOT, "payload", "before");
const PAYLOAD_AFTER = path.join(PATCH_ROOT, "payload", "after");
const args = new Set(process.argv.slice(2));
const allowedArgs = new Set([
  "--check",
  "--commit",
  "--force",
  "--help",
  "--skip-validation",
]);

function fail(message, exitCode = 1) {
  console.error(`\n[${PATCH_ID}] FEHLER: ${message}`);
  process.exit(exitCode);
}

function printHelp() {
  console.log(`
${PATCH_ID}

Aufruf:
  node ${path.basename(import.meta.url)} --check
  node ${path.basename(import.meta.url)}

Optionen:
  --check             Nur Vorprüfung, keine Änderungen
  --force             Abweichende Vergleichsdateien nach Backup überschreiben
  --skip-validation   Audits und Produktions-Build auslassen
  --commit            Nur die 24 Vergleichsdateien lokal committen
  --help              Hilfe anzeigen
`);
}

for (const arg of args) {
  if (!allowedArgs.has(arg)) fail(`Unbekannte Option: ${arg}`);
}

if (args.has("--help")) {
  printHelp();
  process.exit(0);
}

function locateRepositoryRoot(startDirectory) {
  let current = path.resolve(startDirectory);
  while (true) {
    if (
      existsSync(path.join(current, "package.json")) &&
      existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      fail(
        "Repository-Wurzel nicht gefunden. Starte den Installer im Repository affiliate-template.",
      );
    }
    current = parent;
  }
}

function listFiles(rootDirectory, relativeDirectory = "") {
  const absoluteDirectory = path.join(rootDirectory, relativeDirectory);
  if (!existsSync(absoluteDirectory)) fail(`Payload fehlt: ${absoluteDirectory}`);

  return readdirSync(absoluteDirectory)
    .sort()
    .flatMap((entry) => {
      const relativePath = path.join(relativeDirectory, entry);
      const absolutePath = path.join(rootDirectory, relativePath);
      return statSync(absolutePath).isDirectory()
        ? listFiles(rootDirectory, relativePath)
        : [relativePath.split(path.sep).join("/")];
    });
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function readBuffer(filePath) {
  return readFileSync(filePath);
}

function sameBuffer(left, right) {
  return left.length === right.length && left.equals(right);
}

function run(command, commandArgs, repositoryRoot) {
  const printable = [command, ...commandArgs].join(" ");
  console.log(`\n> ${printable}`);
  const result = spawnSync(command, commandArgs, {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      ASTRO_TELEMETRY_DISABLED: "1",
    },
    shell: false,
    stdio: "inherit",
  });

  if (result.error) fail(`${printable}: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`Validierung fehlgeschlagen: ${printable} (Exit ${result.status})`);
  }
}

function createRollbackScript(backupRoot) {
  const rollbackPath = path.join(backupRoot, "rollback.mjs");
  const source = `#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backupRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(backupRoot, "..", "..");
const filesRoot = path.join(backupRoot, "files");

function listFiles(root, relative = "") {
  return readdirSync(path.join(root, relative)).flatMap((entry) => {
    const next = path.join(relative, entry);
    return statSync(path.join(root, next)).isDirectory()
      ? listFiles(root, next)
      : [next];
  });
}

if (!existsSync(filesRoot)) {
  console.error("Backup-Dateien fehlen.");
  process.exit(1);
}

for (const relativePath of listFiles(filesRoot)) {
  const target = path.join(repositoryRoot, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(path.join(filesRoot, relativePath), target);
  console.log(\`Wiederhergestellt: \${relativePath}\`);
}
`;
  writeFileSync(rollbackPath, source, "utf8");
  return rollbackPath;
}

const repositoryRoot = locateRepositoryRoot(process.cwd());
const beforeFiles = listFiles(PAYLOAD_BEFORE);
const afterFiles = listFiles(PAYLOAD_AFTER);

if (beforeFiles.length !== EXPECTED_FILE_COUNT) {
  fail(
    `Ungültiger Vorher-Payload: ${beforeFiles.length} statt ${EXPECTED_FILE_COUNT} Dateien.`,
  );
}
if (
  afterFiles.length !== EXPECTED_FILE_COUNT ||
  JSON.stringify(beforeFiles) !== JSON.stringify(afterFiles)
) {
  fail("Vorher- und Nachher-Payload stimmen nicht überein.");
}

const states = afterFiles.map((relativePath) => {
  const targetPath = path.join(repositoryRoot, relativePath);
  const before = readBuffer(path.join(PAYLOAD_BEFORE, relativePath));
  const after = readBuffer(path.join(PAYLOAD_AFTER, relativePath));
  const current = existsSync(targetPath) ? readBuffer(targetPath) : null;
  let status = "conflict";

  if (current && sameBuffer(current, after)) status = "installed";
  else if (current && sameBuffer(current, before)) status = "ready";

  return {
    after,
    beforeHash: sha256(before),
    currentHash: current ? sha256(current) : null,
    relativePath,
    status,
    targetPath,
  };
});

const ready = states.filter((entry) => entry.status === "ready");
const installed = states.filter((entry) => entry.status === "installed");
const conflicts = states.filter((entry) => entry.status === "conflict");

console.log(`[${PATCH_ID}] Vorprüfung`);
console.log(`Bereit: ${ready.length}`);
console.log(`Bereits installiert: ${installed.length}`);
console.log(`Konflikte: ${conflicts.length}`);

if (conflicts.length > 0) {
  console.log("\nAbweichende Dateien:");
  for (const entry of conflicts) {
    console.log(
      `- ${entry.relativePath} (${entry.currentHash ? "geändert" : "fehlt"})`,
    );
  }
}

if (args.has("--check")) {
  process.exit(conflicts.length > 0 ? 2 : 0);
}

if (conflicts.length > 0 && !args.has("--force")) {
  fail(
    "Vorprüfung abgebrochen. Prüfe die abweichenden Dateien oder verwende bewusst --force.",
    2,
  );
}

const toWrite = states.filter((entry) => entry.status !== "installed");
if (toWrite.length === 0) {
  console.log(`\n[${PATCH_ID}] Bereits vollständig installiert.`);
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  repositoryRoot,
  ".patch-backups",
  `${PATCH_ID}-${timestamp}`,
);
const backupFilesRoot = path.join(backupRoot, "files");
mkdirSync(backupFilesRoot, { recursive: true });

for (const entry of toWrite) {
  if (!existsSync(entry.targetPath)) continue;
  const backupPath = path.join(backupFilesRoot, entry.relativePath);
  mkdirSync(path.dirname(backupPath), { recursive: true });
  copyFileSync(entry.targetPath, backupPath);
}

writeFileSync(
  path.join(backupRoot, "manifest.json"),
  `${JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      files: toWrite.map((entry) => ({
        beforeHash: entry.beforeHash,
        currentHash: entry.currentHash,
        path: entry.relativePath,
        preflightStatus: entry.status,
      })),
      patchId: PATCH_ID,
    },
    null,
    2,
  )}\n`,
  "utf8",
);
const rollbackPath = createRollbackScript(backupRoot);

for (const entry of toWrite) {
  mkdirSync(path.dirname(entry.targetPath), { recursive: true });
  writeFileSync(entry.targetPath, entry.after);
  console.log(`Geändert: ${entry.relativePath}`);
}

console.log(`\nBackups: ${path.relative(repositoryRoot, backupRoot)}`);
console.log(`Rollback: node ${path.relative(repositoryRoot, rollbackPath)}`);

if (!args.has("--skip-validation")) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const validations = [
    ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"],
    [
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "comparison:data:audit:strict",
    ],
    ["--workspace", "apps/pfotentechnik", "run", "comparison:metadata:check"],
    ["run", "build:pfotentechnik"],
    ["--workspace", "apps/pfotentechnik", "run", "audit:comparison-schema"],
    [
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "audit:content-quality:strict",
    ],
    [
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "audit:internal-link-targets:strict",
    ],
  ];

  for (const validationArgs of validations) {
    run(npm, validationArgs, repositoryRoot);
  }
}

if (args.has("--commit")) {
  const gitCheck = spawnSync("git", ["diff", "--cached", "--quiet"], {
    cwd: repositoryRoot,
    stdio: "ignore",
  });
  if (gitCheck.status !== 0) {
    fail("Es gibt bereits vorgemerkte Git-Änderungen. Commit wurde nicht erstellt.");
  }

  run("git", ["add", "--", ...afterFiles], repositoryRoot);
  run(
    "git",
    [
      "commit",
      "-m",
      "content(pfotentechnik): add comparison information gain",
    ],
    repositoryRoot,
  );
}

console.log(`\n[${PATCH_ID}] Abgeschlossen.`);
console.log(`Vergleichsseiten aktualisiert: ${toWrite.length}`);
console.log(
  args.has("--commit")
    ? "Lokal committed. Kein Push und kein Pull Request."
    : "Kein Commit, kein Push und kein Pull Request.",
);
