#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-comparison-mobile-fix-12.1.0";
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
  sticky: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro"),
  recommendations: path.join(root, "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro"),
  price: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro"),
  report: path.join(root, "apps/pfotentechnik/reports/design-system/comparison-mobile-fix-12.1.0.md")
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
  const before = read(file);
  if (before === content) return false;
  if (!DRY_RUN) {
    backup(file);
    fs.writeFileSync(file, content);
  }
  return true;
}

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  }).status === 0;
}

function replaceRequired(content, pattern, replacement, label) {
  if (!pattern.test(content)) fail(`Anker nicht gefunden: ${label}`);
  pattern.lastIndex = 0;
  return content.replace(pattern, replacement);
}

/* -------------------------------------------------------------------------- */
/* Header: Mobile CTA wirklich ausblenden, Burger sauber rendern               */
/* -------------------------------------------------------------------------- */

let header = read(files.header);

header = header.replace(
  /<a class="header-advisor-link"([^>]*)>/,
  (full, rest) => {
    if (/\bdata-desktop-only\b/.test(full)) return full;
    return `<a class="header-advisor-link"${rest} data-desktop-only>`;
  }
);

header = replaceRequired(
  header,
  /<button\b[\s\S]*?data-nav-toggle[\s\S]*?>[\s\S]*?<\/button>/m,
  `<button
      class="pt-button nav-toggle-button"
      type="button"
      aria-label="Navigation öffnen"
      aria-expanded="false"
      aria-controls="main-navigation"
      data-nav-toggle
    >
      <svg
        class="nav-toggle__glyph"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <span class="nav-toggle__sr">Menü</span>
    </button>`,
  "Header Navigation Toggle"
);

const headerMarkerStart = "<!-- PT_HEADER_MOBILE_12_1_0_START -->";
const headerMarkerEnd = "<!-- PT_HEADER_MOBILE_12_1_0_END -->";
header = header.replace(
  new RegExp(`${headerMarkerStart}[\\s\\S]*?${headerMarkerEnd}`, "g"),
  ""
).trimEnd();

header += `

${headerMarkerStart}
<style is:global>
  @media (max-width: 63.99rem) {
    .site-header-v2 .header-container-v2 {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .site-header-v2 [data-desktop-only] {
      display: none !important;
    }

    .site-header-v2 .nav-toggle-button {
      display: inline-grid;
      inline-size: 3rem;
      block-size: 3rem;
      min-inline-size: 3rem;
      min-block-size: 3rem;
      place-items: center;
      padding: 0;
      border-radius: var(--pt-radius-lg);
    }

    .site-header-v2 .nav-toggle__glyph {
      display: block;
      inline-size: 1.5rem;
      block-size: 1.5rem;
    }

    .site-header-v2 .nav-toggle__sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  }
</style>
${headerMarkerEnd}
`;

if (!header.includes("data-desktop-only")) fail("Desktop-only-Markierung fehlt.");
if (!header.includes("nav-toggle__glyph")) fail("Neues Burger-Icon fehlt.");
const headerChanged = write(files.header, header);

/* -------------------------------------------------------------------------- */
/* Sticky CTA: Produktname klar über den Buttons                               */
/* -------------------------------------------------------------------------- */

let sticky = read(files.sticky);

const stickyMarkup = `{product && (
  <aside class="comparison-sticky-bar comparison-sticky-bar--v121" aria-label="Top-Empfehlung">
    <div class="comparison-sticky-bar__identity">
      <span>Top-Empfehlung</span>
      <strong>{product.title}</strong>
    </div>

    <div class="comparison-sticky-bar__actions">
      <a
        href={product.href}
        class="pt-button-secondary pt-button comparison-button comparison-button--secondary"
      >
        Test lesen
      </a>

      {price?.url && (
        <a
          href={price.url}
          class="pt-button comparison-button"
          rel={price.rel}
          target={price.target}
          data-affiliate-link
        >
          {price.label}
        </a>
      )}
    </div>
  </aside>
)}`;

sticky = replaceRequired(
  sticky,
  /\{product && \([\s\S]*?\)\}\s*\n\s*<style is:global>/,
  `${stickyMarkup}

<style is:global>`,
  "Sticky CTA Markup"
);

