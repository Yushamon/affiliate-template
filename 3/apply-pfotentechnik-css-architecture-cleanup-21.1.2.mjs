#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-architecture-cleanup-21.1.2";
const args = new Set(process.argv.slice(2));
const CHECK = args.has("--check");
const SKIP_AUDIT = args.has("--skip-audit");

function findRepoRoot(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT_ARG = process.argv.find((arg) => arg.startsWith("--root="));
const ROOT = ROOT_ARG ? path.resolve(ROOT_ARG.slice("--root=".length)) : findRepoRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PACKAGE_JSON = path.join(APP, "package.json");
const SCRIPT_DIR = path.join(APP, "scripts", "design-system");
const TEST_DIR = path.join(APP, "test");
const BACKUP_DIR = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));
const log = (message) => console.log("[" + NAME + "] " + message);
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
const exists = (file) => fs.existsSync(file);
const read = (file) => fs.readFileSync(file, "utf8");

const auditScript = "#!/usr/bin/env node\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport crypto from \"node:crypto\";\nimport { fileURLToPath } from \"node:url\";\n\nconst SCRIPT_FILE = fileURLToPath(import.meta.url);\nconst APP = path.resolve(path.dirname(SCRIPT_FILE), \"..\", \"..\");\nconst ROOT = path.resolve(APP, \"..\", \"..\");\nconst REPORT_DIR = path.join(APP, \"reports\", \"design-system\");\nconst JSON_REPORT = path.join(REPORT_DIR, \"css-architecture-latest.json\");\nconst MD_REPORT = path.join(REPORT_DIR, \"css-architecture-latest.md\");\nconst STRICT = process.argv.includes(\"--strict\");\n\nconst IGNORE_DIRS = new Set([\".git\",\"node_modules\",\"dist\",\".astro\",\".cache\",\".patch-backups\",\"coverage\",\"reports\"]);\nconst SOURCE_EXTENSIONS = new Set([\".astro\",\".css\",\".js\",\".mjs\",\".ts\",\".tsx\",\".jsx\"]);\nconst ROOTS = [path.join(APP, \"src\"), path.join(ROOT, \"packages\", \"affiliate-core\", \"src\")];\n\nfunction walk(dir) {\n  if (!fs.existsSync(dir)) return [];\n  const output = [];\n  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {\n    if (entry.isDirectory() && IGNORE_DIRS.has(entry.name)) continue;\n    const absolute = path.join(dir, entry.name);\n    if (entry.isDirectory()) output.push(...walk(absolute));\n    else output.push(absolute);\n  }\n  return output;\n}\nconst rel = (file) => path.relative(ROOT, file).split(path.sep).join(\"/\");\nconst readSafe = (file) => { try { return fs.readFileSync(file, \"utf8\"); } catch { return \"\"; } };\nconst stripComments = (css) => css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, \"\");\nconst normalized = (css) => stripComments(css).replace(/\\s+/g, \" \").trim();\nconst sha = (value) => crypto.createHash(\"sha256\").update(value).digest(\"hex\");\n\nfunction extractImports(content, importer) {\n  const result = [];\n  const patterns = [\n    /@import\\s+(?:url\\()?[\"']([^\"']+\\.css(?:\\?[^\"']*)?)[\"']\\)?/g,\n    /import\\s+[\"']([^\"']+\\.css(?:\\?[^\"']*)?)[\"']/g,\n    /import\\s+[^;]*?\\sfrom\\s+[\"']([^\"']+\\.css(?:\\?[^\"']*)?)[\"']/g\n  ];\n  for (const pattern of patterns) {\n    for (const match of content.matchAll(pattern)) {\n      const raw = match[1].split(\"?\")[0];\n      if (/^(https?:|data:|~)/.test(raw)) continue;\n      const resolved = raw.startsWith(\"/\")\n        ? path.join(ROOT, raw.replace(/^\\/+/, \"\"))\n        : path.resolve(path.dirname(importer), raw);\n      result.push({ raw, target: rel(resolved), exists: fs.existsSync(resolved) });\n    }\n  }\n  return result;\n}\n\nfunction parseRules(css) {\n  const rules = [];\n  const regex = /([^{}]+)\\{([^{}]*)\\}/g;\n  let match;\n  while ((match = regex.exec(stripComments(css)))) {\n    const selectorText = match[1].trim();\n    const body = match[2].trim();\n    if (!selectorText || selectorText.startsWith(\"@\")) continue;\n    const fingerprint = body.split(\";\").map((x) => x.trim()).filter(Boolean).sort().join(\";\");\n    for (const selector of selectorText.split(\",\").map((x) => x.trim()).filter(Boolean)) {\n      rules.push({\n        selector: selector.replace(/\\s+/g, \" \"),\n        fingerprint,\n        important: (body.match(/!important\\b/g) || []).length,\n        depth: (selector.match(/[ >+~]/g) || []).length + 1\n      });\n    }\n  }\n  return rules;\n}\n\nfunction category(file) {\n  const p = rel(file).toLowerCase();\n  if (p.includes(\"/admin/\")) return \"admin\";\n  if (/(hotfix|fixes|override|resilience|cleanup|legacy)/.test(p)) return \"legacy-or-override\";\n  if (p.includes(\"/comparison\")) return \"comparison\";\n  if (p.includes(\"/product\")) return \"product\";\n  if (p.includes(\"/manufacturer\") || p.includes(\"/hersteller\")) return \"manufacturer\";\n  if (p.includes(\"/styles/\")) return \"global\";\n  return file.endsWith(\".astro\") ? \"component-inline\" : \"component\";\n}\n\nfunction owner(file) {\n  const p = rel(file);\n  if (p.includes(\"/comparison\")) return \"comparison-platform\";\n  if (p.includes(\"/product\")) return \"product-experience\";\n  if (p.includes(\"/manufacturer\") || p.includes(\"/hersteller\")) return \"manufacturer-pages\";\n  if (p.includes(\"/admin/\") || p.includes(\"/seo/\")) return \"admin-seo-copilot\";\n  if (p.includes(\"PremiumRenderer\") || p.includes(\"/content/\")) return \"editorial-content\";\n  if (/Header|Navigation|nav/i.test(p)) return \"navigation\";\n  if (p.includes(\"/styles/\")) return \"design-system\";\n  return \"component-owner-unresolved\";\n}\n\nconst sourceFiles = ROOTS.flatMap(walk).filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)));\nconst cssFiles = sourceFiles.filter((file) => file.endsWith(\".css\"));\nconst edges = [];\nfor (const file of sourceFiles) {\n  const content = readSafe(file);\n  for (const item of extractImports(content, file)) edges.push({ importer: rel(file), ...item });\n}\n\nconst importedBy = new Map();\nfor (const edge of edges) {\n  const list = importedBy.get(edge.target) || [];\n  list.push(edge.importer);\n  importedBy.set(edge.target, list);\n}\n\nconst records = [];\nconst allRules = [];\n\nfor (const file of cssFiles) {\n  const content = readSafe(file);\n  const rules = parseRules(content);\n  const record = {\n    file: rel(file), kind: \"css\", category: category(file), owner: owner(file),\n    bytes: Buffer.byteLength(content), meaningfulBytes: Buffer.byteLength(normalized(content)),\n    contentHash: sha(content), normalizedHash: sha(normalized(content)),\n    importedBy: importedBy.get(rel(file)) || [], imports: extractImports(content, file),\n    rules: rules.length, important: rules.reduce((s, r) => s + r.important, 0),\n    maxSelectorDepth: rules.reduce((m, r) => Math.max(m, r.depth), 0)\n  };\n  records.push(record);\n  for (const rule of rules) allRules.push({ ...rule, file: record.file, owner: record.owner });\n}\n\nfor (const file of sourceFiles.filter((file) => file.endsWith(\".astro\"))) {\n  const blocks = [...readSafe(file).matchAll(/<style(?:\\s[^>]*)?>([\\s\\S]*?)<\\/style>/gi)].map((m) => m[1]);\n  if (!blocks.length) continue;\n  const css = blocks.join(\"\\n\");\n  const rules = parseRules(css);\n  const record = {\n    file: rel(file), kind: \"astro-style\", category: category(file), owner: owner(file),\n    bytes: Buffer.byteLength(css), meaningfulBytes: Buffer.byteLength(normalized(css)),\n    importedBy: [], imports: [], rules: rules.length,\n    important: rules.reduce((s, r) => s + r.important, 0),\n    maxSelectorDepth: rules.reduce((m, r) => Math.max(m, r.depth), 0)\n  };\n  records.push(record);\n  for (const rule of rules) allRules.push({ ...rule, file: record.file, owner: record.owner });\n}\n\nconst selectorMap = new Map();\nfor (const rule of allRules) {\n  const list = selectorMap.get(rule.selector) || [];\n  list.push(rule);\n  selectorMap.set(rule.selector, list);\n}\nconst duplicateSelectors = [...selectorMap.entries()]\n  .filter(([, list]) => list.length > 1)\n  .map(([selector, list]) => ({\n    selector, occurrences: list.length,\n    files: [...new Set(list.map((x) => x.file))],\n    owners: [...new Set(list.map((x) => x.owner))],\n    important: list.reduce((s, x) => s + x.important, 0)\n  }))\n  .sort((a, b) => b.occurrences - a.occurrences || b.important - a.important);\n\nconst declarationMap = new Map();\nfor (const rule of allRules) {\n  if (!rule.fingerprint) continue;\n  const list = declarationMap.get(rule.fingerprint) || [];\n  list.push(rule);\n  declarationMap.set(rule.fingerprint, list);\n}\nconst duplicateBlocks = [...declarationMap.entries()]\n  .filter(([, list]) => list.length > 1)\n  .map(([fingerprint, list]) => ({\n    fingerprint, occurrences: list.length,\n    selectors: [...new Set(list.map((x) => x.selector))],\n    files: [...new Set(list.map((x) => x.file))]\n  }))\n  .sort((a, b) => b.occurrences - a.occurrences);\n\nconst duplicateFileMap = new Map();\nfor (const record of records.filter((r) => r.kind === \"css\" && r.meaningfulBytes > 0)) {\n  const list = duplicateFileMap.get(record.normalizedHash) || [];\n  list.push(record.file);\n  duplicateFileMap.set(record.normalizedHash, list);\n}\n\nconst emptyFiles = records.filter((r) => r.kind === \"css\" && r.meaningfulBytes === 0).map((r) => r.file);\nconst unimportedFiles = records.filter((r) => r.kind === \"css\" && r.importedBy.length === 0).map((r) => r.file);\nconst exactDuplicateFiles = [...duplicateFileMap.values()].filter((list) => list.length > 1);\nconst safeDeleteCandidates = emptyFiles.map((file) => ({ file, reason: \"empty-or-comments-only\", confidence: \"certain\" }));\n\nconst report = {\n  schemaVersion: 2,\n  generatedAt: new Date().toISOString(),\n  status: \"ok\",\n  safety: { ruleLevelDeletionEnabled: false, note: \"Automatisch gel\u00f6scht werden ausschlie\u00dflich leere bzw. reine Kommentar-CSS-Dateien.\" },\n  totals: {\n    records: records.length,\n    cssFiles: records.filter((r) => r.kind === \"css\").length,\n    astroStyleFiles: records.filter((r) => r.kind === \"astro-style\").length,\n    bytes: records.reduce((s, r) => s + r.bytes, 0),\n    rules: allRules.length,\n    important: records.reduce((s, r) => s + r.important, 0),\n    duplicateSelectors: duplicateSelectors.length,\n    duplicateDeclarationBlocks: duplicateBlocks.length,\n    importEdges: edges.length,\n    brokenImports: edges.filter((e) => !e.exists).length,\n    unimportedCssFiles: unimportedFiles.length,\n    emptyCssFiles: emptyFiles.length,\n    exactDuplicateFileGroups: exactDuplicateFiles.length\n  },\n  records: records.sort((a, b) => b.important - a.important || b.bytes - a.bytes),\n  importEdges: edges,\n  brokenImports: edges.filter((e) => !e.exists),\n  duplicateSelectors: duplicateSelectors.slice(0, 500),\n  duplicateDeclarationBlocks: duplicateBlocks.slice(0, 500),\n  emptyFiles, unimportedFiles, exactDuplicateFiles, safeDeleteCandidates\n};\n\nfs.mkdirSync(REPORT_DIR, { recursive: true });\nfs.writeFileSync(JSON_REPORT, JSON.stringify(report, null, 2) + \"\\n\");\n\nconst ownerStats = new Map();\nfor (const record of records) {\n  const stats = ownerStats.get(record.owner) || { files: 0, bytes: 0, rules: 0, important: 0 };\n  stats.files += 1; stats.bytes += record.bytes; stats.rules += record.rules; stats.important += record.important;\n  ownerStats.set(record.owner, stats);\n}\n\nconst markdown = [\n  \"# CSS Architecture Audit\", \"\",\n  \"Erzeugt: \" + report.generatedAt, \"\",\n  \"## Zusammenfassung\", \"\",\n  \"- CSS-Dateien: \" + report.totals.cssFiles,\n  \"- Astro-Dateien mit Style-Block: \" + report.totals.astroStyleFiles,\n  \"- Quell-CSS: \" + report.totals.bytes + \" Bytes\",\n  \"- Regeln: \" + report.totals.rules,\n  \"- !important: \" + report.totals.important,\n  \"- mehrfach definierte Selektoren: \" + report.totals.duplicateSelectors,\n  \"- identische Deklarationsbl\u00f6cke: \" + report.totals.duplicateDeclarationBlocks,\n  \"- Importkanten: \" + report.totals.importEdges,\n  \"- kaputte CSS-Imports: \" + report.totals.brokenImports,\n  \"- nicht statisch importierte CSS-Dateien: \" + report.totals.unimportedCssFiles,\n  \"- sichere L\u00f6schkandidaten: \" + safeDeleteCandidates.length,\n  \"\", \"## Ownership\", \"\",\n  \"| Owner | Dateien | Bytes | Regeln | !important |\",\n  \"|---|---:|---:|---:|---:|\",\n  ...[...ownerStats.entries()].sort((a,b)=>b[1].important-a[1].important || b[1].bytes-a[1].bytes)\n    .map(([name,s]) => \"| \" + name + \" | \" + s.files + \" | \" + s.bytes + \" | \" + s.rules + \" | \" + s.important + \" |\"),\n  \"\", \"## Gr\u00f6\u00dfte Problemdateien\", \"\",\n  \"| Datei | Kategorie | Owner | Bytes | Regeln | !important | importiert von |\",\n  \"|---|---|---|---:|---:|---:|---:|\",\n  ...report.records.slice(0,40).map((r) => \"| `\" + r.file + \"` | \" + r.category + \" | \" + r.owner + \" | \" + r.bytes + \" | \" + r.rules + \" | \" + r.important + \" | \" + r.importedBy.length + \" |\"),\n  \"\", \"## Sichere L\u00f6schkandidaten\", \"\",\n  ...(safeDeleteCandidates.length ? safeDeleteCandidates.map((x)=>\"- `\" + x.file + \"`: \" + x.reason) : [\"Keine automatisch sicher l\u00f6schbaren Dateien gefunden.\"]),\n  \"\", \"## Sicherheitsgrenze\", \"\",\n  \"Nicht importiert bedeutet nicht automatisch ungenutzt. Dynamische Astro-Klassen, class:list, direkte Layout-Imports und bedingte Komponenten werden daher nur gemeldet.\", \"\"\n].join(\"\\n\");\n\nfs.writeFileSync(MD_REPORT, markdown + \"\\n\");\nconsole.log(\"[css-architecture-audit] Report: \" + path.relative(ROOT, MD_REPORT));\n\nif (STRICT && report.totals.brokenImports > 0) {\n  console.error(\"[css-architecture-audit] FEHLER: \" + report.totals.brokenImports + \" kaputte CSS-Imports.\");\n  process.exitCode = 1;\n}\n";
const cleanupScript = "#!/usr/bin/env node\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\nimport { execFileSync } from \"node:child_process\";\n\nconst SCRIPT_FILE = fileURLToPath(import.meta.url);\nconst APP = path.resolve(path.dirname(SCRIPT_FILE), \"..\", \"..\");\nconst ROOT = path.resolve(APP, \"..\", \"..\");\nconst REPORT = path.join(APP, \"reports\", \"design-system\", \"css-architecture-latest.json\");\nconst WRITE = process.argv.includes(\"--write\");\nconst SKIP_BUILD = process.argv.includes(\"--skip-build\");\nconst BACKUP = path.join(ROOT, \".patch-backups\", \"css-safe-cleanup-\" + new Date().toISOString().replace(/[:.]/g, \"-\"));\n\nfunction run(command, argv) {\n  execFileSync(command, argv, { cwd: ROOT, stdio: \"inherit\", env: process.env });\n}\n\nrun(\"node\", [path.join(APP, \"scripts\", \"design-system\", \"css-architecture-audit.mjs\"), \"--strict\"]);\nconst report = JSON.parse(fs.readFileSync(REPORT, \"utf8\"));\nconst candidates = report.safeDeleteCandidates || [];\n\nconsole.log(\"[css-safe-cleanup] Sichere Kandidaten: \" + candidates.length);\nfor (const item of candidates) console.log(\"- \" + item.file + \": \" + item.reason);\n\nif (!WRITE) {\n  console.log(\"[css-safe-cleanup] Dry-run. Mit --write werden ausschlie\u00dflich sichere Kandidaten entfernt.\");\n  process.exit(0);\n}\nif (!candidates.length) {\n  console.log(\"[css-safe-cleanup] Keine \u00c4nderungen erforderlich.\");\n  process.exit(0);\n}\n\nfs.mkdirSync(BACKUP, { recursive: true });\nconst manifest = [];\ntry {\n  for (const item of candidates) {\n    const source = path.join(ROOT, item.file);\n    if (!fs.existsSync(source)) continue;\n    const target = path.join(BACKUP, item.file);\n    fs.mkdirSync(path.dirname(target), { recursive: true });\n    fs.copyFileSync(source, target);\n    manifest.push(item);\n    fs.unlinkSync(source);\n    console.log(\"[css-safe-cleanup] Gel\u00f6scht: \" + item.file);\n  }\n  fs.writeFileSync(path.join(BACKUP, \"backup-manifest.json\"), JSON.stringify(manifest, null, 2) + \"\\n\");\n\n  run(\"node\", [path.join(APP, \"scripts\", \"design-system\", \"css-architecture-audit.mjs\"), \"--strict\"]);\n  run(\"npm\", [\"--workspace\", \"apps/pfotentechnik\", \"run\", \"design-system:components:audit\"]);\n  run(\"npm\", [\"--workspace\", \"apps/pfotentechnik\", \"run\", \"design-system:budget:audit\"]);\n  if (!SKIP_BUILD) run(\"npm\", [\"--workspace\", \"apps/pfotentechnik\", \"run\", \"build\"]);\n\n  console.log(\"[css-safe-cleanup] BESTANDEN. Backup: \" + path.relative(ROOT, BACKUP));\n} catch (error) {\n  console.error(\"[css-safe-cleanup] FEHLER: \" + error.message);\n  console.error(\"[css-safe-cleanup] Rollback wird ausgef\u00fchrt.\");\n  for (const item of manifest) {\n    const backupFile = path.join(BACKUP, item.file);\n    const destination = path.join(ROOT, item.file);\n    if (!fs.existsSync(backupFile)) continue;\n    fs.mkdirSync(path.dirname(destination), { recursive: true });\n    fs.copyFileSync(backupFile, destination);\n  }\n  process.exitCode = 1;\n}\n";
const testScript = "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\n\nconst TEST_FILE = fileURLToPath(import.meta.url);\nconst APP = path.resolve(path.dirname(TEST_FILE), \"..\");\n\ntest(\"CSS-Architecture-Werkzeuge sind installiert\", () => {\n  assert.ok(fs.existsSync(path.join(APP, \"scripts\", \"design-system\", \"css-architecture-audit.mjs\")));\n  assert.ok(fs.existsSync(path.join(APP, \"scripts\", \"design-system\", \"css-safe-cleanup.mjs\")));\n});\n\ntest(\"package.json enth\u00e4lt CSS-Architecture-Skripte\", () => {\n  const pkg = JSON.parse(fs.readFileSync(path.join(APP, \"package.json\"), \"utf8\"));\n  assert.equal(pkg.scripts[\"css:architecture:audit\"], \"node scripts/design-system/css-architecture-audit.mjs\");\n  assert.equal(pkg.scripts[\"css:architecture:check\"], \"node scripts/design-system/css-architecture-audit.mjs --strict\");\n  assert.equal(pkg.scripts[\"css:cleanup:safe\"], \"node scripts/design-system/css-safe-cleanup.mjs\");\n  assert.equal(pkg.scripts[\"css:cleanup:safe:write\"], \"node scripts/design-system/css-safe-cleanup.mjs --write\");\n});\n";

