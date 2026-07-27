#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-component-simplification-12.0.0";
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
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
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

const files = {
  header: path.join(root, "packages/affiliate-core/src/components/Header.astro"),
  recommendations: path.join(root, "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro"),
  mobileCards: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro"),
  prosCons: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonProsCons.astro"),
  sticky: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro"),
  scenarios: path.join(root, "apps/pfotentechnik/src/components/comparison/ScenarioRecommendations.astro"),
  density: path.join(root, "apps/pfotentechnik/src/styles/pfotentechnik-visual-density.css"),
  runtime: path.join(root, "apps/pfotentechnik/src/components/SiteRuntimeFixes.astro"),
  report: path.join(root, "apps/pfotentechnik/reports/design-system/component-simplification-12.0.0.md")
};

for (const [key, file] of Object.entries(files)) {
  if (key === "report") continue;
  if (!fs.existsSync(file)) fail(`Pflichtdatei fehlt: ${path.relative(root, file)}`);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const rel = (file) => path.relative(root, file).split(path.sep).join("/");
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
const read = (file) => fs.readFileSync(file, "utf8");

function backup(file) {
  if (DRY_RUN || !fs.existsSync(file)) return;
  const target = path.join(backupRoot, rel(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const before = fs.existsSync(file) ? read(file) : null;
  if (before === content) return false;
  if (!DRY_RUN) {
    if (before !== null) backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }
  return true;
}

function replaceRequired(content, pattern, replacement, label) {
  if (!pattern.test(content)) fail(`Anker nicht gefunden: ${label}`);
  pattern.lastIndex = 0;
  return content.replace(pattern, replacement);
}

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  }).status === 0;
}

/* 1. Header: Mobile nur Logo + echtes Burgermenü. */
let header = read(files.header);

header = replaceRequired(
  header,
  /<button\s+class="pt-button nav-toggle-button"[\s\S]*?<\/button>/,
  `<button
      class="pt-button nav-toggle-button"
      type="button"
      aria-label="Navigation öffnen"
      aria-expanded="false"
      aria-controls="main-navigation"
      data-nav-toggle
    >
      <span class="nav-toggle-button__icon" aria-hidden="true">
        <span></span><span></span><span></span>
      </span>
      <span class="nav-toggle-button__label">Menü</span>
    </button>`,
  "Header Navigation Toggle"
);

header = header.replace(
  '<a class="header-advisor-link" href="/berater/futterautomat/">',
  '<a class="header-advisor-link" href="/kaufberatung/" data-header-advisor>'
).replace(">Berater finden<", ">Kaufberatung<");

const headerChanged = write(files.header, header);

/* 2. Empfehlungskarten: verschachtelte pt-surface-Ebenen entfernen. */
let recommendations = read(files.recommendations);
recommendations = recommendations
  .replace('class="pt-surface recommendation-card__badge"', 'class="recommendation-card__badge"')
  .replace('class="pt-surface recommendation-card__image-link"', 'class="recommendation-card__image-link"')
  .replace('class="pt-surface recommendation-card__image"', 'class="recommendation-card__image"')
  .replace('class="pt-surface recommendation-card__content"', 'class="recommendation-card__content"')
  .replace('class="pt-surface recommendation-card__manufacturer"', 'class="recommendation-card__manufacturer"')
  .replace('class="pt-surface recommendation-card__actions"', 'class="recommendation-card__actions"');

if ((recommendations.match(/pt-surface recommendation-card__/g) || []).length) {
  fail("Nicht alle verschachtelten Empfehlungskarten-Flächen wurden entfernt.");
}
const recommendationsChanged = write(files.recommendations, recommendations);

/* 3. Fit-Karten: nur eine äußere Fläche. */
let prosCons = read(files.prosCons);
prosCons = prosCons
  .replace('class="pt-surface comparison-fit-card__badge"', 'class="comparison-fit-card__badge"')
  .replace('class="pt-surface comparison-fit-card__manufacturer"', 'class="comparison-fit-card__manufacturer"')
  .replace('class="pt-surface comparison-fit-card__group"', 'class="comparison-fit-card__group"')
  .replace(
    'class="pt-surface comparison-fit-card__group comparison-fit-card__group--attention"',
    'class="comparison-fit-card__group comparison-fit-card__group--attention"'
  );

if ((prosCons.match(/pt-surface comparison-fit-card__/g) || []).length) {
  fail("Nicht alle verschachtelten Fit-Karten-Flächen wurden entfernt.");
}
const prosConsChanged = write(files.prosCons, prosCons);

/* 4. Szenarien: inneren Surface-Wrapper entfernen und Fit auf 100 begrenzen. */
let scenarios = read(files.scenarios);
scenarios = scenarios
  .replace('class="pt-surface scenario-card__topline"', 'class="scenario-card__topline"')
  .replace(
    '{Math.round(scenario.score)}/100 Fit',
    '{Math.max(0, Math.min(100, Math.round(scenario.score)))}/100 Fit'
  );

