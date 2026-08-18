#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-media-wiring-batch-32.7.0";
const root = process.cwd();

const productDir = path.join(root, "apps/pfotentechnik/src/content/products");
const imageRoot = path.join(root, "apps/pfotentechnik/src/assets/images/products");

const targets = [
  "prothelis-area-pets",
  "enabot-rola-pettracker",
  "litter-robot-5-pro",
  "enabot-ebo-air-2",
  "furbo-360-hundekamera",
  "neakasa-m1-plus",
  "petkit-purobot-max-pro-2",
  "petlibro-luma-smart-litter-box",
  "petlibro-scout-smart-camera"
];

function fail(message) {
  console.error(`[${PATCH}] FEHLER: ${message}`);
  process.exit(1);
}

function log(message) {
  console.log(`[${PATCH}] ${message}`);
}

function warn(message) {
  console.warn(`[${PATCH}] WARNUNG: ${message}`);
}

function quote(value) {
  return JSON.stringify(String(value));
}

function frontmatterRange(source, slug) {
  if (!source.startsWith("---\n")) fail(`${slug}: Frontmatter-Start fehlt.`);
  const end = source.indexOf("\n---", 4);
  if (end < 0) fail(`${slug}: Frontmatter-Ende fehlt.`);
  return { start: 4, end };
}

function extractTitle(frontmatter, slug) {
  const match = frontmatter.match(/^title:\s*(?:"([^"]+)"|'([^']+)'|(.+))$/m);
  return (match?.[1] || match?.[2] || match?.[3] || slug).trim();
}

function findTopLevelBlock(frontmatter, key) {
  const lines = frontmatter.split("\n");
  const startLine = lines.findIndex((line) => line === `${key}:`);
  if (startLine < 0) return null;

  let endLine = lines.length;
  for (let i = startLine + 1; i < lines.length; i += 1) {
    if (/^[A-Za-z0-9_-]+:\s*(?:.*)?$/.test(lines[i]) && !/^\s/.test(lines[i])) {
      endLine = i;
      break;
    }
  }
  return { lines, startLine, endLine };
}

function findMedia(slug) {
  const dir = path.join(imageRoot, slug);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return { dir, files: [], hero: null, thumbnail: null, comparison: null, gallery: [] };
  }

  const files = fs.readdirSync(dir)
    .filter((name) => /\.webp$/i.test(name))
    .sort();

  const hero = files.find((x) => x.toLowerCase() === "hero.webp") || null;
  const thumbnail = files.find((x) => x.toLowerCase() === "thumbnail.webp") || null;
  const comparison =
    files.find((x) => x.toLowerCase() === "comparison.webp") ||
    files.find((x) => x.toLowerCase() === "comparion.webp") ||
    null;

  const gallery = files
    .filter((x) => /^gallery-\d+\.webp$/i.test(x))
    .sort((a, b) => {
      const na = Number(a.match(/(\d+)/)?.[1] || 0);
      const nb = Number(b.match(/(\d+)/)?.[1] || 0);
      return na - nb;
    });

  return { dir, files, hero, thumbnail, comparison, gallery };
}

function imagePath(slug, filename) {
  return `../../assets/images/products/${slug}/${filename}`;
}

function buildImagesBlock(slug, title, media) {
  const lines = ["images:"];

  if (media.hero) {
    lines.push("  hero:");
    lines.push(`    src: ${quote(imagePath(slug, media.hero))}`);
    lines.push(`    alt: ${quote(`${title} in hochwertiger Produktansicht`)}`);
  }

  if (media.thumbnail) {
    lines.push("  thumbnail:");
    lines.push(`    src: ${quote(imagePath(slug, media.thumbnail))}`);
    lines.push(`    alt: ${quote(`${title} in kompakter Produktansicht`)}`);
  }

  if (media.comparison) {
    lines.push("  comparison:");
    lines.push(`    src: ${quote(imagePath(slug, media.comparison))}`);
    lines.push(`    alt: ${quote(`${title} für den Produktvergleich`)}`);
  }

  if (media.gallery.length) {
    lines.push("  gallery:");
    media.gallery.forEach((filename, index) => {
      lines.push(`    - src: ${quote(imagePath(slug, filename))}`);
      lines.push(`      alt: ${quote(`${title}, Produktansicht ${index + 1}`)}`);
    });
  } else {
    lines.push("  gallery: []");
  }

  return lines;
}

