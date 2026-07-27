#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-design-system-governance-11.6.0";
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
const scriptsDir = path.join(app, "scripts", "design-system");
const reportDir = path.join(app, "reports", "design-system");
const baselineFile = path.join(scriptsDir, "css-budget-baseline.json");
const budgetScript = path.join(scriptsDir, "css-budget-audit.mjs");
const checkScript = path.join(scriptsDir, "check.mjs");
const packageFile = path.join(app, "package.json");
const reportMd = path.join(reportDir, "governance-11.6.0.md");
const reportJson = path.join(reportDir, "governance-11.6.0.json");
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
    return entry.isDirectory() ? walk(file, predicate) : (predicate(file) ? [file] : []);
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

if (!fs.existsSync(packageFile)) fail(`Datei fehlt: ${rel(packageFile)}`);

const cssFiles = [
  ...walk(path.join(appSrc, "styles"), (p) => p.endsWith(".css")),
  ...walk(path.join(coreSrc, "styles"), (p) => p.endsWith(".css")),
  ...walk(path.join(coreSrc, "components"), (p) => p.endsWith(".css")),
];

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

const inventory = {
  generatedAt: new Date().toISOString(),
  cssFiles: cssFiles.length,
  cssBytes: 0,
  importantRules: 0,
  mediaQueries: 0,
  rootBlocks: 0,
  customPropertyDeclarations: 0,
  rawHexColors: 0,
  selectorsApprox: 0,
  files: {},
};