scenarios = scenarios
  .replace("padding: 1.25rem;", "padding: 1.15rem;")
  .replace("gap: .85rem;", "gap: .72rem;")
  .replace("box-shadow: var(--comparison-premium-shadow);", "box-shadow: 0 8px 24px color-mix(in srgb, var(--comparison-text) 7%, transparent);")
  .replace("padding: .28rem .5rem;", "padding: .24rem .55rem;")
  .replace("font-size: .68rem;", "font-size: .72rem;");

if (!scenarios.includes("Math.max(0, Math.min(100")) {
  fail("Fit-Score-Clamp wurde nicht eingebaut.");
}
const scenariosChanged = write(files.scenarios, scenarios);

/* 5. Mobile Produktkarten semantisch als vereinfachte Karten markieren. */
let mobileCards = read(files.mobileCards);
mobileCards = mobileCards.replace(
  'class="comparison-mobile-product"',
  'class="comparison-mobile-product comparison-mobile-product--flat"'
);
const mobileCardsChanged = write(files.mobileCards, mobileCards);

/* 6. Sticky Bar komplett auf ruhige, kompakte Variante umstellen. */
let sticky = read(files.sticky);
const stickyStyle = `<style is:global>
  .comparison-sticky-bar {
    position: fixed;
    z-index: 90;
    right: max(.75rem, env(safe-area-inset-right));
    bottom: max(.7rem, env(safe-area-inset-bottom));
    left: max(.75rem, env(safe-area-inset-left));
    display: flex;
    width: auto;
    max-width: 760px;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: .7rem;
    margin-inline: auto;
    padding: .65rem .7rem;
    border: 1px solid color-mix(in srgb, var(--comparison-line) 80%, transparent);
    border-radius: 1rem;
    color: var(--comparison-text);
    background: color-mix(in srgb, var(--comparison-surface) 88%, transparent);
    box-shadow: 0 12px 32px color-mix(in srgb, var(--comparison-text) 15%, transparent);
    -webkit-backdrop-filter: blur(18px) saturate(135%);
    backdrop-filter: blur(18px) saturate(135%);
  }

  .comparison-sticky-bar > div {
    min-width: 0;
  }

  .comparison-sticky-bar > div:first-child {
    display: grid;
    flex: 1 1 auto;
    gap: .08rem;
    padding-inline: .15rem;
  }

  .comparison-sticky-bar > div:first-child span {
    color: var(--comparison-muted);
    font-size: .68rem;
    font-weight: 750;
    line-height: 1.15;
  }

  .comparison-sticky-bar > div:first-child strong {
    display: block;
    min-width: 0;
    overflow: hidden;
    color: var(--comparison-text);
    font-size: .9rem;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .comparison-sticky-bar > div:last-child {
    display: flex;
    flex: 0 0 auto;
    gap: .5rem;
  }

  .comparison-sticky-bar .comparison-button {
    min-height: 42px;
    padding: .62rem .86rem;
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    .comparison-sticky-bar {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: .38rem;
      padding: .5rem;
      border-radius: .92rem;
    }

    .comparison-sticky-bar > div:first-child {
      display: flex;
      align-items: baseline;
      gap: .35rem;
      padding: 0 .2rem;
    }

    .comparison-sticky-bar > div:first-child span {
      flex: 0 0 auto;
      font-size: .62rem;
    }

    .comparison-sticky-bar > div:first-child strong {
      display: -webkit-box;
      flex: 1 1 auto;
      overflow: hidden;
      font-size: .76rem;
      line-height: 1.18;
      white-space: normal;
      overflow-wrap: anywhere;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
    }

    .comparison-sticky-bar > div:last-child {
      display: grid;
      grid-template-columns: minmax(0, .86fr) minmax(0, 1.14fr);
      width: 100%;
      gap: .4rem;
    }

    .comparison-sticky-bar .comparison-button {
      width: 100%;
      min-width: 0;
      min-height: 42px;
      padding: .56rem .4rem;
      font-size: .76rem;
      line-height: 1.15;
      white-space: normal;
    }
  }

  html[data-theme="dark"] .comparison-sticky-bar,
  html.dark .comparison-sticky-bar,
  body.dark .comparison-sticky-bar,
  [data-theme="dark"] .comparison-sticky-bar {
    border-color: color-mix(in srgb, var(--comparison-line) 84%, transparent);
    background: color-mix(in srgb, var(--comparison-surface-raised) 90%, transparent);
    box-shadow: 0 12px 32px rgba(0, 0, 0, .3);
  }
</style>`;

