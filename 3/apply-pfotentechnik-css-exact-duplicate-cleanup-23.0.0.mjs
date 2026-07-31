#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-exact-duplicate-cleanup-23.0.0";
const CHECK = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

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
const PACKAGE = path.join(APP, "package.json");
const SCRIPT = path.join(APP, "scripts", "design-system", "css-exact-duplicate-cleanup.mjs");
const TEST = path.join(APP, "test", "css-exact-duplicate-cleanup.test.mjs");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-exact-duplicate-cleanup-23.0.0.json");
const REPORT_MD = path.join(REPORT_DIR, "css-exact-duplicate-cleanup-23.0.0.md");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-")
);

const log = (message) => console.log("[" + NAME + "] " + message);

if (!fs.existsSync(PACKAGE)) throw new Error("package.json fehlt.");

const cleanupScript = "#!/usr/bin/env node\nimport fs from \"node:fs\";\nimport path from \"node:path\";\n\nconst WRITE = process.argv.includes(\"--write\");\n\nfunction findRoot(start) {\n  let dir = path.resolve(start);\n  for (let i = 0; i < 12; i += 1) {\n    if (fs.existsSync(path.join(dir, \"apps\", \"pfotentechnik\", \"package.json\"))) return dir;\n    const parent = path.dirname(dir);\n    if (parent === dir) break;\n    dir = parent;\n  }\n  throw new Error(\"Repository-Wurzel nicht gefunden.\");\n}\n\nconst ROOT = findRoot(process.cwd());\nconst APP = path.join(ROOT, \"apps\", \"pfotentechnik\");\nconst REPORT_DIR = path.join(APP, \"reports\", \"design-system\");\nconst REPORT_JSON = path.join(REPORT_DIR, \"css-exact-duplicate-cleanup-23.0.0.json\");\nconst REPORT_MD = path.join(REPORT_DIR, \"css-exact-duplicate-cleanup-23.0.0.md\");\n\nconst SEARCH_ROOTS = [\n  path.join(APP, \"src\"),\n  path.join(ROOT, \"packages\", \"affiliate-core\", \"src\")\n];\n\nconst IGNORE_DIRS = new Set([\n  \"node_modules\",\n  \"dist\",\n  \".astro\",\n  \".git\",\n  \".patch-backups\",\n  \"reports\"\n]);\n\nfunction walk(dir, output = []) {\n  if (!fs.existsSync(dir)) return output;\n  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {\n    if (IGNORE_DIRS.has(entry.name)) continue;\n    const full = path.join(dir, entry.name);\n    if (entry.isDirectory()) walk(full, output);\n    else if (entry.isFile() && (full.endsWith(\".css\") || full.endsWith(\".astro\"))) output.push(full);\n  }\n  return output;\n}\n\nfunction extractStyleRanges(source, filename) {\n  if (filename.endsWith(\".css\")) return [{ start: 0, end: source.length }];\n  const ranges = [];\n  const pattern = /<style(?:\\s[^>]*)?>([\\s\\S]*?)<\\/style>/g;\n  let match;\n  while ((match = pattern.exec(source))) {\n    const contentStart = match.index + match[0].indexOf(match[1]);\n    ranges.push({ start: contentStart, end: contentStart + match[1].length });\n  }\n  return ranges;\n}\n\nfunction splitDeclarations(body) {\n  const items = [];\n  let start = 0;\n  let quote = null;\n  let escaped = false;\n  let parenDepth = 0;\n  let comment = false;\n\n  for (let i = 0; i <= body.length; i += 1) {\n    const ch = body[i];\n    const next = body[i + 1];\n\n    if (comment) {\n      if (ch === \"*\" && next === \"/\") {\n        comment = false;\n        i += 1;\n      }\n      continue;\n    }\n\n    if (quote) {\n      if (escaped) escaped = false;\n      else if (ch === \"\\\\\") escaped = true;\n      else if (ch === quote) quote = null;\n      continue;\n    }\n\n    if (ch === \"/\" && next === \"*\") {\n      comment = true;\n      i += 1;\n      continue;\n    }\n\n    if (ch === '\"' || ch === \"'\") {\n      quote = ch;\n      continue;\n    }\n\n    if (ch === \"(\") parenDepth += 1;\n    else if (ch === \")\") parenDepth = Math.max(0, parenDepth - 1);\n    else if ((ch === \";\" || i === body.length) && parenDepth === 0) {\n      const raw = body.slice(start, i);\n      const trimmed = raw.trim();\n      if (trimmed) {\n        const colon = trimmed.indexOf(\":\");\n        items.push({\n          raw,\n          trimmed,\n          property: colon > 0 ? trimmed.slice(0, colon).trim() : \"\",\n          value: colon > 0 ? trimmed.slice(colon + 1).trim() : \"\",\n          start,\n          end: i\n        });\n      }\n      start = i + 1;\n    }\n  }\n\n  return items;\n}\n\nfunction normalizeValue(value) {\n  return value\n    .replace(/\\s+/g, \" \")\n    .replace(/\\s*([,:;()])\\s*/g, \"$1\")\n    .trim();\n}\n\nfunction cleanCss(css, filename) {\n  const edits = [];\n  const findings = [];\n  let depth = 0;\n  let blockStart = -1;\n  let quote = null;\n  let escaped = false;\n  let comment = false;\n\n  for (let i = 0; i < css.length; i += 1) {\n    const ch = css[i];\n    const next = css[i + 1];\n\n    if (comment) {\n      if (ch === \"*\" && next === \"/\") {\n        comment = false;\n        i += 1;\n      }\n      continue;\n    }\n\n    if (quote) {\n      if (escaped) escaped = false;\n      else if (ch === \"\\\\\") escaped = true;\n      else if (ch === quote) quote = null;\n      continue;\n    }\n\n    if (ch === \"/\" && next === \"*\") {\n      comment = true;\n      i += 1;\n      continue;\n    }\n\n    if (ch === '\"' || ch === \"'\") {\n      quote = ch;\n      continue;\n    }\n\n    if (ch === \"{\") {\n      depth += 1;\n      if (depth === 1) blockStart = i + 1;\n      continue;\n    }\n\n    if (ch === \"}\" && depth === 1 && blockStart >= 0) {\n      const body = css.slice(blockStart, i);\n      const declarations = splitDeclarations(body);\n      const seen = new Map();\n\n      for (const declaration of declarations) {\n        if (!declaration.property || declaration.property.startsWith(\"--\")) continue;\n        if (declaration.property.startsWith(\"-\")) continue;\n\n        const key =\n          declaration.property.toLowerCase() +\n          \"\\u0000\" +\n          normalizeValue(declaration.value);\n\n        if (!seen.has(key)) {\n          seen.set(key, declaration);\n          continue;\n        }\n\n        const absoluteStart = blockStart + declaration.start;\n        const absoluteEnd = blockStart + declaration.end + (body[declaration.end] === \";\" ? 1 : 0);\n\n        edits.push({ start: absoluteStart, end: absoluteEnd });\n        findings.push({\n          file: path.relative(ROOT, filename),\n          property: declaration.property,\n          value: declaration.value\n        });\n      }\n\n      blockStart = -1;\n      depth -= 1;\n      continue;\n    }\n\n    if (ch === \"}\") depth = Math.max(0, depth - 1);\n  }\n\n  let cleaned = css;\n  for (const edit of edits.sort((a, b) => b.start - a.start)) {\n    cleaned = cleaned.slice(0, edit.start) + cleaned.slice(edit.end);\n  }\n\n  cleaned = cleaned.replace(/[ \\t]+\\n/g, \"\\n\");\n\n  return { cleaned, findings };\n}\n\nconst files = [...new Set(SEARCH_ROOTS.flatMap((dir) => walk(dir)))].sort();\nconst fileReports = [];\nlet totalRemoved = 0;\nlet totalBytesBefore = 0;\nlet totalBytesAfter = 0;\n\nfor (const file of files) {\n  const source = fs.readFileSync(file, \"utf8\");\n  const ranges = extractStyleRanges(source, file);\n  if (!ranges.length) continue;\n\n  let next = source;\n  const findings = [];\n\n  for (const range of [...ranges].sort((a, b) => b.start - a.start)) {\n    const fragment = next.slice(range.start, range.end);\n    const result = cleanCss(fragment, file);\n    if (result.findings.length) {\n      next = next.slice(0, range.start) + result.cleaned + next.slice(range.end);\n      findings.push(...result.findings);\n    }\n  }\n\n  if (!findings.length) continue;\n\n  totalRemoved += findings.length;\n  totalBytesBefore += Buffer.byteLength(source);\n  totalBytesAfter += Buffer.byteLength(next);\n\n  fileReports.push({\n    file: path.relative(ROOT, file),\n    removed: findings.length,\n    bytesBefore: Buffer.byteLength(source),\n    bytesAfter: Buffer.byteLength(next),\n    findings\n  });\n\n  if (WRITE) fs.writeFileSync(file, next);\n}\n\nconst report = {\n  version: \"23.0.0\",\n  mode: WRITE ? \"write\" : \"dry-run\",\n  filesScanned: files.length,\n  filesChanged: fileReports.length,\n  exactDuplicateDeclarationsRemoved: totalRemoved,\n  bytesBeforeChangedFiles: totalBytesBefore,\n  bytesAfterChangedFiles: totalBytesAfter,\n  bytesSaved: totalBytesBefore - totalBytesAfter,\n  files: fileReports,\n  generatedAt: new Date().toISOString()\n};\n\nfs.mkdirSync(REPORT_DIR, { recursive: true });\nfs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + \"\\n\");\n\nconst markdown =\n`# Exact Duplicate CSS Cleanup 23.0.0\n\n- Modus: ${report.mode}\n- geprüfte CSS-/Astro-Dateien: ${report.filesScanned}\n- betroffene Dateien: ${report.filesChanged}\n- entfernte exakt identische Deklarationen: ${report.exactDuplicateDeclarationsRemoved}\n- eingesparte Bytes: ${report.bytesSaved}\n\n## Sicherheitsgrenze\n\nEntfernt werden ausschließlich Wiederholungen innerhalb desselben\nDeklarationsblocks, wenn Property und normalisierter Wert exakt identisch sind.\n\nNicht verändert werden:\n\n- Custom Properties\n- Vendor-Prefix-Deklarationen\n- gleiche Properties mit unterschiedlichen Werten\n- Deklarationen in verschiedenen Selektoren\n- Reihenfolge unterschiedlicher Deklarationen\n\n## Dateien\n\n${report.files.length\n  ? report.files.map((item) =>\n      `- \\`${item.file}\\`: ${item.removed} Deklarationen, ${item.bytesBefore - item.bytesAfter} Bytes`\n    ).join(\"\\n\")\n  : \"Keine sicheren Kandidaten gefunden.\"}\n`;\n\nfs.writeFileSync(REPORT_MD, markdown);\nconsole.log(\"[css-exact-duplicate-cleanup] Report:\", path.relative(ROOT, REPORT_MD));\nconsole.log(\"[css-exact-duplicate-cleanup] Dateien:\", report.filesChanged);\nconsole.log(\"[css-exact-duplicate-cleanup] Deklarationen:\", report.exactDuplicateDeclarationsRemoved);\nconsole.log(\"[css-exact-duplicate-cleanup] Bytes:\", report.bytesSaved);";

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const script = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "scripts",
  "design-system",
  "css-exact-duplicate-cleanup.mjs"
);

