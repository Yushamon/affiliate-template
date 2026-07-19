#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const installerRoot = path.dirname(fileURLToPath(import.meta.url));
const cssRelative =
  "apps/pfotentechnik/src/styles/pfotentechnik-home-comparison-v3.1.css";
const layoutRelative =
  "apps/pfotentechnik/src/layouts/ProjectLayout.astro";
const manifestRelative =
  ".pfotentechnik-design-system-v3.1-manifest.json";
const backupRoot = path.join(
  root,
  `.pfotentechnik-design-system-v3.1-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

const abs = (relative) => path.join(root, relative);

function backup(relative) {
  if (!fs.existsSync(abs(relative))) return;
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(abs(relative), target);
}

function restore(relative) {
  const saved = path.join(backupRoot, relative);
  if (fs.existsSync(saved)) {
    fs.mkdirSync(path.dirname(abs(relative)), { recursive: true });
    fs.copyFileSync(saved, abs(relative));
  } else if (fs.existsSync(abs(relative))) {
    fs.rmSync(abs(relative), { force: true });
  }
}

const touched = [cssRelative, layoutRelative];

try {
  const required = [
    "package.json",
    layoutRelative,
    "packages/affiliate-core/src/components/home/home.css",
    "packages/affiliate-core/src/components/comparison/comparison.css"
  ];

  const missing = required.filter((file) => !fs.existsSync(abs(file)));
  if (missing.length) {
    throw new Error(
      "Installer im Root von affiliate-template ausführen. Fehlend: " +
      missing.join(", ")
    );
  }

  touched.forEach(backup);

  const source = path.join(installerRoot, "files", cssRelative);
  if (!fs.existsSync(source)) {
    throw new Error(`Payload fehlt: ${cssRelative}`);
  }

  fs.mkdirSync(path.dirname(abs(cssRelative)), { recursive: true });
  fs.copyFileSync(source, abs(cssRelative));

  let layout = fs.readFileSync(abs(layoutRelative), "utf8");
  const importLine =
    'import "../styles/pfotentechnik-home-comparison-v3.1.css";';

  if (!layout.includes(importLine)) {
    const v3 =
      'import "../styles/pfotentechnik-design-system-v3.css";';
    const v2 =
      'import "../styles/pfotentechnik-brand-system-v2.css";';
    const v1 =
      'import "../styles/pfotentechnik-brand-system.css";';

    if (layout.includes(v3)) {
      layout = layout.replace(v3, `${v3}\n${importLine}`);
    } else if (layout.includes(v2)) {
      layout = layout.replace(v2, `${v2}\n${importLine}`);
    } else if (layout.includes(v1)) {
      layout = layout.replace(v1, `${v1}\n${importLine}`);
    } else {
      const end = layout.indexOf("\n---", 3);
      if (end < 0) {
        throw new Error("Frontmatter in ProjectLayout.astro nicht erkannt.");
      }
      layout =
        layout.slice(0, end) +
        "\n" +
        importLine +
        layout.slice(end);
    }

    fs.writeFileSync(abs(layoutRelative), layout, "utf8");
  }

  fs.writeFileSync(
    abs(manifestRelative),
    JSON.stringify(
      {
        installedAt: new Date().toISOString(),
        backupRoot,
        files: touched
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log("");
  console.log("Design System 3.1 wurde installiert.");
  console.log("Betroffen: Homepage und Vergleichsseiten.");
  console.log("Wissensseiten wurden nicht verändert.");
  console.log("");
  console.log("Jetzt ausführen:");
  console.log("  npm run build:pfotentechnik");
  console.log("  npm run dev:pfotentechnik");
} catch (error) {
  [...touched].reverse().forEach(restore);
  console.error("");
  console.error("Installation fehlgeschlagen; Änderungen wurden zurückgesetzt.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
