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
const IGNORE_DIRECTORIES = new Set([
  "node_modules", ".git", ".astro", "dist", "reports", ".patch-backups"
]);

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
  return tag.replace(/\s+/g, " ").trim().slice(0, 320);
}

function getAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(
    new RegExp("\\b" + escaped + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i")
  );
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : undefined;
}

function hasAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("\\b" + escaped + "(?:\\s*=|\\s|/?>)", "i").test(tag);
}

function isExplicitlyDecorative(tag) {
  const ariaHidden = (getAttribute(tag, "aria-hidden") ?? "").toLowerCase();
  const role = (getAttribute(tag, "role") ?? "").toLowerCase();
  return ariaHidden === "true" ||
    role === "presentation" ||
    role === "none" ||
    hasAttribute(tag, "data-alt-audit-ignore");
}

function isTechnicalPlaceholder(tag) {
  const classes = getAttribute(tag, "class") ?? "";
  return /\bimage-lightbox-v2__image\b/.test(classes) &&
    hasAttribute(tag, "data-lightbox-image");
}

function classifyTag(tag, file, offset, scope, source) {
  const literalDouble = tag.match(/\balt\s*=\s*"([^"]*)"/i);
  const literalSingle = tag.match(/\balt\s*=\s*'([^']*)'/i);
  const dynamic = /\balt\s*=\s*\{[\s\S]*?\}/i.test(tag);
  const bareWithValue = /\balt\s*=\s*[^\s>]+/i.test(tag);
  const minimizedEmptyAlt = /\balt(?=\s|\/?>)/i.test(tag);

  const line = lineNumber(source, offset);
  const normalizedFile = path.relative(ROOT, file).replaceAll(path.sep, "/");
  const base = {
    scope,
    file: normalizedFile,
    line,
    tag: compactTag(tag)
  };

  if (dynamic) return null;

  if (
    !literalDouble &&
    !literalSingle &&
    !bareWithValue &&
    !minimizedEmptyAlt
  ) {
    if (isExplicitlyDecorative(tag) || isTechnicalPlaceholder(tag)) {
      return {
        ...base,
        severity: "info",
        code: "IMAGE_ALT_DECORATIVE",
        message: "Technisches oder ausdrücklich dekoratives Bild ohne beschreibenden Alt-Text."
      };
    }

    return {
      ...base,
      severity: "error",
      code: "IMAGE_ALT_MISSING",
      message: "Informativ wirkendes Bild besitzt kein Alt-Attribut."
    };
  }

  if (minimizedEmptyAlt) {
    return {
      ...base,
      severity: "info",
      code: isTechnicalPlaceholder(tag)
        ? "IMAGE_ALT_EMPTY_TECHNICAL"
        : "IMAGE_ALT_EMPTY_DECORATIVE",
      message: isTechnicalPlaceholder(tag)
        ? "Leerer Alt-Text eines technischen Bildplatzhalters."
        : "Minimierter leerer Alt-Text. Das Bild wird als dekorativ oder redundant behandelt."
    };
  }

  const literalValue = literalDouble?.[1] ?? literalSingle?.[1];
  if (literalValue !== undefined && literalValue.trim().length === 0) {
    return {
      ...base,
      severity: "info",
      code: isTechnicalPlaceholder(tag)
        ? "IMAGE_ALT_EMPTY_TECHNICAL"
        : "IMAGE_ALT_EMPTY_DECORATIVE",
      message: isTechnicalPlaceholder(tag)
        ? "Leerer Alt-Text eines technischen Bildplatzhalters."
        : "Leerer Alt-Text. Das Bild wird als dekorativ oder redundant behandelt."
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
    const finding = classifyTag(match[0], file, match.index, "source", source);
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
    const finding = classifyTag(match[0], file, match.index, "dist", source);
    if (finding) findings.push(finding);
  }
  return findings;
}

function signature(item) {
  const src = getAttribute(item.tag, "src") ?? "";
  const classes = getAttribute(item.tag, "class") ?? "";
  const normalizedSrc = src
    .replace(/\/_astro\/[^"'?\s]+/g, "/_astro/ASSET")
    .replace(/[?&](?:width|height|format|quality)=[^&"']+/g, "");
  return [item.scope, item.severity, item.code, normalizedSrc, classes].join("|");
}

function deduplicate(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = signature(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const sourceFiles = [...new Set(
  SOURCE_ROOTS.flatMap((root) => walk(root, [".astro", ".html"]))
)].sort();

const sourceFindings = sourceFiles.flatMap(scanSourceFile);
const distAvailable = fs.existsSync(DIST);
const distFiles = !SOURCE_ONLY && distAvailable
  ? walk(DIST, [".html"]).sort()
  : [];

const distFindingsRaw = distFiles.flatMap(scanHtmlFile);
const distFindings = deduplicate(distFindingsRaw);
const findings = [...sourceFindings, ...distFindings];
const errors = findings.filter((item) => item.severity === "error");
const infos = findings.filter((item) => item.severity === "info");

const report = {
  version: "24.1.2",
  generatedAt: new Date().toISOString(),
  mode: SOURCE_ONLY ? "source-only" : "source-and-dist",
  sourceFilesScanned: sourceFiles.length,
  distAvailable,
  distFilesScanned: distFiles.length,
  rawDistFindings: distFindingsRaw.length,
  findings,
  summary: {
    total: findings.length,
    errors: errors.length,
    info: infos.length,
    source: sourceFindings.length,
    distRaw: distFindingsRaw.length,
    distUnique: distFindings.length,
    missing: errors.filter((item) => item.code === "IMAGE_ALT_MISSING").length
  }
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");

const renderFinding = (item) =>
  "- **" + item.severity.toUpperCase() + " · " + item.code + "** `" +
  item.file + ":" + item.line + "` – " + item.message;

const markdown = [
  "# Image Alt Audit 24.1.2",
  "",
  "- Modus: `" + report.mode + "`",
  "- geprüfte Quelldateien: " + report.sourceFilesScanned,
  "- geprüfte Build-Dateien: " + report.distFilesScanned,
  "- rohe Build-Fundstellen: " + report.summary.distRaw,
  "- eindeutige Build-Fundstellen: " + report.summary.distUnique,
  "- blockierende Fehler: " + report.summary.errors,
  "- Hinweise: " + report.summary.info,
  "",
  "## Blockierende Fehler",
  "",
  errors.length ? errors.map(renderFinding).join("\n") : "Keine blockierenden Alt-Text-Fehler gefunden.",
  "",
  "## Hinweise",
  "",
  infos.length ? infos.map(renderFinding).join("\n") : "Keine Hinweise.",
  ""
].join("\n");

fs.writeFileSync(REPORT_MD, markdown);

console.log("[image-alt-audit] Quelldateien: " + report.sourceFilesScanned);
console.log("[image-alt-audit] Build-Dateien: " + report.distFilesScanned);
console.log("[image-alt-audit] Roh-Fundstellen im Build: " + report.summary.distRaw);
console.log("[image-alt-audit] Eindeutige Hinweise: " + report.summary.info);
console.log("[image-alt-audit] Blockierende Fehler: " + report.summary.errors);
console.log("[image-alt-audit] Report: " + path.relative(ROOT, REPORT_MD));

if (!SOURCE_ONLY && !distAvailable) {
  console.warn("[image-alt-audit] dist fehlt. Zuerst den Astro-Build ausführen oder --source-only verwenden.");
  if (STRICT) process.exitCode = 1;
}

if (STRICT && errors.length > 0) process.exitCode = 1;
