#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH =
  "pfotentechnik-product-mobile-viewport-owner-installer-repair-28.3.6";
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
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openingBrace; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1] || "";

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
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

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
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

    let brace = index + selector.length;
    while (/\s/.test(source[brace] || "")) brace += 1;

    const validBefore = !before || /[\s},]/.test(before);
    const validAfter = !after || /\s|\{/.test(after);

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

function findClosingParen(source, openingParen) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let quote = "";
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openingParen; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1] || "";

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
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

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "(") parenDepth += 1;
    if (char === ")") {
      parenDepth -= 1;
      if (
        parenDepth === 0 &&
        bracketDepth === 0 &&
        braceDepth === 0
      ) {
        return index;
      }
    }

    if (char === "[") bracketDepth += 1;
    if (char === "]") bracketDepth -= 1;
    if (char === "{") braceDepth += 1;
    if (char === "}") braceDepth -= 1;
  }

  throw new Error("Funktionsaufruf ist nicht geschlossen.");
}

function splitTopLevelArguments(source, start, end) {
  const args = [];
  let argumentStart = start;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let quote = "";
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = start; index < end; index += 1) {
    const char = source[index];
    const next = source[index + 1] || "";

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
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

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth -= 1;
    if (char === "[") bracketDepth += 1;
    if (char === "]") bracketDepth -= 1;
    if (char === "{") braceDepth += 1;
    if (char === "}") braceDepth -= 1;

    if (
      char === "," &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0
    ) {
      args.push({
        start: argumentStart,
        end: index,
        text: source.slice(argumentStart, index),
      });
      argumentStart = index + 1;
    }
  }

  args.push({
    start: argumentStart,
    end,
    text: source.slice(argumentStart, end),
  });

  return args;
}

function findRepairTarget(source) {
  const functionNames = [
    "removeSelectorBlocks",
    "removeSelectorBlock",
  ];

  const candidates = [];

  for (const functionName of functionNames) {
    let cursor = 0;

    while (cursor < source.length) {
      const index = source.indexOf(functionName, cursor);
      if (index < 0) break;

      const before = index > 0 ? source[index - 1] : "";
      const after = source[index + functionName.length] || "";

      if (
        (before && /[\w$]/.test(before)) ||
        (after && /[\w$]/.test(after))
      ) {
        cursor = index + functionName.length;
        continue;
      }

      let openingParen = index + functionName.length;
      while (/\s/.test(source[openingParen] || "")) openingParen += 1;

      if (source[openingParen] !== "(") {
        cursor = index + functionName.length;
        continue;
      }

      const closingParen = findClosingParen(source, openingParen);
      const args = splitTopLevelArguments(
        source,
        openingParen + 1,
        closingParen,
      );

      if (
        args.length >= 3 &&
        args[1].text.includes(".px2-editorial-gallery__mobile")
      ) {
        candidates.push({
          functionName,
          openingParen,
          closingParen,
          args,
        });
      }

      cursor = closingParen + 1;
    }
  }

  return candidates;
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
  "apply-pfotentechnik-product-mobile-viewport-owner-28.3.6.mjs",
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

const candidates = findRepairTarget(installer);

if (candidates.length !== 1) {
  const summary = candidates
    .map(
      (candidate) =>
        `${candidate.functionName}(${candidate.args
          .map((arg) => arg.text.trim().slice(0, 80))
          .join(" | ")})`,
    )
    .join("; ");

  throw new Error(
    `Erwartete genau einen passenden Grenzwert-Aufruf, gefunden: ` +
    `${candidates.length}${summary ? `. Treffer: ${summary}` : ""}.`,
  );
}

const target = candidates[0];
const limitArgument = target.args[2];
const currentLimit = limitArgument.text.trim();

if (currentLimit !== "4") {
  throw new Error(
    `Der Grenzwert ist nicht 4, sondern ${JSON.stringify(currentLimit)}. ` +
    "Der Installer wird nicht automatisch verändert.",
  );
}

const leadingWhitespace =
  limitArgument.text.match(/^\s*/)?.[0] ?? "";
const trailingWhitespace =
  limitArgument.text.match(/\s*$/)?.[0] ?? "";

installer =
  installer.slice(0, limitArgument.start) +
  leadingWhitespace +
  "6" +
  trailingWhitespace +
  installer.slice(limitArgument.end);

installer = installer.replaceAll(
  "pfotentechnik-product-mobile-viewport-owner-28.3.4",
  "pfotentechnik-product-mobile-viewport-owner-28.3.6",
);

installer = installer.replaceAll(
  "product-mobile-viewport-owner-28.3.4",
  "product-mobile-viewport-owner-28.3.6",
);

const backupDir = path.join(
  repo,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

fs.mkdirSync(backupDir, { recursive: true });

for (const file of [sourceInstaller, targetInstaller]) {
  if (!fs.existsSync(file)) continue;

  const destination = path.join(
    backupDir,
    path.relative(repo, file),
  );

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
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
  "Syntaxprüfung des korrigierten 28.3.6-Installers",
  repo,
);

const written = fs.readFileSync(targetInstaller, "utf8");
const writtenCandidates = findRepairTarget(written);

if (writtenCandidates.length !== 1) {
  throw new Error(
    "Der geschriebene Installer enthält nicht genau einen Zielaufruf.",
  );
}

if (writtenCandidates[0].args[2].text.trim() !== "6") {
  throw new Error(
    "Der geschriebene Installer besitzt nicht den Grenzwert 6.",
  );
}

if (written.includes("viewport-owner-28.3.4")) {
  throw new Error(
    "Der korrigierte Installer enthält noch alte 28.3.4-Kennungen.",
  );
}

log("BESTANDEN: Grenzwert 4 wurde strukturell durch 6 ersetzt.");
log("BESTANDEN: 28.3.4 blieb unverändert.");
log("Nächster Schritt:");
log(
  "node 3/apply-pfotentechnik-product-mobile-viewport-owner-28.3.6.mjs",
);
