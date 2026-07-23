#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = process.cwd();
const app = path.join(repo, "apps", "pfotentechnik");
const route = path.join(app, "src", "pages", "produkt", "[product].astro");
const source = path.join(
  here,
  "payload",
  "apps",
  "pfotentechnik",
  "src",
  "components",
  "ProductQuickFactsEnhancer.astro"
);
const componentTarget = path.join(
  app,
  "src",
  "components",
  "ProductQuickFactsEnhancer.astro"
);
const backupRoot = path.join(
  repo,
  ".patch-backups",
  `quick-facts-responsive-2.5-${Date.now()}`
);
const changed = [];

if (!fs.existsSync(path.join(app, "package.json"))) {
  console.error("Bitte im Root von Yushamon/affiliate-template ausführen.");
  process.exit(1);
}

if (!fs.existsSync(route)) {
  console.error("Produktseitenroute nicht gefunden: " + route);
  process.exit(1);
}

function backup(target) {
  const rel = path.relative(repo, target);
  const destination = path.join(backupRoot, rel);
  if (fs.existsSync(target)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(target, destination);
    return destination;
  }
  return null;
}

function write(target, content) {
  const saved = backup(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  changed.push({ target, saved });
}

function rollback() {
  for (const item of changed.reverse()) {
    if (item.saved && fs.existsSync(item.saved)) {
      fs.copyFileSync(item.saved, item.target);
    } else if (fs.existsSync(item.target)) {
      fs.rmSync(item.target, { force: true });
    }
  }
}

try {
  write(componentTarget, fs.readFileSync(source));
  console.log("✓ ProductQuickFactsEnhancer.astro");

  let text = fs.readFileSync(route, "utf8");

  if (!text.includes("ProductQuickFactsEnhancer.astro")) {
    const anchor =
      'import ProjectLayout from "../../layouts/ProjectLayout.astro";';

    if (!text.includes(anchor)) {
      throw new Error("Sicherer Import-Anker wurde nicht gefunden");
    }

    text = text.replace(
      anchor,
      `${anchor}
import ProductQuickFactsEnhancer from "../../components/ProductQuickFactsEnhancer.astro";`
    );
  }

  if (!text.includes("<ProductQuickFactsEnhancer")) {
    const close = "</ProjectLayout>";
    if (!text.includes(close)) {
      throw new Error("ProjectLayout-Ende wurde nicht gefunden");
    }

    text = text.replace(
      close,
      '  <ProductQuickFactsEnhancer rootSelector="main" />\n</ProjectLayout>'
    );
  }

  write(route, text);
  console.log("✓ apps/pfotentechnik/src/pages/produkt/[product].astro");

  const result = spawnSync("npm", ["run", "build:pfotentechnik"], {
    cwd: repo,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    throw new Error("Build fehlgeschlagen");
  }

  console.log("\nQuick Facts Responsive 2.5 installiert.");
  console.log("- keine abgeschnittenen Texte");
  console.log("- Kapazität, Einsatz und Geeignet für optisch hervorgehoben");
  console.log("- restliche Fakten in flexiblem Raster");
  console.log("- passende SVG-Icons je Datentyp");
  console.log("- vollständig responsive und Dark-Mode-fähig");
  console.log(`Backup: ${backupRoot}`);
} catch (error) {
  console.error(`\n${error.message}. Rollback wird ausgeführt …`);
  rollback();
  process.exit(1);
}
