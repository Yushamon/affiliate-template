#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = process.cwd();
const app = path.join(repo, "apps", "pfotentechnik");
const payload = path.join(here, "payload");
const backupRoot = path.join(
  repo,
  ".patch-backups",
  `product-engine-2.3-adaptive-renderer-${Date.now()}`
);
const changed = [];

if (!fs.existsSync(path.join(app, "package.json"))) {
  console.error("Bitte im Root von Yushamon/affiliate-template ausführen.");
  process.exit(1);
}

const route = path.join(app, "src", "pages", "produkt", "[product].astro");
if (!fs.existsSync(route)) {
  console.error("Produktseitenroute wurde nicht gefunden.");
  process.exit(1);
}

const routeText = fs.readFileSync(route, "utf8");
if (!routeText.includes("<ProductRenderer")) {
  console.error("Product Engine 2.2 muss zuerst installiert sein: ProductRenderer fehlt in der Route.");
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function rollback() {
  for (const item of changed.reverse()) {
    if (item.backup && fs.existsSync(item.backup)) {
      fs.mkdirSync(path.dirname(item.target), { recursive: true });
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
    const backup = path.join(backupRoot, rel);

    if (fs.existsSync(target)) {
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.copyFileSync(target, backup);
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    changed.push({
      target,
      backup: fs.existsSync(backup) ? backup : null
    });

    console.log(`✓ ${rel}`);
  }

  console.log("\nPrüfe Build …");
  const result = spawnSync("npm", ["run", "build:pfotentechnik"], {
    cwd: repo,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    throw new Error("Build fehlgeschlagen");
  }

  console.log("\nProduct Engine 2.3 Adaptive Renderer installiert.");
  console.log("Bestehende Produktdarstellung bleibt vollständig erhalten.");
  console.log("Neue Intelligence-Blöcke werden nur bei vorhandenen Daten ergänzt.");
  console.log("Debug bleibt standardmäßig deaktiviert.");
  console.log(`Backup: ${backupRoot}`);
} catch (error) {
  console.error(`\n${error.message}. Rollback wird ausgeführt …`);
  rollback();
  process.exit(1);
}
