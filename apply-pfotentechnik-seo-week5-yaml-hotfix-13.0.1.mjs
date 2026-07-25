#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-seo-week5-yaml-hotfix-13.0.1";
const CHECK = process.argv.includes("--check");

function findRepoRoot(start) {
  let current = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Root mit apps/pfotentechnik nicht gefunden.");
}

const root = findRepoRoot(process.cwd());
const target = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "content",
  "pages",
  "trinkbrunnen.md"
);

const normalizeText = (value) =>
  String(value)
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Datei fehlt: ${path.relative(root, file)}`);
  }
  return normalizeText(fs.readFileSync(file, "utf8"));
}

function splitDocument(text) {
  const match = normalizeText(text).match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("Frontmatter in trinkbrunnen.md konnte nicht gelesen werden.");
  }
  return { frontmatter: match[1], body: match[2] };
}

function joinDocument(frontmatter, body) {
  return `---\n${frontmatter.trimEnd()}\n---\n\n${body.trimStart()}`;
}

function cardBlocks(lines) {
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)-\s+(?:label|title):\s+/);
    if (!match) continue;

    const indent = match[1].length;
    let end = index + 1;
    while (end < lines.length) {
      const line = lines[end];
      if (!line.trim()) {
        end += 1;
        continue;
      }

      const nextItem = line.match(/^(\s*)-\s+/);
      if (nextItem && nextItem[1].length === indent) break;

      const leading = line.match(/^\s*/)?.[0].length ?? 0;
      if (leading < indent) break;
      end += 1;
    }

    blocks.push({ start: index, end, indent });
    index = end - 1;
  }
  return blocks;
}

function directKey(line, indent) {
  const expected = " ".repeat(indent + 2);
  if (!line.startsWith(expected)) return null;
  const rest = line.slice(expected.length);
  if (/^\s/.test(rest)) return null;
  return rest.match(/^([A-Za-z][A-Za-z0-9_-]*):/)?.[1] ?? null;
}

function dedupeCardNavigation(frontmatter) {
  const lines = frontmatter.split("\n");
  const remove = new Set();

  for (const block of cardBlocks(lines)) {
    const seen = new Set();

    for (let index = block.start + 1; index < block.end; index += 1) {
      const key = directKey(lines[index], block.indent);
      if (key !== "href" && key !== "cta") continue;

      if (seen.has(key)) {
        remove.add(index);
      } else {
        seen.add(key);
      }
    }
  }

  return {
    frontmatter: lines.filter((_, index) => !remove.has(index)).join("\n"),
    removed: remove.size
  };
}

function findDuplicateCardNavigation(frontmatter) {
  const lines = frontmatter.split("\n");
  const duplicates = [];

  for (const block of cardBlocks(lines)) {
    const seen = new Map();

    for (let index = block.start + 1; index < block.end; index += 1) {
      const key = directKey(lines[index], block.indent);
      if (key !== "href" && key !== "cta") continue;

      if (seen.has(key)) {
        duplicates.push({
          key,
          firstLine: seen.get(key) + 1,
          duplicateLine: index + 1
        });
      } else {
        seen.set(key, index);
      }
    }
  }

  return duplicates;
}

const original = read(target);
const parsed = splitDocument(original);
const fixed = dedupeCardNavigation(parsed.frontmatter);
const next = joinDocument(fixed.frontmatter, parsed.body);

const hygieneCardPattern =
  /title:\s*"Der gesamte Wasserweg zählt"[\s\S]*?href:\s*"\/katzentrinkbrunnen-richtig-reinigen\/"[\s\S]*?cta:\s*"Reinigung im Detail"/;

if (!hygieneCardPattern.test(fixed.frontmatter)) {
  throw new Error(
    "Die erwartete Hygiene-Karte mit der Reinigungs-Zielseite wurde nicht gefunden."
  );
}

const remaining = findDuplicateCardNavigation(fixed.frontmatter);
if (remaining.length) {
  throw new Error(
    `Es bestehen weiterhin doppelte Karten-Schlüssel: ${JSON.stringify(remaining)}`
  );
}

console.log(`[${PATCH}] Repository: ${root}`);
console.log(`[${PATCH}] Entfernte doppelte Schlüssel: ${fixed.removed}`);

if (CHECK) {
  console.log(
    original === next
      ? `[${PATCH}] Datei ist bereits korrekt.`
      : `[${PATCH}] Vorprüfung erfolgreich. Es wurde nichts verändert.`
  );
  process.exit(0);
}

if (original === next) {
  console.log(`[${PATCH}] Keine Änderung erforderlich.`);
  process.exit(0);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replaceAll(":", "-")}`
);
const backup = path.join(
  backupRoot,
  path.relative(root, target)
);

try {
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.writeFileSync(backup, original, "utf8");
  fs.writeFileSync(target, next, "utf8");

  const verify = splitDocument(read(target));
  const duplicates = findDuplicateCardNavigation(verify.frontmatter);
  if (duplicates.length) {
    throw new Error("Validierung nach dem Schreiben fehlgeschlagen.");
  }
  if (!hygieneCardPattern.test(verify.frontmatter)) {
    throw new Error("Die gewünschte Hygiene-Verlinkung fehlt nach dem Schreiben.");
  }

  console.log(`[${PATCH}] Erfolgreich angewendet.`);
  console.log(`[${PATCH}] Backup: ${backupRoot}`);
  console.log("Nächster Schritt: npm run build:pfotentechnik");
} catch (error) {
  fs.writeFileSync(target, original, "utf8");
  console.error(`[${PATCH}] Fehler: ${error.message}`);
  console.error(`[${PATCH}] Änderung wurde zurückgesetzt.`);
  process.exit(1);
}
