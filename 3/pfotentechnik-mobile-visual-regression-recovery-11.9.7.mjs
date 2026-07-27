#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-mobile-visual-regression-recovery-11.9.7";
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const NO_COMMIT = args.has("--no-commit");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  console.error(`[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

function findRoot(start) {
  let current = path.resolve(start);

  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const root =
  findRoot(process.cwd()) ||
  findRoot(path.dirname(fileURLToPath(import.meta.url)));

if (!root) fail("Repository-Root nicht gefunden.");

const app = path.join(root, "apps", "pfotentechnik");
const layoutFile = path.join(app, "src", "layouts", "ProjectLayout.astro");
const densityFile = path.join(
  app,
  "src",
  "styles",
  "pfotentechnik-visual-density.css"
);
const separateFixFile = path.join(
  app,
  "src",
  "styles",
  "pfotentechnik-mobile-visual-regression-fix.css"
);
const reportFile = path.join(
  app,
  "reports",
  "design-system",
  "mobile-visual-regression-recovery-11.9.7.md"
);
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  if (DRY_RUN || !fs.existsSync(file)) return;

  const target = path.join(backupRoot, relative(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const previous = fs.existsSync(file) ? read(file) : null;

  if (previous === content) return false;

  if (!DRY_RUN) {
    if (previous !== null) backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }

  return true;
}

function remove(file) {
  if (!fs.existsSync(file)) return false;

  if (!DRY_RUN) {
    backup(file);
    fs.unlinkSync(file);
  }

  return true;
}

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  }).status === 0;
}

for (const file of [layoutFile, densityFile]) {
  if (!fs.existsSync(file)) {
    fail(`Pflichtdatei fehlt: ${relative(file)}`);
  }
}

const markerStart = "/* PT_MOBILE_VISUAL_REGRESSION_11_9_7_START */";
const markerEnd = "/* PT_MOBILE_VISUAL_REGRESSION_11_9_7_END */";

const mergedCss = `
${markerStart}

/* Mobile Header: Logo + Burgermenü, ohne separaten Kaufberatungs-CTA. */
@media (max-width: 63.99rem) {
  :where(.header-advisor-link) {
    display: none;
  }

  :where(.site-header, .header-v2, header[role="banner"]) :where(
    .header-inner,
    .header-container,
    .header-v2__inner
  ) {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  :where(.main-nav-v2) > [data-pt-purchase-advice="nav"] {
    display: none;
  }

  :where(
    .menu-toggle,
    .nav-toggle,
    .mobile-menu-toggle,
    [aria-controls*="nav"]
  ) {
    min-width: 3rem;
    min-height: 3rem;
    padding-inline: var(--pt-space-3);
    display: inline-grid;
    place-items: center;
    white-space: nowrap;
  }
}

/* Quick-Fact-CTA: belastbare Innenabstände. */
:where([data-pt-quick-facts]) :where(
  a[href="#fuer-katzen"],
  a[href="#fuer-hunde"],
  a[href="#bauarten"],
  a[href*="reinigen"]
) {
  box-sizing: border-box;
  min-height: 3rem;
  padding: var(--pt-space-3) var(--pt-space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--pt-space-3);
  line-height: 1.25;
  text-wrap: balance;
}

/* Einheitliche Kartenränder. */
:where([data-pt-selected-products]) :where([data-pt-product-card]),
:where([data-pt-next-steps]) > :where(article, a, div)[data-pt-step-card] {
  border: 1px solid var(--pt-color-border);
  border-radius: var(--pt-radius-xl);
  box-shadow: none;
  overflow: clip;
}

:where([data-pt-selected-products]) :where([data-pt-product-card]) > * {
  border-radius: 0;
}

/* Korrektes Score-Ring-Element für ausgewählte Trinkbrunnen. */
:where([data-pt-selected-products]) [data-pt-score] {
  inline-size: 4.25rem;
  block-size: 4.25rem;
  min-inline-size: 4.25rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  display: inline-grid;
  place-content: center;
  gap: 0;
  text-align: center;
  line-height: 1;
  background:
    radial-gradient(
      circle at center,
      var(--pt-color-surface) 57%,
      transparent 58%
    ),
    conic-gradient(
      var(--pt-color-primary) var(--pt-score-angle, 280deg),
      var(--pt-color-border) 0
    );
  box-shadow: none;
}

:where([data-pt-selected-products]) [data-pt-score] strong {
  font-size: var(--pt-font-size-xl);
  line-height: 1;
}

:where([data-pt-selected-products]) [data-pt-score] small,
:where([data-pt-selected-products]) [data-pt-score] span:last-child {
  margin-top: 0.15rem;
  font-size: var(--pt-font-size-xs);
  line-height: 1;
}

/* Produkt-/Empfehlungskarten: nur eine äußere Ergebnisfläche. */
:where([data-pt-product-result]) :where(
  [data-pt-inner-box],
  .product-card__content,
  .recommendation-card__content,
  .product-summary,
  .product-meta,
  .product-rating,
  .product-actions,
  .price-row
) {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

:where([data-pt-product-result]) :where(
  [data-pt-inner-box],
  .product-card__content,
  .recommendation-card__content,
  .product-summary,
  .product-meta
) {
  padding-inline: 0;
}

:where([data-pt-product-result]) :where(
  .product-actions,
  [data-pt-product-actions]
) {
  padding-top: var(--pt-space-4);
  border-top: 1px solid var(--pt-color-border);
}

:where([data-pt-product-result]) :where(
  .manufacturer,
  .product-card__manufacturer,
  [data-manufacturer]
) {
  width: auto;
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
}

@media (max-width: 47.99rem) {
  :where([data-pt-selected-products]) {
    overflow: clip;
  }

  :where([data-pt-selected-products]) :where(
    [data-pt-product-track],
    .product-grid,
    .products-grid
  ) {
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
  }

  :where([data-pt-selected-products]) :where([data-pt-product-card]) {
    width: 100%;
    min-width: 0;
  }

  :where([data-pt-product-result]) {
    padding: var(--pt-space-5);
  }

  :where([data-pt-product-result]) :where(h2, h3, p) {
    overflow-wrap: anywhere;
  }
}

@media (prefers-color-scheme: dark) {
  :where([data-pt-selected-products]) [data-pt-score] {
    background:
      radial-gradient(
        circle at center,
        var(--pt-color-surface) 57%,
        transparent 58%
      ),
      conic-gradient(
        var(--pt-color-primary) var(--pt-score-angle, 280deg),
        var(--pt-color-border) 0
      );
  }
}

${markerEnd}
`;

let density = read(densityFile);

const oldMarkerPattern = new RegExp(
  `${markerStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  "g"
);

density = density.replace(oldMarkerPattern, "").trimEnd();
density += "\n\n" + mergedCss.trim() + "\n";

if (/:root\s*\{/.test(density)) {
  fail("Der zusammengeführte Density-Layer enthält einen :root-Block.");
}

if (/!important\b/.test(mergedCss)) {
  fail("Der neue Fix-Block enthält !important.");
}

const densityChanged = write(densityFile, density);

/* Separaten CSS-Import entfernen. */
const layoutBefore = read(layoutFile);
const newline = layoutBefore.includes("\r\n") ? "\r\n" : "\n";

const layoutAfter = layoutBefore
  .split(/\r?\n/)
  .filter(
    (line) =>
      !line.includes("pfotentechnik-mobile-visual-regression-fix.css")
  )
  .join(newline);

const layoutChanged = write(layoutFile, layoutAfter);
const removedSeparateFile = remove(separateFixFile);

const remainingImportCount = (
  layoutAfter.match(/pfotentechnik-mobile-visual-regression-fix\.css/g) || []
).length;

if (remainingImportCount !== 0) {
  fail("Der separate Visual-Regression-CSS-Import wurde nicht vollständig entfernt.");
}

if (fs.existsSync(separateFixFile) && !DRY_RUN) {
  fail("Die separate Visual-Regression-CSS-Datei wurde nicht entfernt.");
}

const report = `# Mobile Visual Regression Recovery 11.9.7

## Ursache

11.9.6 hat eine zusätzliche CSS-Datei angelegt. Die Regeln selbst lagen
innerhalb des Byte-Budgets, aber die Governance begrenzt die Anzahl der
CSS-Dateien bewusst auf 30.

## Korrektur

- Visual-Regression-Regeln in den bestehenden Density-Layer integriert
- separate CSS-Datei entfernt
- separaten Import aus ProjectLayout entfernt
- CSS-Budget-Baseline nicht erhöht
- Runtime-Fixes aus 11.9.6 bleiben erhalten
- Density-Layer geändert: **${densityChanged ? "ja" : "nein"}**
- ProjectLayout geändert: **${layoutChanged ? "ja" : "nein"}**
- separate CSS-Datei entfernt: **${removedSeparateFile ? "ja" : "bereits entfernt"}**

## Erwartetes Budget

- cssFiles: **30**
- rootBlocks: **23**
- importantRules: **1310**
`;

if (!DRY_RUN) {
  ensureDir(path.dirname(reportFile));
  fs.writeFileSync(reportFile, report);
}

log(`Density-Layer: ${densityChanged ? "Fix integriert" : "bereits aktuell"}`);
log(`ProjectLayout: ${layoutChanged ? "separaten Import entfernt" : "bereits korrekt"}`);
log(`Separate CSS-Datei: ${removedSeparateFile ? "entfernt" : "bereits entfernt"}`);
log(`Backups: ${relative(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run erfolgreich abgeschlossen.");
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

const visualQa = path.join(
  app,
  "scripts",
  "design-system",
  "visual-qa.mjs"
);

if (
  fs.existsSync(visualQa) &&
  !run("npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:visual-qa"
  ])
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

    if (
      !run("git", [
        "commit",
        "-m",
        "fix(pfotentechnik): repair mobile visual regressions"
      ])
    ) {
      fail("Commit fehlgeschlagen.");
    }

    log("Offener 11.9.x-Stand gemeinsam lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Mobile Visual Regression Recovery 11.9.7 erfolgreich abgeschlossen.");
