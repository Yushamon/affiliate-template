#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-comparison-mobile-density-and-table-fix-18.2.0";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const EXPLORER = path.join(
  ROOT,
  "packages",
  "affiliate-core",
  "src",
  "components",
  "comparison",
  "ComparisonExplorer.astro"
);
const CSS = path.join(
  ROOT,
  "packages",
  "affiliate-core",
  "src",
  "components",
  "comparison",
  "comparison-system.css"
);
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const CSS_START =
  "/* PT_COMPARISON_MOBILE_DENSITY_TABLE_FIX_18_2_0_START */";
const CSS_END =
  "/* PT_COMPARISON_MOBILE_DENSITY_TABLE_FIX_18_2_0_END */";

const CSS_BLOCK = `${CSS_START}
/*
 * Mobile Density + View Contract
 * - nutzt nur den globalen Seiten-Gutter
 * - reduziert übergroße vertikale Abschnittsabstände
 * - macht die Tabellenansicht auf Mobile wirklich sichtbar
 * - verhindert leere View-Flächen und schmale Karteninseln
 */
@media (max-width: 47.99rem) {
  .comparison-detail {
    gap: clamp(1.75rem, 6vw, 2.5rem);
    padding-bottom: calc(5.75rem + env(safe-area-inset-bottom));
  }

  .comparison-shell {
    gap: clamp(1.5rem, 5vw, 2.25rem);
  }

  .comparison-shell .comparison-decision-flow {
    gap: clamp(1.75rem, 6vw, 2.5rem);
  }

  .comparison-shell .comparison-premium-section,
  .comparison-shell .comparison-explorer {
    margin-block: 0;
    padding-block: 0;
  }

  .comparison-shell .comparison-premium-section__heading {
    gap: 0.65rem;
    margin-bottom: 1rem;
  }

  .comparison-shell .comparison-premium-section__heading h2 {
    margin-top: 0.3rem;
  }

  .comparison-shell .comparison-explorer {
    scroll-margin-top: 6.5rem;
  }

  .comparison-shell .comparison-explorer__mobile-summary {
    margin-block: 0 0.9rem;
    padding: 1rem;
  }

  .comparison-shell .comparison-explorer__mobile-controls {
    margin-block: 0 0.85rem;
  }

  .comparison-shell .comparison-view-tabs {
    margin-block: 0 1rem;
  }

  .comparison-shell .comparison-explorer__layout,
  .comparison-shell .comparison-explorer__content,
  .comparison-shell [data-comparison-table-view],
  .comparison-shell [data-comparison-card-view] {
    width: 100%;
    min-width: 0;
    max-width: none;
    margin: 0;
    padding: 0;
  }

  .comparison-shell [data-comparison-table-view][hidden],
  .comparison-shell [data-comparison-card-view][hidden] {
    display: none !important;
  }

  .comparison-shell[data-active-view="cards"]
    [data-comparison-card-view]:not([hidden]) {
    display: block !important;
  }

  .comparison-shell[data-active-view="table"]
    [data-comparison-table-view]:not([hidden]) {
    display: block !important;
    min-height: 0 !important;
  }

  .comparison-shell[data-active-view="table"]
    [data-comparison-table-view]:not([hidden])
    .comparison-desktop-table {
    display: block !important;
    width: 100%;
    min-width: 0;
  }

  .comparison-shell[data-active-view="table"]
    [data-comparison-table-view]:not([hidden])
    .comparison-section__head {
    display: none;
  }

  .comparison-shell[data-active-view="table"]
    .comparison-table-wrap {
    display: block !important;
    width: 100%;
    max-width: 100%;
    min-height: 0;
    margin: 0;
    overflow-x: auto;
    overflow-y: hidden;
    border-radius: 1rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-gutter: stable;
  }

  .comparison-shell[data-active-view="table"]
    .comparison-table {
    display: table !important;
    width: max-content;
    min-width: max(100%, 46rem);
    table-layout: auto;
  }

  .comparison-shell[data-active-view="table"]
    .comparison-table th:first-child {
    position: sticky;
    z-index: 2;
    left: 0;
    min-width: 9.5rem;
    background: var(--comparison-surface);
  }

  .comparison-shell[data-active-view="table"]
    .comparison-table thead th:first-child {
    z-index: 3;
  }

  .comparison-shell[data-active-view="cards"]
    .comparison-mobile-products,
  .comparison-shell[data-active-view="cards"]
    .comparison-mobile-product {
    width: 100%;
    max-width: none;
    margin-inline: 0;
  }

  .comparison-shell .comparison-mobile-product {
    box-sizing: border-box;
  }

  .comparison-detail > .comparison-content {
    margin-block: 0;
  }

  .comparison-detail > #faq {
    margin-block: 0;
    scroll-margin-top: 6.5rem;
  }

  .comparison-detail > #faq > :first-child {
    margin-top: 0;
  }

  .comparison-detail > #faq .faq,
  .comparison-detail > #faq [class*="faq"] {
    margin-top: 0;
  }
}
${CSS_END}`;

