#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-design-token-migration-11.3.0";
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const NO_COMMIT = args.has("--no-commit");

const log = (m) => console.log(`[${NAME}] ${m}`);
const fail = (m) => {
  console.error(`[${NAME}] FEHLER: ${m}`);
  process.exit(1);
};

function findRoot(start) {
  let dir = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = findRoot(process.cwd()) || findRoot(scriptDir);
if (!root) fail("Repository-Root nicht gefunden.");

const app = path.join(root, "apps", "pfotentechnik");
const appSrc = path.join(app, "src");
const coreSrc = path.join(root, "packages", "affiliate-core", "src");
const tokenFile = path.join(appSrc, "styles", "pfotentechnik-design-tokens.css");
const auditFile = path.join(app, "scripts", "design-system", "token-audit.mjs");
const packageFile = path.join(app, "package.json");
const reportDir = path.join(app, "reports", "design-system");
const reportMd = path.join(reportDir, "token-migration-11.3.0.md");
const reportJson = path.join(reportDir, "token-migration-11.3.0.json");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/");
}
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
function read(file) {
  return fs.readFileSync(file, "utf8");
}
function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro", ".git", ".patch-backups"].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(file, predicate);
    return predicate(file) ? [file] : [];
  });
}
function backup(file) {
  if (DRY_RUN || !fs.existsSync(file)) return;
  const target = path.join(backupRoot, rel(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}
function write(file, content) {
  const old = fs.existsSync(file) ? read(file) : null;
  if (old === content) return false;
  if (!DRY_RUN) {
    if (old !== null) backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }
  return true;
}
function run(cmd, argv) {
  return spawnSync(cmd, argv, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  }).status === 0;
}

if (!fs.existsSync(tokenFile)) fail(`Token-Datei fehlt: ${rel(tokenFile)}`);

const cssFiles = [
  ...walk(path.join(appSrc, "styles"), (p) => p.endsWith(".css")),
  ...walk(path.join(coreSrc, "styles"), (p) => p.endsWith(".css")),
  ...walk(path.join(coreSrc, "components"), (p) => p.endsWith(".css")),
].filter((p) => p !== tokenFile);

const exactValueMap = new Map([
  ["#0f766e", "var(--pt-color-brand-600)"],
  ["#115e59", "var(--pt-color-brand-700)"],
  ["#14b8a6", "var(--pt-color-brand-500)"],
  ["#2e7d32", "var(--pt-color-brand-600)"],
  ["#3f8f50", "var(--pt-color-brand-500)"],
  ["#4f46e5", "var(--pt-color-accent-600)"],
  ["#f59e0b", "var(--pt-color-warning-500)"],
  ["#dc2626", "var(--pt-color-danger-600)"],
  ["#ffffff", "var(--pt-color-surface)"],
  ["#fff", "var(--pt-color-surface)"],
  ["#f8fafc", "var(--pt-color-page)"],
  ["#f7faf8", "var(--pt-color-surface-soft)"],
  ["#17211b", "var(--pt-color-text)"],
  ["#5f6f65", "var(--pt-color-text-muted)"],
  ["#dfe7e1", "var(--pt-color-border)"],
  ["#cbd7ce", "var(--pt-color-border-strong)"],
  ["0.375rem", "var(--pt-radius-xs)"],
  ["0.5rem", "var(--pt-radius-sm)"],
  ["0.75rem", "var(--pt-radius-md)"],
  ["1rem", "var(--pt-radius-lg)"],
  ["1.25rem", "var(--pt-radius-xl)"],
  ["1.5rem", "var(--pt-radius-2xl)"],
  ["999px", "var(--pt-radius-pill)"],
]);

const propertyAllowlist = new Set([
  "color",
  "background-color",
  "border-color",
  "outline-color",
  "text-decoration-color",
  "fill",
  "stroke",
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
]);

const replacements = {};
const changedFiles = [];

function migrateDeclarations(css, file) {
  let changed = false;

  const output = css.replace(
    /(^|[;{]\s*)([a-zA-Z-]+)\s*:\s*([^;{}]+)(;?)/gm,
    (full, prefix, property, rawValue, terminator) => {
      const normalizedProperty = property.toLowerCase();
      if (!propertyAllowlist.has(normalizedProperty)) return full;

      const importantMatch = rawValue.match(/^(.*?)(\s*!important\s*)$/);
      const valuePart = (importantMatch ? importantMatch[1] : rawValue).trim();
      const important = importantMatch ? importantMatch[2] : "";

      const token = exactValueMap.get(valuePart.toLowerCase());
      if (!token) return full;

      changed = true;
      const key = `${normalizedProperty}: ${valuePart}`;
      replacements[rel(file)] ||= {};
      replacements[rel(file)][key] = (replacements[rel(file)][key] || 0) + 1;

      return `${prefix}${property}: ${token}${important}${terminator}`;
    }
  );

  return { output, changed };
}

for (const file of cssFiles) {
  const before = read(file);
  const { output, changed } = migrateDeclarations(before, file);
  if (changed && write(file, output)) changedFiles.push(rel(file));
}

/* Ergänzende Standardtokens nur dann hinzufügen, wenn sie fehlen. */
let tokens = read(tokenFile);
const requiredTokens = {
  "--pt-radius-3xl": "2rem",
  "--pt-shadow-card": "var(--pt-shadow-sm)",
  "--pt-shadow-overlay": "var(--pt-shadow-lg)",
  "--pt-color-on-brand": "#ffffff",
  "--pt-color-on-danger": "#ffffff",
  "--pt-color-on-warning": "#17211b",
};

const missingLines = [];
for (const [name, value] of Object.entries(requiredTokens)) {
  if (!new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`).test(tokens)) {
    missingLines.push(`  ${name}: ${value};`);
  }
}
if (missingLines.length) {
  tokens = tokens.replace(/:root\s*\{/, (m) => `${m}\n${missingLines.join("\n")}`);
  write(tokenFile, tokens);
}

/* Permanentes Audit: neue harte Standardwerte melden, aber erlaubte Ausnahmen
 * (Gradients, rgba/rgb, CSS custom properties und Token-Datei) ignorieren.
 */
const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const auditDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(auditDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const tokenFile = path.join(appRoot, "src", "styles", "pfotentechnik-design-tokens.css");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro", ".git"].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const cssFiles = [
  ...walk(path.join(appRoot, "src", "styles")),
  ...walk(path.join(repoRoot, "packages", "affiliate-core", "src", "styles")),
  ...walk(path.join(repoRoot, "packages", "affiliate-core", "src", "components")),
].filter((file) => file.endsWith(".css") && file !== tokenFile);

const watchedValues = [
  "#0f766e", "#115e59", "#14b8a6", "#2e7d32", "#3f8f50",
  "#4f46e5", "#f59e0b", "#dc2626", "#ffffff", "#fff",
  "#f8fafc", "#f7faf8", "#17211b", "#5f6f65", "#dfe7e1", "#cbd7ce",
  "0.375rem", "0.5rem", "0.75rem", "1rem", "1.25rem", "1.5rem", "999px"
];

const allowedProperties = new Set([
  "color", "background-color", "border-color", "outline-color",
  "text-decoration-color", "fill", "stroke", "border-radius",
  "border-top-left-radius", "border-top-right-radius",
  "border-bottom-left-radius", "border-bottom-right-radius"
]);

const findings = [];
const declarationRe = /(^|[;{]\\s*)([a-zA-Z-]+)\\s*:\\s*([^;{}]+)(;?)/gm;

for (const file of cssFiles) {
  const css = fs.readFileSync(file, "utf8");
  let match;
  while ((match = declarationRe.exec(css))) {
    const property = match[2].toLowerCase();
    if (!allowedProperties.has(property)) continue;
    const value = match[3].replace(/\\s*!important\\s*$/, "").trim().toLowerCase();
    if (watchedValues.includes(value)) {
      findings.push(\`\${path.relative(repoRoot, file)}: \${property}: \${value}\`);
    }
  }
}

if (findings.length) {
  console.error("Nicht tokenisierte Standardwerte gefunden:");
  console.error(findings.join("\\n"));
  process.exit(1);
}

console.log("Design-Token-Audit erfolgreich.");
`;

write(auditFile, auditSource);

const pkg = JSON.parse(read(packageFile));
pkg.scripts ||= {};
pkg.scripts["design-system:tokens:audit"] = "node scripts/design-system/token-audit.mjs";
write(packageFile, JSON.stringify(pkg, null, 2) + "\n");

const summary = {
  changedFiles: changedFiles.length,
  replacements: Object.values(replacements).reduce(
    (sum, fileMap) => sum + Object.values(fileMap).reduce((a, b) => a + b, 0),
    0
  ),
  addedTokens: missingLines.length,
};

const report = {
  name: NAME,
  generatedAt: new Date().toISOString(),
  dryRun: DRY_RUN,
  summary,
  changedFiles,
  replacements,
};

const md = `# PfotenTechnik Design-Token-Migration 11.3.0

## Ergebnis

- CSS-Dateien mit Migrationen: **${summary.changedFiles}**
- Ersetzte harte Standardwerte: **${summary.replacements}**
- Ergänzte zentrale Tokens: **${summary.addedTokens}**

## Geänderte Dateien

${changedFiles.length ? changedFiles.map((f) => `- \`${f}\``).join("\n") : "- Keine"}

## Sicherheitsumfang

Automatisch ersetzt wurden ausschließlich exakte Einzelwerte in diesen Deklarationen:

- Text-, Hintergrund- und Rahmenfarben
- Fill und Stroke
- Border-Radien

Nicht automatisch verändert wurden:

- Gradients
- RGB-/RGBA-Mischfarben
- komplexe Schatten
- komponentenspezifische Sonderfarben
- Werte innerhalb von calc(), clamp() oder Mehrfachdeklarationen
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportJson, JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(reportMd, md);
}

log(`Migrierte Dateien: ${summary.changedFiles}`);
log(`Token-Ersetzungen: ${summary.replacements}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run abgeschlossen.");
  process.exit(0);
}

if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:audit"])) {
  fail("Design-System-Audit fehlgeschlagen.");
}
if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:tokens:audit"])) {
  fail("Design-Token-Audit fehlgeschlagen.");
}
if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("Build fehlgeschlagen.");
}

if (!NO_COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });
  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", "-A"])) fail("git add fehlgeschlagen.");
    if (!run("git", ["commit", "-m", "refactor(pfotentechnik): migrate ui values to design tokens"])) {
      fail("Commit fehlgeschlagen.");
    }
    log("Änderungen lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Token-Migration 11.3.0 erfolgreich abgeschlossen.");
