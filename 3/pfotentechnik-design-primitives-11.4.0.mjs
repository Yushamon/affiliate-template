#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-design-primitives-11.4.0";
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
const stylesDir = path.join(appSrc, "styles");
const tokenFile = path.join(stylesDir, "pfotentechnik-design-tokens.css");
const primitivesFile = path.join(stylesDir, "pfotentechnik-primitives.css");
const layoutFile = path.join(appSrc, "layouts", "ProjectLayout.astro");
const packageFile = path.join(app, "package.json");
const auditFile = path.join(app, "scripts", "design-system", "primitives-audit.mjs");
const reportDir = path.join(app, "reports", "design-system");
const reportMd = path.join(reportDir, "primitives-11.4.0.md");
const reportJson = path.join(reportDir, "primitives-11.4.0.json");
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

for (const file of [tokenFile, layoutFile, packageFile]) {
  if (!fs.existsSync(file)) fail(`Pflichtdatei fehlt: ${rel(file)}`);
}

/* 1. Typografie- und Layout-Tokens ergänzen */
let tokens = read(tokenFile);

const tokenDefinitions = {
  "--pt-font-sans": 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "--pt-font-size-xs": "0.75rem",
  "--pt-font-size-sm": "0.875rem",
  "--pt-font-size-base": "1rem",
  "--pt-font-size-md": "1.0625rem",
  "--pt-font-size-lg": "1.1875rem",
  "--pt-font-size-xl": "1.375rem",
  "--pt-font-size-2xl": "1.75rem",
  "--pt-font-size-3xl": "2.25rem",
  "--pt-font-size-4xl": "3rem",
  "--pt-font-size-display": "clamp(2.5rem, 7vw, 5rem)",
  "--pt-line-height-tight": "1.08",
  "--pt-line-height-heading": "1.18",
  "--pt-line-height-body": "1.65",
  "--pt-line-height-relaxed": "1.75",
  "--pt-letter-spacing-tight": "-0.035em",
  "--pt-letter-spacing-heading": "-0.025em",
  "--pt-letter-spacing-label": "0.08em",
  "--pt-font-weight-medium": "500",
  "--pt-font-weight-semibold": "650",
  "--pt-font-weight-bold": "750",
  "--pt-font-weight-black": "850",
  "--pt-content-narrow": "46rem",
  "--pt-content-reading": "68rem",
  "--pt-content-wide": "82.5rem",
  "--pt-page-gutter": "clamp(1rem, 3vw, 2rem)",
  "--pt-section-space": "clamp(3.5rem, 8vw, 6.5rem)",
  "--pt-focus-ring": "0 0 0 3px color-mix(in srgb, var(--pt-color-brand-600) 26%, transparent)",
};

const missingTokenLines = [];
for (const [name, value] of Object.entries(tokenDefinitions)) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`${escaped}\\s*:`).test(tokens)) {
    missingTokenLines.push(`  ${name}: ${value};`);
  }
}

