#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const packageRoot = path.dirname(new URL(import.meta.url).pathname);
const backupRoot = path.join(
  repoRoot,
  `.pfotentechnik-design-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const replacements = [
  {
    source: "files/apps/pfotentechnik/src/styles/pfotentechnik-brand-system.css",
    target: "apps/pfotentechnik/src/styles/pfotentechnik-brand-system.css"
  },
  {
    source: "files/packages/affiliate-core/src/components/Header.astro",
    target: "packages/affiliate-core/src/components/Header.astro"
  },
  {
    source: "files/packages/affiliate-core/src/components/Footer.astro",
    target: "packages/affiliate-core/src/components/Footer.astro"
  }
];

const layoutPath = path.join(
  repoRoot,
  "apps/pfotentechnik/src/layouts/ProjectLayout.astro"
);

if (!fs.existsSync(layoutPath)) {
  console.error("Abbruch: ProjectLayout.astro wurde nicht gefunden.");
  process.exit(1);
}

for (const item of replacements) {
  const source = path.join(packageRoot, item.source);
  if (!fs.existsSync(source)) {
    console.error(`Abbruch: Paketdatei fehlt: ${item.source}`);
    process.exit(1);
  }
}

fs.mkdirSync(backupRoot, { recursive: true });

const backup = (relativePath) => {
  const source = path.join(repoRoot, relativePath);
  if (!fs.existsSync(source)) return;

  const target = path.join(backupRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

backup("apps/pfotentechnik/src/layouts/ProjectLayout.astro");
for (const item of replacements) backup(item.target);

for (const item of replacements) {
  const source = path.join(packageRoot, item.source);
  const target = path.join(repoRoot, item.target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`installiert: ${item.target}`);
}

let layout = fs.readFileSync(layoutPath, "utf8");
const importLine = 'import "../styles/pfotentechnik-brand-system.css";';

if (!layout.includes(importLine)) {
  const anchor = 'import "../styles/pfotentechnik.css";';

  if (!layout.includes(anchor)) {
    console.error("Abbruch: CSS-Importanker wurde nicht gefunden.");
    process.exit(1);
  }

  layout = layout.replace(anchor, `${anchor}\n${importLine}`);
  fs.writeFileSync(layoutPath, layout, "utf8");
  console.log("aktualisiert: apps/pfotentechnik/src/layouts/ProjectLayout.astro");
}

const manifest = {
  installedAt: new Date().toISOString(),
  backupRoot,
  files: replacements.map((item) => item.target).concat([
    "apps/pfotentechnik/src/layouts/ProjectLayout.astro"
  ])
};

fs.writeFileSync(
  path.join(repoRoot, ".pfotentechnik-design-system-v1.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);

console.log(`\nBackup: ${backupRoot}`);
console.log("Nächster Schritt: npm run build:pfotentechnik");
