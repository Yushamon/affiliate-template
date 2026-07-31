#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const APP = path.resolve(path.dirname(SCRIPT_FILE), "..", "..");
const ROOT = path.resolve(APP, "..", "..");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const JSON_REPORT = path.join(REPORT_DIR, "css-architecture-latest.json");
const MD_REPORT = path.join(REPORT_DIR, "css-architecture-latest.md");
const STRICT = process.argv.includes("--strict");

const IGNORE_DIRS = new Set([".git","node_modules","dist",".astro",".cache",".patch-backups","coverage","reports"]);
const SOURCE_EXTENSIONS = new Set([".astro",".css",".js",".mjs",".ts",".tsx",".jsx"]);
const ROOTS = [path.join(APP, "src"), path.join(ROOT, "packages", "affiliate-core", "src")];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORE_DIRS.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute));
    else output.push(absolute);
  }
  return output;
}
const rel = (file) => path.relative(ROOT, file).split(path.sep).join("/");
const readSafe = (file) => { try { return fs.readFileSync(file, "utf8"); } catch { return ""; } };
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const normalized = (css) => stripComments(css).replace(/\s+/g, " ").trim();
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");

function extractImports(content, importer) {
  const result = [];
  const patterns = [
    /@import\s+(?:url\()?["']([^"']+\.css(?:\?[^"']*)?)["']\)?/g,
    /import\s+["']([^"']+\.css(?:\?[^"']*)?)["']/g,
    /import\s+[^;]*?\sfrom\s+["']([^"']+\.css(?:\?[^"']*)?)["']/g
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const raw = match[1].split("?")[0];
      if (/^(https?:|data:|~)/.test(raw)) continue;
      const resolved = raw.startsWith("/")
        ? path.join(ROOT, raw.replace(/^\/+/, ""))
        : path.resolve(path.dirname(importer), raw);
      result.push({ raw, target: rel(resolved), exists: fs.existsSync(resolved) });
    }
  }
  return result;
}

function parseRules(css) {
  const rules = [];
  const regex = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = regex.exec(stripComments(css)))) {
    const selectorText = match[1].trim();
    const body = match[2].trim();
    if (!selectorText || selectorText.startsWith("@")) continue;
    const fingerprint = body.split(";").map((x) => x.trim()).filter(Boolean).sort().join(";");
    for (const selector of selectorText.split(",").map((x) => x.trim()).filter(Boolean)) {
      rules.push({
        selector: selector.replace(/\s+/g, " "),
        fingerprint,
        important: (body.match(/!important\b/g) || []).length,
        depth: (selector.match(/[ >+~]/g) || []).length + 1
      });
    }
  }
  return rules;
}

function category(file) {
  const p = rel(file).toLowerCase();
  if (p.includes("/admin/")) return "admin";
  if (/(hotfix|fixes|override|resilience|cleanup|legacy)/.test(p)) return "legacy-or-override";
  if (p.includes("/comparison")) return "comparison";
  if (p.includes("/product")) return "product";
  if (p.includes("/manufacturer") || p.includes("/hersteller")) return "manufacturer";
  if (p.includes("/styles/")) return "global";
  return file.endsWith(".astro") ? "component-inline" : "component";
}

function owner(file) {
  const p = rel(file);
  if (p.includes("/comparison")) return "comparison-platform";
  if (p.includes("/product")) return "product-experience";
  if (p.includes("/manufacturer") || p.includes("/hersteller")) return "manufacturer-pages";
  if (p.includes("/admin/") || p.includes("/seo/")) return "admin-seo-copilot";
  if (p.includes("PremiumRenderer") || p.includes("/content/")) return "editorial-content";
  if (/Header|Navigation|nav/i.test(p)) return "navigation";
  if (p.includes("/styles/")) return "design-system";
  return "component-owner-unresolved";
}

const sourceFiles = ROOTS.flatMap(walk).filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)));
const cssFiles = sourceFiles.filter((file) => file.endsWith(".css"));
const edges = [];
for (const file of sourceFiles) {
  const content = readSafe(file);
  for (const item of extractImports(content, file)) edges.push({ importer: rel(file), ...item });
}