function updatePackageJson(content) {
  const pkg = JSON.parse(content);
  pkg.scripts ||= {};
  Object.assign(pkg.scripts, {
    "css:architecture:audit": "node scripts/design-system/css-architecture-audit.mjs",
    "css:architecture:check": "node scripts/design-system/css-architecture-audit.mjs --strict",
    "css:cleanup:safe": "node scripts/design-system/css-safe-cleanup.mjs",
    "css:cleanup:safe:write": "node scripts/design-system/css-safe-cleanup.mjs --write",
    "test:css-architecture": "node --test test/css-architecture.test.mjs"
  });
  return JSON.stringify(pkg, null, 2) + "\n";
}

const desired = new Map([
  [path.join(SCRIPT_DIR, "css-architecture-audit.mjs"), auditScript],
  [path.join(SCRIPT_DIR, "css-safe-cleanup.mjs"), cleanupScript],
  [path.join(TEST_DIR, "css-architecture.test.mjs"), testScript],
  [PACKAGE_JSON, updatePackageJson(read(PACKAGE_JSON))]
]);

const changes = [];
for (const [file, content] of desired) {
  const current = exists(file) ? read(file) : null;
  if (current === content) log("Unverändert: " + path.relative(ROOT, file));
  else changes.push({ file, current, content });
}