if (missingTokenLines.length) {
  tokens = tokens.replace(/:root\s*\{/, (match) => `${match}\n${missingTokenLines.join("\n")}`);
}
const tokenChanged = write(tokenFile, tokens);

/* 2. Zentrale Primitive erzeugen */
const primitives = `/**
 * PfotenTechnik Design Primitives
 *
 * Baseline für Typografie, Layout, Buttons, Chips und Formfelder.
 * Komponenten dürfen diese Regeln gezielt erweitern, aber nicht mit
 * konkurrierenden globalen Baselines überschreiben.
 */

:where(html) {
  font-family: var(--pt-font-sans);
  color: var(--pt-color-text);
  background: var(--pt-color-page);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

:where(body) {
  margin: 0;
  color: var(--pt-color-text);
  background: var(--pt-color-page);
  font-family: var(--pt-font-sans);
  font-size: var(--pt-font-size-base);
  line-height: var(--pt-line-height-body);
}

:where(h1, h2, h3, h4, h5, h6) {
  margin-block: 0;
  color: var(--pt-color-text);
  font-weight: var(--pt-font-weight-bold);
  line-height: var(--pt-line-height-heading);
  letter-spacing: var(--pt-letter-spacing-heading);
  text-wrap: balance;
}

:where(h1) {
  font-size: clamp(2.25rem, 6vw, 4.75rem);
  line-height: var(--pt-line-height-tight);
  letter-spacing: var(--pt-letter-spacing-tight);
}

:where(h2) {
  font-size: clamp(1.875rem, 4.5vw, 3.5rem);
}

:where(h3) {
  font-size: clamp(1.375rem, 3vw, 2rem);
}

:where(h4) {
  font-size: var(--pt-font-size-xl);
}

:where(p, li, dd, dt) {
  font-size: inherit;
}

:where(p) {
  margin-block: 0;
}

:where(a) {
  color: inherit;
  text-underline-offset: 0.18em;
}

:where(img, svg, video) {
  max-width: 100%;
}

:where(button, input, select, textarea) {
  font: inherit;
}

:where(button, [role="button"], a[href], input, select, textarea, summary):focus-visible {
  outline: none;
  box-shadow: var(--pt-focus-ring);
}

.pt-page-shell {
  width: min(100%, var(--pt-content-wide));
  margin-inline: auto;
  padding-inline: var(--pt-page-gutter);
}

.pt-reading-width {
  width: min(100%, var(--pt-content-reading));
  margin-inline: auto;
}

.pt-narrow-width {
  width: min(100%, var(--pt-content-narrow));
  margin-inline: auto;
}

.pt-section-space {
  padding-block: var(--pt-section-space);
}

.pt-stack-xs > * + * {
  margin-top: var(--pt-space-2);
}

.pt-stack-sm > * + * {
  margin-top: var(--pt-space-3);
}

.pt-stack-md > * + * {
  margin-top: var(--pt-space-4);
}

.pt-stack-lg > * + * {
  margin-top: var(--pt-space-6);
}

.pt-stack-xl > * + * {
  margin-top: var(--pt-space-10);
}

.pt-cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pt-space-3);
  align-items: center;
}

.pt-surface {
  border: 1px solid var(--pt-color-border);
  border-radius: var(--pt-radius-xl);
  background: var(--pt-color-surface);
  box-shadow: var(--pt-shadow-xs);
}

.pt-surface-raised {
  border: 1px solid var(--pt-color-border);
  border-radius: var(--pt-radius-2xl);
  background: var(--pt-color-surface-raised);
  box-shadow: var(--pt-shadow-sm);
}

.pt-button,
.pt-chip,
.pt-control {
  min-height: var(--pt-control-min-height);
  border-radius: var(--pt-radius-pill);
  font-weight: var(--pt-font-weight-bold);
  transition:
    transform var(--pt-transition-fast),
    border-color var(--pt-transition-fast),
    background-color var(--pt-transition-fast),
    color var(--pt-transition-fast),
    box-shadow var(--pt-transition-fast);
}

.pt-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--pt-space-2);
  padding: 0.75rem 1.25rem;
  border: 1px solid transparent;
  text-decoration: none;
  cursor: pointer;
}

.pt-button:hover {
  transform: translateY(-1px);
}

.pt-button:active {
  transform: translateY(0);
}

.pt-button-primary {
  border-color: var(--pt-color-brand-600);
  background: var(--pt-color-brand-600);
  color: var(--pt-color-on-brand);
  box-shadow: var(--pt-shadow-sm);
}

.pt-button-primary:hover {
  border-color: var(--pt-color-brand-700);
  background: var(--pt-color-brand-700);
  box-shadow: var(--pt-shadow-md);
}

.pt-button-secondary {
  border-color: var(--pt-color-border-strong);
  background: var(--pt-color-surface);
  color: var(--pt-color-text);
}

.pt-button-secondary:hover {
  border-color: var(--pt-color-brand-500);
  background: var(--pt-color-brand-050);
}

.pt-button-quiet {
  border-color: transparent;
  background: transparent;
  color: var(--pt-color-brand-700);
  box-shadow: none;
}

.pt-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--pt-space-2);
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--pt-color-border);
  background: var(--pt-color-surface);
  color: var(--pt-color-text);
  font-size: var(--pt-font-size-sm);
  text-decoration: none;
}

.pt-chip:hover,
.pt-chip[aria-pressed="true"],
.pt-chip[data-active="true"] {
  border-color: var(--pt-color-brand-500);
  background: var(--pt-color-brand-050);
  color: var(--pt-color-brand-700);
}

.pt-control {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--pt-color-border-strong);
  background: var(--pt-color-surface);
  color: var(--pt-color-text);
}

.pt-control::placeholder {
  color: var(--pt-color-text-muted);
}

.pt-control:hover {
  border-color: var(--pt-color-brand-500);
}

.pt-control:focus {
  border-color: var(--pt-color-brand-600);
}

.pt-eyebrow,
.pt-label {
  color: var(--pt-color-brand-700);
  font-size: var(--pt-font-size-xs);
  font-weight: var(--pt-font-weight-black);
  letter-spacing: var(--pt-letter-spacing-label);
  text-transform: uppercase;
}

.pt-muted {
  color: var(--pt-color-text-muted);
}

.pt-lead {
  max-width: 42rem;
  color: var(--pt-color-text-muted);
  font-size: clamp(var(--pt-font-size-md), 2vw, var(--pt-font-size-xl));
  line-height: var(--pt-line-height-relaxed);
}

@media (max-width: 47.99rem) {
  :where(body) {
    font-size: 1rem;
  }

  .pt-page-shell {
    padding-inline: clamp(0.875rem, 4vw, 1.25rem);
  }

  .pt-button {
    min-height: 3rem;
    padding-inline: 1.125rem;
  }

  .pt-chip {
    min-height: 2.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pt-button,
  .pt-chip,
  .pt-control {
    transition: none;
  }

  .pt-button:hover {
    transform: none;
  }
}
`;

const primitivesChanged = write(primitivesFile, primitives);

/* 3. Import unmittelbar nach Tokens einfügen */
let layout = read(layoutFile);
layout = layout.replace(
  /^\s*import\s+["'][^"']*pfotentechnik-primitives\.css["'];?\s*$/gm,
  ""
);

const tokenImportPattern =
  /import\s+["']\.\.\/styles\/pfotentechnik-design-tokens\.css["'];?/;

if (!tokenImportPattern.test(layout)) {
  fail("Token-Import im ProjectLayout fehlt.");
}

layout = layout.replace(
  tokenImportPattern,
  (match) => `${match}\nimport "../styles/pfotentechnik-primitives.css";`
);

layout = layout.replace(/\n{3,}/g, "\n\n");
const layoutChanged = write(layoutFile, layout);

/* 4. Audit installieren */
const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const auditDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(auditDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");

const tokenFile = path.join(appRoot, "src", "styles", "pfotentechnik-design-tokens.css");
const primitivesFile = path.join(appRoot, "src", "styles", "pfotentechnik-primitives.css");
const layoutFile = path.join(appRoot, "src", "layouts", "ProjectLayout.astro");

const errors = [];

for (const file of [tokenFile, primitivesFile, layoutFile]) {
  if (!fs.existsSync(file)) {
    errors.push("Datei fehlt: " + path.relative(repoRoot, file));
  }
}

if (fs.existsSync(layoutFile)) {
  const layout = fs.readFileSync(layoutFile, "utf8");
  const tokenIndex = layout.indexOf("pfotentechnik-design-tokens.css");
  const primitivesIndex = layout.indexOf("pfotentechnik-primitives.css");

  if (tokenIndex < 0) errors.push("Token-Import fehlt.");
  if (primitivesIndex < 0) errors.push("Primitives-Import fehlt.");
  if (tokenIndex >= 0 && primitivesIndex >= 0 && primitivesIndex < tokenIndex) {
    errors.push("Primitives werden vor den Tokens importiert.");
  }

  if ((layout.match(/pfotentechnik-primitives\\.css/g) || []).length !== 1) {
    errors.push("Primitives-Datei wird nicht exakt einmal importiert.");
  }
}

if (fs.existsSync(tokenFile)) {
  const tokens = fs.readFileSync(tokenFile, "utf8");
  const required = [
    "--pt-font-sans",
    "--pt-font-size-base",
    "--pt-line-height-body",
    "--pt-content-wide",
    "--pt-page-gutter",
    "--pt-focus-ring",
  ];
  for (const token of required) {
    if (!tokens.includes(token + ":")) {
      errors.push("Token fehlt: " + token);
    }
  }
}

if (fs.existsSync(primitivesFile)) {
  const css = fs.readFileSync(primitivesFile, "utf8");
  const requiredSelectors = [
    ".pt-page-shell",
    ".pt-button-primary",
    ".pt-chip",
    ".pt-control",
    ".pt-surface",
  ];
  for (const selector of requiredSelectors) {
    if (!css.includes(selector)) {
      errors.push("Primitive fehlt: " + selector);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\\n"));
  process.exit(1);
}

console.log("Design-Primitives-Audit erfolgreich.");
`;

write(auditFile, auditSource);

const pkg = JSON.parse(read(packageFile));
pkg.scripts ||= {};
pkg.scripts["design-system:primitives:audit"] =
  "node scripts/design-system/primitives-audit.mjs";
write(packageFile, JSON.stringify(pkg, null, 2) + "\n");

const summary = {
  addedTokens: missingTokenLines.length,
  tokenFileChanged: tokenChanged,
  primitivesFileChanged: primitivesChanged,
  layoutChanged,
};

const report = {
  name: NAME,
  generatedAt: new Date().toISOString(),
  dryRun: DRY_RUN,
  summary,
};

const md = `# PfotenTechnik Design Primitives 11.4.0

## Ergebnis

- Ergänzte Typografie-/Layout-Tokens: **${summary.addedTokens}**
- Token-Datei geändert: **${summary.tokenFileChanged ? "ja" : "nein"}**
- Primitive-Datei erstellt/aktualisiert: **${summary.primitivesFileChanged ? "ja" : "nein"}**
- ProjectLayout aktualisiert: **${summary.layoutChanged ? "ja" : "nein"}**

## Neue Baseline

- typografische Skala
- einheitliche Zeilenhöhen und Schriftgewichte
- Seitenbreiten und responsive Gutter
- vertikale Stack-Utilities
- Oberflächen und Karten
- primäre, sekundäre und ruhige Buttons
- klickbare Chips
- Formfelder
- Fokuszustände
- reduzierte Bewegung

## Importreihenfolge

1. \`pfotentechnik-design-tokens.css\`
2. \`pfotentechnik-primitives.css\`
3. bestehende Basis- und Komponentenebenen
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportJson, JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(reportMd, md);
}

log(`Neue Tokens: ${summary.addedTokens}`);
log(`Primitives: ${primitivesChanged ? "aktualisiert" : "bereits aktuell"}`);
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
if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:primitives:audit"])) {
  fail("Design-Primitives-Audit fehlgeschlagen.");
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
    if (!run("git", ["commit", "-m", "refactor(pfotentechnik): standardize design primitives"])) {
      fail("Commit fehlgeschlagen.");
    }
    log("Änderungen lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Design-Primitives 11.4.0 erfolgreich abgeschlossen.");
