#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = process.cwd();
const installerRoot = path.dirname(fileURLToPath(import.meta.url));
const layoutRelative = "apps/pfotentechnik/src/layouts/ProjectLayout.astro";
const cssRelative = "apps/pfotentechnik/src/styles/pfotentechnik-brand-system-v2.css";
const manifestRelative = ".pfotentechnik-brand-system-v2-manifest.json";
const backupRoot = path.join(
  repoRoot,
  `.pfotentechnik-brand-system-v2-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const layoutPath = path.join(repoRoot, layoutRelative);
const cssPath = path.join(repoRoot, cssRelative);
const payloadPath = path.join(installerRoot, "files", cssRelative);
const manifestPath = path.join(repoRoot, manifestRelative);

function fail(message) {
  throw new Error(message);
}

function copyToBackup(relative) {
  const source = path.join(repoRoot, relative);
  if (!fs.existsSync(source)) return false;
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

function restore(relative) {
  const backup = path.join(backupRoot, relative);
  const target = path.join(repoRoot, relative);
  if (fs.existsSync(backup)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(backup, target);
  } else if (relative === cssRelative && fs.existsSync(target)) {
    fs.rmSync(target, { force: true });
  }
}

try {
  if (!fs.existsSync(path.join(repoRoot, "package.json"))) {
    fail("Kein package.json gefunden. Installer im Root von affiliate-template ausführen.");
  }
  if (!fs.existsSync(layoutPath)) {
    fail(`Layout nicht gefunden: ${layoutRelative}`);
  }
  if (!fs.existsSync(payloadPath)) {
    fail(`Installer-Payload fehlt: ${cssRelative}`);
  }

  copyToBackup(layoutRelative);
  copyToBackup(cssRelative);

  fs.mkdirSync(path.dirname(cssPath), { recursive: true });
  fs.copyFileSync(payloadPath, cssPath);

  let layout = fs.readFileSync(layoutPath, "utf8");
  const importLine = 'import "../styles/pfotentechnik-brand-system-v2.css";';

  if (!layout.includes(importLine)) {
    const v1Import = 'import "../styles/pfotentechnik-brand-system.css";';
    const baseImport = 'import "../styles/pfotentechnik.css";';

    if (layout.includes(v1Import)) {
      layout = layout.replace(v1Import, `${v1Import}\n${importLine}`);
    } else if (layout.includes(baseImport)) {
      layout = layout.replace(baseImport, `${baseImport}\n${importLine}`);
    } else {
      const boundary = layout.indexOf("\n---", 3);
      if (boundary < 0) fail("Astro-Frontmatter in ProjectLayout.astro nicht erkannt.");
      layout = layout.slice(0, boundary) + "\n" + importLine + layout.slice(boundary);
    }
    fs.writeFileSync(layoutPath, layout, "utf8");
  }

  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        installedAt: new Date().toISOString(),
        backupRoot,
        files: [layoutRelative, cssRelative]
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log("");
  console.log("PfotenTechnik Brand System 2.0 wurde installiert.");
  console.log(`Theme-Datei: ${cssRelative}`);
  console.log(`Backup: ${path.relative(repoRoot, backupRoot)}`);
  console.log("");
  console.log("Jetzt ausführen:");
  console.log("  npm run build:pfotentechnik");
  console.log("  npm run dev:pfotentechnik");
  console.log("");
  console.log("Danach Light Mode und Dark Mode auf Startseite, Ratgeber, Vergleich und Produktseite prüfen.");
} catch (error) {
  restore(cssRelative);
  restore(layoutRelative);
  console.error("");
  console.error("Installation fehlgeschlagen; Änderungen wurden zurückgesetzt.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