function patchImages(source, slug, title, media) {
  const range = frontmatterRange(source, slug);
  const fm = source.slice(range.start, range.end);
  const replacement = buildImagesBlock(slug, title, media);
  const block = findTopLevelBlock(fm, "images");

  let patched;
  if (block) {
    const lines = [...block.lines];
    lines.splice(block.startLine, block.endLine - block.startLine, ...replacement);
    patched = lines.join("\n");
  } else {
    const lines = fm.split("\n");
    const insertAfter = lines.findIndex((line) => line.startsWith("tags:"));
    if (insertAfter >= 0) {
      // Inline tags stay untouched; block is inserted immediately afterwards.
      lines.splice(insertAfter + 1, 0, ...replacement);
    } else {
      lines.push(...replacement);
    }
    patched = lines.join("\n");
  }

  return source.slice(0, range.start) + patched + source.slice(range.end);
}

if (!fs.existsSync(productDir)) fail(`Produktverzeichnis fehlt: ${path.relative(root, productDir)}`);

const changes = [];
let skippedNoAssets = 0;
let skippedNoHero = 0;
let unchanged = 0;

for (const slug of targets) {
  const file = path.join(productDir, `${slug}.md`);
  if (!fs.existsSync(file)) {
    warn(`${slug}: Produkt-MD fehlt, übersprungen.`);
    continue;
  }

  const media = findMedia(slug);

  if (!media.files.length) {
    warn(`${slug}: kein WebP-Produktordner bzw. keine WebP-Dateien vorhanden, übersprungen.`);
    skippedNoAssets += 1;
    continue;
  }

  // Ein Produkt wird nur umverdrahtet, wenn ein echtes hero.webp vorhanden ist.
  // So ersetzen wir niemals einen funktionierenden Platzhalter durch ein unvollständiges Medienobjekt.
  if (!media.hero) {
    warn(`${slug}: WebP-Dateien vorhanden, aber hero.webp fehlt. Sicherheitshalber übersprungen.`);
    skippedNoHero += 1;
    continue;
  }

  const before = fs.readFileSync(file, "utf8");
  const range = frontmatterRange(before, slug);
  const frontmatter = before.slice(range.start, range.end);

  if (!new RegExp(`^slug:\\s*["']?${slug}["']?\\s*$`, "m").test(frontmatter)) {
    fail(`${slug}: Slug in Produkt-MD stimmt nicht.`);
  }

  const title = extractTitle(frontmatter, slug);
  const after = patchImages(before, slug, title, media);

  // Verifiziere, dass jede tatsächlich gefundene Datei im neuen Images-Block referenziert wird.
  for (const filename of [media.hero, media.thumbnail, media.comparison, ...media.gallery].filter(Boolean)) {
    const expected = imagePath(slug, filename);
    if (!after.includes(expected)) fail(`${slug}: Medienpfad wurde nicht geschrieben: ${expected}`);
  }

  if (after === before) {
    log(`${slug}: bereits korrekt verdrahtet.`);
    unchanged += 1;
    continue;
  }

  changes.push({ slug, file, after, media });
}

// Erst nach vollständiger Validierung schreiben.
for (const change of changes) {
  const tmp = `${change.file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, change.after, "utf8");
  fs.renameSync(tmp, change.file);

  const parts = [
    `hero=${change.media.hero}`,
    `thumbnail=${change.media.thumbnail || "fehlt"}`,
    `comparison=${change.media.comparison || "fehlt"}`,
    `gallery=${change.media.gallery.length}`
  ];
  log(`Aktualisiert: ${path.relative(root, change.file)} (${parts.join(", ")})`);
}

console.log("");
log(`Fertig: ${changes.length} geändert, ${unchanged} bereits korrekt, ${skippedNoAssets} ohne Assets, ${skippedNoHero} ohne hero.webp.`);
log("Keine .bak-Dateien angelegt.");
console.log("");
console.log("Jetzt prüfen:");
console.log("  npm --workspace apps/pfotentechnik run audit:products");
console.log("  git diff -- apps/pfotentechnik/src/content/products");
console.log("");
console.log("Optionaler Asset-Überblick:");
console.log("  for s in " + targets.join(" ") + '; do echo "### $s"; find "apps/pfotentechnik/src/assets/images/products/$s" -maxdepth 1 -type f -name "*.webp" 2>/dev/null | sort; done');
