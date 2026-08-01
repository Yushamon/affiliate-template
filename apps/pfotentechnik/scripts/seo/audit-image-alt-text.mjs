#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const STRICT = process.argv.includes("--strict");
const SOURCE_ONLY = process.argv.includes("--source-only");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const DIST = path.join(APP, "dist");
const REPORT_DIR = path.join(APP, "reports", "seo");
const REPORT_JSON = path.join(REPORT_DIR, "image-alt-audit-latest.json");
const REPORT_MD = path.join(REPORT_DIR, "image-alt-audit-latest.md");
const SOURCE_ROOTS = [
  path.join(APP, "src"),
  path.join(ROOT, "packages", "affiliate-core", "src")
];
const IGNORE_DIRECTORIES = new Set(["node_modules", ".git", ".astro", "dist", "reports", ".patch-backups"]);

function walk(directory, extensions, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORE_DIRECTORIES.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, extensions, output);
    else if (entry.isFile() && extensions.some((extension) => full.endsWith(extension))) output.push(full);
  }
  return output;
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function compactTag(tag) {
  return tag.replace(/\s+/g, " ").trim().slice(0, 260);
}

function inspectTag(tag, file, offset, scope, source) {
  const literalDouble = tag.match(/\balt\s*=\s*"([^"]*)"/i);
  const literalSingle = tag.match(/\balt\s*=\s*'([^']*)'/i);
  const dynamic = /\balt\s*=\s*\{[\s\S]*?\}/i.test(tag);
  const bare = /\balt\s*=\s*[^\s>]+/i.test(tag);
  const line = lineNumber(source, offset);
  const normalizedFile = path.relative(ROOT, file).replaceAll(path.sep, "/");

  if (!literalDouble && !literalSingle && !dynamic && !bare) {
    return {
      scope,
      file: normalizedFile,
      line,
      code: "IMAGE_ALT_MISSING",
      message: "Bild besitzt kein Alt-Attribut.",
      tag: compactTag(tag)
    };
  }

  const literalValue = literalDouble?.[1] ?? literalSingle?.[1];
  if (literalValue !== undefined && literalValue.trim().length === 0) {
    return {
      scope,
      file: normalizedFile,
      line,
      code: "IMAGE_ALT_EMPTY",
      message: "Bild besitzt einen leeren Alt-Text.",
      tag: compactTag(tag)
    };
  }

  return null;
}

function scanSourceFile(file) {
  const source = fs.readFileSync(file, "utf8");
  const findings = [];
  const pattern = /<(?:img|OptimizedImage|ProductImage)\b[\s\S]*?>/g;
  let match;
  while ((match = pattern.exec(source))) {
    const finding = inspectTag(match[0], file, match.index, "source", source);
    if (finding) findings.push(finding);
  }
  return findings;
}

function scanHtmlFile(file) {
  const source = fs.readFileSync(file, "utf8");
  const findings = [];
  const pattern = /<img\b[^>]*>/gi;
  let match;
  while ((match = pattern.exec(source))) {
    const finding = inspectTag(match[0], file, match.index, "dist", source);
    if (finding) findings.push(finding);
  }
  return findings;
}

const sourceFiles = [...new Set(SOURCE_ROOTS.flatMap((root) => walk(root, [".astro", ".html"])))].sort();
const sourceFindings = sourceFiles.flatMap(scanSourceFile);
const distAvailable = fs.existsSync(DIST);
const distFiles = !SOURCE_ONLY && distAvailable ? walk(DIST, [".html"]).sort() : [];
const distFindings = distFiles.flatMap(scanHtmlFile);
const findings = [...sourceFindings, ...distFindings];

const report = {
  version: "24.0.0",
  generatedAt: new Date().toISOString(),
  mode: SOURCE_ONLY ? "source-only" : "source-and-dist",
  sourceFilesScanned: sourceFiles.length,
  distAvailable,
  distFilesScanned: distFiles.length,
  findings,
  summary: {
    total: findings.length,
    missing: findings.filter((item) => item.code === "IMAGE_ALT_MISSING").length,
    empty: findings.filter((item) => item.code === "IMAGE_ALT_EMPTY").length,
    source: sourceFindings.length,
    dist: distFindings.length
  }
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");
const markdown = [
  "# Image Alt Audit",
  "",
  "- Modus: `" + report.mode + "`",
  "- geprüfte Quelldateien: " + report.sourceFilesScanned,
  "- geprüfte Build-Dateien: " + report.distFilesScanned,
  "- fehlende Alt-Attribute: " + report.summary.missing,
  "- leere Alt-Texte: " + report.summary.empty,
  "",
  "## Findings",
  "",
  findings.length
    ? findings.map((item) => "- **" + item.code + "** `" + item.file + ":" + item.line + "` – " + item.message).join("\n")
    : "Keine fehlenden oder leeren Alt-Texte gefunden.",
  ""
].join("\n");
fs.writeFileSync(REPORT_MD, markdown);

console.log("[image-alt-audit] Quelldateien: " + report.sourceFilesScanned);
console.log("[image-alt-audit] Build-Dateien: " + report.distFilesScanned);
console.log("[image-alt-audit] Findings: " + report.summary.total);
console.log("[image-alt-audit] Report: " + path.relative(ROOT, REPORT_MD));

if (!SOURCE_ONLY && !distAvailable) {
  console.warn("[image-alt-audit] dist fehlt. Zuerst den Astro-Build ausführen oder --source-only verwenden.");
  if (STRICT) process.exitCode = 1;
}
if (STRICT && findings.length > 0) process.exitCode = 1;
