#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH =
  "pfotentechnik-product-mobile-viewport-owner-installer-repair-28.3.5";
const log = (message) => console.log(`[${PATCH}] ${message}`);

function findRoot(start) {
  let current = path.resolve(start);

  for (let depth = 0; depth < 16; depth += 1) {
    if (
      fs.existsSync(
        path.join(current, "apps", "pfotentechnik", "package.json"),
      )
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error("Repository-Wurzel nicht gefunden.");
}

function findBlockEnd(source, openingBrace) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let inComment = false;

  for (let index = openingBrace; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1] || "";

    if (inComment) {
      if (char === "*" && next === "/") {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === "/" && next === "*") {
      inComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;

    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error("CSS-Block ist nicht geschlossen.");
}

function countExactSelectorBlocks(source, selector) {
  let cursor = 0;
  let count = 0;

  while (cursor < source.length) {
    const index = source.indexOf(selector, cursor);
    if (index < 0) break;

    const before = index > 0 ? source[index - 1] : "";
    const after = source[index + selector.length] || "";

    const validBefore = !before || /[\s},]/.test(before);
    const validAfter = !after || /\s|\{/.test(after);

    let brace = index + selector.length;
    while (/\s/.test(source[brace] || "")) brace += 1;

    if (
      validBefore &&
      validAfter &&
      source[brace] === "{"
    ) {
      count += 1;
      cursor = findBlockEnd(source, brace) + 1;
      continue;
    }

    cursor = index + selector.length;
  }

  return count;
}

function run(command, args, label, cwd) {
  log(`Prüfe: ${label}`);

  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  }

  log(`BESTANDEN: ${label}`);
}

const repo = findRoot(process.cwd());

const sourceInstaller = path.join(
  repo,
  "3",
  "apply-pfotentechnik-product-mobile-viewport-owner-28.3.4.mjs",
);

const targetInstaller = path.join(
  repo,
  "3",
  "apply-pfotentechnik-product-mobile-viewport-owner-28.3.5.mjs",
);

const galleryFile = path.join(
  repo,
  "apps",
  "pfotentechnik",
  "src",
  "components",
  "product-experience-2",
  "ProductGallery2.astro",
);

for (const file of [sourceInstaller, galleryFile]) {
  if (!fs.existsSync(file)) {
    throw new Error(`Datei fehlt: ${path.relative(repo, file)}`);
  }
}

const gallerySource = fs.readFileSync(galleryFile, "utf8");
const selector = ".px2-editorial-gallery__mobile";
const exactBlocks = countExactSelectorBlocks(gallerySource, selector);

if (exactBlocks !== 6) {
  throw new Error(
    `${selector}: ${exactBlocks} eigenständige Regelblöcke gefunden; ` +
    "für den geprüften Repository-Stand werden exakt 6 erwartet.",
  );
}

log(`${selector}: exakt 6 eigenständige Regelblöcke bestätigt.`);

let installer = fs.readFileSync(sourceInstaller, "utf8");

if (/^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(installer)) {
  throw new Error("Der 28.3.4-Installer enthält Git-Konfliktmarker.");
}

const callPattern =
  /(removeSelectorBlocks\s*\(\s*[^,]+,\s*["']\.px2-editorial-gallery__mobile["']\s*,\s*)4(\s*\))/g;

const matches = [...installer.matchAll(callPattern)];

if (matches.length !== 1) {
  throw new Error(
    `Erwartete genau einen 28.3.4-Grenzwert-Aufruf, gefunden: ${matches.length}.`,
  );
}

installer = installer.replace(callPattern, "$16$2");

installer = installer.replaceAll(
  "pfotentechnik-product-mobile-viewport-owner-28.3.4",
  "pfotentechnik-product-mobile-viewport-owner-28.3.5",
);

installer = installer.replaceAll(
  "product-mobile-viewport-owner-28.3.4",
  "product-mobile-viewport-owner-28.3.5",
);

const backupDir = path.join(
  repo,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

fs.mkdirSync(backupDir, { recursive: true });

const backupFile = path.join(
  backupDir,
  path.relative(repo, sourceInstaller),
);

fs.mkdirSync(path.dirname(backupFile), { recursive: true });
fs.copyFileSync(sourceInstaller, backupFile);

if (fs.existsSync(targetInstaller)) {
  const existingBackup = path.join(
    backupDir,
    path.relative(repo, targetInstaller),
  );
  fs.mkdirSync(path.dirname(existingBackup), { recursive: true });
  fs.copyFileSync(targetInstaller, existingBackup);
}

log(`Backup: ${path.relative(repo, backupDir)}`);

fs.writeFileSync(
  targetInstaller,
  installer.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n",
  "utf8",
);

log(`Geschrieben: ${path.relative(repo, targetInstaller)}`);

run(
  process.execPath,
  ["--check", targetInstaller],
  "Syntaxprüfung des korrigierten 28.3.5-Installers",
  repo,
);

const written = fs.readFileSync(targetInstaller, "utf8");

if (!written.includes('".px2-editorial-gallery__mobile", 6')) {
  throw new Error(
    "Der korrigierte Installer enthält den erwarteten Grenzwert 6 nicht.",
  );
}

if (written.includes("viewport-owner-28.3.4")) {
  throw new Error(
    "Der korrigierte Installer enthält noch alte 28.3.4-Kennungen.",
  );
}

log("BESTANDEN: Grenzwert entspricht exakt dem geprüften Bestand.");
log("Nächster Schritt:");
log(
  "node 3/apply-pfotentechnik-product-mobile-viewport-owner-28.3.5.mjs",
);
