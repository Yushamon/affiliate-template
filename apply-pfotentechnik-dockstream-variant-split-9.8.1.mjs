#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-dockstream-variant-split-9.8.1";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

const payloadFiles = [
  "apps/pfotentechnik/src/content/products/petlibro-dockstream-2-smart.md",
  "apps/pfotentechnik/src/content/products/petlibro-dockstream-2-smart-cordless.md",
  "apps/pfotentechnik/docs/product-image-prompts-dockstream-2-variants.md"
];

const imageDirectories = [
  "apps/pfotentechnik/src/assets/images/products/petlibro-dockstream-2-smart",
  "apps/pfotentechnik/src/assets/images/products/petlibro-dockstream-2-smart-cordless"
];

const requiredCordlessImages = [
  "hero.webp",
  "thumbnail.webp",
  "comparison.webp",
  "gallery-1.webp",
  "gallery-2.webp",
  "gallery-3.webp"
];

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function findRepositoryRoot(start) {
  let current = path.resolve(start);
  while (true) {
    const productDir = path.join(current, "apps/pfotentechnik/src/content/products");
    const packageJson = path.join(current, "apps/pfotentechnik/package.json");
    if (await exists(productDir) && await exists(packageJson)) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Stamm nicht gefunden. Bitte den Installer im affiliate-template-Repository ausführen.");
}

function timestamp() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function validatePayload(relativePath, content) {
  if (!relativePath.includes("/products/")) return;
  if (!content.startsWith("---\n") || !content.includes("\n---\n")) {
    throw new Error(`Ungültiges Frontmatter im Payload: ${relativePath}`);
  }
  const stem = path.basename(relativePath, ".md");
  const escapedStem = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const slugPattern = new RegExp(`slug:\\s*[\"']?${escapedStem}[\"']?`);
  if (!slugPattern.test(content)) {
    throw new Error(`Slug und Dateiname stimmen nicht überein: ${relativePath}`);
  }
  for (const key of ["title:", "type:", "layout:", "testStatus:", "productStatus:", "images:", "rating:", "decision:", "review:"]) {
    if (!content.includes(key)) {
      throw new Error(`Pflichtfeld ${key} fehlt im Payload: ${relativePath}`);
    }
  }
}

async function atomicWrite(target, content) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.${PATCH_ID}.tmp`;
  await fs.writeFile(temp, content, "utf8");
  await fs.rename(temp, target);
}

async function main() {
  const repoRoot = await findRepositoryRoot(process.cwd());
  const existingBase = path.join(repoRoot, "apps/pfotentechnik/src/content/products/petlibro-dockstream-2-smart.md");
  if (!(await exists(existingBase))) {
    throw new Error("Bestehende Datei petlibro-dockstream-2-smart.md wurde nicht gefunden. Es wurde nichts verändert.");
  }
  const existingBaseText = await fs.readFile(existingBase, "utf8");
  if (!/slug:\s*[\"']?petlibro-dockstream-2-smart[\"']?/.test(existingBaseText)) {
    throw new Error("Die bestehende Dockstream-Datei hat nicht den erwarteten Slug. Es wurde nichts verändert.");
  }

  const backupRoot = path.join(repoRoot, ".patch-backups", `${PATCH_ID}-${timestamp()}`);
  const originals = new Map();
  const changed = [];
  const skipped = [];

  try {
    for (const relativePath of payloadFiles) {
      const source = path.join(SCRIPT_DIR, "payload", relativePath);
      const target = path.join(repoRoot, relativePath);
      const content = await fs.readFile(source, "utf8");
      validatePayload(relativePath, content);

      const targetExists = await exists(target);
      const current = targetExists ? await fs.readFile(target, "utf8") : null;
      originals.set(target, { existed: targetExists, content: current });

      if (current === content) {
        skipped.push(relativePath);
        continue;
      }

      if (targetExists) {
        const backup = path.join(backupRoot, relativePath);
        await fs.mkdir(path.dirname(backup), { recursive: true });
        await fs.writeFile(backup, current, "utf8");
      }

      await atomicWrite(target, content);
      changed.push(relativePath);
    }

    for (const relativeDir of imageDirectories) {
      const absoluteDir = path.join(repoRoot, relativeDir);
      await fs.mkdir(absoluteDir, { recursive: true });
      const entries = await fs.readdir(absoluteDir);
      if (entries.length === 0) {
        await fs.writeFile(path.join(absoluteDir, ".gitkeep"), "", "utf8");
      }
    }

    const cordlessDir = path.join(repoRoot, imageDirectories[1]);
    const missingImages = [];
    for (const filename of requiredCordlessImages) {
      if (!(await exists(path.join(cordlessDir, filename)))) missingImages.push(filename);
    }

    const reportRelative = `apps/pfotentechnik/reports/${PATCH_ID}.md`;
    const reportTarget = path.join(repoRoot, reportRelative);
    await fs.mkdir(path.dirname(reportTarget), { recursive: true });
    const report = [
      `# ${PATCH_ID}`,
      "",
      `Ausgeführt: ${new Date().toISOString()}`,
      "",
      "## Geändert",
      ...(changed.length ? changed.map((item) => `- ${item}`) : ["- keine"]),
      "",
      "## Unverändert",
      ...(skipped.length ? skipped.map((item) => `- ${item}`) : ["- keine"]),
      "",
      "## Fehlende Cordless-Bilder",
      ...(missingImages.length ? missingImages.map((item) => `- ${item}`) : ["- keine"]),
      "",
      missingImages.length
        ? "Der Astro-Build kann bis zum Einfügen dieser WebP-Dateien mit ImageNotFound abbrechen."
        : "Alle referenzierten Cordless-Bilder sind vorhanden."
    ].join("\n");
    await atomicWrite(reportTarget, `${report}\n`);

    console.log(`\n[${PATCH_ID}] Folgepatch abgeschlossen.`);
    console.log(`Geändert: ${changed.length}`);
    console.log(`Übersprungen: ${skipped.length}`);
    console.log(`Backup: ${path.relative(repoRoot, backupRoot)}`);
    console.log(`Report: ${reportRelative}`);
    if (missingImages.length) {
      console.warn(`\nAchtung: ${missingImages.length} Cordless-Bilder fehlen noch:`);
      missingImages.forEach((item) => console.warn(`- ${item}`));
      console.warn("Bilder vor dem Astro-Build einfügen.");
    }
  } catch (error) {
    for (const [target, original] of [...originals.entries()].reverse()) {
      if (original.existed) {
        await atomicWrite(target, original.content);
      } else if (await exists(target)) {
        await fs.rm(target, { force: true });
      }
    }
    console.error(`\n[${PATCH_ID}] Patch fehlgeschlagen; geänderte Dateien wurden zurückgesetzt.`);
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
