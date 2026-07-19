#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const installerRoot = path.dirname(fileURLToPath(import.meta.url));

const files = [
  "packages/affiliate-core/src/components/TableOfContents.astro",
  "apps/pfotentechnik/src/styles/pfotentechnik-design-system-v3.css"
];

const layoutFile = "apps/pfotentechnik/src/layouts/ProjectLayout.astro";
const manifestFile = ".pfotentechnik-design-system-v3-manifest.json";
const backupRoot = path.join(
  root,
  `.pfotentechnik-design-system-v3-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function abs(relative) {
  return path.join(root, relative);
}

function backup(relative) {
  const source = abs(relative);
  if (!fs.existsSync(source)) return false;
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

function restore(relative) {
  const target = abs(relative);
  const saved = path.join(backupRoot, relative);

  if (fs.existsSync(saved)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(saved, target);
  } else if (fs.existsSync(target)) {
    fs.rmSync(target, { force: true });
  }
}

const touched = [...files, layoutFile];

try {
  const required = [
    "package.json",
    layoutFile,
    "packages/affiliate-core/src/components/TableOfContents.astro",
    "apps/pfotentechnik/src/pages/[slug].astro"
  ];

  const missing = required.filter((file) => !fs.existsSync(abs(file)));
  if (missing.length) {
    throw new Error(
      "Installer im Root von affiliate-template ausführen. Fehlend: " +
      missing.join(", ")
    );
  }

  touched.forEach(backup);

  for (const relative of files) {
    const source = path.join(installerRoot, "files", relative);
    if (!fs.existsSync(source)) {
      throw new Error(`Payload fehlt: ${relative}`);
    }
    fs.mkdirSync(path.dirname(abs(relative)), { recursive: true });
    fs.copyFileSync(source, abs(relative));
    console.log(`Installiert: ${relative}`);
  }

  let layout = fs.readFileSync(abs(layoutFile), "utf8");
  const importLine = 'import "../styles/pfotentechnik-design-system-v3.css";';

  if (!layout.includes(importLine)) {
    const v2 = 'import "../styles/pfotentechnik-brand-system-v2.css";';
    const v1 = 'import "../styles/pfotentechnik-brand-system.css";';
    const base = 'import "../styles/pfotentechnik.css";';

    if (layout.includes(v2)) {
      layout = layout.replace(v2, `${v2}\n${importLine}`);
    } else if (layout.includes(v1)) {
      layout = layout.replace(v1, `${v1}\n${importLine}`);
    } else if (layout.includes(base)) {
      layout = layout.replace(base, `${base}\n${importLine}`);
    } else {
      const end = layout.indexOf("\n---", 3);
      if (end < 0) {
        throw new Error("Frontmatter in ProjectLayout.astro nicht erkannt.");
      }
      layout = layout.slice(0, end) + "\n" + importLine + layout.slice(end);
    }

    fs.writeFileSync(abs(layoutFile), layout, "utf8");
  }

  fs.writeFileSync(
    abs(manifestFile),
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
  console.log("PfotenTechnik Design System 3.0 erfolgreich installiert.");
  console.log(`Backup: ${path.relative(root, backupRoot)}`);
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