if (CHECK) {
  log(changes.length ? changes.length + " Änderung(en) erforderlich." : "Bereits vollständig installiert.");
  process.exit(changes.length ? 1 : 0);
}
if (!changes.length) {
  log("Keine Änderungen erforderlich.");
  process.exit(0);
}

ensureDir(BACKUP_DIR);
const manifest = [];
try {
  for (const change of changes) {
    const relative = path.relative(ROOT, change.file);
    manifest.push({ file: relative, existed: change.current !== null });
    if (change.current !== null) {
      const backup = path.join(BACKUP_DIR, relative);
      ensureDir(path.dirname(backup));
      fs.writeFileSync(backup, change.current);
    }
    ensureDir(path.dirname(change.file));
    fs.writeFileSync(change.file, change.content);
    log("Geschrieben: " + relative);
  }
  fs.writeFileSync(path.join(BACKUP_DIR, "backup-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  execFileSync("node", ["--check", path.join(SCRIPT_DIR, "css-architecture-audit.mjs")], { cwd: ROOT, stdio: "inherit" });
  execFileSync("node", ["--check", path.join(SCRIPT_DIR, "css-safe-cleanup.mjs")], { cwd: ROOT, stdio: "inherit" });
  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:css-architecture"], { cwd: ROOT, stdio: "inherit", env: process.env });

  if (!SKIP_AUDIT) {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "css:architecture:audit"], { cwd: ROOT, stdio: "inherit", env: process.env });
  }

  log("Backup: " + path.relative(ROOT, BACKUP_DIR));
  log("Installation abgeschlossen.");
  log("Dry-run: npm --workspace apps/pfotentechnik run css:cleanup:safe");
  log("Anwenden: npm --workspace apps/pfotentechnik run css:cleanup:safe:write");
} catch (error) {
  log("FEHLER: " + error.message);
  log("Rollback wird ausgeführt.");
  for (const change of [...changes].reverse()) {
    if (change.current === null) {
      if (exists(change.file)) fs.unlinkSync(change.file);
    } else {
      ensureDir(path.dirname(change.file));
      fs.writeFileSync(change.file, change.current);
    }
  }
  process.exitCode = 1;
}
