#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const stylesDir = path.join(root, "apps/pfotentechnik/src/styles");
const layoutPath = path.join(root, "apps/pfotentechnik/src/layouts/ProjectLayout.astro");
const targetCss = path.join(stylesDir, "pfotentechnik-design-system.css");
const darkModeSource = path.join(packageRoot, "dark-mode-3.6.css");
const manifestPath = path.join(root, ".pfotentechnik-design-system-3.6-manifest.json");
const backupRoot = path.join(
  root,
  `.pfotentechnik-design-system-3.6-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const legacyCssFiles = [
  "pfotentechnik-brand-system.css",
  "pfotentechnik-brand-system-v2.css",
  "pfotentechnik-design-system-v3.css",
  "pfotentechnik-home-comparison-v3.1.css",
  "pfotentechnik-design-system-v3.3.css",
  "pfotentechnik-design-system-v3.4.css",
  "pfotentechnik-design-system-v3.5.css",
  "pfotentechnik-dark-mode-3.6.css"
];

const legacyImportPattern =
  /^import\s+["']\.\.\/styles\/(?:pfotentechnik-brand-system(?:-v2)?|pfotentechnik-design-system-v3(?:\.3|\.4|\.5)?|pfotentechnik-home-comparison-v3\.1|pfotentechnik-dark-mode-3\.6)\.css["'];\s*$/gm;

function backupPath(source) {
  if (!fs.existsSync(source)) return;
  const relative = path.relative(root, source);
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(layoutPath) || !fs.existsSync(stylesDir)) {
  fail("Installer muss im Root von affiliate-template ausgeführt werden.");
}
if (!fs.existsSync(darkModeSource)) {
  fail("dark-mode-3.6.css fehlt im Paket.");
}

const existingLegacyFiles = legacyCssFiles
  .map((name) => path.join(stylesDir, name))
  .filter((file) => fs.existsSync(file));

if (existingLegacyFiles.length === 0 && !fs.existsSync(targetCss)) {
  fail("Keine bestehenden Design-System-Dateien gefunden.");
}

backupPath(layoutPath);
backupPath(targetCss);
for (const file of existingLegacyFiles) backupPath(file);

const sections = [];

for (const file of existingLegacyFiles) {
  if (path.basename(file) === "pfotentechnik-dark-mode-3.6.css") continue;

  const content = fs.readFileSync(file, "utf8").trim();
  if (!content) continue;

  sections.push(
    `/* ============================================================\n` +
    ` * Consolidated from: ${path.basename(file)}\n` +
    ` * ============================================================ */\n\n` +
    content
  );
}

if (fs.existsSync(targetCss)) {
  const currentConsolidated = fs.readFileSync(targetCss, "utf8").trim();
  if (currentConsolidated && sections.length === 0) {
    sections.push(currentConsolidated);
  }
}

sections.push(fs.readFileSync(darkModeSource, "utf8").trim());

const consolidated =
  `/*\n` +
  ` * PfotenTechnik Design System\n` +
  ` * Consolidated by Design System 3.6.\n` +
  ` * Do not add new versioned CSS imports. Extend this file instead.\n` +
  ` */\n\n` +
  sections.join("\n\n");

fs.writeFileSync(targetCss, consolidated + "\n", "utf8");

let layout = fs.readFileSync(layoutPath, "utf8");
layout = layout.replace(legacyImportPattern, "");

const baseImport = 'import "../styles/pfotentechnik.css";';
const consolidatedImport = 'import "../styles/pfotentechnik-design-system.css";';

if (!layout.includes(baseImport)) {
  fail("Basis-Import pfotentechnik.css wurde im ProjectLayout nicht gefunden.");
}

if (!layout.includes(consolidatedImport)) {
  layout = layout.replace(baseImport, `${baseImport}\n${consolidatedImport}`);
}

layout = layout.replace(/\n{3,}/g, "\n\n");
fs.writeFileSync(layoutPath, layout, "utf8");

for (const file of existingLegacyFiles) {
  if (file !== targetCss) fs.rmSync(file, { force: true });
}

fs.writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      installedAt: new Date().toISOString(),
      backupRoot,
      layout: path.relative(root, layoutPath),
      consolidatedCss: path.relative(root, targetCss),
      removedCss: existingLegacyFiles.map((file) => path.relative(root, file))
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log("");
console.log("PfotenTechnik Design System 3.6 konsolidiert.");
console.log("");
console.log("ProjectLayout lädt jetzt nur:");
console.log('  import "../styles/pfotentechnik.css";');
console.log('  import "../styles/pfotentechnik-design-system.css";');
console.log("");
console.log(`Zusammengeführt: ${existingLegacyFiles.length} alte CSS-Dateien`);
console.log(`Neue Datei: ${path.relative(root, targetCss)}`);
console.log(`Backup: ${path.relative(root, backupRoot)}`);
console.log("");
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");
