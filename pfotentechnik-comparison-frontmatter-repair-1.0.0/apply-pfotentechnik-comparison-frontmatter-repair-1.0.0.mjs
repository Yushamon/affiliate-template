#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-frontmatter-repair-1.0.0";
const dryRun = process.argv.includes("--check") || process.argv.includes("--dry-run");

const TARGET_KEYS = new Set([
  "faq",
  "tableTitle",
  "cardsTitle",
  "heroImage",
  "recommendation"
]);

function findRepo(start = process.cwd()) {
  let current = path.resolve(start);

  for (let i = 0; i < 8; i += 1) {
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

  throw new Error(
    "Repository-Root mit apps/pfotentechnik und package.json wurde nicht gefunden."
  );
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) return walk(full);
    if (!/\.(md|mdx|ya?ml)$/i.test(entry.name)) return [];

    return [full];
  });
}

function normalize(text) {
  return text.replace(/\r\n/g, "\n");
}

function splitFrontmatter(text, file) {
  const normalized = normalize(text);

  if (/\.ya?ml$/i.test(file)) {
    return {
      prefix: "",
      body: normalized,
      suffix: "",
      isFrontmatter: false
    };
  }

  if (!normalized.startsWith("---\n")) return null;

  const end = normalized.indexOf("\n---", 4);
  if (end === -1) return null;

  const closingEnd = normalized.indexOf("\n", end + 4);
  const suffixStart = closingEnd === -1 ? normalized.length : closingEnd + 1;

  return {
    prefix: "---\n",
    body: normalized.slice(4, end),
    suffix: normalized.slice(end, suffixStart) + normalized.slice(suffixStart),
    isFrontmatter: true
  };
}

function getTopLevelBlocks(body) {
  const lines = body.split("\n");
  const starts = [];

  lines.forEach((line, index) => {
    if (!line || /^\s/.test(line) || /^\s*#/.test(line)) return;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):(?:\s|$)/);
    if (match) starts.push({ key: match[1], index });
  });

  return starts.map((start, position) => {
    const end =
      position + 1 < starts.length ? starts[position + 1].index : lines.length;

    return {
      key: start.key,
      start: start.index,
      end,
      lines: lines.slice(start.index, end)
    };
  });
}

function blockScore(block) {
  const text = block.lines.join("\n").trim();
  const afterColon = block.lines[0].replace(/^[^:]+:\s*/, "").trim();

  let score = text.length;

  if (afterColon && afterColon !== "[]" && afterColon !== "{}" && afterColon !== "null") {
    score += 5000;
  }

  if (block.lines.length > 1) {
    const meaningfulChildren = block.lines
      .slice(1)
      .filter((line) => line.trim() && !line.trim().startsWith("#")).length;

    score += meaningfulChildren * 1000;
  }

  if (block.key === "faq") {
    const questionCount = block.lines.filter((line) =>
      /^\s*-\s*(?:\{?\s*)?question\s*:/.test(line)
    ).length;

    score += questionCount * 10000;
  }

  return score;
}

function repairBody(body, relativePath) {
  const lines = body.split("\n");
  const blocks = getTopLevelBlocks(body);
  const byKey = new Map();

  for (const block of blocks) {
    const current = byKey.get(block.key) ?? [];
    current.push(block);
    byKey.set(block.key, current);
  }

  const removeRanges = [];
  const repairs = [];
  const unresolved = [];

  for (const [key, duplicates] of byKey.entries()) {
    if (duplicates.length < 2) continue;

    if (!TARGET_KEYS.has(key)) {
      unresolved.push(`${relativePath}: doppelter Top-Level-Key "${key}"`);
      continue;
    }

    const ranked = [...duplicates].sort((a, b) => {
      const difference = blockScore(b) - blockScore(a);
      return difference || a.start - b.start;
    });

    const keep = ranked[0];

    for (const block of duplicates) {
      if (block === keep) continue;

      removeRanges.push([block.start, block.end]);
      repairs.push({
        key,
        keptLine: keep.start + 1,
        removedLine: block.start + 1
      });
    }
  }

  if (removeRanges.length === 0) {
    return { body, repairs, unresolved };
  }

  const remove = new Set();

  for (const [start, end] of removeRanges) {
    for (let index = start; index < end; index += 1) remove.add(index);
  }

  const repaired = lines
    .filter((_, index) => !remove.has(index))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return { body: repaired, repairs, unresolved };
}

async function validateYaml(text, file) {
  try {
    const yaml = await import("js-yaml");
    yaml.load(text);
    return null;
  } catch (error) {
    return `${file}: ${error instanceof Error ? error.message : String(error)}`;
  }
}

const root = findRepo();
const comparisonRoots = [
  path.join(root, "apps", "pfotentechnik", "src", "content", "comparisons"),
  path.join(root, "apps", "pfotentechnik", "src", "data", "comparisons")
];

const files = [...new Set(comparisonRoots.flatMap(walk))];
const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${Date.now()}`);

if (files.length === 0) {
  throw new Error(
    "Keine Vergleichsdateien unter src/content/comparisons oder src/data/comparisons gefunden."
  );
}

let changed = 0;
let repairedKeys = 0;
const unresolved = [];
const validationErrors = [];

for (const file of files) {
  const relative = path.relative(root, file);
  const original = fs.readFileSync(file, "utf8");
  const split = splitFrontmatter(original, file);

  if (!split) continue;

  const result = repairBody(split.body, relative);
  unresolved.push(...result.unresolved);

  if (result.repairs.length === 0) continue;

  const validationError = await validateYaml(result.body, relative);

  if (validationError) {
    validationErrors.push(validationError);
    continue;
  }

  repairedKeys += result.repairs.length;
  changed += 1;

  console.log(`\n${dryRun ? "[check]" : "[repair]"} ${relative}`);

  for (const repair of result.repairs) {
    console.log(
      `  ${repair.key}: Zeile ${repair.keptLine} behalten, ` +
      `Duplikat ab Zeile ${repair.removedLine} entfernt`
    );
  }

  if (dryRun) continue;

  const backup = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(file, backup);

  const next =
    split.prefix +
    result.body.replace(/\n?$/, "\n") +
    split.suffix.replace(/^\n?/, "");

  fs.writeFileSync(file, next, "utf8");
}

console.log("\n--- Ergebnis ---");
console.log(`Geprüfte Dateien: ${files.length}`);
console.log(`Geänderte Dateien: ${changed}`);
console.log(`Entfernte Duplikate: ${repairedKeys}`);

if (unresolved.length > 0) {
  console.log("\nWeitere doppelte Keys wurden nur gemeldet:");
  unresolved.forEach((entry) => console.log(`- ${entry}`));
}

if (validationErrors.length > 0) {
  console.error("\nNicht automatisch reparierte YAML-Fehler:");
  validationErrors.forEach((entry) => console.error(`- ${entry}`));
  process.exitCode = 1;
}

if (dryRun) {
  console.log("\nVorprüfung abgeschlossen. Es wurde nichts verändert.");
} else {
  console.log(`\nBackup: ${backupRoot}`);
  console.log("Jetzt ausführen:");
  console.log("  npm run dev:pfotentechnik:seo");
  console.log("  npm run build:pfotentechnik");
}