test("Cleanup-Werkzeug ist installiert", () => {
  assert.ok(fs.existsSync(script));
});

test("exakt identische Deklarationen werden entfernt, Kaskadenwerte bleiben", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pt-css-cleanup-"));
  const repo = path.join(temp, "affiliate-template");
  const app = path.join(repo, "apps", "pfotentechnik");
  const core = path.join(repo, "packages", "affiliate-core", "src");
  fs.mkdirSync(path.join(app, "src"), { recursive: true });
  fs.mkdirSync(path.join(app, "reports", "design-system"), { recursive: true });
  fs.mkdirSync(core, { recursive: true });
  fs.writeFileSync(path.join(app, "package.json"), "{}");
  fs.copyFileSync(script, path.join(app, "scripts.mjs"));

  const cssFile = path.join(app, "src", "fixture.css");
  fs.writeFileSync(cssFile, \`
.fixture {
  color: red;
  color: red;
  background: white;
  background: black;
  --local-token: 1;
  --local-token: 1;
  -webkit-user-select: none;
  -webkit-user-select: none;
}
\`);

  execFileSync("node", [path.join(app, "scripts.mjs"), "--write"], {
    cwd: repo,
    stdio: "pipe"
  });

  const result = fs.readFileSync(cssFile, "utf8");
  assert.equal((result.match(/color: red/g) || []).length, 1);
  assert.equal((result.match(/background:/g) || []).length, 2);
  assert.equal((result.match(/--local-token:/g) || []).length, 2);
  assert.equal((result.match(/-webkit-user-select:/g) || []).length, 2);
});
`;

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ||= {};
packageJson.scripts["css:cleanup:exact-duplicates"] =
  "node scripts/design-system/css-exact-duplicate-cleanup.mjs";
packageJson.scripts["css:cleanup:exact-duplicates:write"] =
  "node scripts/design-system/css-exact-duplicate-cleanup.mjs --write";
packageJson.scripts["test:css-exact-duplicate-cleanup"] =
  "node --test test/css-exact-duplicate-cleanup.test.mjs";
const packageAfter = JSON.stringify(packageJson, null, 2) + "\n";

const desired = new Map([
  [SCRIPT, cleanupScript],
  [TEST, testContent],
  [PACKAGE, packageAfter]
]);

const changes = [];
for (const [file, content] of desired) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current === content) log("Unverändert: " + path.relative(ROOT, file));
  else changes.push({ file, current, content });
}