const importedBy = new Map();
for (const edge of edges) {
  const list = importedBy.get(edge.target) || [];
  list.push(edge.importer);
  importedBy.set(edge.target, list);
}

const records = [];
const allRules = [];

for (const file of cssFiles) {
  const content = readSafe(file);
  const rules = parseRules(content);
  const record = {
    file: rel(file), kind: "css", category: category(file), owner: owner(file),
    bytes: Buffer.byteLength(content), meaningfulBytes: Buffer.byteLength(normalized(content)),
    contentHash: sha(content), normalizedHash: sha(normalized(content)),
    importedBy: importedBy.get(rel(file)) || [], imports: extractImports(content, file),
    rules: rules.length, important: rules.reduce((s, r) => s + r.important, 0),
    maxSelectorDepth: rules.reduce((m, r) => Math.max(m, r.depth), 0)
  };
  records.push(record);
  for (const rule of rules) allRules.push({ ...rule, file: record.file, owner: record.owner });
}

for (const file of sourceFiles.filter((file) => file.endsWith(".astro"))) {
  const blocks = [...readSafe(file).matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  if (!blocks.length) continue;
  const css = blocks.join("\n");
  const rules = parseRules(css);
  const record = {
    file: rel(file), kind: "astro-style", category: category(file), owner: owner(file),
    bytes: Buffer.byteLength(css), meaningfulBytes: Buffer.byteLength(normalized(css)),
    importedBy: [], imports: [], rules: rules.length,
    important: rules.reduce((s, r) => s + r.important, 0),
    maxSelectorDepth: rules.reduce((m, r) => Math.max(m, r.depth), 0)
  };
  records.push(record);
  for (const rule of rules) allRules.push({ ...rule, file: record.file, owner: record.owner });
}

const selectorMap = new Map();
for (const rule of allRules) {
  const list = selectorMap.get(rule.selector) || [];
  list.push(rule);
  selectorMap.set(rule.selector, list);
}
const duplicateSelectors = [...selectorMap.entries()]
  .filter(([, list]) => list.length > 1)
  .map(([selector, list]) => ({
    selector, occurrences: list.length,
    files: [...new Set(list.map((x) => x.file))],
    owners: [...new Set(list.map((x) => x.owner))],
    important: list.reduce((s, x) => s + x.important, 0)
  }))
  .sort((a, b) => b.occurrences - a.occurrences || b.important - a.important);

const declarationMap = new Map();
for (const rule of allRules) {
  if (!rule.fingerprint) continue;
  const list = declarationMap.get(rule.fingerprint) || [];
  list.push(rule);
  declarationMap.set(rule.fingerprint, list);
}
const duplicateBlocks = [...declarationMap.entries()]
  .filter(([, list]) => list.length > 1)
  .map(([fingerprint, list]) => ({
    fingerprint, occurrences: list.length,
    selectors: [...new Set(list.map((x) => x.selector))],
    files: [...new Set(list.map((x) => x.file))]
  }))
  .sort((a, b) => b.occurrences - a.occurrences);

const duplicateFileMap = new Map();
for (const record of records.filter((r) => r.kind === "css" && r.meaningfulBytes > 0)) {
  const list = duplicateFileMap.get(record.normalizedHash) || [];
  list.push(record.file);
  duplicateFileMap.set(record.normalizedHash, list);
}

const emptyFiles = records.filter((r) => r.kind === "css" && r.meaningfulBytes === 0).map((r) => r.file);
const unimportedFiles = records.filter((r) => r.kind === "css" && r.importedBy.length === 0).map((r) => r.file);
const exactDuplicateFiles = [...duplicateFileMap.values()].filter((list) => list.length > 1);
const safeDeleteCandidates = emptyFiles.map((file) => ({ file, reason: "empty-or-comments-only", confidence: "certain" }));

const report = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  status: "ok",
  safety: { ruleLevelDeletionEnabled: false, note: "Automatisch gelöscht werden ausschließlich leere bzw. reine Kommentar-CSS-Dateien." },
  totals: {
    records: records.length,
    cssFiles: records.filter((r) => r.kind === "css").length,
    astroStyleFiles: records.filter((r) => r.kind === "astro-style").length,
    bytes: records.reduce((s, r) => s + r.bytes, 0),
    rules: allRules.length,
    important: records.reduce((s, r) => s + r.important, 0),
    duplicateSelectors: duplicateSelectors.length,
    duplicateDeclarationBlocks: duplicateBlocks.length,
    importEdges: edges.length,
    brokenImports: edges.filter((e) => !e.exists).length,
    unimportedCssFiles: unimportedFiles.length,
    emptyCssFiles: emptyFiles.length,
    exactDuplicateFileGroups: exactDuplicateFiles.length
  },
  records: records.sort((a, b) => b.important - a.important || b.bytes - a.bytes),
  importEdges: edges,
  brokenImports: edges.filter((e) => !e.exists),
  duplicateSelectors: duplicateSelectors.slice(0, 500),
  duplicateDeclarationBlocks: duplicateBlocks.slice(0, 500),
  emptyFiles, unimportedFiles, exactDuplicateFiles, safeDeleteCandidates
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(JSON_REPORT, JSON.stringify(report, null, 2) + "\n");

const ownerStats = new Map();
for (const record of records) {
  const stats = ownerStats.get(record.owner) || { files: 0, bytes: 0, rules: 0, important: 0 };
  stats.files += 1; stats.bytes += record.bytes; stats.rules += record.rules; stats.important += record.important;
  ownerStats.set(record.owner, stats);
}

const markdown = [
  "# CSS Architecture Audit", "",
  "Erzeugt: " + report.generatedAt, "",
  "## Zusammenfassung", "",
  "- CSS-Dateien: " + report.totals.cssFiles,
  "- Astro-Dateien mit Style-Block: " + report.totals.astroStyleFiles,
  "- Quell-CSS: " + report.totals.bytes + " Bytes",
  "- Regeln: " + report.totals.rules,
  "- !important: " + report.totals.important,
  "- mehrfach definierte Selektoren: " + report.totals.duplicateSelectors,
  "- identische Deklarationsblöcke: " + report.totals.duplicateDeclarationBlocks,
  "- Importkanten: " + report.totals.importEdges,
  "- kaputte CSS-Imports: " + report.totals.brokenImports,
  "- nicht statisch importierte CSS-Dateien: " + report.totals.unimportedCssFiles,
  "- sichere Löschkandidaten: " + safeDeleteCandidates.length,
  "", "## Ownership", "",
  "| Owner | Dateien | Bytes | Regeln | !important |",
  "|---|---:|---:|---:|---:|",
  ...[...ownerStats.entries()].sort((a,b)=>b[1].important-a[1].important || b[1].bytes-a[1].bytes)
    .map(([name,s]) => "| " + name + " | " + s.files + " | " + s.bytes + " | " + s.rules + " | " + s.important + " |"),
  "", "## Größte Problemdateien", "",
  "| Datei | Kategorie | Owner | Bytes | Regeln | !important | importiert von |",
  "|---|---|---|---:|---:|---:|---:|",
  ...report.records.slice(0,40).map((r) => "| `" + r.file + "` | " + r.category + " | " + r.owner + " | " + r.bytes + " | " + r.rules + " | " + r.important + " | " + r.importedBy.length + " |"),
  "", "## Sichere Löschkandidaten", "",
  ...(safeDeleteCandidates.length ? safeDeleteCandidates.map((x)=>"- `" + x.file + "`: " + x.reason) : ["Keine automatisch sicher löschbaren Dateien gefunden."]),
  "", "## Sicherheitsgrenze", "",
  "Nicht importiert bedeutet nicht automatisch ungenutzt. Dynamische Astro-Klassen, class:list, direkte Layout-Imports und bedingte Komponenten werden daher nur gemeldet.", ""
].join("\n");

fs.writeFileSync(MD_REPORT, markdown + "\n");
console.log("[css-architecture-audit] Report: " + path.relative(ROOT, MD_REPORT));

if (STRICT && report.totals.brokenImports > 0) {
  console.error("[css-architecture-audit] FEHLER: " + report.totals.brokenImports + " kaputte CSS-Imports.");
  process.exitCode = 1;
}
