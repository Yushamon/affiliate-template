#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-visual-density-11.9.0";
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
const layoutFile = path.join(src, "layouts", "ProjectLayout.astro");
const densityFile = path.join(src, "styles", "pfotentechnik-visual-density.css");
const auditFile = path.join(app, "scripts", "design-system", "density-audit.mjs");
const packageFile = path.join(app, "package.json");
const reportDir = path.join(app, "reports", "design-system");
const reportFile = path.join(reportDir, "visual-density-11.9.0.md");
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

for (const file of [layoutFile, packageFile]) {
  if (!fs.existsSync(file)) fail(`Pflichtdatei fehlt: ${rel(file)}`);
}

const css = `/**
 * PfotenTechnik Visual Density
 *
 * Ruhigere Flächenhierarchie, weniger Box-in-Box und konsistente Abstände.
 * Die Regeln arbeiten ausschließlich mit bestehenden Design-Tokens.
 */

:root {
  --pt-section-gap: clamp(var(--pt-space-10), 7vw, var(--pt-space-16));
  --pt-content-gap: clamp(var(--pt-space-6), 4vw, var(--pt-space-10));
  --pt-card-gap: clamp(var(--pt-space-4), 2.5vw, var(--pt-space-6));
  --pt-card-padding: clamp(var(--pt-space-5), 3vw, var(--pt-space-8));
  --pt-card-padding-compact: clamp(var(--pt-space-4), 2vw, var(--pt-space-5));
  --pt-surface-border-subtle: color-mix(
    in srgb,
    var(--pt-color-border) 72%,
    transparent
  );
}

:where(.pt-page-flow) {
  display: grid;
  gap: var(--pt-section-gap);
}

:where(.pt-section-flow) {
  display: grid;
  gap: var(--pt-content-gap);
}

:where(.pt-card-flow) {
  display: grid;
  gap: var(--pt-card-gap);
}

:where(.pt-surface) {
  padding: var(--pt-card-padding);
  border-color: var(--pt-surface-border-subtle);
}

:where(.pt-surface-compact) {
  padding: var(--pt-card-padding-compact);
}

:where(.pt-surface-flat) {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

/*
 * Verschachtelte Standardflächen werden visuell zurückgenommen.
 * Interaktive Karten, Produktkarten und explizit erhobene Flächen bleiben erhalten.
 */
:where(.pt-surface) > :where(.pt-surface):not(
  .pt-surface-elevated,
  .product-card,
  .comparison-card,
  .recommendation-card,
  [data-interactive-card]
) {
  padding: var(--pt-card-padding-compact);
  border-color: color-mix(in srgb, var(--pt-color-border) 54%, transparent);
  background: color-mix(
    in srgb,
    var(--pt-color-surface-subtle, var(--pt-color-surface)) 58%,
    transparent
  );
  box-shadow: none;
}

:where(.pt-surface) > :where(.pt-surface) > :where(.pt-surface):not(
  .pt-surface-elevated,
  .product-card,
  .comparison-card,
  .recommendation-card,
  [data-interactive-card]
) {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

:where(
  .article-content,
  .editorial-content,
  .product-content,
  .comparison-content,
  .manufacturer-content
) > :where(section, .content-section) {
  margin-block: 0;
}

:where(
  .article-content,
  .editorial-content,
  .product-content,
  .comparison-content,
  .manufacturer-content
) > :where(section, .content-section) + :where(section, .content-section) {
  margin-block-start: var(--pt-section-gap);
}

:where(.pt-section-heading) {
  max-width: 46rem;
  margin-block-end: var(--pt-content-gap);
}

:where(.pt-section-heading > :is(h2, h3)) {
  margin-block: 0;
}

:where(.pt-section-heading > p) {
  max-width: 42rem;
  margin-block-start: var(--pt-space-3);
  margin-block-end: 0;
  color: var(--pt-color-text-muted);
}

:where(.pt-divider-section) {
  padding-block-start: var(--pt-section-gap);
  border-block-start: 1px solid var(--pt-surface-border-subtle);
}

:where(.pt-card-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--pt-card-gap);
  align-items: stretch;
}

:where(.pt-card-grid > .pt-surface) {
  height: 100%;
}

:where(.pt-meta-row) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pt-space-2) var(--pt-space-4);
  color: var(--pt-color-text-muted);
  font-size: var(--pt-font-size-sm);
}

:where(.pt-actions) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pt-space-3);
}

:where(.pt-actions > .pt-button) {
  min-width: min(100%, 10rem);
}

@media (max-width: 47.99rem) {
  :root {
    --pt-section-gap: var(--pt-space-10);
    --pt-content-gap: var(--pt-space-6);
    --pt-card-padding: var(--pt-space-5);
  }

  :where(.pt-surface) {
    border-radius: var(--pt-radius-lg);
  }

  :where(.pt-card-grid) {
    grid-template-columns: minmax(0, 1fr);
  }

  :where(.pt-actions) {
    align-items: stretch;
  }

  :where(.pt-actions > .pt-button) {
    flex: 1 1 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  :where(.pt-surface) {
    scroll-behavior: auto;
  }
}
`;

const densityChanged = write(densityFile, css);

let layout = read(layoutFile);
layout = layout.replace(
  /^\s*import\s+["'][^"']*pfotentechnik-visual-density\.css["'];?\s*$/gm,
  ""
);

