#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-petporte-media-path-repair-32.4.2";

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

if (!fs.existsSync(mdFile)) throw new Error(`[${PATCH}] Produkt-MD fehlt: ${path.relative(root, mdFile)}`);
if (!fs.existsSync(imageDir)) throw new Error(`[${PATCH}] Bildordner fehlt: ${path.relative(root, imageDir)}`);

const files = fs.readdirSync(imageDir)
  .filter((name) => /\.webp$/i.test(name))
  .sort();

console.log(`[${PATCH}] Vorhandene WebP-Dateien (${files.length}):`);
for (const file of files) console.log(`- ${file}`);

const prefixMap = new Map();
for (const file of files) {
  const match = file.match(/-(\d{2})(?:-|\.|_)/);
  if (!match) continue;
  const prefix = match[1];
  const list = prefixMap.get(prefix) ?? [];
  list.push(file);
  prefixMap.set(prefix, list);
}

function findByPrefix(prefix) {
  const matches = prefixMap.get(prefix) ?? [];
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error(`[${PATCH}] Mehrdeutige Bildnummer ${prefix}: ${matches.join(", ")}`);
  }
  return null;
}

let source = fs.readFileSync(mdFile, "utf8");
const backup = `${mdFile}.${PATCH}.bak`;
if (!fs.existsSync(backup)) fs.copyFileSync(mdFile, backup);

const productPathPrefix = "../../assets/images/products/petsafe-petporte-smart-flap/";

function repairSingleField(blockName, expectedPrefix, required = true) {
  const blockRx = new RegExp(
    `(${blockName}:\\n(?:[ \\t].*\\n)*?[ \\t]+src:\\s*")([^"]+)(")`,
    "m"
  );
  const match = source.match(blockRx);
  if (!match) {
    if (required) throw new Error(`[${PATCH}] ${blockName}.src nicht gefunden.`);
    return;
  }

  const current = match[2];
  const absoluteCurrent = path.resolve(path.dirname(mdFile), current);
  if (fs.existsSync(absoluteCurrent)) return;

  const found = findByPrefix(expectedPrefix);
  if (!found) {
    if (required) {
      throw new Error(`[${PATCH}] Pflichtbild ${blockName} (${expectedPrefix}) fehlt im Bildordner.`);
    }
    return;
  }

  source = source.replace(blockRx, `$1${productPathPrefix}${found}$3`);
  console.log(`[${PATCH}] ${blockName}: ${path.basename(current)} -> ${found}`);
}

repairSingleField("hero", "01", true);
repairSingleField("thumbnail", "02", true);
repairSingleField("comparison", "03", true);

/*
 * Galerie: jeden src-Eintrag innerhalb des gallery-Blocks prüfen.
 * Existiert der referenzierte Dateiname nicht, wird zuerst über das zweistellige
 * Nummernpräfix ein vorhandenes WebP gesucht. Gibt es keines, wird genau dieser
 * optionale Galerieeintrag entfernt.
 */
const galleryStart = source.indexOf("  gallery:\n");
if (galleryStart >= 0) {
  const afterGallery = source.slice(galleryStart + "  gallery:\n".length);
  const nextTopLevel = afterGallery.search(/^\S/m);
  const galleryEnd = nextTopLevel >= 0
    ? galleryStart + "  gallery:\n".length + nextTopLevel
    : source.length;

  const before = source.slice(0, galleryStart);
  const galleryHeader = "  gallery:\n";
  let galleryBody = source.slice(galleryStart + galleryHeader.length, galleryEnd);
  const after = source.slice(galleryEnd);

  const entries = galleryBody.match(/    - src:\s*"[^"]+"\n(?:      .*\n)*/g) ?? [];
  const repairedEntries = [];

  for (const entry of entries) {
    const srcMatch = entry.match(/    - src:\s*"([^"]+)"/);
    if (!srcMatch) {
      repairedEntries.push(entry);
      continue;
    }

    const current = srcMatch[1];
    const absoluteCurrent = path.resolve(path.dirname(mdFile), current);
    if (fs.existsSync(absoluteCurrent)) {
      repairedEntries.push(entry);
      continue;
    }

    const filename = path.basename(current);
    const prefixMatch = filename.match(/-(\d{2})(?:-|\.|_)/);
    const prefix = prefixMatch?.[1];
    const found = prefix ? findByPrefix(prefix) : null;

    if (found) {
      repairedEntries.push(
        entry.replace(current, `${productPathPrefix}${found}`)
      );
      console.log(`[${PATCH}] Galerie ${prefix}: ${filename} -> ${found}`);
    } else {
      console.log(`[${PATCH}] Galerie entfernt, Asset fehlt: ${filename}`);
    }
  }

  if (entries.length) {
    galleryBody = repairedEntries.join("");
    source = before + galleryHeader + galleryBody + after;
  }
}

/* Finale Kontrolle: jede lokale WebP-Referenz der MD muss existieren. */
const refs = [...source.matchAll(/src:\s*"([^"]+\.webp)"/g)].map((m) => m[1]);
const missing = refs.filter((ref) => !fs.existsSync(path.resolve(path.dirname(mdFile), ref)));

if (missing.length) {
  throw new Error(
    `[${PATCH}] Nach Repair fehlen weiterhin Assets:\n${missing.map((x) => `- ${x}`).join("\n")}`
  );
}

fs.writeFileSync(mdFile, source, "utf8");

console.log(`[${PATCH}] Medienpfade erfolgreich repariert.`);
console.log(`[${PATCH}] Geprüfte MD-WebP-Referenzen: ${refs.length}`);
console.log(`[${PATCH}] Fehlende Referenzen: 0`);
console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
console.log(`[${PATCH}] Danach ausführen: npm --workspace apps/pfotentechnik run build`);
