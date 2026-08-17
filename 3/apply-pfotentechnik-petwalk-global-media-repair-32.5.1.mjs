#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-petwalk-global-media-repair-32.5.1";

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
const srcRoot = path.join(app, "src");
const imageDir = path.join(srcRoot, "assets", "images", "products", "petwalk-medium-tiertuer");

if (!fs.existsSync(imageDir)) {
  throw new Error(`[${PATCH}] Bildordner fehlt: ${path.relative(root, imageDir)}`);
}

const assets = new Set(fs.readdirSync(imageDir));
const required = ["hero.webp", "thumbnail.webp", "comparison.webp"];
for (const f of required) {
  if (!assets.has(f)) {
    throw new Error(`[${PATCH}] Erwartetes Asset fehlt: ${path.relative(root, path.join(imageDir, f))}`);
  }
}

const gallery = [...assets]
  .filter(f => /^gallery-\d+\.webp$/i.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

console.log(`[${PATCH}] Gefundene Assets:`);
for (const f of [...required, ...gallery]) console.log(`- ${f}`);

const replacements = new Map([
  ["hero.png", "hero.webp"],
  ["hero.svg", "hero.webp"],
  ["thumbnail.png", "thumbnail.webp"],
  ["thumbnail.svg", "thumbnail.webp"],
  ["comparison.png", "comparison.webp"],
  ["comparison.svg", "comparison.webp"],
  ["use-case.svg", gallery[0] || "gallery-1.webp"],
  ["use-case.png", gallery[0] || "gallery-1.webp"],
  ["detail.svg", gallery[1] || gallery[0] || "gallery-1.webp"],
  ["detail.png", gallery[1] || gallery[0] || "gallery-1.webp"],
  ["setup.svg", gallery[2] || gallery[1] || gallery[0] || "gallery-1.webp"],
  ["setup.png", gallery[2] || gallery[1] || gallery[0] || "gallery-1.webp"],
  ["scale.svg", gallery[3] || gallery[2] || gallery[1] || gallery[0] || "gallery-1.webp"],
  ["scale.png", gallery[3] || gallery[2] || gallery[1] || gallery[0] || "gallery-1.webp"],
  ["limitation.svg", gallery[4] || gallery[3] || gallery[2] || gallery[1] || gallery[0] || "gallery-1.webp"],
  ["limitation.png", gallery[4] || gallery[3] || gallery[2] || gallery[1] || gallery[0] || "gallery-1.webp"],
]);

const textExt = /\.(md|mdx|astro|ts|tsx|js|mjs|json|yaml|yml)$/i;
const changed = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!textExt.test(entry.name)) continue;

    let source = fs.readFileSync(full, "utf8");
    const before = source;

    for (const [oldName, newName] of replacements) {
      const rx = new RegExp(
        `(petwalk-medium-tiertuer/)${oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "g"
      );
      source = source.replace(rx, `$1${newName}`);
    }

    // Generisches Sicherheitsnetz: falls noch irgendeine PNG/SVG-Referenz auf bekannte Basisnamen bleibt.
    source = source.replace(
      /(petwalk-medium-tiertuer\/)(hero|thumbnail|comparison)\.(png|svg)/g,
      (_, prefix, base) => `${prefix}${base}.webp`
    );

    if (source !== before) {
      const backup = `${full}.${PATCH}.bak`;
      if (!fs.existsSync(backup)) fs.copyFileSync(full, backup);
      fs.writeFileSync(full, source, "utf8");
      changed.push(path.relative(root, full));
    }
  }
}

walk(srcRoot);

if (changed.length) {
  console.log(`[${PATCH}] Aktualisierte Dateien:`);
  for (const f of changed) console.log(`- ${f}`);
} else {
  console.log(`[${PATCH}] Keine Dateien mussten geändert werden.`);
}

// Harte Abschlussprüfung über src.
const leftovers = [];
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(full);
      continue;
    }
    if (!textExt.test(entry.name)) continue;

    const txt = fs.readFileSync(full, "utf8");
    const hits = txt.match(/petwalk-medium-tiertuer\/[^"'`\s)]+\.(?:png|svg)/gi);
    if (hits?.length) {
      leftovers.push({
        file: path.relative(root, full),
        hits: [...new Set(hits)]
      });
    }
  }
}
scan(srcRoot);

if (leftovers.length) {
  console.error(`[${PATCH}] FEHLER: Alte petWALK PNG/SVG-Referenzen verbleiben:`);
  for (const item of leftovers) {
    console.error(`- ${item.file}`);
    for (const hit of item.hits) console.error(`  ${hit}`);
  }
  process.exit(1);
}

console.log(`[${PATCH}] Keine alten petWALK PNG/SVG-Referenzen unter apps/pfotentechnik/src mehr vorhanden.`);

// Spezifisch Herstellerdatei prüfen.
const manufacturer = path.join(srcRoot, "content", "manufacturers", "petwalk.md");
if (fs.existsSync(manufacturer)) {
  const txt = fs.readFileSync(manufacturer, "utf8");
  if (txt.includes("petwalk-medium-tiertuer/hero.png")) {
    throw new Error(`[${PATCH}] Herstellerdatei enthält weiterhin hero.png.`);
  }
  console.log(`[${PATCH}] Herstellerdatei geprüft: ${path.relative(root, manufacturer)}`);
}

run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], root);

console.log(`[${PATCH}] Fertig. Build erfolgreich.`);
