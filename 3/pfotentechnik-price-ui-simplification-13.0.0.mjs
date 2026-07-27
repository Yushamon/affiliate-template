#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-price-ui-simplification-13.0.0";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const COMMIT = args.has("--commit");

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

if (!root) {
  fail("Repository-Root nicht gefunden. Starte den Installer im affiliate-template-Repository.");
}

const files = {
  priceSignal: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro"
  ),
  comparisonTable: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/ComparisonTable.astro"
  ),
  comparisonShell: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/ComparisonShell.astro"
  ),
  recommendationGrid: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro"
  ),
  comparisonPremiumCss: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/comparison-premium-ux.css"
  ),
  productPriceBox: path.join(
    root,
    "apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro"
  ),
  test: path.join(
    root,
    "apps/pfotentechnik/test/comparison-score-price-3.3.4.test.mjs"
  ),
  report: path.join(
    root,
    "apps/pfotentechnik/reports/design-system/price-ui-simplification-13.0.0.md"
  )
};

for (const [key, file] of Object.entries(files)) {
  if (key === "report") continue;
  if (!fs.existsSync(file)) {
    fail(`Pflichtdatei fehlt: ${path.relative(root, file)}`);
  }
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${NAME}-${timestamp}`);
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const read = (file) => fs.readFileSync(file, "utf8");
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

function backup(file) {
  if (CHECK_ONLY || !fs.existsSync(file)) return;
  const target = path.join(backupRoot, relative(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const before = read(file);
  if (before === content) return false;

  if (!CHECK_ONLY) {
    backup(file);
    fs.writeFileSync(file, content);
  }

  return true;
}

function stripMarkedBlock(content, start, end) {
  const pattern = new RegExp(
    `${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\s*`,
    "g"
  );
  return content.replace(pattern, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceRequired(content, pattern, replacement, label) {
  if (!pattern.test(content)) {
    fail(`Anker nicht gefunden: ${label}`);
  }
  pattern.lastIndex = 0;
  return content.replace(pattern, replacement);
}

function replacePriceTableRow(content) {
  const anchor = "<strong>Aktueller Preis</strong>";
  const anchorIndex = content.indexOf(anchor);

  if (anchorIndex === -1) {
    fail("Anker nicht gefunden: Preiszeile in ComparisonTable.astro");
  }

  const start = content.lastIndexOf(
    '<tr class="comparison-table__signal-row"',
    anchorIndex
  );
  const endTag = "</tr>";
  const end = content.indexOf(endTag, anchorIndex);

  if (start === -1 || end === -1) {
    fail("Preiszeile in ComparisonTable.astro konnte nicht sicher abgegrenzt werden.");
  }

  const replacement = `        <tr class="comparison-table__signal-row" data-comparison-row data-has-differences="true">
          <th scope="row">
            <strong>Aktueller Preis</strong>
            <small>Preisangabe und letzter Prüfstand</small>
          </th>
          {products.map((product) => {
            const price = getPriceDisplay(product.price);
            const checkedLabel = price.meta?.replace(/^Preisstand:/, "Zuletzt geprüft:");
            return (
              <td data-label={product.title} data-product-column={product.slug}>
                <div class="comparison-table-price">
                  <strong>{price.amountLabel ?? (price.url ? "Beim Händler prüfen" : "Keine Angabe")}</strong>
                  {checkedLabel && <small>{checkedLabel}</small>}
                </div>
              </td>
            );
          })}
        </tr>`;

  return content.slice(0, start) + replacement + content.slice(end + endTag.length);
}

function validatePublicPriceUi(outputs) {
  const bannedPatterns = [
    /Typischer Preisbereich/i,
    /Typischer Bereich/i,
    /Ist der Preis fair/i,
    /comparison-price-signal__status/,
    /comparison-price-signal__range/,
    /comparison-price-signal__context/,
    /data-price-assessment/
  ];

  for (const [label, content] of Object.entries(outputs)) {
    for (const pattern of bannedPatterns) {
      if (pattern.test(content)) {
        fail(`Veraltete öffentliche Preisinformation in ${label}: ${pattern}`);
      }
    }
  }
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });
  return result.status === 0;
}

/* -------------------------------------------------------------------------- */
/* 1. GEMEINSAMES PREISSIGNAL                                                  */
/* -------------------------------------------------------------------------- */

const canonicalPriceSignal = `---
import type { PriceState } from "../../comparison/model";
import { getPriceDisplay } from "../../comparison/price";

interface Props {
  price: PriceState;
  variant?: "compact" | "standard";
  label?: string;
}

const {
  price,
  variant = "compact",
  label = "Aktueller Preis"
} = Astro.props;
const display = getPriceDisplay(price);
const hasSignal = Boolean(display.amountLabel || display.url);
const checkedLabel = display.meta?.replace(/^Preisstand:/, "Zuletzt geprüft:");
---

{hasSignal && (
  <div
    class:list={[
      "comparison-price-signal",
      \`comparison-price-signal--\${variant}\`
    ]}
  >
    <div class="comparison-price-signal__main">
      <span>{label}</span>
      <strong>{display.amountLabel ?? "Beim Händler prüfen"}</strong>
    </div>

    {checkedLabel && <small>{checkedLabel}</small>}
  </div>
)}

<style>
  .comparison-price-signal {
    display: grid;
    min-width: 0;
    gap: .28rem;
    padding: .8rem 0;
    border-top: 1px solid var(--comparison-line);
    color: var(--comparison-text);
    background: transparent;
  }

  .comparison-price-signal__main {
    display: grid;
    min-width: 0;
    gap: .2rem;
  }

  .comparison-price-signal__main span {
    color: var(--comparison-muted);
    font-size: .72rem;
    font-weight: 800;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .comparison-price-signal__main strong {
    min-width: 0;
    color: var(--comparison-text);
    font-size: 1.15rem;
    font-weight: 900;
    line-height: 1.18;
    overflow-wrap: anywhere;
  }

  .comparison-price-signal small {
    margin: 0;
    color: var(--comparison-muted);
    font-size: .72rem;
    line-height: 1.4;
  }

  .comparison-price-signal--standard {
    gap: .35rem;
    padding: 1rem 0 .25rem;
  }

  .comparison-price-signal--standard .comparison-price-signal__main strong {
    font-size: clamp(1.65rem, 5vw, 2rem);
    letter-spacing: -.025em;
  }
</style>
`;

const priceSignalChanged = write(files.priceSignal, canonicalPriceSignal);

/* -------------------------------------------------------------------------- */
/* 2. PRODUKTSEITEN: PREISBOX OHNE RANGE UND FAIRNESS                          */
/* -------------------------------------------------------------------------- */

const canonicalProductPriceBox = `---
import type { ProductPriceInsight } from "../../domain/price/types";

interface Operations {
  availability: "available" | "temporarily-unavailable" | "out-of-stock" | "discontinued" | "unknown";
  availabilityLabel: string;
  availabilityReason?: string;
  purchasable: boolean;
  priceAvailable: boolean;
}

interface Props {
  price?: ProductPriceInsight;
  operations: Operations;
  affiliate: {
    url?: string;
    label: string;
    rel: string;
    target: "_blank" | "_self";
  };
}

const { price, affiliate, operations } = Astro.props;
const checkedLabel = price?.checkedAt
  ? new Date(price.checkedAt).toLocaleDateString("de-DE")
  : null;
const currentPriceLabel = price?.formattedCurrent
  ? \`ca. \${price.formattedCurrent}\`
  : operations.purchasable
    ? "Beim Händler prüfen"
    : "Preis aktuell nicht verfügbar";
const unavailableCopy = operations.availability === "discontinued"
  ? "Dieses Produkt wurde eingestellt und wird nicht mehr als Hauptempfehlung geführt. Prüfe die Alternativen auf dieser Seite."
  : operations.availability === "temporarily-unavailable"
    ? "Dieses Produkt ist vorübergehend nicht verfügbar. Die redaktionelle Bewertung bleibt bestehen, aktuell solltest du aber eine Alternative prüfen."
    : operations.availability === "out-of-stock"
      ? "Dieses Produkt ist aktuell nicht lieferbar. Die redaktionelle Bewertung bleibt bestehen, eine Kaufempfehlung wird derzeit nicht ausgespielt."
      : operations.availability === "unknown"
        ? "Die aktuelle Verfügbarkeit ist noch nicht belastbar bestätigt. Deshalb zeigen wir keinen Kaufen-CTA."
        : null;
---

<section class="px2-price" aria-labelledby="px2-price-title" data-availability={operations.availability}>
  {unavailableCopy && (
    <aside class:list={["px2-availability", \`is-\${operations.availability}\`]} role="status">
      <strong>{operations.availabilityLabel}</strong>
      <p>{operations.availabilityReason || unavailableCopy}</p>
    </aside>
  )}

  <header class="px2-price__header">
    <span>Preis</span>
    <h2 id="px2-price-title">Aktueller Preis</h2>
  </header>

  <div class="px2-price__amount">
    <strong>{currentPriceLabel}</strong>
    {checkedLabel && <small>Zuletzt geprüft: {checkedLabel}</small>}
  </div>

  {operations.purchasable && affiliate.url ? (
    <a
      class="px2-price__cta"
      href={affiliate.url}
      rel={affiliate.rel}
      target={affiliate.target}
    >
      {affiliate.label}
      <span aria-hidden="true">↗</span>
    </a>
  ) : (
    <span class="px2-price__cta is-disabled" aria-disabled="true">
      {operations.availability === "available"
        ? "Kaufquelle noch nicht hinterlegt"
        : "Aktuell keine Kaufempfehlung"}
    </span>
  )}

  <p class="px2-price__note">
    Preis und Verfügbarkeit können sich kurzfristig ändern.
    {price?.isStale && checkedLabel && <> Die letzte Prüfung ist älter als 14 Tage.</>}
  </p>
</section>

<style>
  .px2-price {
    display: grid;
    gap: 16px;
    padding: clamp(18px, 3vw, 24px);
    border: 1px solid var(--px2-border);
    border-radius: 20px;
    color: var(--px2-text);
    background: var(--px2-surface);
    box-shadow: var(--px2-shadow);
  }

  .px2-availability {
    padding: 14px;
    border: 1px solid var(--px2-border);
    border-radius: 14px;
    color: var(--px2-text);
    background: var(--px2-amber-soft);
  }

  .px2-availability.is-discontinued,
  .px2-availability.is-out-of-stock {
    background: var(--px2-red-soft);
  }

  .px2-availability strong {
    display: block;
    margin-bottom: 5px;
    color: var(--px2-text);
  }

  .px2-availability p {
    margin: 0;
    color: var(--px2-muted);
    font-size: .88rem;
    line-height: 1.5;
  }

  .px2-price__header {
    display: grid;
    gap: 4px;
  }

  .px2-price__header span {
    color: var(--px2-green-strong);
    font-size: .72rem;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .px2-price__header h2 {
    margin: 0;
    color: var(--px2-text);
    font-size: clamp(1.2rem, 3vw, 1.45rem);
    line-height: 1.18;
  }

  .px2-price__amount {
    display: grid;
    gap: 6px;
    padding: 16px 0;
    border-top: 1px solid var(--px2-border);
    border-bottom: 1px solid var(--px2-border);
  }

  .px2-price__amount strong {
    color: var(--px2-text);
    font-size: clamp(1.8rem, 7vw, 2.4rem);
    font-weight: 950;
    line-height: 1.05;
    letter-spacing: -.035em;
    overflow-wrap: anywhere;
  }

  .px2-price__amount small,
  .px2-price__note {
    color: var(--px2-muted);
    font-size: .76rem;
    line-height: 1.45;
  }

  .px2-price__cta {
    display: flex;
    min-height: 50px;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 12px 16px;
    border: 1px solid var(--px2-green-strong);
    border-radius: 14px;
    color: var(--px2-on-accent);
    background: var(--px2-green-strong);
    font-weight: 900;
    text-align: center;
    text-decoration: none;
  }

  .px2-price__cta:hover {
    filter: brightness(1.06);
  }

  .px2-price__cta.is-disabled {
    border-color: var(--px2-border);
    color: var(--px2-muted);
    background: var(--px2-surface-soft);
  }

  .px2-price__note {
    margin: 0;
  }
</style>
`;

const productPriceBoxChanged = write(files.productPriceBox, canonicalProductPriceBox);

/* -------------------------------------------------------------------------- */
/* 3. DIREKTVERGLEICH: NUR PREIS UND PRÜFSTAND                                 */
/* -------------------------------------------------------------------------- */

let comparisonTable = read(files.comparisonTable);
comparisonTable = replacePriceTableRow(comparisonTable);
const comparisonTableChanged = write(files.comparisonTable, comparisonTable);

/* -------------------------------------------------------------------------- */
/* 4. TOP-EMPFEHLUNG: EINE FLÄCHE, 4:3-MEDIUM, PREIS BEIM CTA                   */
/* -------------------------------------------------------------------------- */

let comparisonShell = read(files.comparisonShell);

if (!comparisonShell.includes("comparison-winner-card")) {
  fail("ComparisonShell.astro enthält keine Top-Empfehlungskarte.");
}

comparisonShell = comparisonShell
  .replace(
    /class="pt-surface comparison-winner-card__eyebrow"/g,
    'class="comparison-winner-card__eyebrow"'
  )
  .replace(
    /class="pt-surface comparison-winner-card__badge"/g,
    'class="comparison-winner-card__badge"'
  )
  .replace(
    /class="pt-surface comparison-winner-card__image"/g,
    'class="comparison-winner-card__image"'
  )
  .replace(
    /class="pt-surface comparison-winner-card__copy"/g,
    'class="comparison-winner-card__copy"'
  )
  .replace(
    /class="pt-surface comparison-winner-card__actions"/g,
    'class="comparison-winner-card__actions"'
  )
  .replace(/width="520"\s+height="420"/g, 'width="640"\n                height="480"')
  .replace(
    /\s*<ComparisonPriceSignal\s+price=\{winner\.price\}\s+variant="standard"(?:\s+showContext)?\s*\/>\s*/g,
    "\n"
  );

if (!comparisonShell.includes('class="comparison-winner-card__purchase"')) {
  comparisonShell = replaceRequired(
    comparisonShell,
    /          <div class="comparison-winner-card__actions">([\s\S]*?)          <\/div>\n        <\/div>/,
    `          <div class="comparison-winner-card__purchase">
            <ComparisonPriceSignal price={winner.price} variant="standard" />
            <div class="comparison-winner-card__actions">$1            </div>
          </div>
        </div>`,
    "Kaufbereich der Top-Empfehlung"
  );
}

const comparisonShellChanged = write(files.comparisonShell, comparisonShell);

/* -------------------------------------------------------------------------- */
/* 5. EMPFEHLUNGSKARTEN: 4:3-BILD BLEIBT IN DER KARTE                          */
/* -------------------------------------------------------------------------- */

let recommendationGrid = read(files.recommendationGrid);
recommendationGrid = stripMarkedBlock(
  recommendationGrid,
  "<!-- PT_RECOMMENDATION_RECOVERY_12_1_1_START -->",
  "<!-- PT_RECOMMENDATION_RECOVERY_12_1_1_END -->"
);
recommendationGrid = stripMarkedBlock(
  recommendationGrid,
  "<!-- PT_RECOMMENDATION_PRICE_UI_13_0_0_START -->",
  "<!-- PT_RECOMMENDATION_PRICE_UI_13_0_0_END -->"
).trimEnd();

recommendationGrid += `

<!-- PT_RECOMMENDATION_PRICE_UI_13_0_0_START -->
<style is:global>
  .recommendation-grid .recommendation-card {
    display: grid !important;
    min-width: 0 !important;
    overflow: hidden !important;
    padding: var(--pt-space-4) !important;
    border-color: var(--comparison-line) !important;
    color: var(--comparison-text) !important;
    background: var(--comparison-surface) !important;
  }

  .recommendation-grid .recommendation-card__image-link {
    display: grid !important;
    width: 100% !important;
    min-height: 0 !important;
    aspect-ratio: 4 / 3 !important;
    place-items: center !important;
    margin: 0 0 var(--pt-space-4) !important;
    padding: var(--pt-space-3) !important;
    overflow: hidden !important;
    border: 1px solid var(--comparison-line) !important;
    border-radius: var(--pt-radius-lg) !important;
    background: #f8faf8 !important;
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
    min-width: 0 !important;
    padding: 0 !important;
    color: var(--comparison-text) !important;
    background: transparent !important;
  }

  .recommendation-grid .recommendation-card__content h3,
  .recommendation-grid .recommendation-card__content h3 a {
    color: var(--comparison-text) !important;
  }

  .recommendation-grid .recommendation-card__content > p,
  .recommendation-grid .recommendation-card__manufacturer {
    color: var(--comparison-muted) !important;
  }

  .recommendation-grid .recommendation-card .pt-score {
    --score-surface: var(--comparison-surface);
    --score-text: var(--comparison-text);
    --score-muted: var(--comparison-muted);
    --score-accent: var(--comparison-accent);
  }

  .recommendation-grid .recommendation-card > .comparison-price-signal {
    margin-top: var(--pt-space-4) !important;
  }

  .recommendation-grid .recommendation-card__actions {
    display: grid !important;
    grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr) !important;
    gap: var(--pt-space-2) !important;
    margin: 0 !important;
    padding: var(--pt-space-3) 0 0 !important;
  }

  @media (max-width: 47.99rem) {
    .recommendation-grid .recommendation-card {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    .recommendation-grid .recommendation-card__content h3 {
      margin: 0 0 var(--pt-space-2) !important;
      font-size: var(--pt-font-size-xl) !important;
      line-height: var(--pt-line-height-heading) !important;
    }

    .recommendation-grid .recommendation-card__actions .comparison-button {
      min-height: var(--pt-control-min-height) !important;
    }
  }

  @media (max-width: 23rem) {
    .recommendation-grid .recommendation-card__actions {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }
</style>
<!-- PT_RECOMMENDATION_PRICE_UI_13_0_0_END -->
`;

const recommendationGridChanged = write(files.recommendationGrid, recommendationGrid);

/* -------------------------------------------------------------------------- */
/* 6. FINALE LAYOUT- UND DARK-MODE-REGELN                                      */
/* -------------------------------------------------------------------------- */

let premiumCss = read(files.comparisonPremiumCss);
premiumCss = stripMarkedBlock(
  premiumCss,
  "/* PT_PRICE_UI_SIMPLIFICATION_13_0_0_START */",
  "/* PT_PRICE_UI_SIMPLIFICATION_13_0_0_END */"
).trimEnd();

premiumCss += `

/* PT_PRICE_UI_SIMPLIFICATION_13_0_0_START */
.comparison-winner-card {
  display: grid !important;
  grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr) !important;
  gap: clamp(1rem, 2.5vw, 1.5rem) !important;
  padding: clamp(1rem, 2.5vw, 1.4rem) !important;
  overflow: hidden !important;
  border: 1px solid color-mix(in srgb, var(--comparison-accent) 30%, var(--comparison-line)) !important;
  border-radius: 1.35rem !important;
  color: var(--comparison-text) !important;
  background: var(--comparison-surface) !important;
  box-shadow: var(--comparison-premium-shadow) !important;
}

.comparison-winner-card__eyebrow {
  grid-column: 1 / -1 !important;
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  color: var(--comparison-accent) !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: .76rem !important;
  font-weight: 900 !important;
  letter-spacing: .08em !important;
  text-transform: uppercase !important;
}

.comparison-winner-card__badge {
  grid-column: 1 / -1 !important;
  justify-self: start !important;
  display: inline-flex !important;
  margin: -.25rem 0 0 !important;
  padding: .42rem .72rem !important;
  border: 0 !important;
  border-radius: var(--pt-radius-pill) !important;
  color: #3b2b00 !important;
  background: #f7d676 !important;
  box-shadow: none !important;
  font-size: .74rem !important;
  font-weight: 900 !important;
}

.comparison-winner-card__image {
  grid-column: 1 !important;
  grid-row: 3 / span 2 !important;
  display: grid !important;
  width: 100% !important;
  min-height: 0 !important;
  aspect-ratio: 4 / 3 !important;
  place-items: center !important;
  margin: 0 !important;
  padding: clamp(.65rem, 2vw, 1rem) !important;
  overflow: hidden !important;
  border: 1px solid var(--comparison-line) !important;
  border-radius: var(--pt-radius-lg) !important;
  color: inherit !important;
  background: #f8faf8 !important;
  box-shadow: none !important;
}

.comparison-winner-card__image img {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: contain !important;
  object-position: center !important;
}

.comparison-winner-card__copy {
  grid-column: 2 !important;
  grid-row: 3 !important;
  min-width: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  color: var(--comparison-text) !important;
  background: transparent !important;
  box-shadow: none !important;
}

.comparison-winner-card__copy > span {
  color: var(--comparison-muted) !important;
}

.comparison-winner-card__copy h3 {
  margin: .28rem 0 .9rem !important;
  color: var(--comparison-text) !important;
  font-size: clamp(1.55rem, 3.5vw, 2.2rem) !important;
  line-height: 1.08 !important;
  letter-spacing: -.035em !important;
}

.comparison-winner-card__copy h3 a {
  color: inherit !important;
  text-decoration: none !important;
}

.comparison-winner-card__copy > p {
  margin: 1rem 0 0 !important;
  color: var(--comparison-muted) !important;
  font-size: 1rem !important;
  line-height: 1.58 !important;
}

.comparison-winner-card .pt-score {
  --score-surface: var(--comparison-surface);
  --score-text: var(--comparison-text);
  --score-muted: var(--comparison-muted);
  --score-accent: var(--comparison-accent);
  color: var(--comparison-text) !important;
}

.comparison-winner-card .pt-score__ring-inner {
  background: var(--comparison-surface) !important;
}

.comparison-winner-card li {
  color: var(--comparison-text) !important;
  font-size: .94rem !important;
  line-height: 1.45 !important;
}

.comparison-winner-card__purchase {
  grid-column: 2 !important;
  grid-row: 4 !important;
  align-self: end !important;
  display: grid !important;
  min-width: 0 !important;
  gap: var(--pt-space-3) !important;
  padding-top: var(--pt-space-2) !important;
  border: 0 !important;
  color: var(--comparison-text) !important;
  background: transparent !important;
}

.comparison-winner-card__purchase .comparison-price-signal {
  margin: 0 !important;
  padding: var(--pt-space-3) 0 0 !important;
  border-top: 1px solid var(--comparison-line) !important;
}

.comparison-winner-card__actions {
  display: grid !important;
  grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr) !important;
  gap: var(--pt-space-2) !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.comparison-winner-card__actions .comparison-button {
  min-width: 0 !important;
  min-height: var(--pt-control-min-height) !important;
  padding-inline: var(--pt-space-3) !important;
  text-wrap: balance !important;
}

.comparison-price-signal,
.comparison-price-signal__main,
.comparison-price-signal__main strong,
.comparison-price-signal small {
  color-scheme: light dark;
}

.comparison-price-signal__main strong {
  color: var(--comparison-text) !important;
}

.comparison-price-signal__main span,
.comparison-price-signal small {
  color: var(--comparison-muted) !important;
}

.comparison-table-price {
  display: grid;
  gap: .3rem;
}

.comparison-table-price strong {
  color: var(--comparison-text);
}

.comparison-table-price small {
  color: var(--comparison-muted);
  font-size: .72rem;
  line-height: 1.35;
}

@media (max-width: 760px) {
  .comparison-winner-card {
    grid-template-columns: minmax(0, 1fr) !important;
    gap: var(--pt-space-4) !important;
    padding: var(--pt-space-4) !important;
  }

  .comparison-winner-card__eyebrow,
  .comparison-winner-card__badge,
  .comparison-winner-card__image,
  .comparison-winner-card__copy,
  .comparison-winner-card__purchase {
    grid-column: 1 !important;
    grid-row: auto !important;
  }

  .comparison-winner-card__image {
    aspect-ratio: 4 / 3 !important;
  }

  .comparison-winner-card__copy h3 {
    font-size: clamp(1.45rem, 7vw, 1.85rem) !important;
  }

  .comparison-winner-card__copy > p {
    font-size: .98rem !important;
  }

  .comparison-winner-card__purchase {
    padding-top: 0 !important;
  }

  .comparison-winner-card__actions {
    grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr) !important;
  }
}

@media (max-width: 23rem) {
  .comparison-winner-card__actions {
    grid-template-columns: minmax(0, 1fr) !important;
  }
}
/* PT_PRICE_UI_SIMPLIFICATION_13_0_0_END */
`;

const premiumCssChanged = write(files.comparisonPremiumCss, premiumCss);

/* -------------------------------------------------------------------------- */
/* 7. REGRESSIONSTESTS ANPASSEN                                                 */
/* -------------------------------------------------------------------------- */

let testSource = read(files.test);
testSource = testSource.replace(
  "  assert.match(files[3], /Typisch:/);",
  "  assert.doesNotMatch(files[3], /Typisch:|fair|eher teuer|günstig/i);"
);

if (!testSource.includes('test("public price UI omits ranges and fairness labels"')) {
  testSource += `

test("public price UI omits ranges and fairness labels", async () => {
  const files = await Promise.all([
    read("packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro"),
    read("packages/affiliate-core/src/components/comparison/ComparisonTable.astro"),
    read("apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro")
  ]);

  for (const source of files) {
    assert.doesNotMatch(
      source,
      /Typischer Preisbereich|Typischer Bereich|Ist der Preis fair|data-price-assessment|comparison-price-signal__status/i
    );
  }

  assert.match(files[0], /Zuletzt geprüft/);
  assert.match(files[2], /Aktueller Preis/);
});
`;
}

const testChanged = write(files.test, testSource);

/* -------------------------------------------------------------------------- */
/* 8. VALIDIERUNG UND REPORT                                                   */
/* -------------------------------------------------------------------------- */

const transformedOutputs = {
  ComparisonPriceSignal: canonicalPriceSignal,
  ComparisonTable: comparisonTable,
  ComparisonShell: comparisonShell,
  RecommendationGrid: recommendationGrid,
  PriceBox2: canonicalProductPriceBox
};

validatePublicPriceUi(transformedOutputs);

if (!/aspect-ratio:\s*4\s*\/\s*3/.test(premiumCss)) {
  fail("4:3-Regel für die Top-Empfehlung fehlt.");
}

if (!comparisonShell.includes('class="comparison-winner-card__purchase"')) {
  fail("Preis und CTA wurden nicht zu einem Kaufbereich zusammengeführt.");
}

const changes = [
  [files.priceSignal, priceSignalChanged],
  [files.productPriceBox, productPriceBoxChanged],
  [files.comparisonTable, comparisonTableChanged],
  [files.comparisonShell, comparisonShellChanged],
  [files.recommendationGrid, recommendationGridChanged],
  [files.comparisonPremiumCss, premiumCssChanged],
  [files.test, testChanged]
];

const changedFiles = changes.filter(([, changed]) => changed).map(([file]) => relative(file));

const report = `# Price UI Simplification 13.0.0

## Öffentliche Preisdarstellung

- Preisrange entfernt
- Fairness-Badge und Preisurteil entfernt
- erklärender Preisvergleichstext entfernt
- sichtbar bleiben nur aktueller Preis, letzter Prüfstand und Händler-CTA
- zugrunde liegende Price-Engine-Daten bleiben für Admin, Audits und spätere Preisverläufe erhalten

## Vergleich

- Top-Empfehlung auf eine zusammenhängende Oberfläche reduziert
- verschachtelte \`pt-surface\`-Flächen aus der Gewinnerkarte entfernt
- Produktmedium auf 4:3 begrenzt und innerhalb der Karte gehalten
- Preis direkt mit dem CTA-Bereich verbunden
- Dark-Mode-Texte, Score und Flächen auf Comparison-Tokens festgelegt
- Direktvergleich zeigt keine Range oder Fairness-Einordnung mehr

## Produktseiten

- PriceBox2 zeigt nur noch den aktuellen Preis
- Prüfdatum und Änderlichkeit bleiben transparent
- Verfügbarkeitszustände und deaktivierte Kauf-CTAs bleiben erhalten

## Geänderte Dateien

${changedFiles.length > 0 ? changedFiles.map((file) => `- ${file}`).join("\n") : "- keine, Stand bereits aktuell"}
`;

if (CHECK_ONLY) {
  log("Check erfolgreich. Es wurde nichts verändert.");
  if (changedFiles.length > 0) {
    log("Würde ändern:");
    for (const file of changedFiles) log(`- ${file}`);
  } else {
    log("Der Stand ist bereits aktuell.");
  }
  process.exit(0);
}

ensureDir(path.dirname(files.report));
fs.writeFileSync(files.report, report);

log(`Backups: ${relative(backupRoot)}`);
log(`Report: ${relative(files.report)}`);

if (!run("node", ["--test", relative(files.test)])) {
  fail("Gezielter Preis-/Vergleichstest fehlgeschlagen.");
}

if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("PfotenTechnik-Build fehlgeschlagen. Änderungen und Backups bleiben zur Prüfung erhalten.");
}

if (COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8"
  });

  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", ...changedFiles, relative(files.report)])) {
      fail("git add fehlgeschlagen.");
    }

    if (
      !run("git", [
        "commit",
        "-m",
        "fix(pfotentechnik): simplify public price UI"
      ])
    ) {
      fail("Commit fehlgeschlagen.");
    }

    log("Lokal committed.");
  } else {
    log("Keine offenen Änderungen.");
  }
}

log("Price UI Simplification 13.0.0 erfolgreich abgeschlossen.");
