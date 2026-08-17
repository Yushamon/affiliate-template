#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-petwalk-media-repair-32.5.0";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

function run(cmd, args, cwd) {
  console.log(`[${PATCH}] $ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: false });
  if (r.status !== 0) {
    throw new Error(`[${PATCH}] Command fehlgeschlagen (${r.status}): ${cmd} ${args.join(" ")}`);
  }
}

const root = findRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const mdFile = path.join(app, "src", "content", "products", "petwalk-medium-tiertuer.md");
const imageDir = path.join(app, "src", "assets", "images", "products", "petwalk-medium-tiertuer");

if (!fs.existsSync(mdFile)) {
  throw new Error(`[${PATCH}] Produkt-MD fehlt: ${path.relative(root, mdFile)}`);
}
if (!fs.existsSync(imageDir)) {
  throw new Error(`[${PATCH}] Bildordner fehlt: ${path.relative(root, imageDir)}`);
}

const files = fs.readdirSync(imageDir).sort();
console.log(`[${PATCH}] Vorhandene Assets (${files.length}):`);
for (const f of files) console.log(`- ${f}`);

for (const required of ["hero.webp", "thumbnail.webp", "comparison.webp"]) {
  if (!files.includes(required)) {
    throw new Error(`[${PATCH}] Erwartetes Asset fehlt: ${path.relative(root, path.join(imageDir, required))}`);
  }
}

const galleryFiles = files
  .filter((f) => /^gallery-\d+\.webp$/i.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

if (galleryFiles.length === 0) {
  throw new Error(`[${PATCH}] Keine gallery-N.webp im Produktordner gefunden.`);
}

const backup = `${mdFile}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(mdFile, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

let source = fs.readFileSync(mdFile, "utf8");
const base = "../../assets/images/products/petwalk-medium-tiertuer/";

function replaceInlineImage(key, filename, alt) {
  const rx = new RegExp(
    `(^[ \\t]*${key}:\\s*\\{\\s*src:\\s*")[^"]+(".*?alt:\\s*")[^"]*(".*?\\}\\s*$)`,
    "m"
  );
  if (!rx.test(source)) {
    throw new Error(`[${PATCH}] images.${key} konnte nicht gefunden werden.`);
  }
  source = source.replace(rx, `$1${base}${filename}$2${alt}$3`);
}

replaceInlineImage(
  "hero",
  "hero.webp",
  "petWALK Medium Tiertür in dunkler Ausführung als freigestellte Produktansicht"
);
replaceInlineImage(
  "thumbnail",
  "thumbnail.webp",
  "petWALK Medium frontal mit massivem Rahmen und motorisiertem Türblatt"
);
replaceInlineImage(
  "comparison",
  "comparison.webp",
  "petWALK Medium als motorisierte Premium-Tiertür für Katzen und kleinere Hunde"
);

const galleryStart = source.match(/^  gallery:\s*$/m);
if (!galleryStart) {
  throw new Error(`[${PATCH}] images.gallery nicht gefunden.`);
}

const start = galleryStart.index;
const afterStart = start + galleryStart[0].length;
const tail = source.slice(afterStart);
const nextTopLevel = tail.match(/\n[a-zA-Z][\w-]*:/);

if (!nextTopLevel) {
  throw new Error(`[${PATCH}] Ende des images-Blocks konnte nicht bestimmt werden.`);
}

const end = afterStart + nextTopLevel.index;
const alts = [
  "Frontansicht der petWALK Medium mit Türblatt und oberer Bedieneinheit",
  "petWALK Medium in Dreiviertelansicht mit sichtbarer Rahmentiefe",
  "Detailansicht von Bedienbereich, Türblatt und Verriegelungszone der petWALK Medium",
  "petWALK Medium als hochwertig integrierte automatische Tiertür",
  "Größen- und Passformeindruck der petWALK Medium für Katzen und kleinere Hunde",
];

const galleryBlock =
  "  gallery:\n" +
  galleryFiles
    .map((file, i) => {
      const alt = alts[i] ?? `Weitere Produktansicht ${i + 1} der petWALK Medium Tiertür`;
      return `    - { src: "${base}${file}", alt: "${alt}" }`;
    })
    .join("\n");

source = source.slice(0, start) + galleryBlock + source.slice(end);

// Sicherheitsnetz: alte Pfade für genau dieses Produkt dürfen nicht mehr existieren.
const stale = source.match(
  /\.\.\/\.\.\/assets\/images\/products\/petwalk-medium-tiertuer\/[^"\n]+\.(?:png|svg)/gi
);
if (stale?.length) {
  throw new Error(
    `[${PATCH}] Alte PNG/SVG-Referenzen verbleiben:\n${[...new Set(stale)].map(x => `- ${x}`).join("\n")}`
  );
}

// Aktualisierungsdatum nur dann anheben, wenn das Feld vorhanden ist.
source = source.replace(/^updatedAt:\s*"[^"]+"/m, 'updatedAt: "2026-08-17"');

fs.writeFileSync(mdFile, source, "utf8");
console.log(`[${PATCH}] Gepatcht: ${path.relative(root, mdFile)}`);

const expectedRefs = [
  `${base}hero.webp`,
  `${base}thumbnail.webp`,
  `${base}comparison.webp`,
  ...galleryFiles.map(f => `${base}${f}`),
];

for (const ref of expectedRefs) {
  if (!source.includes(ref)) {
    throw new Error(`[${PATCH}] Erwartete Referenz fehlt nach Patch: ${ref}`);
  }
}

console.log(`[${PATCH}] Medienreferenzen OK:`);
for (const ref of expectedRefs) console.log(`- ${ref}`);

// Prüfen, ob es im gesamten Pfotentechnik-Quellbaum noch alte petWALK-Referenzen gibt.
const srcRoot = path.join(app, "src");
const leftovers = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(md|mdx|astro|ts|tsx|js|mjs|json|yaml|yml)$/i.test(entry.name)) {
      const txt = fs.readFileSync(full, "utf8");
      if (
        txt.includes("petwalk-medium-tiertuer/hero.png") ||
        txt.match(/petwalk-medium-tiertuer\/[^"'`\s]+\.(?:svg|png)/i)
      ) {
        leftovers.push(path.relative(root, full));
      }
    }
  }
}
walk(srcRoot);

if (leftovers.length) {
  console.error(`[${PATCH}] WARNUNG: Weitere alte petWALK-Medienreferenzen gefunden:`);
  for (const f of leftovers) console.error(`- ${f}`);
  console.error(`[${PATCH}] Diese Dateien bitte prüfen. Der Produktdatensatz selbst wurde repariert.`);
} else {
  console.log(`[${PATCH}] Keine alten petWALK PNG/SVG-Referenzen unter apps/pfotentechnik/src gefunden.`);
}

run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], root);

console.log(`[${PATCH}] Fertig. Build erfolgreich.`);