sticky = replaceRequired(
  sticky,
  /<style is:global>[\s\S]*?<\/style>\s*$/,
  `<style is:global>
  .comparison-sticky-bar--v121 {
    position: fixed !important;
    z-index: 90 !important;
    right: max(var(--pt-space-3), env(safe-area-inset-right)) !important;
    bottom: max(var(--pt-space-3), env(safe-area-inset-bottom)) !important;
    left: max(var(--pt-space-3), env(safe-area-inset-left)) !important;
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) !important;
    gap: var(--pt-space-2) !important;
    width: auto !important;
    max-width: 47.5rem !important;
    margin-inline: auto !important;
    padding: var(--pt-space-3) !important;
    border: 1px solid var(--comparison-line) !important;
    border-radius: var(--pt-radius-lg) !important;
    color: var(--comparison-text) !important;
    background: color-mix(in srgb, var(--comparison-surface-raised) 94%, transparent) !important;
    box-shadow: var(--pt-shadow-lg) !important;
    -webkit-backdrop-filter: blur(18px) saturate(135%);
    backdrop-filter: blur(18px) saturate(135%);
  }

  .comparison-sticky-bar--v121 .comparison-sticky-bar__identity {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) !important;
    gap: var(--pt-space-1) !important;
    min-width: 0 !important;
    padding-inline: var(--pt-space-1) !important;
  }

  .comparison-sticky-bar--v121 .comparison-sticky-bar__identity span {
    color: var(--comparison-accent) !important;
    font-size: var(--pt-font-size-xs) !important;
    font-weight: var(--pt-font-weight-bold) !important;
    line-height: 1.2 !important;
  }

  .comparison-sticky-bar--v121 .comparison-sticky-bar__identity strong {
    display: block !important;
    min-width: 0 !important;
    overflow: hidden !important;
    color: var(--comparison-text) !important;
    font-size: var(--pt-font-size-sm) !important;
    line-height: 1.25 !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .comparison-sticky-bar--v121 .comparison-sticky-bar__actions {
    display: grid !important;
    grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr) !important;
    gap: var(--pt-space-2) !important;
    width: 100% !important;
  }

  .comparison-sticky-bar--v121 .comparison-button {
    width: 100% !important;
    min-width: 0 !important;
    min-height: var(--pt-control-min-height) !important;
    padding: var(--pt-space-2) var(--pt-space-3) !important;
    font-size: var(--pt-font-size-sm) !important;
    line-height: 1.2 !important;
    white-space: normal !important;
  }

  @media (min-width: 48rem) {
    .comparison-sticky-bar--v121 {
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: center !important;
    }

    .comparison-sticky-bar--v121 .comparison-sticky-bar__actions {
      grid-template-columns: repeat(2, minmax(10rem, auto)) !important;
      width: auto !important;
    }
  }
</style>`,
  "Sticky CTA Style"
);

const stickyChanged = write(files.sticky, sticky);

/* -------------------------------------------------------------------------- */
/* Vergleichskarten: Mobile Layout neu ordnen                                  */
/* -------------------------------------------------------------------------- */

let recommendations = read(files.recommendations);

const recommendationMarkerStart = "<!-- PT_RECOMMENDATION_MOBILE_12_1_0_START -->";
const recommendationMarkerEnd = "<!-- PT_RECOMMENDATION_MOBILE_12_1_0_END -->";
recommendations = recommendations.replace(
  new RegExp(`${recommendationMarkerStart}[\\s\\S]*?${recommendationMarkerEnd}`, "g"),
  ""
).trimEnd();

recommendations += `

${recommendationMarkerStart}
<style is:global>
  @media (max-width: 47.99rem) {
    .recommendation-grid .recommendation-card {
      display: grid !important;
      grid-template-columns: minmax(7.75rem, 9rem) minmax(0, 1fr) !important;
      column-gap: var(--pt-space-4) !important;
      row-gap: 0 !important;
      padding: var(--pt-space-4) !important;
      overflow: hidden !important;
    }

    .recommendation-grid .recommendation-card__badge {
      grid-column: 1 / -1 !important;
      justify-self: start !important;
      margin: 0 0 var(--pt-space-4) !important;
    }

    .recommendation-grid .recommendation-card__image-link {
      grid-column: 1 !important;
      grid-row: 2 !important;
      align-self: stretch !important;
      min-height: 18rem !important;
      margin: 0 !important;
      border-radius: var(--pt-radius-lg) !important;
      background: color-mix(in srgb, var(--comparison-accent) 8%, var(--comparison-surface)) !important;
    }

    .recommendation-grid .recommendation-card__image-link picture,
    .recommendation-grid .recommendation-card__image-link img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
    }

    .recommendation-grid .recommendation-card__content {
      grid-column: 2 !important;
      grid-row: 2 !important;
      align-self: start !important;
      min-width: 0 !important;
      padding: 0 !important;
    }

    .recommendation-grid .recommendation-card__content h3 {
      margin-bottom: var(--pt-space-2) !important;
      font-size: var(--pt-font-size-xl) !important;
      line-height: var(--pt-line-height-heading) !important;
    }

    .recommendation-grid .recommendation-card__content > p {
      margin-bottom: var(--pt-space-3) !important;
      font-size: var(--pt-font-size-base) !important;
      line-height: 1.55 !important;
    }

    .recommendation-grid .recommendation-card__content .pt-score {
      margin-top: var(--pt-space-3) !important;
      padding-top: var(--pt-space-3) !important;
      border-top: 1px solid var(--comparison-line) !important;
    }

    .recommendation-grid .recommendation-card > .comparison-price-signal {
      grid-column: 1 / -1 !important;
      grid-row: 3 !important;
      margin: var(--pt-space-4) 0 0 !important;
    }

    .recommendation-grid .recommendation-card__actions {
      grid-column: 1 / -1 !important;
      grid-row: 4 !important;
      margin: 0 !important;
      padding: var(--pt-space-4) 0 0 !important;
    }
  }

  @media (max-width: 25rem) {
    .recommendation-grid .recommendation-card {
      grid-template-columns: minmax(6.5rem, 7.5rem) minmax(0, 1fr) !important;
      column-gap: var(--pt-space-3) !important;
      padding: var(--pt-space-3) !important;
    }

    .recommendation-grid .recommendation-card__image-link {
      min-height: 16rem !important;
    }
  }
</style>
${recommendationMarkerEnd}
`;