const log = (message = "") =>
  console.log(`[${NAME}] ${message}`.trimEnd());

const fail = (message) => {
  console.error(`\n[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

const rel = (file) =>
  path.relative(ROOT, file).replace(/\\/g, "/");

const normalize = (value) =>
  String(value)
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

function backup(file) {
  const target = path.join(BACKUP_ROOT, rel(file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
  return target;
}

function run(command, args) {
  log(`Ausführen: ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      FORCE_COLOR: "0"
    }
  });

  if (result.error) {
    fail(
      `${command} konnte nicht gestartet werden: ` +
      result.error.message
    );
  }

  if (result.status !== 0) {
    fail(
      `Befehl fehlgeschlagen (${result.status}): ` +
      `${command} ${args.join(" ")}`
    );
  }
}

log("Vorprüfung");

for (const file of [
  path.join(ROOT, "package.json"),
  path.join(APP, "package.json"),
  EXPLORER,
  CSS
]) {
  if (!fs.existsSync(file)) {
    fail(`Erwartete Datei fehlt: ${rel(file)}`);
  }
}

/* Explorer-State härten. */
let explorer = normalize(fs.readFileSync(EXPLORER, "utf8"));

for (const anchor of [
  "const setView = (view) => {",
  "tableView.hidden = isCards",
  "cardView.hidden = !isCards",
  "explorer.dataset.activeView = view",
  'data-comparison-view="table"'
]) {
  if (!explorer.includes(anchor)) {
    fail(
      `Unbekannte Explorer-Architektur; Anker fehlt: ${anchor}`
    );
  }
}

const oldSetView = `      const setView = (view) => {
        const isCards = view === "cards";

        if (tableView instanceof HTMLElement) tableView.hidden = isCards;
        if (cardView instanceof HTMLElement) cardView.hidden = !isCards;
        explorer.dataset.activeView = view;

        viewTabs.forEach((tab) => {
          if (!(tab instanceof HTMLButtonElement)) return;
          const active = tab.dataset.comparisonView === view;
          tab.classList.toggle("is-active", active);
          tab.setAttribute("aria-selected", String(active));
        });
      };`;

const newSetView = `      const setView = (view) => {
        const normalizedView = view === "table" ? "table" : "cards";
        const isCards = normalizedView === "cards";

        if (tableView instanceof HTMLElement) {
          tableView.hidden = isCards;
          tableView.setAttribute("aria-hidden", String(isCards));
          tableView.inert = isCards;
        }

        if (cardView instanceof HTMLElement) {
          cardView.hidden = !isCards;
          cardView.setAttribute("aria-hidden", String(!isCards));
          cardView.inert = !isCards;
        }

        explorer.dataset.activeView = normalizedView;

        viewTabs.forEach((tab) => {
          if (!(tab instanceof HTMLButtonElement)) return;
          const active =
            tab.dataset.comparisonView === normalizedView;
          tab.classList.toggle("is-active", active);
          tab.setAttribute("aria-selected", String(active));
          tab.tabIndex = active ? 0 : -1;
        });
      };`;

