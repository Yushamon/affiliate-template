#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const installerRoot = path.dirname(fileURLToPath(import.meta.url));
const cssRelative = "apps/pfotentechnik/src/styles/pfotentechnik-design-system-v3.4.css";
const layoutRelative = "apps/pfotentechnik/src/layouts/ProjectLayout.astro";
const manifestRelative = ".pfotentechnik-design-system-v3.4-manifest.json";
const backupRoot = path.join(root, `.pfotentechnik-design-system-v3.4-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`);

const abs = (p) => path.join(root, p);

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
    "packages/affiliate-core/src/components/home/HomeUseCases.astro",
    "packages/affiliate-core/src/components/product/ProductReview.astro",
    "apps/pfotentechnik/src/pages/produkt/[product].astro"
  ];
  const missing = required.filter((file) => !fs.existsSync(abs(file)));
  if (missing.length) throw new Error("Installer im Repository-Root ausführen. Fehlend: " + missing.join(", "));

  touched.forEach(backup);

  const source = path.join(installerRoot, "files", cssRelative);
  fs.mkdirSync(path.dirname(abs(cssRelative)), { recursive: true });
  fs.copyFileSync(source, abs(cssRelative));

  let layout = fs.readFileSync(abs(layoutRelative), "utf8");
  const importLine = 'import "../styles/pfotentechnik-design-system-v3.4.css";';

  if (!layout.includes(importLine)) {
    const anchors = [
      'import "../styles/pfotentechnik-design-system-v3.3.css";',
      'import "../styles/pfotentechnik-product-v3.2.css";',
      'import "../styles/pfotentechnik-home-comparison-v3.1.css";',
      'import "../styles/pfotentechnik-design-system-v3.css";'
    ];
    const anchor = anchors.find((candidate) => layout.includes(candidate));
    if (anchor) {
      layout = layout.replace(anchor, `${anchor}\n${importLine}`);
    } else {
      const end = layout.indexOf("\n---", 3);
      if (end < 0) throw new Error("Astro-Frontmatter nicht erkannt.");
      layout = layout.slice(0, end) + "\n" + importLine + layout.slice(end);
    }
    fs.writeFileSync(abs(layoutRelative), layout, "utf8");
  }

  fs.writeFileSync(abs(manifestRelative), JSON.stringify({
    installedAt: new Date().toISOString(),
    backupRoot,
    files: touched
  }, null, 2) + "\n");

  console.log("Design System 3.4 installiert.");
  console.log("Jetzt: npm run build:pfotentechnik");
} catch (error) {
  [...touched].reverse().forEach(restore);
  console.error("Installation fehlgeschlagen; Änderungen zurückgesetzt.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