sticky = replaceRequired(
  sticky,
  /<style is:global>[\s\S]*?<\/style>\s*$/,
  stickyStyle,
  "ComparisonStickyBar Style"
);

if (/!important\b/.test(stickyStyle)) fail("Neue Sticky-Bar enthält !important.");
const stickyChanged = write(files.sticky, sticky);

/* 7. Runtime-Fix nicht länger als primäre Layout-Engine verwenden. */
let runtime = read(files.runtime);
runtime = runtime.replace(
  /const ensureDesktopPurchaseAdvice = \(\) => \{[\s\S]*?\n    \};/,
  `const ensureDesktopPurchaseAdvice = () => {
      const desktopCta = document.querySelector(".header-advisor-link");
      if (desktopCta instanceof HTMLAnchorElement) {
        desktopCta.href = PURCHASE_ADVICE_HREF;
        desktopCta.textContent = PURCHASE_ADVICE_LABEL;
        desktopCta.setAttribute("aria-label", "Allgemeine Kaufberatung öffnen");
        desktopCta.dataset.ptPurchaseAdvice = "desktop";
      }
    };`
);
const runtimeChanged = write(files.runtime, runtime);

/* 8. Zielgenaue Styles in bestehenden Density-Layer integrieren. */
const markerStart = "/* PT_COMPONENT_SIMPLIFICATION_12_0_0_START */";
const markerEnd = "/* PT_COMPONENT_SIMPLIFICATION_12_0_0_END */";

const cssBlock = `
${markerStart}

/* Header: Mobile bewusst nur Logo + Burgermenü. */
@media (max-width: 63.99rem) {
  .site-header-v2 .header-container-v2 {
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 4.25rem;
    padding-block: .55rem;
  }

  .site-header-v2 .header-advisor-link {
    display: none;
  }

  .site-header-v2 .brand-lockup {
    min-width: 0;
  }

  .site-header-v2 .nav-toggle-button {
    inline-size: 2.9rem;
    block-size: 2.9rem;
    min-inline-size: 2.9rem;
    min-block-size: 2.9rem;
    padding: 0;
    display: inline-grid;
    place-items: center;
    border-radius: .85rem;
  }

  .site-header-v2 .nav-toggle-button__label {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .site-header-v2 .nav-toggle-button__icon {
    display: grid;
    gap: 4px;
    inline-size: 1.2rem;
  }

  .site-header-v2 .nav-toggle-button__icon > span {
    display: block;
    block-size: 2px;
    border-radius: 999px;
    background: currentColor;
  }
}

/* Desktop zeigt weiterhin den Text des Menüs nur, falls Toggle dort sichtbar ist. */
@media (min-width: 64rem) {
  .nav-toggle-button__icon {
    display: none;
  }
}

/* Empfehlungskarten: exakt eine visuelle Kartenebene. */
.recommendation-card {
  display: grid;
  gap: 0;
  overflow: clip;
}

.recommendation-card__badge {
  justify-self: start;
  margin: 1rem 1rem .7rem;
  padding: .42rem .72rem;
  border-radius: 999px;
  color: var(--comparison-accent);
  background: color-mix(in srgb, var(--comparison-accent) 10%, transparent);
  font-size: .76rem;
  font-weight: 800;
}

.recommendation-card__image-link,
.recommendation-card__content,
.recommendation-card__manufacturer,
.recommendation-card__actions {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.recommendation-card__image-link {
  margin-inline: 1rem;
  overflow: hidden;
  border-radius: .9rem;
}

.recommendation-card__content {
  padding: 1rem;
}

.recommendation-card__manufacturer {
  display: block;
  width: auto;
  margin: 0 0 .3rem;
  padding: 0;
  color: var(--comparison-muted);
  font-size: .75rem;
  font-weight: 800;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.recommendation-card > :where(.comparison-price-signal, [class*="price-signal"]) {
  margin-inline: 1rem;
  border-inline: 0;
  border-radius: 0;
}

.recommendation-card__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .65rem;
  margin: 0 1rem 1rem;
  padding: 1rem 0 0;
  border-top: 1px solid var(--comparison-line);
}

.recommendation-card__actions .comparison-button {
  min-width: 0;
}

/* Mobile Vergleichsprodukte: keine Karte in der Karte. */
.comparison-mobile-product--flat {
  overflow: clip;
}

.comparison-mobile-product--flat > :where(
  header,
  .pt-score,
  .comparison-price-signal,
  .comparison-mobile-product__actions
) {
  border-inline: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.comparison-mobile-product--flat .comparison-mobile-product__actions {
  padding-top: 1rem;
  border-top: 1px solid var(--comparison-line);
}

/* Fit-Karten: Hersteller und Pro/Contra sind Inhaltsgruppen, keine Sub-Karten. */
.comparison-fit-card {
  gap: 1.1rem;
  padding: 1.2rem;
}

.comparison-fit-card__badge {
  display: inline-flex;
  width: fit-content;
  padding: .38rem .68rem;
  border-radius: 999px;
  color: var(--comparison-accent);
  background: color-mix(in srgb, var(--comparison-accent) 10%, transparent);
  font-size: .75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.comparison-fit-card__manufacturer {
  margin: .35rem 0 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--comparison-muted);
  background: transparent;
  box-shadow: none;
}

.comparison-fit-card__group {
  padding: 1rem 0 0;
  border: 0;
  border-top: 1px solid var(--comparison-line);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.comparison-fit-card__group h4 {
  margin-bottom: .65rem;
}

.comparison-fit-card__group ul {
  margin-bottom: 0;
}

/* Szenario-Chips kompakt und Fit nie über 100. */
.scenario-card__topline {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.scenario-label {
  line-height: 1.2;
}

.scenario-match {
  min-height: 1.8rem;
  display: inline-flex;
  align-items: center;
}

/* Score und Preis kompakter. */
:where(.recommendation-card, .scenario-card, .comparison-mobile-product) .pt-score {
  margin-block: .35rem;
}

:where(.recommendation-card, .scenario-card, .comparison-mobile-product)
  :where(.comparison-price-signal, [class*="price-signal"]) {
  min-height: auto;
  padding-block: .8rem;
}

/* Mobile Abstände und Lesbarkeit. */
@media (max-width: 47.99rem) {
  .recommendation-card,
  .comparison-fit-card,
  .scenario-card,
  .comparison-mobile-product {
    border-radius: 1rem;
  }

  .recommendation-card__content {
    padding: .9rem 1rem;
  }

  .recommendation-card__actions {
    grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
    gap: .55rem;
  }

  .comparison-fit-card {
    padding: 1.05rem;
  }

  .comparison-fit-card__group {
    padding-top: .9rem;
  }
}

${markerEnd}
`;

