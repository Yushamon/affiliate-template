#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = process.cwd();
const app = path.join(repo, "apps", "pfotentechnik");
const payload = path.join(here, "payload");
const backup = path.join(repo, ".patch-backups", `product-engine-2.1.1-${Date.now()}`);
const changed = [];

if (!fs.existsSync(path.join(app, "package.json"))) {
  console.error("Bitte im Root von Yushamon/affiliate-template ausführen.");
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function restore() {
  for (const item of changed.reverse()) {
    if (item.backup && fs.existsSync(item.backup)) {
      fs.copyFileSync(item.backup, item.target);
    } else if (fs.existsSync(item.target)) {
      fs.rmSync(item.target, { force: true });
    }
  }
}

try {
  for (const source of walk(payload)) {
    const rel = path.relative(payload, source);
    const target = path.join(repo, rel);
    const saved = path.join(backup, rel);

    if (fs.existsSync(target)) {
      fs.mkdirSync(path.dirname(saved), { recursive: true });
      fs.copyFileSync(target, saved);
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    changed.push({ target, backup: fs.existsSync(saved) ? saved : null });
    console.log(`✓ ${rel}`);
  }

  const packagePath = path.join(app, "package.json");
  const packageBackup = path.join(backup, "apps/pfotentechnik/package.json");
  fs.mkdirSync(path.dirname(packageBackup), { recursive: true });
  fs.copyFileSync(packagePath, packageBackup);

  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  pkg.scripts ||= {};
  pkg.scripts["audit:product-standard-2"] =
    pkg.scripts["audit:product-standard-2"] || "node scripts/audit-product-standard-2.mjs";
  pkg.scripts["audit:product-standard-2:strict"] =
    pkg.scripts["audit:product-standard-2:strict"] || "node scripts/audit-product-standard-2.mjs --strict";
  pkg.scripts["audit:product-engine"] =
    pkg.scripts["audit:product-engine"] || "node scripts/audit-product-engine.mjs";
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

  console.log("\nBuild wird geprüft …");
  const result = spawnSync("npm", ["run", "build:pfotentechnik"], {
    cwd: repo,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    fs.copyFileSync(packageBackup, packagePath);
    throw new Error("Build fehlgeschlagen");
  }

  console.log("\nProduct Engine 2.1.1 vollständig installiert.");
  console.log(`Backup: ${backup}`);
} catch (error) {
  console.error(`\n${error.message}. Rollback wird ausgeführt …`);
  restore();
  process.exit(1);
}
