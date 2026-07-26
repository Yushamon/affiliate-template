#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compareAuditReports, formatAuditRegression } from "./lib/audit-regression.mjs";

const VERSION = "3.3.4";
const PATCH_ID = `pfotentechnik-comparison-score-price-${VERSION}`;
const packageRoot = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { repo: process.cwd(), skipValidation: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--repo") out.repo = argv[++index];
    else if (value === "--skip-validation") out.skipValidation = true;
    else if (value === "--help" || value === "-h") out.help = true;
  }
  return out;
}

function usage() {
  console.log(`PfotenTechnik Comparison Score + Price ${VERSION}

Installation:
  node install.mjs --repo C:\\hp\\Projekt\\affiliate-template

Optional:
  --skip-validation   Build, Tests und Audit nicht ausführen`);
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  usage();
  process.exit(0);
}

const repoRoot = path.resolve(args.repo);
const appRoot = path.join(repoRoot, "apps", "pfotentechnik");
const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const reportPath = path.join(appRoot, "reports", `${PATCH_ID}-report.json`);
const touched = new Map();
const created = new Set();

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function atomicWrite(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporary, content, "utf8");
  await fs.rename(temporary, file);
}

async function backup(file) {
  if (touched.has(file) || created.has(file)) return;
  if (await exists(file)) {
    const relative = path.relative(repoRoot, file);
    const destination = path.join(backupRoot, "files", relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(file, destination);
    touched.set(file, relative);
  } else {
    created.add(file);
  }
}

async function writeFile(file, content) {
  await backup(file);
  await atomicWrite(file, content);
}

async function copyPayload(relative) {
  const source = path.join(packageRoot, "payload", relative);
  const destination = path.join(repoRoot, relative);
  if (!(await exists(source))) throw new Error(`Payload fehlt: ${relative}`);
  await writeFile(destination, await fs.readFile(source, "utf8"));
}

async function updateFile(relative, updater) {
  const file = path.join(repoRoot, relative);
  if (!(await exists(file))) throw new Error(`Datei fehlt: ${relative}`);
  const current = await fs.readFile(file, "utf8");
  const eol = current.includes("\r\n") ? "\r\n" : "\n";
  const normalizedCurrent = current.replace(/\r\n/g, "\n");
  const normalizedNext = updater(normalizedCurrent);
  if (typeof normalizedNext !== "string") {
    throw new Error(`Updater lieferte keinen Text: ${relative}`);
  }
  const next = eol === "\r\n"
    ? normalizedNext.replace(/\n/g, "\r\n")
    : normalizedNext;
  if (next !== current) await writeFile(file, next);
  return next;
}

function replaceOnce(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Anker nicht gefunden: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) {
    throw new Error(`Anker nicht eindeutig: ${label}`);
  }
  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

async function rollback() {
  for (const [file, relative] of [...touched.entries()].reverse()) {
    const source = path.join(backupRoot, "files", relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.copyFile(source, file);
  }
  for (const file of [...created].reverse()) await fs.rm(file, { force: true });
}

function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Befehl fehlgeschlagen (${result.status}): ${command} ${commandArgs.join(" ")}`);
  }
}

const payloadFiles = [
  "packages/affiliate-core/src/components/EditorialScore.astro",
  "packages/affiliate-core/src/comparison/model.ts",
  "packages/affiliate-core/src/comparison/price.ts",
  "packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro",
  "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro",
  "packages/affiliate-core/src/components/comparison/ComparisonShell.astro",
  "packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro",
  "packages/affiliate-core/src/components/comparison/ComparisonTable.astro",
  "packages/affiliate-core/src/components/comparison/ComparisonVerdict.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductHero2.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductExperience2.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductGallery2.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductDecisionAssistant.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductEverydayTimeline.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductDetails2.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductAlternatives2.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductTrust2.astro",
  "apps/pfotentechnik/src/domain/productExperience/contentLists.ts",
  "apps/pfotentechnik/src/components/comparison/ScenarioRecommendations.astro",
  "apps/pfotentechnik/src/lib/price-intelligence/frontmatter-price.mjs",
  "apps/pfotentechnik/src/lib/price-intelligence/service.mjs",
  "apps/pfotentechnik/src/domain/price/adapters/contentPriceAdapter.ts",
  "apps/pfotentechnik/test/comparison-score-price-3.3.4.test.mjs",
  "apps/pfotentechnik/test/price-url-canonical-3.3.4.test.mjs",
  "apps/pfotentechnik/test/product-card-layout-restored-3.3.4.test.mjs"
];

const priceHelper = `
const toComparisonAffiliate = (
  insight: ProductPriceInsight | undefined,
  affiliate?: ComparisonProduct["affiliate"]
): ComparisonProduct["affiliate"] => {
  if (affiliate?.url) return affiliate;
  if (!insight?.affiliateUrl) return undefined;
  const source = insight.source?.label || "Händler";
  return {
    provider: insight.source?.id,
    label: \`Preis bei \${source} prüfen\`,
    url: insight.affiliateUrl,
    rel: "sponsored nofollow noopener",
    target: "_blank"
  };
};

const toComparisonPrice = (
  insight: ProductPriceInsight | undefined,
  affiliate?: ComparisonProduct["affiliate"]
): ComparisonProduct["price"] => {
  const resolvedAffiliate = toComparisonAffiliate(insight, affiliate);
  const snapshot = insight?.current != null
    ? {
        amount: insight.current,
        currency: insight.currency,
        fetchedAt: insight.checkedAt,
        assessment: insight.assessment,
        assessmentLabel: insight.assessmentLabel,
        rangeLabel: insight.formattedRange ?? undefined,
        comparisonText: insight.generatedComparisonText,
        sourceLabel: insight.source?.label
      }
    : null;

  if (snapshot && resolvedAffiliate) return { kind: "live", link: resolvedAffiliate, snapshot };
  if (snapshot) return { kind: "value-only", snapshot };
  if (resolvedAffiliate) return { kind: "link-only", link: resolvedAffiliate };
  return { kind: "hidden" };
};

`;

const comparisonCss = `

/* comparison-score-price-3.3.4 */
.comparison-shell,
.comparison-detail {
  --comparison-accent: var(--pt-theme-accent, #2e7d32);
  --comparison-accent-dark: var(--pt-theme-accent-hover, #246b2a);
}

.comparison-shell .comparison-button:not(.comparison-button--secondary),
.comparison-sticky-bar .comparison-button:not(.comparison-button--secondary) {
  border-color: var(--pt-cta-primary-bg, var(--comparison-accent)) !important;
  background: var(--pt-cta-primary-bg, var(--comparison-accent)) !important;
  color: var(--pt-cta-primary-text, #fff) !important;
  -webkit-text-fill-color: var(--pt-cta-primary-text, #fff) !important;
}

.comparison-shell .comparison-button:not(.comparison-button--secondary):hover,
.comparison-sticky-bar .comparison-button:not(.comparison-button--secondary):hover {
  border-color: var(--pt-cta-primary-bg-hover, var(--comparison-accent-dark)) !important;
  background: var(--pt-cta-primary-bg-hover, var(--comparison-accent-dark)) !important;
}

.comparison-shell .pt-score {
  --score-surface: var(--comparison-surface);
  --score-text: var(--comparison-text);
  --score-muted: var(--comparison-muted);
  --score-accent: var(--comparison-accent);
}

.recommendation-card > .comparison-price-signal {
  margin: .9rem 1.15rem 0;
}

.recommendation-card .pt-score--ring-compact {
  margin-top: auto;
  padding-top: .85rem;
  border-top: 1px solid var(--comparison-line);
}

.comparison-winner-card__copy > .pt-score {
  max-width: 430px;
  margin: .8rem 0;
}

.comparison-winner-card__copy > .comparison-price-signal {
  max-width: 560px;
  margin-block: .45rem 1rem;
}

.comparison-mobile-product > .pt-score,
.comparison-mobile-product > .comparison-price-signal {
  margin: 0 1rem 1rem;
}

.comparison-mobile-product__identity h3 a {
  color: inherit;
  text-decoration: none;
}

.comparison-table__signal-row > th,
.comparison-table__signal-row > td {
  background: color-mix(in srgb, var(--comparison-accent) 3%, var(--comparison-surface));
}

.comparison-table__signal-row .pt-score--inline {
  justify-content: center;
}

.comparison-table-price {
  display: grid;
  justify-items: center;
  gap: .2rem;
  min-width: 110px;
}

.comparison-table-price > strong {
  color: var(--comparison-text);
  font-size: .92rem;
}

.comparison-table-price > small {
  padding: .2rem .45rem;
  border-radius: 999px;
  color: var(--comparison-accent);
  background: color-mix(in srgb, var(--comparison-accent) 10%, var(--comparison-surface));
  font-weight: 850;
}

.comparison-table-price[data-price-assessment="fair"] > small { color: #8a5a00; background: #fff4d8; }
.comparison-table-price[data-price-assessment="expensive"] > small { color: #a42b20; background: #fee9e7; }
.comparison-table-price > span { color: var(--comparison-muted); font-size: .68rem; line-height: 1.3; }

.comparison-verdict__choices article > .pt-score,
.comparison-verdict__choices article > .comparison-price-signal {
  margin-block: .75rem;
}

@media (max-width: 760px) {
  .comparison-winner-card__copy > .pt-score,
  .comparison-winner-card__copy > .comparison-price-signal {
    max-width: none;
  }
}

html[data-theme="dark"] .comparison-table-price[data-price-assessment="fair"] > small,
html.dark .comparison-table-price[data-price-assessment="fair"] > small {
  color: #ffd27a;
  background: #3b2d13;
}

html[data-theme="dark"] .comparison-table-price[data-price-assessment="expensive"] > small,
html.dark .comparison-table-price[data-price-assessment="expensive"] > small {
  color: #ffaaa2;
  background: #43201f;
}
/* end comparison-score-price-3.3.4 */
`;

async function patchViewModel() {
  const relative = "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts";
  await updateFile(relative, (source) => {
    let next = source;

    if (!next.includes('from "../price/engine"')) {
      const importMarkers = [
        "type ComparisonEntry =",
        "type BuildInput =",
        "export function buildComparisonViewModel({"
      ];
      const importIndex = importMarkers
        .map((marker) => next.indexOf(marker))
        .filter((index) => index >= 0)
        .sort((left, right) => left - right)[0] ?? -1;
      if (importIndex < 0) {
        throw new Error("Importbereich der Vergleichslogik konnte nicht bestimmt werden.");
      }
      next =
        next.slice(0, importIndex) +
        'import { buildPriceIndex } from "../price/engine";\n' +
        'import type { ProductPriceInsight } from "../price/types";\n\n' +
        next.slice(importIndex);
    }

    if (!next.includes("const toComparisonPrice =")) {
      const mapperMarker = "export function buildComparisonViewModel({";
      const mapperIndex = next.indexOf(mapperMarker);
      if (mapperIndex < 0) throw new Error("Anker nicht gefunden: Price Mapper");
      next = next.slice(0, mapperIndex) + priceHelper + next.slice(mapperIndex);
    }

    if (!next.includes("const priceIndex = buildPriceIndex(products);")) {
      const indexMarkers = [
        "  const explicitItems =",
        "  const items =",
        "  const automaticItems ="
      ];
      const indexPosition = indexMarkers
        .map((marker) => next.indexOf(marker))
        .filter((index) => index >= 0)
        .sort((left, right) => left - right)[0] ?? -1;
      if (indexPosition < 0) {
        throw new Error("Anker nicht gefunden: Price Index");
      }
      next =
        next.slice(0, indexPosition) +
        "  const priceIndex = buildPriceIndex(products);\n\n" +
        next.slice(indexPosition);
    }

    if (!next.includes("const priceInsight = priceIndex.bySlug.get(item.slug);")) {
      const affiliateMarker = "      const affiliate = product.data.affiliate";
      const affiliatePosition = next.indexOf(affiliateMarker);
      if (affiliatePosition < 0) {
        throw new Error("Anker nicht gefunden: Product Affiliate");
      }
      let returnPosition = next.indexOf("\n\n      return {", affiliatePosition);
      if (returnPosition < 0) {
        returnPosition = next.indexOf("\n      return {", affiliatePosition);
      }
      if (returnPosition < 0) {
        throw new Error("Anker nicht gefunden: Product Price Insight");
      }
      next =
        next.slice(0, returnPosition) +
        "\n      const priceInsight = priceIndex.bySlug.get(item.slug);" +
        next.slice(returnPosition);
    }

    if (!next.includes("price: toComparisonPrice(priceInsight, affiliate)")) {
      const legacyPricePattern = /        price:\s*affiliate\s*\?\s*\{\s*kind:\s*["']link-only["'],\s*link:\s*affiliate\s*\}\s*:\s*\{\s*kind:\s*["']hidden["']\s*\},/m;
      if (!legacyPricePattern.test(next)) {
        throw new Error("Anker nicht gefunden: Product Price Assignment");
      }
      next = next.replace(
        legacyPricePattern,
        "        price: toComparisonPrice(priceInsight, affiliate),"
      );
    }

    return next;
  });
}

async function patchComparisonPage() {
  const relative = "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro";
  await updateFile(relative, (source) => {
    let next = source
      .replace(/^import\s+Breadcrumbs\s+from\s+["']@affiliate-core\/components\/Breadcrumbs\.astro["'];?\n/m, "")
      .replace(/\n\s*<Breadcrumbs\s+items=\{breadcrumbs\}\s*\/>\n/, "\n");

    if (!next.includes("const comparisonAdvisorText =")) {
      const modelPattern = /const model = buildComparisonViewModel\(\{\s*comparison:\s*entry,\s*products,\s*manufacturers\s*\}\);\n/m;
      const modelMatch = next.match(modelPattern);
      if (!modelMatch) throw new Error("Anker nicht gefunden: Vergleichsberater Text");
      const advisorBlock = `\nconst comparisonAdvisorDimensions = model.filters\n  .map((filter) => filter.label)\n  .slice(0, 4);\nconst comparisonAdvisorText = comparisonAdvisorDimensions.length\n  ? \`Grenze \${comparisonAdvisorDimensions.join(", ")} ein, bevor du einzelne Modelle gegenüberstellst.\`\n  : "Grenze Tierart, Nutzung, Ausstattung und Budget ein, bevor du einzelne Modelle gegenüberstellst.";\n`;
      next = next.replace(modelPattern, `${modelMatch[0]}${advisorBlock}`);
    }

    next = next.replace(
      /<AdvisorCta\s+title=["']Welche Geräteklasse passt zu deinen Anforderungen\?["']\s+text=(?:["'][^"']*["']|\{[^}]+\})\s*\/>/m,
      '<AdvisorCta title="Welche Geräteklasse passt zu deinen Anforderungen?" text={comparisonAdvisorText} />'
    );

    if (next.includes("<Breadcrumbs ")) throw new Error("Sichtbares Breadcrumb wurde nicht entfernt.");
    if (!next.includes("text={comparisonAdvisorText}")) throw new Error("Kategorieabhängiger Beratertext fehlt.");
    return next;
  });
}

async function patchComparisonCss() {
  const relative = "packages/affiliate-core/src/components/comparison/comparison-ux-polish-3.2.css";
  await updateFile(relative, (source) => {
    if (source.includes("comparison-score-price-3.3.4")) return source;
    if (/comparison-score-price-3\.3\.[123]/.test(source)) {
      return source.replaceAll(/comparison-score-price-3\.3\.[123]/g, "comparison-score-price-3.3.4");
    }
    return `${source.trimEnd()}${comparisonCss}`;
  });
}

async function patchPriceAdminPage() {
  const relative = "apps/pfotentechnik/src/pages/admin/seo/prices.astro";
  await updateFile(relative, (source) => {
    let next = source;

    next = next.replace(
      "    hasUrl: Boolean(insight?.affiliateUrl ?? entry.data.affiliate?.url),",
      "    hasUrl: Boolean(entry.data.affiliate?.url ?? insight?.affiliateUrl),"
    );
    next = next.replace(
      "    affiliateUrl: insight?.affiliateUrl ?? entry.data.affiliate?.url ?? \"\",",
      "    targetUrl: entry.data.affiliate?.url ?? insight?.affiliateUrl ?? \"\","
    );

    next = next.replace(
      "<span>Affiliate- oder Händler-URL</span>",
      "<span>Händler- oder Affiliate-Ziel</span>\n        <small>Eine URL für Preisprüfung sowie Produkt- und Vergleichs-CTA.</small>"
    );
    next = next.replace('name="affiliateUrl"', 'name="targetUrl"');
    next = next.replace('data-affiliate-url={row.affiliateUrl}', 'data-target-url={row.targetUrl}');

    next = next.replace(
      'const affiliateUrl = field<HTMLInputElement>("affiliateUrl");',
      'const targetUrl = field<HTMLInputElement>("targetUrl");'
    );
    next = next.replace(
      'if (affiliateUrl) {\n          affiliateUrl.value = button.dataset.affiliateUrl || "";\n        }',
      'if (targetUrl) {\n          targetUrl.value = button.dataset.targetUrl || "";\n        }'
    );
    next = next.replace(
      'affiliateUrl: data.get("affiliateUrl"),',
      'targetUrl: data.get("targetUrl"),'
    );
    next = next.replace(
      '`${result.title}: ${formatted} manuell hinterlegt. Seite wird neu geladen.`',
      '`${result.title}: ${formatted} manuell hinterlegt.${result.ctaUpdated ? " CTA-Ziel aktualisiert." : ""} Seite wird neu geladen.`'
    );

    if (!next.includes('name="targetUrl"')) {
      throw new Error("Einheitliches Preis-/CTA-Zielfeld konnte nicht eingebaut werden.");
    }
    if (next.includes('name="affiliateUrl"')) {
      throw new Error("Doppeltes Affiliate-URL-Feld ist noch vorhanden.");
    }
    if (!next.includes('data-target-url={row.targetUrl}')) {
      throw new Error("Manuelle Preiszeilen liefern das kanonische CTA-Ziel nicht.");
    }
    if (!next.includes('targetUrl: data.get("targetUrl")')) {
      throw new Error("Manuelles Preisformular sendet das kanonische CTA-Ziel nicht.");
    }

    return next;
  });
}

async function migrateCanonicalPriceUrls() {
  const helperPath = path.join(
    appRoot,
    "src",
    "lib",
    "price-intelligence",
    "frontmatter-price.mjs"
  );
  const { canonicalizeProductPriceUrlSource } = await import(
    `${pathToFileURL(helperPath).href}?v=${Date.now()}`
  );
  const productsDir = path.join(appRoot, "src", "content", "products");
  if (!(await exists(productsDir))) return { migrated: 0, skipped: 0 };

  const entries = await fs.readdir(productsDir, { withFileTypes: true });
  let migrated = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !/\.mdx?$/i.test(entry.name)) continue;
    const file = path.join(productsDir, entry.name);
    const current = await fs.readFile(file, "utf8");
    try {
      const next = canonicalizeProductPriceUrlSource(current, file);
      if (next !== current) {
        await writeFile(file, next);
        migrated += 1;
      }
    } catch {
      // Alte oder nicht-HTTPS-Ziele blockieren den übrigen Patch nicht.
      // Sie bleiben im Audit sichtbar und können bewusst korrigiert werden.
      skipped += 1;
    }
  }

  return { migrated, skipped };
}

async function runProductAudit() {
  const script = path.join(appRoot, "scripts", "audit-product-data.mjs");
  const report = path.join(appRoot, "reports", "product-data-audit.json");
  if (!(await exists(script))) {
    throw new Error("Produktdaten-Auditskript fehlt: apps/pfotentechnik/scripts/audit-product-data.mjs");
  }

  // Bewusst ohne --strict: Die Regressionsprüfung darunter entscheidet,
  // ob dieser Patch neue Fehler erzeugt hat. Das Audit selbst wird nicht abgeschwächt.
  run(process.execPath, [script], appRoot);
  if (!(await exists(report))) {
    throw new Error("Produktdaten-Audit hat keinen JSON-Bericht erzeugt.");
  }
  return JSON.parse(await fs.readFile(report, "utf8"));
}

async function runValidation(auditBaseline) {
  const testFiles = [
    path.join(packageRoot, "test", "audit-regression-3.3.4.test.mjs"),
    path.join(appRoot, "test", "comparison-score-price-3.3.4.test.mjs"),
    path.join(appRoot, "test", "price-url-canonical-3.3.4.test.mjs"),
    path.join(appRoot, "test", "product-card-layout-restored-3.3.4.test.mjs")
  ];
  run(process.execPath, ["--test", ...testFiles], repoRoot);

  const auditAfter = await runProductAudit();
  const auditRegression = compareAuditReports(auditBaseline, auditAfter);
  if (auditRegression.hasRegression) {
    throw new Error(
      `Der Produktdaten-Audit enthält neue Fehler durch diesen Patch:
${formatAuditRegression(auditRegression)}`
    );
  }

  if (auditRegression.afterIssues > 0) {
    console.warn(
      `[${PATCH_ID}] Produktdaten-Audit: ${auditRegression.afterIssues} bereits vorher vorhandene Fehler, keine Regression durch diesen Patch.`
    );
  } else {
    console.log(`[${PATCH_ID}] Produktdaten-Audit: 0 Fehler.`);
  }

  const appPackagePath = path.join(appRoot, "package.json");
  const rootPackagePath = path.join(repoRoot, "package.json");
  const appPackage = JSON.parse(await fs.readFile(appPackagePath, "utf8"));
  const rootPackage = await exists(rootPackagePath)
    ? JSON.parse(await fs.readFile(rootPackagePath, "utf8"))
    : { scripts: {} };

  if (appPackage.scripts?.build) {
    run("npm", ["run", "build"], appRoot);
  } else if (rootPackage.scripts?.["build:pfotentechnik"]) {
    run("npm", ["run", "build:pfotentechnik"], repoRoot);
  } else {
    throw new Error("Kein PfotenTechnik-Buildskript gefunden.");
  }

  return {
    beforeIssues: auditRegression.beforeIssues,
    afterIssues: auditRegression.afterIssues,
    regressions: auditRegression.regressions
  };
}

async function main() {
  const required = [
    path.join(appRoot, "src", "domain", "comparison", "buildComparisonViewModel.ts"),
    path.join(appRoot, "src", "pages", "vergleiche", "[comparison].astro"),
    path.join(repoRoot, "packages", "affiliate-core", "src", "components", "comparison", "ComparisonShell.astro"),
    path.join(repoRoot, "packages", "affiliate-core", "src", "components", "EditorialScore.astro"),
    path.join(appRoot, "src", "domain", "price", "engine.ts"),
    path.join(appRoot, "src", "pages", "admin", "seo", "prices.astro"),
    path.join(appRoot, "src", "components", "product-experience-2", "ProductExperience2.astro")
  ];

  for (const file of required) {
    if (!(await exists(file))) throw new Error(`Voraussetzung fehlt: ${path.relative(repoRoot, file)}`);
  }

  const auditBaseline = args.skipValidation ? null : await runProductAudit();
  let validation = null;

  try {
    await fs.mkdir(backupRoot, { recursive: true });
    for (const relative of payloadFiles) await copyPayload(relative);
    await patchViewModel();
    await patchComparisonPage();
    await patchComparisonCss();
    await patchPriceAdminPage();
    const priceUrlMigration = await migrateCanonicalPriceUrls();

    if (!args.skipValidation) validation = await runValidation(auditBaseline);

    const state = {
      patchId: PATCH_ID,
      installedAt: new Date().toISOString(),
      restoredFiles: [...touched.values()],
      createdFiles: [...created].map((file) => path.relative(repoRoot, file))
    };
    await atomicWrite(path.join(backupRoot, "install-state.json"), JSON.stringify(state, null, 2));
    await atomicWrite(reportPath, JSON.stringify({
      patchId: PATCH_ID,
      status: "ok",
      changedFiles: [...touched.values()],
      createdFiles: state.createdFiles,
      validationSkipped: args.skipValidation,
      validation,
      priceUrlMigration
    }, null, 2));

    console.log(`\n[${PATCH_ID}] Installation abgeschlossen.`);
    console.log(`Backup: ${backupRoot}`);
  } catch (error) {
    await rollback();
    if (!args.skipValidation) {
      try {
        await runProductAudit();
      } catch {
        // Der ursprüngliche Installationsfehler bleibt maßgeblich.
      }
    }
    console.error(`\n[${PATCH_ID}] Installation fehlgeschlagen. Änderungen wurden zurückgesetzt.`);
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
