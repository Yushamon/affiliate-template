#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-design-system-consolidation-11.1.0";
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
const src = path.join(app, "src");
const styles = path.join(src, "styles");
const layoutFile = path.join(src, "layouts", "ProjectLayout.astro");
const tokenFile = path.join(styles, "pfotentechnik-design-tokens.css");
const baseFile = path.join(styles, "pfotentechnik.css");
const consolidatedFile = path.join(styles, "pfotentechnik-ui-system.css");
const reportFile = path.join(app, "reports", "design-system", "consolidation-11.1.0.md");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const mergeCandidates = [
  "pfotentechnik-theme-fixes.css",
  "pfotentechnik-cta-system.css",
  "pfotentechnik-content-ui-polish.css",
].map((name) => path.join(styles, name));

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
  if (!fs.existsSync(file) || DRY_RUN) return;
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
function remove(file) {
  if (!fs.existsSync(file)) return false;
  if (!DRY_RUN) {
    backup(file);
    fs.rmSync(file);
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

for (const file of [layoutFile, tokenFile, baseFile]) {
  if (!fs.existsSync(file)) fail(`Pflichtdatei fehlt: ${rel(file)}`);
}

/* 1. ProjectLayout frontmatter robust normalisieren */
let layout = read(layoutFile);
const firstFence = layout.indexOf("---");
const secondFence = layout.indexOf("---", firstFence + 3);
if (firstFence !== 0 || secondFence < 3) {
  fail("ProjectLayout besitzt kein gültig erkennbares Astro-Frontmatter.");
}

let frontmatter = layout.slice(3, secondFence);
const template = layout.slice(secondFence + 3);

frontmatter = frontmatter
  .replace(/;\s*---\s*$/gm, ";")
  .replace(/^\s*import\s+["'][^"']*pfotentechnik-(?:theme-fixes|cta-system|content-ui-polish)\.css["'];?\s*$/gm, "")
  .replace(/^\s*import\s+["'][^"']*pfotentechnik-design-tokens\.css["'];?\s*$/gm, "")
  .replace(/^\s*import\s+["'][^"']*pfotentechnik-ui-system\.css["'];?\s*$/gm, "");

const lines = frontmatter.split("\n");
const importLines = [];
const otherLines = [];
for (const line of lines) {
  if (/^\s*import\s+/.test(line)) importLines.push(line.trim());
  else otherLines.push(line);
}

const orderedStyleImports = [
  'import "../styles/pfotentechnik-design-tokens.css";',
  'import "../styles/pfotentechnik.css";',
  'import "../styles/pfotentechnik-design-system.css";',
  'import "../styles/pfotentechnik-ui-system.css";',
  'import "../styles/pfotentechnik-product-mobile-premium.css";',
];

const nonStyleImports = importLines.filter(
  (line) => !/import\s+["']\.\.\/styles\//.test(line)
);

const normalizedFrontmatter = [
  "",
  ...nonStyleImports,
  ...orderedStyleImports.filter((line) => {
    if (line.includes("product-mobile-premium")) {
      return fs.existsSync(path.join(styles, "pfotentechnik-product-mobile-premium.css"));
    }
    if (line.includes("design-system.css")) {
      return fs.existsSync(path.join(styles, "pfotentechnik-design-system.css"));
    }
    return true;
  }),
  "",
  ...otherLines.filter((line, index, arr) => {
    if (!line.trim() && (!index || !arr[index - 1]?.trim())) return false;
    return true;
  }),
].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();

const normalizedLayout = `---${normalizedFrontmatter}\n---${template}`;
const layoutChanged = write(layoutFile, normalizedLayout);

/* 2. Bestehende allgemeine Override-Dateien verlustfrei zusammenführen */
const sections = [];
for (const file of mergeCandidates) {
  if (!fs.existsSync(file)) continue;
  const content = read(file).trim();
  if (!content) continue;
  sections.push(`/* ============================================================
 * Quelle: ${path.basename(file)}
 * Reihenfolge beim früheren Import wurde beibehalten.
 * ============================================================ */\n${content}`);
}

if (!sections.length && fs.existsSync(consolidatedFile)) {
  sections.push(read(consolidatedFile).trim());
}

const consolidatedHeader = `/**
 * PfotenTechnik UI System
 *
 * Konsolidiert allgemeine Theme-, CTA- und Content-UI-Overrides.
 * Spezifische Produkt-Mobile-Regeln bleiben bewusst separat.
 * Keine neuen Seiten-Hotfix-Dateien mehr anlegen; stattdessen diese Datei
 * oder die zuständige Komponenten-CSS-Datei pflegen.
 */`;

const consolidatedContent = `${consolidatedHeader}\n\n${sections.join("\n\n")}\n`;
const consolidatedChanged = write(consolidatedFile, consolidatedContent);

const removed = [];
for (const file of mergeCandidates) {
  if (remove(file)) removed.push(rel(file));
}

/* 3. Legacy-Variablen auf semantische Tokens abbilden */
let tokens = read(tokenFile);
const compatibilityBlock = `
/* Kompatibilitäts-Aliasse für bestehende Komponenten.
 * Diese Aliasse verhindern parallele Farb- und Schattenquellen.
 */
:root {
  --primary: var(--pt-color-brand-600);
  --primary-dark: var(--pt-color-brand-700);
  --primary-soft: var(--pt-color-brand-100);
  --secondary: var(--pt-color-brand-500);
  --accent: var(--pt-color-warning-500);
  --text: var(--pt-color-text);
  --muted: var(--pt-color-text-muted);
  --bg: var(--pt-color-page);
  --bg-soft: var(--pt-color-surface-soft);
  --surface: var(--pt-color-surface);
  --surface-soft: var(--pt-color-surface-soft);
  --card: var(--pt-color-surface-raised);
  --border: var(--pt-color-border);
  --border-strong: var(--pt-color-border-strong);
  --shadow-soft: var(--pt-shadow-sm);
  --shadow-strong: var(--pt-shadow-lg);
}
`;

tokens = tokens.replace(
  /\n?\/\* Kompatibilitäts-Aliasse[\s\S]*?(?=\n\[data-theme="dark"\]|\n\.dark|\s*$)/,
  "\n"
);

const darkIndex = tokens.search(/\n\[data-theme="dark"\]|\n\.dark/);
if (darkIndex >= 0) {
  tokens =
    tokens.slice(0, darkIndex).trimEnd() +
    "\n" +
    compatibilityBlock +
    "\n" +
    tokens.slice(darkIndex).trimStart();
} else {
  tokens = tokens.trimEnd() + "\n" + compatibilityBlock;
}
const tokensChanged = write(tokenFile, tokens);

/* 4. Alte Root-Definition in pfotentechnik.css entfernen,
      da sie nun vollständig aus der Token-Datei kommt. */
let base = read(baseFile);
const rootMatch = base.match(/^\s*:root\s*\{[\s\S]*?\}\s*/);
let baseChanged = false;
if (rootMatch && /--primary\s*:/.test(rootMatch[0])) {
  base = base.slice(rootMatch[0].length);
  baseChanged = write(baseFile, base);
}

/* 5. Echte Konfliktmarker und verbliebene alte Imports prüfen */
const checkFiles = [layoutFile, tokenFile, baseFile, consolidatedFile];
const errors = [];
for (const file of checkFiles) {
  const text = read(file);
  if (/^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(text)) {
    errors.push(`Merge-Konfliktmarker: ${rel(file)}`);
  }
}

const finalLayout = DRY_RUN ? normalizedLayout : read(layoutFile);
for (const file of mergeCandidates) {
  if (finalLayout.includes(path.basename(file))) {
    errors.push(`Alter CSS-Import verblieben: ${path.basename(file)}`);
  }
}
if (!finalLayout.includes("pfotentechnik-ui-system.css")) {
  errors.push("Konsolidierter UI-System-Import fehlt.");
}
if ((finalLayout.match(/pfotentechnik-design-tokens\.css/g) || []).length !== 1) {
  errors.push("Token-Datei wird nicht exakt einmal importiert.");
}
if (errors.length) fail(errors.join("\n"));

const report = `# Design-System-Konsolidierung 11.1.0

## Ergebnis

- ProjectLayout normalisiert: **${layoutChanged ? "ja" : "bereits korrekt"}**
- UI-System erzeugt/aktualisiert: **${consolidatedChanged ? "ja" : "unverändert"}**
- Token-Kompatibilitätsaliase ergänzt: **${tokensChanged ? "ja" : "unverändert"}**
- Alte Root-Tokenquelle aus pfotentechnik.css entfernt: **${baseChanged ? "ja" : "nicht nötig"}**
- Zusammengeführte und entfernte Dateien: **${removed.length}**

## Entfernte Quelldateien

${removed.length ? removed.map((f) => `- \`${f}\``).join("\n") : "- Keine"}

## Verbleibende CSS-Schichten im ProjectLayout

1. \`pfotentechnik-design-tokens.css\`
2. \`pfotentechnik.css\`
3. \`pfotentechnik-design-system.css\`
4. \`pfotentechnik-ui-system.css\`
5. \`pfotentechnik-product-mobile-premium.css\` (nur falls vorhanden)

## Regel

Neue allgemeine Theme-, CTA- oder Content-Hotfix-Dateien sollen nicht mehr angelegt werden. Allgemeine Regeln gehören in \`pfotentechnik-ui-system.css\`; echte Komponentenregeln in die jeweilige Komponenten-CSS-Datei.
`;

if (!DRY_RUN) {
  ensureDir(path.dirname(reportFile));
  fs.writeFileSync(reportFile, report);
}

log(`Layout: ${layoutChanged ? "bereinigt" : "bereits sauber"}`);
log(`CSS-Dateien zusammengeführt: ${removed.length}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run erfolgreich; keine Dateien verändert.");
  process.exit(0);
}

if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:audit"])) {
  fail("Design-System-Audit fehlgeschlagen.");
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
    if (!run("git", ["commit", "-m", "refactor(pfotentechnik): consolidate ui style layers"])) {
      fail("Commit fehlgeschlagen.");
    }
    log("Änderungen lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Konsolidierungsstufe 11.1.0 erfolgreich abgeschlossen.");
