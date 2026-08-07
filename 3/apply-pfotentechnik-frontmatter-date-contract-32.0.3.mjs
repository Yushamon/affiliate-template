#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-frontmatter-date-contract-32.0.3";

function findRepoRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

const root = findRepoRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const contentRoot = path.join(app, "src", "content");
const packageFile = path.join(app, "package.json");
const preflightFile = path.join(app, "scripts", "seo", "release-preflight.mjs");
const auditFile = path.join(app, "scripts", "seo", "audit-frontmatter-date-scalars.mjs");
const testFile = path.join(app, "test", "frontmatter-date-contract-32.0.3.test.mjs");

for (const file of [packageFile, preflightFile]) {
  if (!fs.existsSync(file)) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, file)}`);
  }
}

const backup = (file) => {
  const target = `${file}.${PATCH}.bak`;
  if (!fs.existsSync(target)) fs.copyFileSync(file, target);
};

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return /\.mdx?$/i.test(entry.name) ? [full] : [];
});

function normalizeFrontmatterDates(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { source, changed: false, fields: [] };

  const fm = match[1];
  const fields = [];
  const normalized = fm.replace(
    /^(\s*)(publishedAt|updatedAt):\s*(\d{4}-\d{2}-\d{2}(?:[Tt ][0-9:.+-]+(?:Z)?)?)\s*(#.*)?$/gm,
    (line, indent, key, value, comment = "") => {
      fields.push(`${key}=${value}`);
      return `${indent}${key}: ${JSON.stringify(value)}${comment ? ` ${comment.trim()}` : ""}`;
    }
  );

  if (normalized === fm) return { source, changed: false, fields: [] };
  return {
    source: source.replace(fm, normalized),
    changed: true,
    fields
  };
}

const changedContent = [];
for (const file of walk(contentRoot)) {
  const source = fs.readFileSync(file, "utf8");
  const result = normalizeFrontmatterDates(source);
  if (!result.changed) continue;
  backup(file);
  fs.writeFileSync(file, result.source, "utf8");
  changedContent.push({
    file: path.relative(root, file),
    fields: result.fields
  });
}

const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..", "..");
const contentRoot = path.join(appRoot, "src", "content");
const strict = process.argv.includes("--strict");

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return /\\\\.mdx?$/i.test(entry.name) ? [full] : [];
});

const findings = [];

for (const file of walk(contentRoot)) {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/^---\\\\r?\\\\n([\\\\s\\\\S]*?)\\\\r?\\\\n---(?:\\\\r?\\\\n|$)/);
  if (!match) continue;

  const lines = match[1].split(/\\\\r?\\\\n/);
  lines.forEach((line, index) => {
    const m = line.match(/^\\\\s*(publishedAt|updatedAt):\\\\s*(.+?)\\\\s*$/);
    if (!m) return;

    const key = m[1];
    const raw = m[2].replace(/\\\\s+#.*$/, "").trim();
    if (!raw || raw.startsWith('"') || raw.startsWith("'")) return;

    findings.push({
      file: path.relative(appRoot, file),
      line: index + 2,
      key,
      value: raw,
      reason: "Datumsfelder müssen als YAML-String gequotet sein."
    });
  });
}

console.log(\`Frontmatter Date Contract: \${findings.length} Fehler.\`);
for (const finding of findings) {
  console.log(\`ERROR \${finding.file}:\${finding.line} \${finding.key}: \${finding.value} -> \${finding.reason}\`);
}

if (strict && findings.length) process.exitCode = 1;
`;

fs.mkdirSync(path.dirname(auditFile), { recursive: true });
fs.writeFileSync(auditFile, auditSource, "utf8");

let pkg = fs.readFileSync(packageFile, "utf8");
const scriptLine =
  '    "audit:frontmatter-dates": "node scripts/seo/audit-frontmatter-date-scalars.mjs",\n' +
  '    "audit:frontmatter-dates:strict": "node scripts/seo/audit-frontmatter-date-scalars.mjs --strict",\n';

if (!pkg.includes('"audit:frontmatter-dates"')) {
  const marker = '    "audit:technical-seo:source": "node scripts/seo/audit-week4-technical-seo.mjs --source-only",\n';
  if (!pkg.includes(marker)) {
    throw new Error(`[${PATCH}] package.json Marker für Audit-Skripte nicht gefunden.`);
  }
  backup(packageFile);
  pkg = pkg.replace(marker, marker + scriptLine);
  fs.writeFileSync(packageFile, pkg, "utf8");
}

let preflight = fs.readFileSync(preflightFile, "utf8");
const preflightCall = '  npmScript("Frontmatter-Datumsvertrag", "audit:frontmatter-dates:strict");\n';
if (!preflight.includes(preflightCall)) {
  const marker = '  npmScript("Technischer SEO-Source-Audit", "audit:technical-seo:source");\n';
  if (!preflight.includes(marker)) {
    throw new Error(`[${PATCH}] release-preflight Marker nicht gefunden.`);
  }
  backup(preflightFile);
  preflight = preflight.replace(marker, preflightCall + marker);
  fs.writeFileSync(preflightFile, preflight, "utf8");
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");

test("Frontmatter-Datumsfelder werden vor dem Astro-Build geprüft", () => {
  const pkg = fs.readFileSync(path.join(app, "package.json"), "utf8");
  const preflight = fs.readFileSync(path.join(app, "scripts", "seo", "release-preflight.mjs"), "utf8");
  const audit = fs.readFileSync(path.join(app, "scripts", "seo", "audit-frontmatter-date-scalars.mjs"), "utf8");

  assert.match(pkg, /"audit:frontmatter-dates:strict"/);
  assert.match(preflight, /Frontmatter-Datumsvertrag/);
  assert.match(preflight, /audit:frontmatter-dates:strict/);
  assert.match(audit, /publishedAt\\\\|updatedAt/);
  assert.match(audit, /Datumsfelder müssen als YAML-String gequotet sein/);
});
`;

fs.writeFileSync(testFile, testSource, "utf8");

function run(command, args, cwd = root) {
  console.log(`\n[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) {
    throw new Error(`[${PATCH}] Prüfung fehlgeschlagen: ${command} ${args.join(" ")}`);
  }
}

run(process.execPath, ["--check", auditFile]);
run(process.execPath, ["--check", preflightFile]);
run(process.execPath, ["--test", testFile]);
run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:frontmatter-dates:strict"]);
run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);

console.log(`\n[${PATCH}] Erfolgreich abgeschlossen.`);
console.log(`[${PATCH}] Normalisierte Content-Dateien: ${changedContent.length}`);
for (const item of changedContent) {
  console.log(`- ${item.file}: ${item.fields.join(", ")}`);
}
console.log(`[${PATCH}] Neuer Release-Guard: audit:frontmatter-dates:strict`);
console.log(`[${PATCH}] Danach vollständigen Gate starten: npm run seo:release:check`);
