#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const packageDir = path.dirname(fileURLToPath(import.meta.url));

const files = {
  renderer: path.join(root, "packages/affiliate-core/src/renderer/PremiumRenderer.astro"),
  ui: path.join(root, "packages/affiliate-core/src/styles/ui.css"),
  design: path.join(root, "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"),
};

for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    console.error(`Erwartete Repo-Datei fehlt (${name}): ${file}`);
    process.exit(1);
  }
}

const rendererSource = fs.readFileSync(files.renderer, "utf8");
const uiSource = fs.readFileSync(files.ui, "utf8");
const designSource = fs.readFileSync(files.design, "utf8");

const requiredChecks = [
  [rendererSource, "premium-v3--pfotentechnik", "PremiumRenderer v3"],
  [rendererSource, "premium-v3-checklist", "Checklist-Block"],
  [rendererSource, "premium-v3-mistakes", "Mistakes-Block"],
  [uiSource, ".ui-accordion-item", "Accordion-Styles"],
  [designSource, "PfotenTechnik Design System", "PfotenTechnik Design System"],
];

for (const [source, needle, label] of requiredChecks) {
  if (!source.includes(needle)) {
    console.error(`Repo-Stand passt nicht: ${label} wurde nicht gefunden.`);
    process.exit(1);
  }
}

const marker = "PfotenTechnik Mobile Editorial Polish 6.1.4";
if (
  rendererSource.includes(marker) ||
  uiSource.includes("PfotenTechnik FAQ Polish 6.1.4") ||
  designSource.includes("PfotenTechnik Article Media Polish 6.1.4")
) {
  console.log("Patch 6.1.4 ist bereits installiert.");
  process.exit(0);
}

const backupRoot = path.join(
  root,
  `.mobile-editorial-polish-6.1.4-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

for (const file of Object.values(files)) {
  const backup = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(file, backup);
}

const premiumPatch = fs.readFileSync(path.join(packageDir, "PremiumRenderer.6.1.4.css"), "utf8").trim();
const uiPatch = fs.readFileSync(path.join(packageDir, "FAQ.6.1.4.css"), "utf8").trim();
const globalPatch = fs.readFileSync(path.join(packageDir, "ArticleMedia.6.1.4.css"), "utf8").trim();

const styleClose = rendererSource.lastIndexOf("</style>");
if (styleClose < 0) {
  console.error("PremiumRenderer enthält keinen schließenden Style-Block.");
  process.exit(1);
}

const nextRenderer =
  rendererSource.slice(0, styleClose).trimEnd() +
  "\n\n" +
  premiumPatch +
  "\n" +
  rendererSource.slice(styleClose);

fs.writeFileSync(files.renderer, nextRenderer, "utf8");
fs.writeFileSync(files.ui, `${uiSource.trimEnd()}\n\n${uiPatch}\n`, "utf8");
fs.writeFileSync(files.design, `${designSource.trimEnd()}\n\n${globalPatch}\n`, "utf8");

const manifest = {
  installedAt: new Date().toISOString(),
  version: "6.1.4",
  backupRoot: path.relative(root, backupRoot),
  files: Object.values(files).map((file) => path.relative(root, file)),
  basedOn: {
    premiumRendererSha: "f26a043f129153638e68d378f375932653abf5af",
    uiCssSha: "f838d7117a8cc5582779605e8ff6ea26dcf5f99a",
    designSystemSha: "79aa6269733388b2d95256b3fd7f52496a74a1c3"
  }
};

fs.writeFileSync(
  path.join(root, ".mobile-editorial-polish-6.1.4.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8"
);

console.log("Mobile Editorial Polish 6.1.4 installiert.");
console.log("Geänderte Dateien:");
for (const file of Object.values(files)) {
  console.log(`- ${path.relative(root, file)}`);
}
console.log("Jetzt ausführen: npm run build:pfotentechnik");
