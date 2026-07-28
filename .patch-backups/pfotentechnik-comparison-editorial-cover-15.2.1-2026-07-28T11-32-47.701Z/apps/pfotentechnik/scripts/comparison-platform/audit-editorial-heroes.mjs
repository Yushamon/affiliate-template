#!/usr/bin/env node
import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import process from "node:process";

const strict = process.argv.includes("--strict");
const root = resolve(process.cwd());
const comparisonDir = join(root, "src/content/comparisons");
const heroDir = join(root, "src/assets/images/project/pfotentechnik/comparison");
const defaultHero = join(heroDir, "default-editorial-hero.webp");

const exists = async (path) => {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
};

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if ([".md", ".mdx", ".json"].includes(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
};

const slugFromContent = (content, path) => {
  if (extname(path).toLowerCase() === ".json") {
    try { return JSON.parse(content).slug; } catch { return undefined; }
  }
  return content.match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim()
    ?? basename(path).replace(/\.(md|mdx)$/i, "");
};

if (!(await exists(comparisonDir))) {
  console.error(`Vergleichsordner fehlt: ${relative(root, comparisonDir)}`);
  process.exit(1);
}

const files = await walk(comparisonDir);
const missing = [];
for (const file of files) {
  const content = await readFile(file, "utf8");
  const slug = slugFromContent(content, file);
  if (!slug) continue;
  const expected = join(heroDir, `${slug}-editorial-hero.webp`);
  if (!(await exists(expected))) missing.push({ slug, expected: relative(root, expected) });
}

console.log(`Editorial-Hero-Audit: ${files.length} Vergleichsdateien geprüft.`);
console.log(`Standard-Fallback: ${await exists(defaultHero) ? "vorhanden" : "FEHLT"}`);
if (missing.length === 0) {
  console.log("Alle Vergleichsseiten besitzen ein slug-spezifisches Editorial-Hero.");
  process.exit(0);
}

console.warn(`Fehlende slug-spezifische Hero-Bilder: ${missing.length}`);
for (const item of missing) console.warn(`- ${item.slug}: ${item.expected}`);
console.warn("Diese Seiten verwenden bis dahin default-editorial-hero.webp.");
if (strict) process.exitCode = 1;