const preferredAnchors = [
  /import\s+["']\.\.\/styles\/pfotentechnik-responsive-resilience\.css["'];?/,
  /import\s+["']\.\.\/styles\/pfotentechnik-ui-system\.css["'];?/,
  /import\s+["']\.\.\/styles\/pfotentechnik-primitives\.css["'];?/,
];

let inserted = false;
for (const pattern of preferredAnchors) {
  if (pattern.test(layout)) {
    layout = layout.replace(
      pattern,
      (match) => `${match}\nimport "../styles/pfotentechnik-visual-density.css";`
    );
    inserted = true;
    break;
  }
}

if (!inserted) fail("Kein geeigneter Style-Import-Anker im ProjectLayout gefunden.");

layout = layout.replace(/\n{3,}/g, "\n\n");
const layoutChanged = write(layoutFile, layout);

const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const layoutFile = path.join(appRoot, "src", "layouts", "ProjectLayout.astro");
const cssFile = path.join(appRoot, "src", "styles", "pfotentechnik-visual-density.css");

const errors = [];

if (!fs.existsSync(layoutFile)) errors.push("ProjectLayout fehlt.");
if (!fs.existsSync(cssFile)) errors.push("Visual-Density-Datei fehlt.");

if (fs.existsSync(layoutFile)) {
  const layout = fs.readFileSync(layoutFile, "utf8");
  const matches = layout.match(/pfotentechnik-visual-density\\.css/g) || [];
  if (matches.length !== 1) {
    errors.push("Visual Density muss exakt einmal importiert werden.");
  }

  const densityIndex = layout.indexOf("pfotentechnik-visual-density.css");
  const primitiveIndex = layout.indexOf("pfotentechnik-primitives.css");
  if (primitiveIndex >= 0 && densityIndex >= 0 && densityIndex < primitiveIndex) {
    errors.push("Visual Density wird vor den Primitives importiert.");
  }
}

if (fs.existsSync(cssFile)) {
  const css = fs.readFileSync(cssFile, "utf8");

  for (const token of [
    "--pt-section-gap",
    "--pt-content-gap",
    "--pt-card-padding",
    ".pt-page-flow",
    ".pt-section-flow",
    ".pt-card-grid",
    ".pt-actions",
  ]) {
    if (!css.includes(token)) errors.push("Density-Baustein fehlt: " + token);
  }

  if (/!important\\b/.test(css)) {
    errors.push("Visual Density darf kein !important enthalten.");
  }

  const rawColors = css.match(/#[0-9a-fA-F]{3,8}\\b/g) || [];
  if (rawColors.length) {
    errors.push("Visual Density enthält harte Hex-Farben.");
  }
}

if (errors.length) {
  console.error(errors.join("\\n"));
  process.exit(1);
}

console.log("Visual-Density-Audit erfolgreich.");
`;

write(auditFile, auditSource);

const pkg = JSON.parse(read(packageFile));
pkg.scripts ||= {};
pkg.scripts["design-system:density:audit"] =
  "node scripts/design-system/density-audit.mjs";
write(packageFile, JSON.stringify(pkg, null, 2) + "\n");

const report = `# PfotenTechnik Visual Density 11.9.0

## Ergebnis

- Density-Layer erstellt/aktualisiert: **${densityChanged ? "ja" : "nein"}**
- ProjectLayout aktualisiert: **${layoutChanged ? "ja" : "nein"}**

## Verbesserungen

- konsistente Abstände zwischen Seitenabschnitten
- harmonisierte Karten-Innenabstände
- zurückgenommene verschachtelte Flächen
- dritte Box-Ebene wird bei Standardflächen flach dargestellt
- klarere Abschnittsüberschriften
- responsive Kartengrids
- konsistente Meta- und Aktionszeilen
- mobile CTA-Gruppen stapeln sauber
- keine neuen harten Farben oder \`!important\`-Regeln

## Neue Hilfsklassen

- \`pt-page-flow\`
- \`pt-section-flow\`
- \`pt-card-flow\`
- \`pt-surface-compact\`
- \`pt-surface-flat\`
- \`pt-section-heading\`
- \`pt-divider-section\`
- \`pt-card-grid\`
- \`pt-meta-row\`
- \`pt-actions\`
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportFile, report);
}

log(`Density-Layer: ${densityChanged ? "aktualisiert" : "bereits aktuell"}`);
log(`ProjectLayout: ${layoutChanged ? "aktualisiert" : "bereits aktuell"}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run abgeschlossen.");
  process.exit(0);
}

for (const check of [
  "design-system:density:audit",
  "design-system:check",
]) {
  if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", check])) {
    fail(`${check} fehlgeschlagen.`);
  }
}

if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("Build fehlgeschlagen.");
}

if (
  fs.existsSync(path.join(app, "scripts", "design-system", "visual-qa.mjs")) &&
  !run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:visual-qa"])
) {
  fail("Visual-QA fehlgeschlagen.");
}

if (!NO_COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });

  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", "-A"])) fail("git add fehlgeschlagen.");
    if (!run("git", ["commit", "-m", "refactor(pfotentechnik): reduce visual density"])) {
      fail("Commit fehlgeschlagen.");
    }
    log("Änderungen lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Visual Density 11.9.0 erfolgreich abgeschlossen.");
