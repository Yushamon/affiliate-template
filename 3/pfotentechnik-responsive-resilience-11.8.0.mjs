#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-responsive-resilience-11.8.0";
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
const resilienceFile = path.join(stylesDir, "pfotentechnik-responsive-resilience.css");
const layoutFile = path.join(appSrc, "layouts", "ProjectLayout.astro");
const auditFile = path.join(app, "scripts", "design-system", "responsive-audit.mjs");
const packageFile = path.join(app, "package.json");
const reportDir = path.join(app, "reports", "design-system");
const reportMd = path.join(reportDir, "responsive-resilience-11.8.0.md");
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
 * PfotenTechnik Responsive Resilience
 *
 * Schutzschicht gegen typische Mobile-Ausreißer. Die Regeln verändern keine
 * Komponentenidentität, sondern stellen robuste Größen- und Umbruchgrenzen her.
 */

:where(*, *::before, *::after) {
  box-sizing: border-box;
}

:where(html) {
  max-width: 100%;
  overflow-x: clip;
}

:where(body) {
  min-width: 20rem;
  max-width: 100%;
}

:where(main, section, article, aside, header, footer, nav) {
  min-width: 0;
}

:where(
  [class*="grid"],
  [class*="layout"],
  [class*="columns"],
  [class*="split"],
  [class*="row"],
  [class*="cluster"]
) > * {
  min-width: 0;
}

:where(img, picture, video, canvas, svg, iframe) {
  height: auto;
  max-width: 100%;
}

:where(img, video) {
  display: block;
}

:where(pre, code, kbd, samp) {
  overflow-wrap: anywhere;
}

:where(p, li, dd, dt, figcaption, blockquote, a, button, summary) {
  overflow-wrap: break-word;
}

:where(.pt-button, .pt-chip) {
  max-width: 100%;
  white-space: normal;
  text-align: center;
}

:where(.pt-button > span, .pt-chip > span) {
  min-width: 0;
  overflow-wrap: anywhere;
}

:where(input, select, textarea, button) {
  max-width: 100%;
}

:where(textarea) {
  resize: vertical;
}

:where(table) {
  border-collapse: collapse;
}

.pt-table-scroll,
.table-scroll,
.table-wrapper,
.comparison-table-wrapper {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}

.pt-table-scroll > table,
.table-scroll > table,
.table-wrapper > table,
.comparison-table-wrapper > table {
  min-width: 42rem;
}

.pt-media-bleed-mobile {
  width: auto;
}

.pt-safe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: var(--pt-space-5);
}

.pt-safe-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pt-space-6);
}

.pt-sticky-safe {
  position: sticky;
  inset-block-start: var(--pt-space-4);
  max-height: calc(100dvh - (2 * var(--pt-space-4)));
  overflow-y: auto;
}

.pt-scroll-shadow {
  background:
    linear-gradient(to right, var(--pt-color-surface) 30%, transparent),
    linear-gradient(to left, var(--pt-color-surface) 30%, transparent) 100% 0,
    linear-gradient(to right, color-mix(in srgb, var(--pt-color-text) 12%, transparent), transparent),
    linear-gradient(to left, color-mix(in srgb, var(--pt-color-text) 12%, transparent), transparent) 100% 0;
  background-attachment: local, local, scroll, scroll;
  background-repeat: no-repeat;
  background-size: 2.5rem 100%, 2.5rem 100%, 0.75rem 100%, 0.75rem 100%;
}

@media (min-width: 48rem) {
  .pt-safe-split {
    grid-template-columns: minmax(0, 1.25fr) minmax(16rem, 0.75fr);
    align-items: start;
  }
}

