#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-mobile-visual-regression-fix-11.9.6";
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
    ) return current;
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
const runtimeFile = path.join(app, "src", "components", "SiteRuntimeFixes.astro");
const cssFile = path.join(
  app,
  "src",
  "styles",
  "pfotentechnik-mobile-visual-regression-fix.css"
);
const reportFile = path.join(
  app,
  "reports",
  "design-system",
  "mobile-visual-regression-fix-11.9.6.md"
);
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
function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  }).status === 0;
}

for (const file of [layoutFile, runtimeFile]) {
  if (!fs.existsSync(file)) fail(`Pflichtdatei fehlt: ${rel(file)}`);
}

const css = `/**
 * PfotenTechnik Mobile Visual Regression Fix 11.9.6
 *
 * Behebt gezielt die durch die Density-Stufe sichtbar gewordenen
 * Header-, Karten-, Bewertungs- und Box-in-Box-Probleme.
 */

/* Mobile Header: Logo + echtes Burgermenü. Kein separater Kaufberatungs-CTA. */
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

/* Quick-Fact-CTA: echte Innenabstände, kein Text am Kartenrand. */
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

/* Einheitliche Kartenränder in kuratierten Produktbereichen. */
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

/* Ausgewählte Trinkbrunnen: konsistenter Score-Ring statt fremder Score-Kachel. */
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

/* Keine pillenförmige Outline um Herstellername oder Textbereich. */
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

/* Mobile Cards dürfen nicht rechts aus dem Viewport laufen. */
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
`;

const cssChanged = write(cssFile, css);

/* Import exakt einmal und ganz am Ende der lokalen Styles. */
let layout = read(layoutFile);
const importLine =
  'import "../styles/pfotentechnik-mobile-visual-regression-fix.css";';
layout = layout
  .split(/\r?\n/)
  .filter((line) => !line.includes("pfotentechnik-mobile-visual-regression-fix.css"))
  .join(layout.includes("\r\n") ? "\r\n" : "\n");

const layoutLines = layout.split(/\r?\n/);
let lastCssImport = -1;
for (let i = 0; i < layoutLines.length; i += 1) {
  if (
    layoutLines[i].trim().startsWith("import ") &&
    layoutLines[i].includes(".css")
  ) lastCssImport = i;
}
if (lastCssImport < 0) fail("Kein CSS-Import im ProjectLayout gefunden.");
layoutLines.splice(lastCssImport + 1, 0, importLine);
const layoutChanged = write(
  layoutFile,
  layoutLines.join(layout.includes("\r\n") ? "\r\n" : "\n")
);

/* Runtime-Fixes ersetzen: kein künstlicher CTA im mobilen Menü,
   stattdessen stabile semantische Marker für die gezielten CSS-Regeln. */