let density = read(files.density);
const escapedStart = markerStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapedEnd = markerEnd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
density = density.replace(new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, "g"), "").trimEnd();
density += "\n\n" + cssBlock.trim() + "\n";

if (/:root\s*\{/.test(cssBlock)) fail("Neuer CSS-Block enthält :root.");
if (/!important\b/.test(cssBlock)) fail("Neuer CSS-Block enthält !important.");

const densityChanged = write(files.density, density);

const changed = {
  headerChanged,
  recommendationsChanged,
  mobileCardsChanged,
  prosConsChanged,
  stickyChanged,
  scenariosChanged,
  runtimeChanged,
  densityChanged
};

const report = `# Component Simplification 12.0.0

## Behobene Findings

- Mobile Header zeigt nur Logo und Burgermenü
- Kaufberatung bleibt auf Desktop und im Navigationskontext erreichbar
- doppelter Menütext durch echte Burger-Struktur beseitigt
- Empfehlungskarten auf eine Surface-Ebene reduziert
- CTA-Unterboxen entfernt
- Hersteller-Kapseln zu normaler Metazeile vereinfacht
- Fit-/Pro-Contra-Unterkarten abgeflacht
- Szenario-Chips verkleinert
- Fit-Scores technisch auf 0–100 begrenzt
- Sticky CTA kompakter, transparenter und ohne !important-Kaskade
- Preis- und Score-Abstände reduziert
- Dark Mode für Sticky CTA berücksichtigt

## Geänderte Dateien

${Object.entries(changed).map(([name, value]) => `- ${name}: ${value ? "geändert" : "bereits aktuell"}`).join("\n")}
`;

if (!DRY_RUN) {
  ensureDir(path.dirname(files.report));
  fs.writeFileSync(files.report, report);
}

log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run erfolgreich.");
  process.exit(0);
}

for (const check of [
  "design-system:density:audit",
  "design-system:check"
]) {
  if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", check])) {
    fail(`${check} fehlgeschlagen.`);
  }
}

if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("Build fehlgeschlagen.");
}

const visualQaScript = path.join(
  root,
  "apps/pfotentechnik/scripts/design-system/visual-qa.mjs"
);
if (
  fs.existsSync(visualQaScript) &&
  !run("npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:visual-qa"
  ])
) fail("Visual-QA fehlgeschlagen.");

if (!NO_COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8"
  });
  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", "-A"])) fail("git add fehlgeschlagen.");
    if (!run("git", [
      "commit",
      "-m",
      "refactor(pfotentechnik): simplify comparison components"
    ])) fail("Commit fehlgeschlagen.");
    log("Lokal committed.");
  } else {
    log("Keine offenen Änderungen.");
  }
}

log("Component Simplification 12.0.0 erfolgreich abgeschlossen.");