@media (max-width: 47.99rem) {
  :where(body) {
    min-width: 0;
  }

  :where(.pt-page-shell) {
    width: 100%;
    max-width: none;
  }

  :where(.pt-button) {
    justify-content: center;
  }

  :where(
    .product-gallery,
    .product-media,
    .article-hero-media,
    .comparison-hero-media,
    .manufacturer-hero-media
  ).pt-media-bleed-mobile {
    margin-inline: calc(-1 * var(--pt-page-gutter));
    width: calc(100% + (2 * var(--pt-page-gutter)));
    max-width: none;
  }

  .pt-sticky-safe {
    position: static;
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 25.875rem) {
  :where(.pt-cluster) {
    align-items: stretch;
  }

  :where(.pt-cluster > .pt-button) {
    flex: 1 1 100%;
  }
}

@supports not (overflow: clip) {
  :where(html) {
    overflow-x: hidden;
  }
}
`;

const cssChanged = write(resilienceFile, css);

let layout = read(layoutFile);
layout = layout.replace(
  /^\s*import\s+["'][^"']*pfotentechnik-responsive-resilience\.css["'];?\s*$/gm,
  ""
);

const primitivePattern =
  /import\s+["']\.\.\/styles\/pfotentechnik-primitives\.css["'];?/;

if (!primitivePattern.test(layout)) {
  fail("Primitives-Import im ProjectLayout fehlt. Stufe 11.4.0 zuerst ausführen.");
}

layout = layout.replace(
  primitivePattern,
  (match) => `${match}\nimport "../styles/pfotentechnik-responsive-resilience.css";`
);
layout = layout.replace(/\n{3,}/g, "\n\n");
const layoutChanged = write(layoutFile, layout);

const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const layoutFile = path.join(appRoot, "src", "layouts", "ProjectLayout.astro");
const cssFile = path.join(appRoot, "src", "styles", "pfotentechnik-responsive-resilience.css");

const errors = [];

if (!fs.existsSync(cssFile)) errors.push("Responsive-Resilience-Datei fehlt.");
if (!fs.existsSync(layoutFile)) errors.push("ProjectLayout fehlt.");

if (fs.existsSync(layoutFile)) {
  const layout = fs.readFileSync(layoutFile, "utf8");
  const primitiveIndex = layout.indexOf("pfotentechnik-primitives.css");
  const resilienceIndex = layout.indexOf("pfotentechnik-responsive-resilience.css");

  if (resilienceIndex < 0) errors.push("Responsive-Resilience-Import fehlt.");
  if (primitiveIndex >= 0 && resilienceIndex >= 0 && resilienceIndex < primitiveIndex) {
    errors.push("Responsive Resilience wird vor den Primitives importiert.");
  }
  if ((layout.match(/pfotentechnik-responsive-resilience\\.css/g) || []).length !== 1) {
    errors.push("Responsive Resilience wird nicht exakt einmal importiert.");
  }
}

if (fs.existsSync(cssFile)) {
  const css = fs.readFileSync(cssFile, "utf8");
  for (const requirement of [
    "box-sizing: border-box",
    "min-width: 0",
    "overflow-wrap: break-word",
    ".pt-table-scroll",
    ".pt-safe-grid",
    ".pt-safe-split",
  ]) {
    if (!css.includes(requirement)) {
      errors.push("Resilience-Regel fehlt: " + requirement);
    }
  }

  if (/!important\\b/.test(css)) {
    errors.push("Responsive Resilience darf kein !important enthalten.");
  }
}

if (errors.length) {
  console.error(errors.join("\\n"));
  process.exit(1);
}

console.log("Responsive-Resilience-Audit erfolgreich.");
`;

write(auditFile, auditSource);

const pkg = JSON.parse(read(packageFile));
pkg.scripts ||= {};
pkg.scripts["design-system:responsive:audit"] =
  "node scripts/design-system/responsive-audit.mjs";
write(packageFile, JSON.stringify(pkg, null, 2) + "\n");

const report = `# PfotenTechnik Responsive Resilience 11.8.0

## Ergebnis

- Resilience-Datei erstellt/aktualisiert: **${cssChanged ? "ja" : "nein"}**
- ProjectLayout aktualisiert: **${layoutChanged ? "ja" : "nein"}**

## Abgesicherte Bereiche

- Flex- und Grid-Kinder dürfen korrekt schrumpfen
- Medien überschreiten den Viewport nicht
- lange URLs und Produktnamen brechen um
- Buttons und Chips bleiben innerhalb des Containers
- Tabellen erhalten wiederverwendbare Scroll-Wrapper
- sichere Auto-Fit-Grids und Split-Layouts
- Sticky-Elemente werden mobil zurückgesetzt
- optionaler Mobile-Media-Bleed ohne globale Galerieänderung
- 375- und 414-Pixel-Layouts erhalten robuste Grenzen
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportMd, report);
}

log(`Resilience-Datei: ${cssChanged ? "aktualisiert" : "bereits aktuell"}`);
log(`ProjectLayout: ${layoutChanged ? "aktualisiert" : "bereits aktuell"}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run abgeschlossen.");
  process.exit(0);
}

for (const check of [
  "design-system:responsive:audit",
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
    if (!run("git", ["commit", "-m", "fix(pfotentechnik): harden responsive layouts"])) {
      fail("Commit fehlgeschlagen.");
    }
    log("Änderungen lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Responsive Resilience 11.8.0 erfolgreich abgeschlossen.");
