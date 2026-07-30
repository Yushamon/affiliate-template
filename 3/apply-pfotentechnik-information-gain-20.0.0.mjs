#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const VERSION = "20.0.0";
const PREFIX = `[pfotentechnik-information-gain-${VERSION}]`;
const here = path.dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const withBuild = args.has("--build");

const files = [
  {
    path: "apps/pfotentechnik/src/domain/contentPlatform/assembleContentPage.ts",
    before: "ca5607bfd188cc972dc606a9f7c356453a704fdbc6c85786777d3e5b0b45a86a",
    after: "c0fa98a8c5724ea1bf97e21d0fe8cd50c5944c51c69551199b89890438be633e"
  },
  {
    path: "apps/pfotentechnik/src/pages/[slug].astro",
    before: "2c451781df9aa8c187f70195824b60f8666005ac4e5a004c3ec903b1b9118a79",
    after: "58709fa1e5f8bc033a21d5703635cd45674f8a8b5e3d8ba6dd2e27d561d7ad23"
  },
  {
    path: "apps/pfotentechnik/src/components/EditorialEvidence.astro",
    before: null,
    after: "6410c3f81671c8c503c57601210b32aa4c71aff97896bee0b0ddb8da559b796f"
  },
  {
    path: "apps/pfotentechnik/src/domain/contentPlatform/informationGainProfiles.ts",
    before: null,
    after: "66bfd8fec4f4645f49b8f6d8fa43571f1631f14545c3fd002b6d8bb332ebdbd6"
  }
];

const sha256 = (file) =>
  crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

const findRepoRoot = () => {
  let current = process.cwd();
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps/pfotentechnik/package.json"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(
    "Repository-Wurzel nicht gefunden. Starte den Installer im Repository Yushamon/affiliate-template."
  );
};

const copyAtomic = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}`;
  fs.copyFileSync(source, temporary);
  fs.renameSync(temporary, target);
};

const run = (root, command, commandArgs) => {
  console.log(`${PREFIX} Prüfe: ${command} ${commandArgs.join(" ")}`);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Validierung fehlgeschlagen: ${command} ${commandArgs.join(" ")}`);
  }
};

const root = findRepoRoot();
const payloadRoot = path.join(here, "payload");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `pfotentechnik-information-gain-${VERSION}-${timestamp}`
);

console.log(`${PREFIX} Vorprüfung`);

for (const entry of files) {
  const target = path.join(root, entry.path);
  const payload = path.join(payloadRoot, entry.path);
  if (!fs.existsSync(payload)) {
    throw new Error(`Payload fehlt: ${entry.path}`);
  }
  if (sha256(payload) !== entry.after) {
    throw new Error(`Payload-Prüfsumme stimmt nicht: ${entry.path}`);
  }

  if (!fs.existsSync(target)) {
    if (entry.before !== null && !force) {
      throw new Error(`Erwartete Zieldatei fehlt: ${entry.path}`);
    }
    continue;
  }

  const current = sha256(target);
  if (current === entry.after) continue;
  if (entry.before === null && !force) {
    throw new Error(
      `${entry.path} existiert bereits mit anderem Inhalt. Prüfe die Datei oder nutze --force bewusst.`
    );
  }
  if (entry.before && current !== entry.before && !force) {
    throw new Error(
      `${entry.path} entspricht nicht dem erwarteten Ausgangsstand. So werden neuere Änderungen nicht überschrieben. ` +
      "Prüfe den Stand oder nutze --force bewusst."
    );
  }
}

const changed = files.filter((entry) => {
  const target = path.join(root, entry.path);
  return !fs.existsSync(target) || sha256(target) !== entry.after;
});

if (changed.length === 0) {
  console.log(`${PREFIX} Unverändert: Patch ist bereits vollständig installiert.`);
  process.exit(0);
}

fs.mkdirSync(backupRoot, { recursive: true });
for (const entry of changed) {
  const target = path.join(root, entry.path);
  if (fs.existsSync(target)) {
    copyAtomic(target, path.join(backupRoot, entry.path));
  }
}

const restore = () => {
  for (const entry of changed) {
    const target = path.join(root, entry.path);
    const backup = path.join(backupRoot, entry.path);
    if (fs.existsSync(backup)) {
      copyAtomic(backup, target);
    } else if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
  }
};

try {
  for (const entry of changed) {
    copyAtomic(path.join(payloadRoot, entry.path), path.join(root, entry.path));
    console.log(`${PREFIX} Geändert: ${entry.path}`);
  }

  run(root, "npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:content-quality"
  ]);

  if (withBuild) {
    const result = spawnSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", "build"],
      {
        cwd: root,
        stdio: "inherit",
        shell: process.platform === "win32",
        env: {
          ...process.env,
          ASTRO_TELEMETRY_DISABLED: "1"
        }
      }
    );
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error("Build fehlgeschlagen.");

    run(root, "npm", [
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "audit:internal-link-targets:strict"
    ]);
  }
} catch (error) {
  console.error(`${PREFIX} FEHLER: ${error.message}`);
  console.error(`${PREFIX} Änderungen werden aus dem Backup zurückgesetzt.`);
  restore();
  process.exit(1);
}

console.log("");
console.log(`${PREFIX} Abgeschlossen.`);
console.log(`Backups: ${path.relative(root, backupRoot)}`);
console.log(
  withBuild
    ? "Validierung: Content-Quality-Tests, vollständiger Build und Linkziel-Audit bestanden."
    : "Validierung: Content-Quality-Tests bestanden. Für vollständigen Build erneut mit --build ausführen."
);

