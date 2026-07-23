#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = process.cwd();
const app = path.join(repo, "apps", "pfotentechnik");

const files = [
  {
    source: path.join(here, "payload", "apps", "pfotentechnik", "src", "components", "product-standard-2", "ProductRenderer.astro"),
    target: path.join(app, "src", "components", "product-standard-2", "ProductRenderer.astro")
  },
  {
    source: path.join(here, "payload", "apps", "pfotentechnik", "src", "pages", "produkt", "[product].astro"),
    target: path.join(app, "src", "pages", "produkt", "[product].astro")
  }
];

const obsoleteFiles = [
  path.join(app, "src", "components", "ProductQuickFactsEnhancer.astro"),
  path.join(app, "src", "components", "ProductPagePresentationFix.astro")
];

const backupRoot = path.join(repo, ".patch-backups", `product-renderer-4.1-premium-${Date.now()}`);
const changed = [];

if (!fs.existsSync(path.join(app, "package.json"))) {
  console.error("Bitte im Root von Yushamon/affiliate-template ausführen.");
  process.exit(1);
}

function backup(target) {
  const relative = path.relative(repo, target);
  const destination = path.join(backupRoot, relative);

  if (!fs.existsSync(target)) return null;

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
  return destination;
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
  for (const file of files) {
    if (!fs.existsSync(file.source)) {
      throw new Error(`Payload-Datei fehlt: ${file.source}`);
    }

    const saved = backup(file.target);
    fs.mkdirSync(path.dirname(file.target), { recursive: true });
    fs.copyFileSync(file.source, file.target);
    changed.push({ target: file.target, backup: saved });
    console.log(`✓ ${path.relative(repo, file.target)}`);
  }

  for (const obsolete of obsoleteFiles) {
    if (!fs.existsSync(obsolete)) continue;

    const saved = backup(obsolete);
    fs.rmSync(obsolete, { force: true });
    changed.push({ target: obsolete, backup: saved });
    console.log(`✓ alten Fix entfernt: ${path.relative(repo, obsolete)}`);
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

  console.log("\nProduct Renderer 4.1 Premium erfolgreich installiert.");
  console.log("- vollständiges Light-/Dark-Mode-Designsystem");
  console.log("- bestehende Datenlogik bleibt erhalten");
  console.log("- Bewertung als xx/100 ohne Sterne");
  console.log("- native Quick Facts ohne abgeschnittene Inhalte");
  console.log("- Premium Hero, Galerie, Buybox und Karten");
  console.log("- alte DOM- und Presentation-Fixes entfernt");
  console.log(`Backup: ${backupRoot}`);
} catch (error) {
  console.error(`\n${error.message}. Rollback wird ausgeführt …`);
  rollback();
  process.exit(1);
}
