#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-price-alignment-consistency-13.1.0";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const NO_TESTS = args.has("--no-tests");
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
  mobileCards: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro"
  ),
  recommendationGrid: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro"
  ),
  premiumCss: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/comparison-premium-ux.css"
  ),
  productPriceBox: path.join(
    root,
    "apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro"
  ),
  priceEngine: path.join(
    root,
    "apps/pfotentechnik/src/domain/price/engine.ts"
  ),
  existingTest: path.join(
    root,
    "apps/pfotentechnik/test/comparison-score-price-3.3.4.test.mjs"
  ),
  newTest: path.join(
    root,
    "apps/pfotentechnik/test/price-alignment-consistency-13.1.0.test.mjs"
  ),
  report: path.join(
    root,
    "apps/pfotentechnik/reports/design-system/price-alignment-consistency-13.1.0.md"
  )
};

for (const [key, file] of Object.entries(files)) {
  if (key === "newTest" || key === "report") continue;
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
  const before = fs.existsSync(file) ? read(file) : null;
  if (before === content) return false;

  if (!CHECK_ONLY) {
    if (before != null) backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }

  return true;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripMarkedBlock(content, start, end) {
  const pattern = new RegExp(
    `${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\s*`,
    "g"
  );
  return content.replace(pattern, "").trimEnd();
}

function appendMarkedBlock(content, start, end, block) {
  const cleaned = stripMarkedBlock(content, start, end);
  return `${cleaned}\n\n${start}\n${block.trim()}\n${end}\n`;
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

  const lineStart = content.lastIndexOf("\n", start) + 1;

  const replacement = `        <tr class="comparison-table__signal-row" data-comparison-row data-has-differences="true">
          <th scope="row">
            <strong>Aktueller Preis</strong>
          </th>
          {products.map((product) => {
            const price = getPriceDisplay(product.price);
            return (
              <td data-label={product.title} data-product-column={product.slug}>
                <div class="comparison-table-price">
                  <strong>{price.amountLabel ?? (price.url ? "Beim Händler prüfen" : "Keine Angabe")}</strong>
                </div>
              </td>
            );
          })}
        </tr>`;

  return content.slice(0, lineStart) + replacement + content.slice(end + endTag.length);
}

function moveMobilePriceToActions(content) {
  const priceTag = "<ComparisonPriceSignal price={product.price} />";
  const occurrences = content.split(priceTag).length - 1;

  if (occurrences === 0) {
    fail("Anker nicht gefunden: ComparisonPriceSignal in ComparisonMobileCards.astro");
  }

  let next = content.replace(
    /^\s*<ComparisonPriceSignal price=\{product\.price\} \/>\s*$/gm,
    ""
  );

  const dlStart = next.indexOf('<dl class="comparison-mobile-product__values">');
  const dlEnd = dlStart === -1 ? -1 : next.indexOf("</dl>", dlStart);
  const actionsStart = dlEnd === -1
    ? -1
    : next.indexOf('<div class="comparison-mobile-product__actions">', dlEnd);

  if (dlStart === -1 || dlEnd === -1 || actionsStart === -1) {
    fail("Die mobile Merkmalsliste oder der CTA-Bereich konnte nicht sicher gefunden werden.");
  }

  const actionsLineStart = next.lastIndexOf("\n", actionsStart) + 1;

  next =
    next.slice(0, actionsLineStart) +
    `        ${priceTag}\n\n` +
    next.slice(actionsLineStart);

  return next.replace(/\n{3,}/g, "\n\n");
}

function patchPriceEngine(content) {
  if (
    /maximumFractionDigits:\s*Number\.isInteger\(amount\)\s*\?\s*0\s*:\s*2/.test(content)
  ) {
    return content;
  }

  const legacy = /const moneyFormatter = \(currency: string\) =>\s*\n\s*new Intl\.NumberFormat\("de-DE", \{\s*\n\s*style: "currency",\s*\n\s*currency,\s*\n\s*maximumFractionDigits: 0\s*\n\s*\}\);/;

  if (!legacy.test(content)) {
    fail("Anker nicht gefunden: gerundeter Preisformatierer in price/engine.ts");
  }

  return content.replace(
    legacy,
    `// PT_PRICE_PRECISION_13_1_0: dieselbe Cent-Logik wie im Vergleich.\nconst moneyFormatter = (currency: string) => ({\n  format: (amount: number) =>\n    new Intl.NumberFormat("de-DE", {\n      style: "currency",\n      currency,\n      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2\n    }).format(amount)\n});`
  );
}

function patchExistingTest(content) {
  let next = content;

  next = next.replace(
    /\s*assert\.match\(files\[0\], \/Zuletzt geprüft\/\);\s*assert\.match\(files\[2\], \/Aktueller Preis\/\);/,
    `\n\n  for (const source of files) {\n    assert.doesNotMatch(source, /Zuletzt geprüft|Preisstand|letzter Prüfstand/i);\n  }\n  assert.match(files[2], /Aktueller Preis/);`
  );

  if (/assert\.match\(files\[0\], \/Zuletzt geprüft\//.test(next)) {
    fail("Veraltete Test-Erwartung 'Zuletzt geprüft' konnte nicht ersetzt werden.");
  }

  return next;
}

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
---

{hasSignal && (
  <div
    class:list={[
      "comparison-price-signal",
      \`comparison-price-signal--\${variant}\`
    ]}
  >
    <span class="comparison-price-signal__label">{label}</span>
    <strong class="comparison-price-signal__amount">
      {display.amountLabel ?? "Beim Händler prüfen"}
    </strong>
  </div>
)}

<style>
  .comparison-price-signal {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    min-width: 0;
    align-items: baseline;
    gap: .5rem 1rem;
    padding: .85rem 0;
    border-top: 1px solid var(--comparison-line);
    color: var(--comparison-text);
    background: transparent;
  }

  .comparison-price-signal__label {
    min-width: 0;
    color: var(--comparison-muted);
    font-size: .72rem;
    font-weight: 800;
    letter-spacing: .05em;
    line-height: 1.3;
    text-transform: uppercase;
  }

  .comparison-price-signal__amount {
    min-width: 0;
    color: var(--comparison-text);
    font-size: 1.15rem;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
    line-height: 1.18;
    text-align: right;
    white-space: nowrap;
  }

  .comparison-price-signal--standard {
    padding: 1rem 0 .25rem;
  }

  .comparison-price-signal--standard .comparison-price-signal__amount {
    font-size: clamp(1.65rem, 5vw, 2rem);
    letter-spacing: -.025em;
  }

  @media (max-width: 22rem) {
    .comparison-price-signal {
      gap: .45rem .65rem;
    }

    .comparison-price-signal__amount {
      font-size: 1.05rem;
    }
  }
</style>
`;

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
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: baseline;
    gap: 8px 18px;
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
    text-align: right;
  }

  .px2-price__amount {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0;
    border-top: 1px solid var(--px2-border);
    border-bottom: 1px solid var(--px2-border);
    text-align: right;
  }

  .px2-price__amount strong {
    max-width: 100%;
    color: var(--px2-text);
    font-size: clamp(1.8rem, 7vw, 2.4rem);
    font-weight: 950;
    font-variant-numeric: tabular-nums;
    line-height: 1.05;
    letter-spacing: -.035em;
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
    color: var(--px2-muted);
    font-size: .76rem;
    line-height: 1.45;
  }
</style>
`;

const recommendationStart = "<!-- PT_PRICE_ALIGNMENT_13_1_0_START -->";
const recommendationEnd = "<!-- PT_PRICE_ALIGNMENT_13_1_0_END -->";
const recommendationOverride = `<style is:global>
  .recommendation-grid .recommendation-card {
    display: flex !important;
    flex-direction: column !important;
  }

  .recommendation-grid .recommendation-card > .comparison-price-signal {
    width: 100% !important;
    margin-top: auto !important;
  }
</style>`;

const premiumStart = "/* PT_PRICE_ALIGNMENT_13_1_0_START */";
const premiumEnd = "/* PT_PRICE_ALIGNMENT_13_1_0_END */";
const premiumOverride = `.comparison-table-price {
  display: grid;
  justify-items: end;
  gap: 0;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.comparison-table-price strong {
  white-space: nowrap;
}`;

const newTest = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

test("price metadata is hidden and amounts are right aligned", async () => {
  const [signal, productBox, table] = await Promise.all([
    read("packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro"),
    read("apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro"),
    read("packages/affiliate-core/src/components/comparison/ComparisonTable.astro")
  ]);

  for (const source of [signal, productBox, table]) {
    assert.doesNotMatch(source, /Zuletzt geprüft|Preisstand|letzter Prüfstand/i);
  }

  assert.match(signal, /grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(signal, /text-align:\s*right/);
  assert.match(productBox, /justify-content:\s*flex-end/);
  assert.match(productBox, /text-align:\s*right/);
});

test("product and comparison price formatters preserve the same cents", async () => {
  const [engine, comparisonPrice] = await Promise.all([
    read("apps/pfotentechnik/src/domain/price/engine.ts"),
    read("packages/affiliate-core/src/comparison/price.ts")
  ]);

  const centsRule = /maximumFractionDigits:\s*Number\.isInteger\(amount\)\s*\?\s*0\s*:\s*2/;
  assert.match(engine, centsRule);
  assert.match(comparisonPrice, centsRule);
});

test("list prices sit directly above their CTAs", async () => {
  const [mobileCards, recommendationGrid] = await Promise.all([
    read("packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro"),
    read("packages/affiliate-core/src/components/comparison/RecommendationGrid.astro")
  ]);

  const valuesEnd = mobileCards.indexOf("</dl>");
  const price = mobileCards.indexOf("<ComparisonPriceSignal price={product.price} />");
  const actions = mobileCards.indexOf('<div class="comparison-mobile-product__actions">');

  assert.ok(valuesEnd !== -1 && price > valuesEnd && actions > price);
  assert.match(recommendationGrid, /flex-direction:\s*column\s*!important/);
  assert.match(recommendationGrid, /margin-top:\s*auto\s*!important/);
});
`;

const report = `# Price Alignment & Consistency 13.1.0

- Preisbeträge in Produktbox, Vergleichskarten und Vergleichstabelle rechts ausgerichtet.
- Öffentliche Datumszeilen wie „Zuletzt geprüft“ aus der Preis-UI entfernt.
- Produktseite und Vergleich verwenden dieselbe Cent-Formatierung.
- Preise in mobilen Produktlisten stehen direkt oberhalb der CTA-Zeile.
- Empfehlungskarten halten Preis und CTAs am Kartenende.
- Light Mode und Dark Mode bleiben über die bestehenden Design-Tokens gekoppelt.
`;

const outputs = {
  priceSignal: canonicalPriceSignal,
  productPriceBox: canonicalProductPriceBox,
  priceEngine: patchPriceEngine(read(files.priceEngine)),
  mobileCards: moveMobilePriceToActions(read(files.mobileCards)),
  comparisonTable: replacePriceTableRow(read(files.comparisonTable)),
  recommendationGrid: appendMarkedBlock(
    read(files.recommendationGrid),
    recommendationStart,
    recommendationEnd,
    recommendationOverride
  ),
  premiumCss: appendMarkedBlock(
    read(files.premiumCss),
    premiumStart,
    premiumEnd,
    premiumOverride
  ),
  existingTest: patchExistingTest(read(files.existingTest)),
  newTest,
  report
};

const publicPriceFiles = [
  outputs.priceSignal,
  outputs.productPriceBox,
  outputs.comparisonTable
];

for (const source of publicPriceFiles) {
  if (/Zuletzt geprüft|Preisstand|letzter Prüfstand/i.test(source)) {
    fail("Datumsmetadaten sind weiterhin in der öffentlichen Preis-UI enthalten.");
  }
}

if (!/maximumFractionDigits:\s*Number\.isInteger\(amount\)\s*\?\s*0\s*:\s*2/.test(outputs.priceEngine)) {
  fail("Die gemeinsame Cent-Formatierung wurde nicht hergestellt.");
}

const changed = [];
for (const [key, content] of Object.entries(outputs)) {
  const file = files[key];
  if (write(file, content)) changed.push(relative(file));
}

if (CHECK_ONLY) {
  log(changed.length ? `Würde ${changed.length} Datei(en) ändern:` : "Keine Änderungen erforderlich.");
  for (const file of changed) console.log(`- ${file}`);
  process.exit(0);
}

if (changed.length === 0) {
  log("Bereits vollständig installiert. Keine Änderungen erforderlich.");
  process.exit(0);
}

log(`${changed.length} Datei(en) aktualisiert:`);
for (const file of changed) console.log(`- ${file}`);
log(`Backups: ${relative(backupRoot)}`);

function run(command, commandArgs) {
  const executable = process.platform === "win32" && command === "npm"
    ? "npm.cmd"
    : command;
  const result = spawnSync(executable, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    console.error(`[${NAME}] Prozessfehler: ${result.error.message}`);
  }

  return result.status === 0;
}

if (!NO_TESTS) {
  log("Führe Preis-UI-Tests aus …");
  const testsOk = run("node", [
    "--test",
    "apps/pfotentechnik/test/comparison-score-price-3.3.4.test.mjs",
    "apps/pfotentechnik/test/price-alignment-consistency-13.1.0.test.mjs"
  ]);
  if (!testsOk) fail("Preis-UI-Tests fehlgeschlagen. Backups liegen unter .patch-backups.");
}

if (!NO_BUILD) {
  log("Führe PfotenTechnik-Build aus …");
  if (!run("npm", ["run", "build:pfotentechnik"])) {
    fail("Build fehlgeschlagen. Backups liegen unter .patch-backups.");
  }
}

if (COMMIT) {
  log("Erstelle lokalen Git-Commit …");
  const paths = changed.filter((file) => !file.startsWith(".patch-backups/"));
  if (!run("git", ["add", "--", ...paths])) {
    fail("git add fehlgeschlagen.");
  }
  if (!run("git", ["commit", "-m", "fix(pfotentechnik): align and unify price display"])) {
    fail("git commit fehlgeschlagen.");
  }
}

log("Abgeschlossen.");