const recommendationsChanged = write(files.recommendations, recommendations);

/* -------------------------------------------------------------------------- */
/* Preiszeile: Preis links, Fair-Badge rechts in derselben Zeile               */
/* -------------------------------------------------------------------------- */

let price = read(files.price);

price = price.replace(
  /border-radius:\s*999px\s*;/g,
  "border-radius: var(--pt-radius-pill);"
);

const priceMarkerStart = "<!-- PT_PRICE_SIGNAL_12_1_0_START -->";
const priceMarkerEnd = "<!-- PT_PRICE_SIGNAL_12_1_0_END -->";
price = price.replace(
  new RegExp(`${priceMarkerStart}[\\s\\S]*?${priceMarkerEnd}`, "g"),
  ""
).trimEnd();

price += `

${priceMarkerStart}
<style is:global>
  .comparison-price-signal {
    grid-template-columns: minmax(0, 1fr) auto !important;
    align-items: center !important;
    column-gap: var(--pt-space-3) !important;
    row-gap: var(--pt-space-2) !important;
  }

  .comparison-price-signal__main {
    justify-content: flex-start !important;
    gap: var(--pt-space-3) !important;
  }

  .comparison-price-signal__main strong {
    font-size: var(--pt-font-size-lg) !important;
    text-align: left !important;
  }

  .comparison-price-signal__status {
    grid-column: 2 !important;
    grid-row: 1 !important;
    align-self: center !important;
    justify-self: end !important;
    min-height: 2rem !important;
    display: inline-flex !important;
    align-items: center !important;
    padding: var(--pt-space-1) var(--pt-space-3) !important;
    border-radius: var(--pt-radius-pill) !important;
    line-height: 1 !important;
  }

  .comparison-price-signal__range,
  .comparison-price-signal__context,
  .comparison-price-signal small {
    grid-column: 1 / -1 !important;
  }
</style>
${priceMarkerEnd}
`;

const priceChanged = write(files.price, price);

const report = `# Comparison Mobile Fix 12.1.0

## Behoben

- Kaufberatungs-CTA im mobilen Header zuverlässig entfernt
- Burgermenü durch sauberes Drei-Linien-SVG ersetzt
- Produktname wieder vollständig oberhalb der Sticky-CTA-Buttons
- fehlerhaft gequetschter Sticky-CTA-Text beseitigt
- Vergleichskarten mobil neu aufgeteilt
- Produktbild, Beschreibung und Score klarer hierarchisiert
- Preis links und Preisbewertung rechts in einer Zeile
- Fair-Badge vertikal zentriert und kompakter
- CTA-Zeile direkt unter Preisbereich
- Dark Mode und bestehende Design-Tokens berücksichtigt

## Dateien

- Header: ${headerChanged ? "geändert" : "bereits aktuell"}
- Sticky CTA: ${stickyChanged ? "geändert" : "bereits aktuell"}
- Empfehlungskarten: ${recommendationsChanged ? "geändert" : "bereits aktuell"}
- Preissignal: ${priceChanged ? "geändert" : "bereits aktuell"}
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
  "design-system:components:audit",
  "design-system:tokens:audit",
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
      "fix(pfotentechnik): polish mobile comparison layout"
    ])) fail("Commit fehlgeschlagen.");
    log("Lokal committed.");
  } else {
    log("Keine offenen Änderungen.");
  }
}

log("Comparison Mobile Fix 12.1.0 erfolgreich abgeschlossen.");
