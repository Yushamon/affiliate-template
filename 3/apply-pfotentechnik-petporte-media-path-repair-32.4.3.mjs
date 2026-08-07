#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-petporte-media-path-repair-32.4.3";

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

const root = findRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const mdFile = path.join(app, "src", "content", "products", "petsafe-petporte-smart-flap.md");
const imageDir = path.join(app, "src", "assets", "images", "products", "petsafe-petporte-smart-flap");

if (!fs.existsSync(mdFile)) {
  throw new Error(`[${PATCH}] Produkt-MD fehlt: ${path.relative(root, mdFile)}`);
}
if (!fs.existsSync(imageDir)) {
  throw new Error(`[${PATCH}] Bildordner fehlt: ${path.relative(root, imageDir)}`);
}

const required = [
  "hero.webp",
  "thumbnail.webp",
  "comparison.webp",
  "gallery-1.webp",
  "gallery-2.webp",
  "gallery-3.webp"
];

const missingRequired = required.filter((file) => !fs.existsSync(path.join(imageDir, file)));
if (missingRequired.length) {
  throw new Error(
    `[${PATCH}] Erwartete lokale Assets fehlen:\n${missingRequired.map((x) => `- ${x}`).join("\n")}`
  );
}

console.log(`[${PATCH}] Verwendete Assets:`);
for (const file of required) console.log(`- ${file}`);

const backup = `${mdFile}.${PATCH}.bak`;
if (!fs.existsSync(backup)) fs.copyFileSync(mdFile, backup);

let source = fs.readFileSync(mdFile, "utf8");
const base = "../../assets/images/products/petsafe-petporte-smart-flap/";

function replaceBlockSrc(blockName, filename) {
  const rx = new RegExp(
    `(${blockName}:\\n(?:[ \\t].*\\n)*?[ \\t]+src:\\s*")([^"]+)(")`,
    "m"
  );
  if (!rx.test(source)) {
    throw new Error(`[${PATCH}] ${blockName}.src nicht gefunden.`);
  }
  source = source.replace(rx, `$1${base}${filename}$3`);
}

replaceBlockSrc("hero", "hero.webp");
replaceBlockSrc("thumbnail", "thumbnail.webp");
replaceBlockSrc("comparison", "comparison.webp");

/*
 * Galerie vollständig auf die real vorhandenen drei Assets reduzieren.
 * Dadurch bleiben keine alten 03-front/04-angle/09-glass-Referenzen zurück.
 */
const galleryRx = /  gallery:\n(?:    - src:.*\n(?:      .*\n)*)+/m;
const galleryReplacement = `  gallery:
    - src: "${base}gallery-1.webp"
      alt: "PetSafe Petporte smart flap in zusätzlicher Produktansicht"
    - src: "${base}gallery-2.webp"
      alt: "PetSafe Petporte smart flap in weiterer Detail- oder Nutzungsperspektive"
    - src: "${base}gallery-3.webp"
      alt: "PetSafe Petporte smart flap in weiterer Einbau- oder Anwendungsperspektive"
`;

if (!galleryRx.test(source)) {
  throw new Error(`[${PATCH}] gallery-Block nicht gefunden.`);
}
source = source.replace(galleryRx, galleryReplacement);

/* Finale Kontrolle: alle lokalen WebP-Referenzen müssen wirklich existieren. */
const refs = [...source.matchAll(/src:\s*"([^"]+\.webp)"/g)].map((m) => m[1]);
const missingRefs = refs.filter((ref) => !fs.existsSync(path.resolve(path.dirname(mdFile), ref)));

if (missingRefs.length) {
  throw new Error(
    `[${PATCH}] Nach Korrektur fehlen weiterhin referenzierte Assets:\n${missingRefs.map((x) => `- ${x}`).join("\n")}`
  );
}

fs.writeFileSync(mdFile, source, "utf8");

console.log(`[${PATCH}] Medienpfade korrigiert.`);
console.log(`[${PATCH}] MD-WebP-Referenzen: ${refs.length}`);
console.log(`[${PATCH}] Fehlende Referenzen: 0`);
console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);

/* Der echte Astro-Build ist die richtige Validierung für Content-Assets. */
const result = spawnSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "build"],
  {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  }
);

if (result.status !== 0) {
  throw new Error(`[${PATCH}] Astro-Build fehlgeschlagen.`);
}

console.log(`[${PATCH}] Astro-Build erfolgreich.`);