const runtime = `<script is:inline>
  (() => {
    const PURCHASE_ADVICE_HREF = "/kaufberatung/";
    const PURCHASE_ADVICE_LABEL = "Kaufberatung";

    const editorialStatuses = new Set([
      "editorial review",
      "editorial-review",
      "redaktionelle einordnung",
      "redaktionelle bewertung",
      "redaktionell bewertet"
    ]);

    const normalize = (value) =>
      String(value ?? "")
        .trim()
        .toLocaleLowerCase("de-DE")
        .replace(/[_-]+/g, " ")
        .replace(/\\s+/g, " ");

    const ensureDesktopPurchaseAdvice = () => {
      const desktopCta = document.querySelector(".header-advisor-link");

      if (desktopCta instanceof HTMLAnchorElement) {
        desktopCta.href = PURCHASE_ADVICE_HREF;
        desktopCta.textContent = PURCHASE_ADVICE_LABEL;
        desktopCta.setAttribute(
          "aria-label",
          "Allgemeine Kaufberatung öffnen"
        );
        desktopCta.dataset.ptPurchaseAdvice = "desktop";
      }

      document
        .querySelectorAll(
          '.main-nav-v2 [data-pt-purchase-advice="nav"]'
        )
        .forEach((element) => element.remove());
    };

    const removeGenericEditorialStatus = () => {
      document
        .querySelectorAll(
          "[data-product-page] .native-buybox__meta > div"
        )
        .forEach((row) => {
          const label = normalize(row.querySelector("dt")?.textContent);
          const value = normalize(row.querySelector("dd")?.textContent);

          if (label === "status" && editorialStatuses.has(value)) {
            row.remove();
          }
        });
    };

    const closestBlock = (element) =>
      element?.closest(
        "section, article, li, .pt-surface, .premium-block, .content-section"
      );

    const markQuickFacts = () => {
      const heading = [...document.querySelectorAll("h2, h3")].find(
        (element) =>
          normalize(element.textContent) ===
          "die wichtigsten kriterien auf einen blick"
      );
      closestBlock(heading)?.setAttribute("data-pt-quick-facts", "");
    };

    const markSelectedProducts = () => {
      const heading = [...document.querySelectorAll("h2, h3")].find(
        (element) =>
          normalize(element.textContent) === "ausgewählte trinkbrunnen"
      );
      const section = closestBlock(heading);
      if (!(section instanceof HTMLElement)) return;

      section.dataset.ptSelectedProducts = "";

      const candidates = [
        ...section.querySelectorAll(
          "article, li, .product-card, .recommendation-card"
        )
      ].filter((element) =>
        element.querySelector("img") &&
        /\\/100/.test(element.textContent ?? "")
      );

      for (const card of candidates) {
        card.setAttribute("data-pt-product-card", "");
        card.setAttribute("data-pt-product-result", "");

        const scoreCandidates = [
          ...card.querySelectorAll("div, span, output")
        ].filter((element) => {
          const text = normalize(element.textContent);
          return /^\\d{1,3}\\s*\\/\\s*100$/.test(text) ||
            /^\\d{1,3}\\s*100$/.test(text);
        });

        const score = scoreCandidates.sort(
          (a, b) => a.children.length - b.children.length
        )[0];

        if (score instanceof HTMLElement) {
          score.dataset.ptScore = "";
          const numeric = Number(
            score.textContent?.match(/\\d{1,3}/)?.[0] ?? 0
          );
          score.style.setProperty(
            "--pt-score-angle",
            \`\${Math.max(0, Math.min(100, numeric)) * 3.6}deg\`
          );
        }
      }
    };

    const markProductResults = () => {
      document
        .querySelectorAll(
          ".product-card, .recommendation-card, [data-product-card], [class*='product-result']"
        )
        .forEach((card) => {
          if (!(card instanceof HTMLElement)) return;
          card.dataset.ptProductResult = "";

          card
            .querySelectorAll(
              ":scope > div > div, :scope > div > section, :scope > section > div"
            )
            .forEach((inner) => {
              if (!(inner instanceof HTMLElement)) return;
              const style = getComputedStyle(inner);
              if (
                style.borderTopWidth !== "0px" ||
                style.borderRadius !== "0px"
              ) {
                inner.dataset.ptInnerBox = "";
              }
            });
        });
    };

    const markNextSteps = () => {
      const heading = [...document.querySelectorAll("h2, h3")].find(
        (element) =>
          normalize(element.textContent) === "deine nächsten schritte"
      );
      const section = closestBlock(heading);
      if (!(section instanceof HTMLElement)) return;
      section.dataset.ptNextSteps = "";

      section
        .querySelectorAll("article, a, .pt-surface")
        .forEach((card) => card.setAttribute("data-pt-step-card", ""));
    };

    const applyFixes = () => {
      ensureDesktopPurchaseAdvice();
      removeGenericEditorialStatus();
      markQuickFacts();
      markSelectedProducts();
      markProductResults();
      markNextSteps();
    };

    applyFixes();

    if (!window.__ptSiteRuntimeFixesInstalled) {
      window.__ptSiteRuntimeFixesInstalled = true;
      document.addEventListener("astro:page-load", applyFixes);
    }
  })();
</script>
`;

const runtimeChanged = write(runtimeFile, runtime);

const report = `# Mobile Visual Regression Fix 11.9.6

## Behobene Punkte

- mobiler Header zeigt nur Logo und Burgermenü
- künstlich erzeugter Kaufberatungs-Link im mobilen Navigationsbereich entfernt
- Desktop-Kaufberatungs-CTA bleibt erhalten
- CTA-Texte wie „Katzenmodelle einordnen“ erhalten belastbares Innenpadding
- einheitliche Kartenränder in „Ausgewählte Trinkbrunnen“
- falsche rechteckige Score-Kachel wird als Design-System-Score-Ring dargestellt
- Produkt- und Empfehlungskarten werden auf eine äußere Ergebnisfläche reduziert
- Hersteller-, Inhalts-, Rating- und Aktionsbereiche erzeugen keine Box-in-Box-Optik
- mobile Produktbereiche laufen nicht horizontal aus dem Viewport
- Dark Mode berücksichtigt

## Dateien

- ${rel(cssFile)}
- ${rel(layoutFile)}
- ${rel(runtimeFile)}
`;

if (!DRY_RUN) {
  ensureDir(path.dirname(reportFile));
  fs.writeFileSync(reportFile, report);
}

log(`CSS: ${cssChanged ? "erstellt/aktualisiert" : "bereits aktuell"}`);
log(`ProjectLayout: ${layoutChanged ? "Import aktualisiert" : "bereits aktuell"}`);
log(`Runtime-Fixes: ${runtimeChanged ? "aktualisiert" : "bereits aktuell"}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run erfolgreich.");
  process.exit(0);
}

const commands = [
  ["npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:density:audit"]],
  ["npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:check"]],
];

for (const [command, commandArgs] of commands) {
  if (!run(command, commandArgs)) {
    fail(`${command} ${commandArgs.join(" ")} fehlgeschlagen.`);
  }
}

if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("Build fehlgeschlagen.");
}

const visualQa = path.join(app, "scripts", "design-system", "visual-qa.mjs");
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
    if (!run("git", [
      "commit",
      "-m",
      "fix(pfotentechnik): repair mobile visual regressions"
    ])) {
      fail("Commit fehlgeschlagen.");
    }
    log("Änderungen lokal committed.");
  } else {
    log("Keine offenen Änderungen.");
  }
}

log("Mobile Visual Regression Fix 11.9.6 abgeschlossen.");