if (CHECK) {
  log(changes.length ? changes.length + " Werkzeugänderung(en) erforderlich." : "Werkzeug installiert.");
  process.exit(changes.length ? 1 : 0);
}

fs.mkdirSync(BACKUP, { recursive: true });

try {
  for (const change of changes) {
    const relative = path.relative(ROOT, change.file);
    if (change.current !== null) {
      const backupFile = path.join(BACKUP, relative);
      fs.mkdirSync(path.dirname(backupFile), { recursive: true });
      fs.writeFileSync(backupFile, change.current);
    }
    fs.mkdirSync(path.dirname(change.file), { recursive: true });
    fs.writeFileSync(change.file, change.content);
    log("Geschrieben: " + relative);
  }

  execFileSync("npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:css-exact-duplicate-cleanup"
  ], { cwd: ROOT, stdio: "inherit", env: process.env });

  execFileSync("npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "css:cleanup:exact-duplicates"
  ], { cwd: ROOT, stdio: "inherit", env: process.env });

  const report = JSON.parse(fs.readFileSync(REPORT_JSON, "utf8"));

  if (report.filesChanged > 0) {
    for (const item of report.files) {
      const file = path.join(ROOT, item.file);
      const backupFile = path.join(BACKUP, item.file);
      if (!fs.existsSync(backupFile)) {
        fs.mkdirSync(path.dirname(backupFile), { recursive: true });
        fs.copyFileSync(file, backupFile);
      }
    }

    execFileSync("npm", [
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "css:cleanup:exact-duplicates:write"
    ], { cwd: ROOT, stdio: "inherit", env: process.env });
  }

  if (
    fs.existsSync(path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs")) &&
    packageJson.scripts?.["css:architecture:audit"]
  ) {
    execFileSync("npm", [
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "css:architecture:audit"
    ], { cwd: ROOT, stdio: "inherit", env: process.env });
  }

  if (!SKIP_BUILD) {
    execFileSync("npm", [
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "build"
    ], { cwd: ROOT, stdio: "inherit", env: process.env });
  }

  log("BESTANDEN.");
  log("Entfernte Deklarationen: " + report.exactDuplicateDeclarationsRemoved);
  log("Eingesparte Bytes: " + report.bytesSaved);
  log("Report: " + path.relative(ROOT, REPORT_MD));
  log("Backup: " + path.relative(ROOT, BACKUP));
} catch (error) {
  log("FEHLER: " + error.message);
  log("Rollback wird ausgeführt.");

  if (fs.existsSync(BACKUP)) {
    const restore = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) restore(full);
        else {
          const relative = path.relative(BACKUP, full);
          const target = path.join(ROOT, relative);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.copyFileSync(full, target);
        }
      }
    };
    restore(BACKUP);
  }

  for (const change of changes) {
    if (change.current === null && fs.existsSync(change.file)) {
      fs.unlinkSync(change.file);
    }
  }

  process.exitCode = 1;
}
