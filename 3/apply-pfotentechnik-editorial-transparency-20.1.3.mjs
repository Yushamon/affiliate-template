#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const PATCH_NAME = "pfotentechnik-editorial-transparency-20.1.3";
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const skipAudit = args.includes("--skip-audit");
const force = args.includes("--force");
const rootIndex = args.indexOf("--root");
const explicitRoot = rootIndex >= 0 ? args[rootIndex + 1] : null;

const findRepoRoot = (start) => {
  if (!start) return null;
  let current = path.resolve(start);

  while (true) {
    if (
      fs.existsSync(path.join(current, "apps/pfotentechnik/package.json")) &&
      fs.existsSync(path.join(current, "packages"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
};

const repoRoot =
  findRepoRoot(explicitRoot) ??
  findRepoRoot(process.cwd()) ??
  findRepoRoot(path.resolve(import.meta.dirname, ".."));

if (!repoRoot) {
  console.error(`[${PATCH_NAME}] Repository-Wurzel nicht gefunden.`);
  process.exit(1);
}

const appRoot = path.join(repoRoot, "apps/pfotentechnik");
const files = {
  page: path.join(appRoot, "src/pages/[slug].astro"),
  audit: path.join(appRoot, "scripts/audit-editorial-transparency.mjs")
};

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) {
    console.error(`[${PATCH_NAME}] Pflichtdatei fehlt: ${path.relative(repoRoot, file)}`);
    process.exit(1);
  }
}

const read = (file) => fs.readFileSync(file, "utf8");
const original = {
  page: read(files.page),
  audit: read(files.audit)
};

const normalize = (source) => source.replace(/\r\n/g, "\n");
const restoreNewlines = (source, originalSource) =>
  originalSource.includes("\r\n") ? source.replace(/\n/g, "\r\n") : source;

const guideCallPattern =
  /[ \t]*<EditorialTransparency\b(?=[^>]*\bkind="ratgeber")[^>]*\/>[ \t]*(?:\r?\n)?/g;

const removeGuideTransparency = (source) => {
  const normalized = normalize(source);
  const matches = normalized.match(guideCallPattern) ?? [];

  if (matches.length === 0) return source;
  if (matches.length > 1 && !force) {
    throw new Error(
      `Mehrere Ratgeber-Transparenzkomponenten gefunden (${matches.length}). Nutze --force erst nach manueller Prüfung.`
    );
  }

  const next = normalized.replace(guideCallPattern, "");
  return restoreNewlines(next, source);
};

const findRequirePatternRangeByLabel = (source, label) => {
  const index = source.indexOf(`"${label}"`);
  if (index < 0) return null;

  const start = source.lastIndexOf("requirePattern(", index);
  const close = source.indexOf(");", index);
  if (start < 0 || close < 0) return null;

  let end = close + 2;
  while (source[end] === "\r" || source[end] === "\n") end += 1;
  return { start, end };
};

const knownGuideAuditLabels = [
  "Ratgeber zeigen die redaktionelle Transparenz",
  "Ratgeber zeigen die redaktionelle Transparenz nach dem Hauptinhalt und vor dem FAQ",
  "Ratgeber behalten die Decision Journey vor der kompakten Transparenz",
  "Ratgeber zeigen vor dem Hero keine doppelte Transparenz",
  "Ratgeber nutzen die kompakte, einklappbare Transparenzdarstellung",
  "Ratgeber enthalten keine sichtbare redaktionelle Transparenzbox"
];

const targetAuditBlock = `requirePattern(
  "src/pages/[slug].astro",
  /^(?![\\s\\S]*<EditorialTransparency\\b(?=[^>]*\\bkind="ratgeber"))[\\s\\S]*$/,
  "Ratgeber enthalten keine sichtbare redaktionelle Transparenzbox"
);`;

const updateAudit = (source) => {
  let next = normalize(source);

  const ranges = knownGuideAuditLabels
    .map((label) => findRequirePatternRangeByLabel(next, label))
    .filter(Boolean)
    .sort((a, b) => b.start - a.start);

  for (const range of ranges) {
    next = next.slice(0, range.start) + next.slice(range.end);
  }

  const insertionAnchor = next.indexOf('requirePattern(\n  "src/pages/produkt/[product].astro"');
  if (insertionAnchor < 0) {
    if (!force) {
      throw new Error(
        "Audit-Anker für Produktseiten nicht gefunden. Nutze --force erst nach manueller Prüfung."
      );
    }
    next = `${targetAuditBlock}\n${next}`;
  } else {
    next =
      next.slice(0, insertionAnchor) +
      targetAuditBlock +
      "\n" +
      next.slice(insertionAnchor);
  }

  return restoreNewlines(next, source);
};

let next;
try {
  next = {
    page: removeGuideTransparency(original.page),
    audit: updateAudit(original.audit)
  };
} catch (error) {
  console.error(`[${PATCH_NAME}] Vorprüfung fehlgeschlagen: ${error.message}`);
  process.exit(1);
}

const remainingGuideCalls =
  normalize(next.page).match(guideCallPattern) ?? [];

if (remainingGuideCalls.length > 0) {
  console.error(`[${PATCH_NAME}] Interne Validierung fehlgeschlagen: Ratgeber-Box noch vorhanden.`);
  process.exit(1);
}

if (
  !next.audit.includes(
    "Ratgeber enthalten keine sichtbare redaktionelle Transparenzbox"
  )
) {
  console.error(`[${PATCH_NAME}] Interne Validierung fehlgeschlagen: Audit nicht aktualisiert.`);
  process.exit(1);
}

const changed = Object.keys(files).filter(
  (key) => next[key] !== original[key]
);

if (checkOnly) {
  console.log(`[${PATCH_NAME}] Prüfung erfolgreich.`);
  console.log(`Zu ändernde Dateien: ${changed.length}`);
  for (const key of changed) {
    console.log(`- ${path.relative(repoRoot, files[key])}`);
  }
  console.log("Ergebnis: Auf Ratgeberseiten wird keine EditorialTransparency-Komponente mehr gerendert.");
  process.exit(0);
}

if (!changed.length) {
  console.log(`[${PATCH_NAME}] Bereits vollständig installiert.`);
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_NAME}-${timestamp}`
);

fs.mkdirSync(backupRoot, { recursive: true });

for (const key of changed) {
  const relative = path.relative(repoRoot, files[key]);
  const backup = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.writeFileSync(backup, original[key], "utf8");
}

const restore = () => {
  for (const key of changed) {
    fs.writeFileSync(files[key], original[key], "utf8");
  }
};

try {
  for (const key of changed) {
    fs.writeFileSync(files[key], next[key], "utf8");
    console.log(`[${PATCH_NAME}] Geändert: ${path.relative(repoRoot, files[key])}`);
  }

  if (!skipAudit) {
    const result = spawnSync(
      process.execPath,
      [path.relative(repoRoot, files.audit)],
      {
        cwd: repoRoot,
        stdio: "inherit",
        shell: false
      }
    );

    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(
        `Editorial-Transparency-Audit fehlgeschlagen (Exit ${result.status}).`
      );
    }
  }
} catch (error) {
  restore();
  console.error(`[${PATCH_NAME}] Fehler: ${error.message}`);
  console.error("Änderungen wurden zurückgesetzt.");
  process.exit(1);
}

console.log("");
console.log(`[${PATCH_NAME}] Abgeschlossen.`);
console.log(`Backups: ${path.relative(repoRoot, backupRoot)}`);
console.log("Ratgeber enthalten keine sichtbare Editorial-Transparency-Box mehr.");
console.log("Produkt- und Vergleichsseiten bleiben unverändert.");
