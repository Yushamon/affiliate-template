#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-comparison-mobile-recovery-12.1.1";
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
  runtime: path.join(root, "apps/pfotentechnik/src/components/SiteRuntimeFixes.astro"),
  recommendations: path.join(root, "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro"),
  price: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro"),
  sticky: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro"),
  report: path.join(root, "apps/pfotentechnik/reports/design-system/comparison-mobile-recovery-12.1.1.md")
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
/* 1. HEADER CTA AUS MARKUP ENTFERNEN                                          */
/* -------------------------------------------------------------------------- */

let header = read(files.header);

/* Entfernt jede Header-Kaufberatungs-/Advisor-CTA als echtes Element. */
const headerCtaPatterns = [
  /[ \t]*<a\b[^>]*class=(["'])[^"']*\bheader-advisor-link\b[^"']*\1[^>]*>[\s\S]*?<\/a>[ \t]*\n?/gi,
  /[ \t]*<a\b[^>]*(?:href=(["'])\/(?:kaufberatung|berater\/futterautomat)\/?\1)[^>]*>[\s\S]*?<\/a>[ \t]*\n?/gi,
  /[ \t]*<button\b[^>]*data-header-advisor[^>]*>[\s\S]*?<\/button>[ \t]*\n?/gi
];

for (const pattern of headerCtaPatterns) {
  header = header.replace(pattern, "");
}

/* Alte 12.1.0-CSS-Hilfe entfernen, da CTA nicht mehr existiert. */
header = header.replace(
  /<!-- PT_HEADER_MOBILE_12_1_0_START -->[\s\S]*?<!-- PT_HEADER_MOBILE_12_1_0_END -->/g,
  ""
);

/* Toggle robust auf ein einziges sauberes Icon reduzieren. */
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
        <path
          d="M5 7h14M5 12h14M5 17h14"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <span class="nav-toggle__sr">Menü</span>
    </button>`,
  "Header Navigation Toggle"
);

const headerStyleStart = "<!-- PT_HEADER_RECOVERY_12_1_1_START -->";
const headerStyleEnd = "<!-- PT_HEADER_RECOVERY_12_1_1_END -->";

header = header.replace(
  new RegExp(`${headerStyleStart}[\\s\\S]*?${headerStyleEnd}`, "g"),
  ""
).trimEnd();

header += `

${headerStyleStart}
<style is:global>
  .site-header-v2 .header-container-v2 {
    grid-template-columns: minmax(0, 1fr) auto;
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
    inline-size: 1.45rem;
    block-size: 1.45rem;
  }

  .site-header-v2 .nav-toggle__sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (min-width: 64rem) {
    .site-header-v2 .header-container-v2 {
      grid-template-columns: auto minmax(0, 1fr);
    }
  }
</style>
${headerStyleEnd}
`;

if (/header-advisor-link|data-header-advisor|>Kaufberatung</i.test(header)) {
  fail("Header-CTA ist nach der Bereinigung noch im Markup vorhanden.");
}
const headerChanged = write(files.header, header);

/* Runtime darf keinen Header-CTA mehr suchen oder rekonstruieren. */
let runtime = read(files.runtime);
runtime = runtime
  .replace(/const PURCHASE_ADVICE_HREF[\s\S]*?;\n/g, "")
  .replace(/const PURCHASE_ADVICE_LABEL[\s\S]*?;\n/g, "")
  .replace(
    /\n\s*const ensureDesktopPurchaseAdvice = \(\) => \{[\s\S]*?\n\s*\};\n/g,
    "\n"
  )
  .replace(/\n\s*ensureDesktopPurchaseAdvice\(\);/g, "");

if (/header-advisor-link|ensureDesktopPurchaseAdvice/.test(runtime)) {
  fail("Runtime enthält noch Header-CTA-Logik.");
}
const runtimeChanged = write(files.runtime, runtime);

/* -------------------------------------------------------------------------- */
/* 2. EMPFEHLUNGSKARTEN KOMPLETT STABILISIEREN                                 */
/* -------------------------------------------------------------------------- */

let recommendations = read(files.recommendations);

const recommendationStart = "<!-- PT_RECOMMENDATION_RECOVERY_12_1_1_START -->";
const recommendationEnd = "<!-- PT_RECOMMENDATION_RECOVERY_12_1_1_END -->";

recommendations = recommendations
  .replace(
    /<!-- PT_RECOMMENDATION_MOBILE_12_1_0_START -->[\s\S]*?<!-- PT_RECOMMENDATION_MOBILE_12_1_0_END -->/g,
    ""
  )
  .replace(
    new RegExp(`${recommendationStart}[\\s\\S]*?${recommendationEnd}`, "g"),
    ""
  )
  .trimEnd();

recommendations += `

${recommendationStart}
<style is:global>
  .recommendation-grid .recommendation-card {
    overflow: hidden;
  }

  @media (max-width: 47.99rem) {
    .recommendation-grid .recommendation-card {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) !important;
      gap: 0 !important;
      padding: var(--pt-space-4) !important;
    }

    .recommendation-grid .recommendation-card__badge {
      grid-column: 1 !important;
      margin: 0 0 var(--pt-space-3) !important;
      justify-self: start !important;
    }

    .recommendation-grid .recommendation-card__image-link {
      grid-column: 1 !important;
      grid-row: auto !important;
      display: grid !important;
      place-items: center !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      aspect-ratio: 4 / 3 !important;
      margin: 0 0 var(--pt-space-4) !important;
      padding: var(--pt-space-3) !important;
      overflow: hidden !important;
      border-radius: var(--pt-radius-lg) !important;
      background: color-mix(in srgb, var(--comparison-accent) 7%, var(--comparison-surface)) !important;
    }

    .recommendation-grid .recommendation-card__image-link picture {
      display: contents !important;
    }

    .recommendation-grid .recommendation-card__image-link img {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      object-fit: contain !important;
      object-position: center !important;
    }

    .recommendation-grid .recommendation-card__content {
      grid-column: 1 !important;
      grid-row: auto !important;
      padding: 0 !important;
    }

    .recommendation-grid .recommendation-card__manufacturer {
      margin-bottom: var(--pt-space-1) !important;
    }

    .recommendation-grid .recommendation-card__content h3 {
      margin: 0 0 var(--pt-space-2) !important;
      font-size: var(--pt-font-size-xl) !important;
      line-height: var(--pt-line-height-heading) !important;
    }

    .recommendation-grid .recommendation-card__content > p {
      margin: 0 0 var(--pt-space-3) !important;
      font-size: var(--pt-font-size-base) !important;
      line-height: 1.55 !important;
    }

    .recommendation-grid .recommendation-card__content .pt-score {
      margin: 0 !important;
      padding: var(--pt-space-3) 0 0 !important;
      border-top: 1px solid var(--comparison-line) !important;
    }

    .recommendation-grid .recommendation-card > .comparison-price-signal {
      grid-column: 1 !important;
      grid-row: auto !important;
      margin: var(--pt-space-4) 0 0 !important;
      padding: var(--pt-space-3) 0 !important;
      border-top: 1px solid var(--comparison-line) !important;
      border-bottom: 0 !important;
    }

    .recommendation-grid .recommendation-card__actions {
      grid-column: 1 !important;
      grid-row: auto !important;
      display: grid !important;
      grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr) !important;
      gap: var(--pt-space-2) !important;
      margin: 0 !important;
      padding: var(--pt-space-3) 0 0 !important;
      border-top: 1px solid var(--comparison-line) !important;
    }

    .recommendation-grid .recommendation-card__actions .comparison-button {
      min-height: var(--pt-control-min-height) !important;
    }
  }
</style>
${recommendationEnd}
`;

const recommendationsChanged = write(files.recommendations, recommendations);

/* -------------------------------------------------------------------------- */
/* 3. PREIS DIREKT VOR CTA, SAUBERE ZEILE                                      */
/* -------------------------------------------------------------------------- */

let price = read(files.price);

price = price
  .replace(
    /<!-- PT_PRICE_SIGNAL_12_1_0_START -->[\s\S]*?<!-- PT_PRICE_SIGNAL_12_1_0_END -->/g,
    ""
  )
  .replace(/border-radius:\s*999px\s*;/g, "border-radius: var(--pt-radius-pill);")
  .trimEnd();

const priceStart = "<!-- PT_PRICE_RECOVERY_12_1_1_START -->";
const priceEnd = "<!-- PT_PRICE_RECOVERY_12_1_1_END -->";
price = price.replace(
  new RegExp(`${priceStart}[\\s\\S]*?${priceEnd}`, "g"),
  ""
).trimEnd();

price += `

${priceStart}
<style is:global>
  .comparison-price-signal {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto !important;
    align-items: center !important;
    gap: var(--pt-space-2) var(--pt-space-3) !important;
  }

  .comparison-price-signal__main {
    display: grid !important;
    grid-template-columns: auto minmax(0, 1fr) !important;
    align-items: baseline !important;
    justify-content: start !important;
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
    display: inline-flex !important;
    min-height: 2rem !important;
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
${priceEnd}
`;

const priceChanged = write(files.price, price);

/* -------------------------------------------------------------------------- */
/* 4. STICKY CTA: NAME NICHT AUSGEPUNKTET                                      */
/* -------------------------------------------------------------------------- */

let sticky = read(files.sticky);

sticky = sticky.replace(
  /<strong>\{product\.title\}<\/strong>/,
  '<strong title={product.title}>{product.title}</strong>'
);

const stickyStart = "<!-- PT_STICKY_RECOVERY_12_1_1_START -->";
const stickyEnd = "<!-- PT_STICKY_RECOVERY_12_1_1_END -->";

sticky = sticky.replace(
  new RegExp(`${stickyStart}[\\s\\S]*?${stickyEnd}`, "g"),
  ""
).trimEnd();

sticky += `

${stickyStart}
<style is:global>
  .comparison-sticky-bar .comparison-sticky-bar__identity strong,
  .comparison-sticky-bar > div:first-child strong {
    display: block !important;
    max-width: none !important;
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: normal !important;
    overflow-wrap: anywhere !important;
    -webkit-line-clamp: unset !important;
  }

  @media (max-width: 47.99rem) {
    .comparison-sticky-bar {
      gap: var(--pt-space-2) !important;
    }

    .comparison-sticky-bar .comparison-sticky-bar__identity,
    .comparison-sticky-bar > div:first-child {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) !important;
      align-items: start !important;
      gap: var(--pt-space-1) !important;
    }

    .comparison-sticky-bar .comparison-sticky-bar__identity strong,
    .comparison-sticky-bar > div:first-child strong {
      font-size: var(--pt-font-size-sm) !important;
      line-height: 1.2 !important;
    }
  }
</style>
${stickyEnd}
`;

const stickyChanged = write(files.sticky, sticky);

const report = `# Comparison Mobile Recovery 12.1.1

## Behoben

- Header-Kaufberatungs-CTA physisch aus dem Astro-Markup entfernt
- Runtime-Logik für Header-CTA vollständig entfernt
- Header besteht mobil nur noch aus Logo und Burgermenü
- Burgermenü auf ein sauberes SVG reduziert
- Vergleichskarten mobil auf vertikale Premium-Struktur umgestellt
- überlanges Bildfeld entfernt
- Produktbild auf stabiles 4:3-Seitenverhältnis begrenzt
- Preis direkt vor dem CTA-Bereich positioniert
- Preis und Fair-Badge sauber in einer Zeile
- Produktname im Sticky-CTA nicht mehr ausgepunktet
- Top-Empfehlungsdarstellung wieder kompakter und klarer

## Änderungen

- Header: ${headerChanged ? "geändert" : "bereits aktuell"}
- Runtime: ${runtimeChanged ? "geändert" : "bereits aktuell"}
- Empfehlungskarten: ${recommendationsChanged ? "geändert" : "bereits aktuell"}
- Preisbereich: ${priceChanged ? "geändert" : "bereits aktuell"}
- Sticky CTA: ${stickyChanged ? "geändert" : "bereits aktuell"}
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
      "fix(pfotentechnik): recover mobile comparison layout"
    ])) fail("Commit fehlgeschlagen.");

    log("Lokal committed.");
  } else {
    log("Keine offenen Änderungen.");
  }
}

log("Comparison Mobile Recovery 12.1.1 erfolgreich abgeschlossen.");