if (!explorer.includes(newSetView)) {
  if (!explorer.includes(oldSetView)) {
    fail(
      "Der erwartete setView-Codeblock wurde nicht gefunden. " +
      "Es wurde nichts verändert."
    );
  }

  backup(EXPLORER);
  explorer = explorer.replace(oldSetView, newSetView);
  fs.writeFileSync(EXPLORER, explorer, "utf8");
  log(`Geändert: ${rel(EXPLORER)}`);
} else {
  log(`Unverändert: ${rel(EXPLORER)} (State-Fix vorhanden)`);
}

/* CSS idempotent am Ende konsolidieren. */
let css = normalize(fs.readFileSync(CSS, "utf8"));

for (const anchor of [
  ".comparison-detail",
  ".comparison-shell",
  ".comparison-desktop-table",
  ".comparison-table-wrap",
  ".comparison-mobile-product"
]) {
  if (!css.includes(anchor)) {
    fail(
      `Unbekannte Comparison-CSS-Architektur; Anker fehlt: ${anchor}`
    );
  }
}

const markerPattern =
  /\/\* PT_COMPARISON_MOBILE_DENSITY_TABLE_FIX_18_2_0_START \*\/[\s\S]*?\/\* PT_COMPARISON_MOBILE_DENSITY_TABLE_FIX_18_2_0_END \*\//g;

const updatedCss =
  `${css.replace(markerPattern, "").trimEnd()}\n\n${CSS_BLOCK}\n`;

if (updatedCss !== css) {
  backup(CSS);
  fs.writeFileSync(CSS, updatedCss, "utf8");
  log(`Geändert: ${rel(CSS)}`);
} else {
  log(`Unverändert: ${rel(CSS)} (CSS-Fix vorhanden)`);
}

/* Nachprüfungen. */
const finalExplorer =
  normalize(fs.readFileSync(EXPLORER, "utf8"));
const finalCss =
  normalize(fs.readFileSync(CSS, "utf8"));

for (const required of [
  'tableView.setAttribute("aria-hidden"',
  "tableView.inert = isCards",
  'cardView.setAttribute("aria-hidden"',
  "explorer.dataset.activeView = normalizedView"
]) {
  if (!finalExplorer.includes(required)) {
    fail(`Explorer-Nachprüfung fehlgeschlagen: ${required}`);
  }
}

if (
  (
    finalCss.match(
      /PT_COMPARISON_MOBILE_DENSITY_TABLE_FIX_18_2_0_START/g
    ) ?? []
  ).length !== 1
) {
  fail("Der CSS-Fix ist nicht genau einmal vorhanden.");
}

for (const required of [
  '.comparison-shell[data-active-view="table"]',
  ".comparison-desktop-table",
  "display: block !important",
  "width: max-content",
  "scroll-margin-top: 6.5rem"
]) {
  if (!finalCss.includes(required)) {
    fail(`CSS-Nachprüfung fehlgeschlagen: ${required}`);
  }
}

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:responsive:audit"
  ]
);

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:visual-qa:strict"
  ]
);

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "comparison:audit:strict"
  ]
);

run("npm", ["run", "build:pfotentechnik"]);

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "audit:release-build-output:strict"
  ]
);

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "audit:technical-seo"
  ]
);

log("");
log("ABGESCHLOSSEN.");
log("Mobile Abschnittsabstände oberhalb des Contents und vor der FAQ wurden reduziert.");
log("Direktvergleich-Karten nutzen die vollständige verfügbare Containerbreite.");
log("Der Karten-/Tabellen-State setzt hidden, aria-hidden und inert konsistent.");
log("Die Tabelle ist auf Mobile sichtbar und horizontal scrollbar.");
log("Die erste Kriterien-Spalte bleibt beim horizontalen Scrollen fixiert.");
log("Desktop, Scores, Preise, Empfehlungen und Sticky-CTA-Logik wurden nicht verändert.");
log(`Backups: ${rel(BACKUP_ROOT)}`);
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");