for (const file of cssFiles) {
  const css = read(file);
  const stats = {
    bytes: Buffer.byteLength(css),
    importantRules: countMatches(css, /!important\b/g),
    mediaQueries: countMatches(css, /@media\b/g),
    rootBlocks: countMatches(css, /:root\s*\{/g),
    customPropertyDeclarations: countMatches(css, /--[a-zA-Z0-9_-]+\s*:/g),
    rawHexColors: countMatches(css, /#[0-9a-fA-F]{3,8}\b/g),
    selectorsApprox: countMatches(css, /[^@{}][^{]*\{/g),
  };

  inventory.files[rel(file)] = stats;
  inventory.cssBytes += stats.bytes;
  inventory.importantRules += stats.importantRules;
  inventory.mediaQueries += stats.mediaQueries;
  inventory.rootBlocks += stats.rootBlocks;
  inventory.customPropertyDeclarations += stats.customPropertyDeclarations;
  inventory.rawHexColors += stats.rawHexColors;
  inventory.selectorsApprox += stats.selectorsApprox;
}

/* Baseline erhält kleine Wachstumsreserve, verhindert aber schleichende Explosion. */
const baseline = {
  version: 1,
  createdAt: new Date().toISOString(),
  limits: {
    cssFiles: inventory.cssFiles + 2,
    cssBytes: Math.ceil(inventory.cssBytes * 1.04),
    importantRules: inventory.importantRules,
    rootBlocks: inventory.rootBlocks,
    rawHexColors: inventory.rawHexColors,
  },
  current: {
    cssFiles: inventory.cssFiles,
    cssBytes: inventory.cssBytes,
    importantRules: inventory.importantRules,
    rootBlocks: inventory.rootBlocks,
    rawHexColors: inventory.rawHexColors,
  },
  notes: {
    cssFiles: "Maximal zwei zusätzliche CSS-Dateien ohne bewusste Baseline-Anpassung.",
    cssBytes: "Vier Prozent Wachstumsreserve für reguläre Weiterentwicklung.",
    importantRules: "Keine neuen !important-Regeln.",
    rootBlocks: "Keine zusätzlichen :root-Blöcke.",
    rawHexColors: "Keine neuen harten Hex-Farben.",
  },
};

write(baselineFile, JSON.stringify(baseline, null, 2) + "\n");

const budgetSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const appSrc = path.join(appRoot, "src");
const coreSrc = path.join(repoRoot, "packages", "affiliate-core", "src");
const baselineFile = path.join(scriptDir, "css-budget-baseline.json");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro", ".git"].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function count(text, regex) {
  return (text.match(regex) || []).length;
}

if (!fs.existsSync(baselineFile)) {
  console.error("CSS-Budget-Baseline fehlt.");
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
const cssFiles = [
  ...walk(path.join(appSrc, "styles")),
  ...walk(path.join(coreSrc, "styles")),
  ...walk(path.join(coreSrc, "components")),
].filter((file) => file.endsWith(".css"));

const current = {
  cssFiles: cssFiles.length,
  cssBytes: 0,
  importantRules: 0,
  rootBlocks: 0,
  rawHexColors: 0,
};

for (const file of cssFiles) {
  const css = fs.readFileSync(file, "utf8");
  current.cssBytes += Buffer.byteLength(css);
  current.importantRules += count(css, /!important\\b/g);
  current.rootBlocks += count(css, /:root\\s*\\{/g);
  current.rawHexColors += count(css, /#[0-9a-fA-F]{3,8}\\b/g);
}

const errors = [];
for (const [metric, limit] of Object.entries(baseline.limits)) {
  if (current[metric] > limit) {
    errors.push(
      metric + ": " + current[metric] + " überschreitet Budget " + limit
    );
  }
}

console.log("CSS-Budget:");
console.log(JSON.stringify({ current, limits: baseline.limits }, null, 2));

if (errors.length) {
  console.error("\\nCSS-Budget überschritten:");
  console.error(errors.join("\\n"));
  console.error(
    "\\nNur nach bewusster Prüfung die Baseline aktualisieren."
  );
  process.exit(1);
}

console.log("CSS-Budget-Audit erfolgreich.");
`;

write(budgetScript, budgetSource);

const checkSource = `#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");

const checks = [
  "design-system:audit",
  "design-system:tokens:audit",
  "design-system:primitives:audit",
  "design-system:components:audit",
  "design-system:budget:audit",
];

for (const check of checks) {
  console.log("\\n=== " + check + " ===");
  const result = spawnSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", check],
    { cwd: repoRoot, stdio: "inherit", shell: false }
  );

  if (result.status !== 0) {
    console.error("\\nDesign-System-Check fehlgeschlagen: " + check);
    process.exit(result.status || 1);
  }
}

console.log("\\nAlle Design-System-Checks erfolgreich.");
`;

write(checkScript, checkSource);

const pkg = JSON.parse(read(packageFile));
pkg.scripts ||= {};
pkg.scripts["design-system:budget:audit"] =
  "node scripts/design-system/css-budget-audit.mjs";
pkg.scripts["design-system:check"] =
  "node scripts/design-system/check.mjs";
write(packageFile, JSON.stringify(pkg, null, 2) + "\n");

const report = {
  name: NAME,
  generatedAt: new Date().toISOString(),
  dryRun: DRY_RUN,
  inventory,
  baseline,
};

const md = `# PfotenTechnik Design-System Governance 11.6.0

## Aktueller Bestand

- CSS-Dateien: **${inventory.cssFiles}**
- CSS-Größe: **${inventory.cssBytes.toLocaleString("de-DE")} Bytes**
- \`!important\`-Regeln: **${inventory.importantRules}**
- \`:root\`-Blöcke: **${inventory.rootBlocks}**
- harte Hex-Farben: **${inventory.rawHexColors}**
- Media Queries: **${inventory.mediaQueries}**

## Installierte Schutzmechanismen

- zentrales Kommando für alle Design-System-Audits
- CSS-Dateibudget
- Größenbudget mit vier Prozent Reserve
- keine neuen \`!important\`-Regeln
- keine zusätzlichen \`:root\`-Blöcke
- keine neuen harten Hex-Farben
- versionierte Baseline

## Zentrales Kommando

\`\`\`bash
npm --workspace apps/pfotentechnik run design-system:check
\`\`\`

## Baseline bewusst aktualisieren

Die Baseline soll nur angepasst werden, wenn eine geprüfte funktionale Erweiterung das Budget legitim erhöht. Sie befindet sich unter:

\`\`\`text
apps/pfotentechnik/scripts/design-system/css-budget-baseline.json
\`\`\`
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportJson, JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(reportMd, md);
}

log(`CSS-Dateien: ${inventory.cssFiles}`);
log(`CSS-Größe: ${inventory.cssBytes.toLocaleString("de-DE")} Bytes`);
log(`!important-Regeln: ${inventory.importantRules}`);
log(`Harte Hex-Farben: ${inventory.rawHexColors}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run abgeschlossen.");
  process.exit(0);
}

if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:check"])) {
  fail("Zentraler Design-System-Check fehlgeschlagen.");
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
    if (!run("git", ["commit", "-m", "chore(pfotentechnik): enforce design system governance"])) {
      fail("Commit fehlgeschlagen.");
    }
    log("Änderungen lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Design-System Governance 11.6.0 erfolgreich abgeschlossen.");
