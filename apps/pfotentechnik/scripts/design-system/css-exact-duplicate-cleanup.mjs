#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const WRITE = process.argv.includes("--write");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-exact-duplicate-cleanup-23.0.0.json");
const REPORT_MD = path.join(REPORT_DIR, "css-exact-duplicate-cleanup-23.0.0.md");

const SEARCH_ROOTS = [
  path.join(APP, "src"),
  path.join(ROOT, "packages", "affiliate-core", "src")
];

const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  ".astro",
  ".git",
  ".patch-backups",
  "reports"
]);

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else if (entry.isFile() && (full.endsWith(".css") || full.endsWith(".astro"))) output.push(full);
  }
  return output;
}

function extractStyleRanges(source, filename) {
  if (filename.endsWith(".css")) return [{ start: 0, end: source.length }];
  const ranges = [];
  const pattern = /<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g;
  let match;
  while ((match = pattern.exec(source))) {
    const contentStart = match.index + match[0].indexOf(match[1]);
    ranges.push({ start: contentStart, end: contentStart + match[1].length });
  }
  return ranges;
}

function splitDeclarations(body) {
  const items = [];
  let start = 0;
  let quote = null;
  let escaped = false;
  let parenDepth = 0;
  let comment = false;

  for (let i = 0; i <= body.length; i += 1) {
    const ch = body[i];
    const next = body[i + 1];

    if (comment) {
      if (ch === "*" && next === "/") {
        comment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }

    if (ch === "/" && next === "*") {
      comment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === "(") parenDepth += 1;
    else if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if ((ch === ";" || i === body.length) && parenDepth === 0) {
      const raw = body.slice(start, i);
      const trimmed = raw.trim();
      if (trimmed) {
        const colon = trimmed.indexOf(":");
        items.push({
          raw,
          trimmed,
          property: colon > 0 ? trimmed.slice(0, colon).trim() : "",
          value: colon > 0 ? trimmed.slice(colon + 1).trim() : "",
          start,
          end: i
        });
      }
      start = i + 1;
    }
  }

  return items;
}

function normalizeValue(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s*([,:;()])\s*/g, "$1")
    .trim();
}

function cleanCss(css, filename) {
  const edits = [];
  const findings = [];
  let depth = 0;
  let blockStart = -1;
  let quote = null;
  let escaped = false;
  let comment = false;

  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    const next = css[i + 1];

    if (comment) {
      if (ch === "*" && next === "/") {
        comment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }

    if (ch === "/" && next === "*") {
      comment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === "{") {
      depth += 1;
      if (depth === 1) blockStart = i + 1;
      continue;
    }

    if (ch === "}" && depth === 1 && blockStart >= 0) {
      const body = css.slice(blockStart, i);
      const declarations = splitDeclarations(body);
      const seen = new Map();

      for (const declaration of declarations) {
        if (!declaration.property || declaration.property.startsWith("--")) continue;
        if (declaration.property.startsWith("-")) continue;

        const key =
          declaration.property.toLowerCase() +
          "\u0000" +
          normalizeValue(declaration.value);

        if (!seen.has(key)) {
          seen.set(key, declaration);
          continue;
        }

        const absoluteStart = blockStart + declaration.start;
        const absoluteEnd = blockStart + declaration.end + (body[declaration.end] === ";" ? 1 : 0);

        edits.push({ start: absoluteStart, end: absoluteEnd });
        findings.push({
          file: path.relative(ROOT, filename),
          property: declaration.property,
          value: declaration.value
        });
      }

      blockStart = -1;
      depth -= 1;
      continue;
    }

    if (ch === "}") depth = Math.max(0, depth - 1);
  }

  let cleaned = css;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    cleaned = cleaned.slice(0, edit.start) + cleaned.slice(edit.end);
  }

  cleaned = cleaned.replace(/[ \t]+\n/g, "\n");

  return { cleaned, findings };
}

const files = [...new Set(SEARCH_ROOTS.flatMap((dir) => walk(dir)))].sort();
const fileReports = [];
let totalRemoved = 0;
let totalBytesBefore = 0;
let totalBytesAfter = 0;

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const ranges = extractStyleRanges(source, file);
  if (!ranges.length) continue;

  let next = source;
  const findings = [];

  for (const range of [...ranges].sort((a, b) => b.start - a.start)) {
    const fragment = next.slice(range.start, range.end);
    const result = cleanCss(fragment, file);
    if (result.findings.length) {
      next = next.slice(0, range.start) + result.cleaned + next.slice(range.end);
      findings.push(...result.findings);
    }
  }

  if (!findings.length) continue;

  totalRemoved += findings.length;
  totalBytesBefore += Buffer.byteLength(source);
  totalBytesAfter += Buffer.byteLength(next);

  fileReports.push({
    file: path.relative(ROOT, file),
    removed: findings.length,
    bytesBefore: Buffer.byteLength(source),
    bytesAfter: Buffer.byteLength(next),
    findings
  });

  if (WRITE) fs.writeFileSync(file, next);
}

const report = {
  version: "23.0.0",
  mode: WRITE ? "write" : "dry-run",
  filesScanned: files.length,
  filesChanged: fileReports.length,
  exactDuplicateDeclarationsRemoved: totalRemoved,
  bytesBeforeChangedFiles: totalBytesBefore,
  bytesAfterChangedFiles: totalBytesAfter,
  bytesSaved: totalBytesBefore - totalBytesAfter,
  files: fileReports,
  generatedAt: new Date().toISOString()
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");

const markdown =
`# Exact Duplicate CSS Cleanup 23.0.0

- Modus: ${report.mode}
- geprüfte CSS-/Astro-Dateien: ${report.filesScanned}
- betroffene Dateien: ${report.filesChanged}
- entfernte exakt identische Deklarationen: ${report.exactDuplicateDeclarationsRemoved}
- eingesparte Bytes: ${report.bytesSaved}

## Sicherheitsgrenze

Entfernt werden ausschließlich Wiederholungen innerhalb desselben
Deklarationsblocks, wenn Property und normalisierter Wert exakt identisch sind.

Nicht verändert werden:

- Custom Properties
- Vendor-Prefix-Deklarationen
- gleiche Properties mit unterschiedlichen Werten
- Deklarationen in verschiedenen Selektoren
- Reihenfolge unterschiedlicher Deklarationen

## Dateien

${report.files.length
  ? report.files.map((item) =>
      `- \`${item.file}\`: ${item.removed} Deklarationen, ${item.bytesBefore - item.bytesAfter} Bytes`
    ).join("\n")
  : "Keine sicheren Kandidaten gefunden."}
`;

fs.writeFileSync(REPORT_MD, markdown);
console.log("[css-exact-duplicate-cleanup] Report:", path.relative(ROOT, REPORT_MD));
console.log("[css-exact-duplicate-cleanup] Dateien:", report.filesChanged);
console.log("[css-exact-duplicate-cleanup] Deklarationen:", report.exactDuplicateDeclarationsRemoved);
console.log("[css-exact-duplicate-cleanup] Bytes:", report.bytesSaved);