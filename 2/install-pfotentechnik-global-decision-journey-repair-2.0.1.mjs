#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-global-decision-journey-repair-2.0.1";
const here = path.dirname(fileURLToPath(import.meta.url));
const payloadRoot = path.join(here, "payload");

function findRepoRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) throw new Error("Repository-Root nicht gefunden.");
    current = parent;
  }
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function backup(repoRoot, backupRoot, file) {
  if (!fs.existsSync(file)) return;
  const target = path.join(backupRoot, path.relative(repoRoot, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function count(source, pattern) {
  return source.match(pattern)?.length ?? 0;
}

function dedupeImport(source, importStatement) {
  const escaped = importStatement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  source = source.replace(new RegExp(`^${escaped}\\r?\\n`, "gm"), "");
  return source;
}

function ensureImport(source, importStatement, anchors) {
  source = dedupeImport(source, importStatement);
  const anchor = anchors.find((candidate) => source.includes(candidate));
  if (!anchor) throw new Error(`Kein Import-Anker gefunden: ${importStatement}`);
  return source.replace(anchor, `${anchor}\n${importStatement}`);
}

function removeComponents(source, componentName) {
  return source.replace(
    new RegExp(`\\s*<${componentName}\\b[\\s\\S]*?\\/>\\s*`, "g"),
    "\n",
  );
}

function ensureJourneyBlock(source, block, strategies, label) {
  source = removeComponents(source, "DecisionJourney");
  for (const strategy of strategies) {
    if (!strategy.pattern.test(source)) continue;
    source = strategy.after
      ? source.replace(strategy.pattern, `$1${block}`)
      : source.replace(strategy.pattern, `${block}$1`);
    console.log(`[${PATCH_ID}] ${label}: ${strategy.label}`);
    return source;
  }
  throw new Error(`${label}: kein sicherer Journey-Einfügepunkt gefunden.`);
}

function validateTemplate(source, label) {
  if (count(source, /import DecisionJourney/g) !== 1) {
    throw new Error(`${label}: DecisionJourney-Import nicht exakt einmal vorhanden.`);
  }
  if (count(source, /import \{ findJourneyEntry, toJourneyEntries \}/g) !== 1) {
    throw new Error(`${label}: Adapter-Import nicht exakt einmal vorhanden.`);
  }
  if (count(source, /<DecisionJourney/g) !== 1) {
    throw new Error(`${label}: DecisionJourney-Komponente nicht exakt einmal vorhanden.`);
  }
  if (count(source, /const journeyEntries = toJourneyEntries/g) !== 1) {
    throw new Error(`${label}: journeyEntries nicht exakt einmal vorhanden.`);
  }
  if (count(source, /const currentJourneyEntry = findJourneyEntry/g) !== 1) {
    throw new Error(`${label}: currentJourneyEntry nicht exakt einmal vorhanden.`);
  }
  if (/FeederIntentJourney/.test(source)) {
    throw new Error(`${label}: alte Feeder-Komponente noch referenziert.`);
  }
}

const repoRoot = findRepoRoot(process.cwd());
const appRoot = path.join(repoRoot, "apps", "pfotentechnik");
const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

const pageFile = path.join(appRoot, "src", "pages", "[slug].astro");
const comparisonFile = path.join(appRoot, "src", "pages", "vergleiche", "[comparison].astro");
const productFile = path.join(appRoot, "src", "pages", "produkt", "[product].astro");
const packageFile = path.join(appRoot, "package.json");

const obsolete = [
  path.join(appRoot, "src", "components", "FeederIntentJourney.astro"),
  path.join(appRoot, "src", "domain", "seo", "feederIntentMatrix.ts"),
  path.join(appRoot, "scripts", "seo", "audit-feeder-intent.mjs"),
  path.join(appRoot, "test", "feeder-intent.test.mjs"),
];

for (const file of [
  pageFile,
  comparisonFile,
  productFile,
  packageFile,
  ...obsolete,
  ...walk(payloadRoot).map((source) =>
    path.join(repoRoot, path.relative(payloadRoot, source)),
  ),
]) {
  backup(repoRoot, backupRoot, file);
}

for (const source of walk(payloadRoot)) {
  const relative = path.relative(payloadRoot, source);
  const target = path.join(repoRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`[${PATCH_ID}] Geschrieben: ${relative}`);
}

/* Ratgeber: normalisiert eine eventuell bereits erfolgreiche Teiländerung. */
let page = fs.readFileSync(pageFile, "utf8");
page = page
  .replace(/^import FeederIntentJourney.*\r?\n/gm, "")
  .replace(/\s*<FeederIntentJourney\b[\s\S]*?\/>\s*/g, "\n");

page = ensureImport(
  page,
  'import DecisionJourney from "../components/DecisionJourney.astro";',
  [
    'import DecisionNextSteps from "../components/DecisionNextSteps.astro";',
    'import ConversionJourney from "../components/ConversionJourney.astro";',
  ],
);
page = ensureImport(
  page,
  'import { findJourneyEntry, toJourneyEntries } from "../domain/decisionJourney/adapters";',
  [
    'import { buildMoneyPageNextSteps } from "../domain/recommendationLinks";',
    'import { assembleContentPage } from "../domain/contentPlatform";',
    'import { getCachedImage } from "../lib/imageOptimization";',
  ],
);

page = page
  .replace(/^const journeyEntries = toJourneyEntries.*\r?\n/gm, "")
  .replace(/^const currentJourneyEntry = findJourneyEntry.*\r?\n/gm, "");

const pageDataPattern =
  /(const \[[^\]]*\bpages\b[^\]]*\bproducts\b[^\]]*\bcomparisons\b[^\]]*\] = await Promise\.all\(\[[\s\S]*?\]\);\r?\n)/;
if (!pageDataPattern.test(page)) {
  throw new Error("Ratgeber: Promise.all-Datenblock nicht gefunden.");
}
page = page.replace(
  pageDataPattern,
  `$1const journeyEntries = toJourneyEntries({ pages, comparisons, products });\nconst currentJourneyEntry = findJourneyEntry(journeyEntries, "page", page.data.slug);\n`,
);
page = ensureJourneyBlock(
  page,
  `\n    <DecisionJourney current={currentJourneyEntry} entries={journeyEntries} />\n\n`,
  [
    {
      label: "vor DecisionNextSteps",
      pattern: /(\r?\n\s*\{\s*\r?\n\s*isRecommendationPage\s*&&\s*moneyPageNextSteps\.length)/,
    },
    {
      label: "nach Content",
      pattern: /(<Content\s*\/>\s*\r?\n\s*<\/AutoLinkContent>\s*\r?\n)/,
      after: true,
    },
  ],
  "Ratgeber",
);
validateTemplate(page, "Ratgeber");
fs.writeFileSync(pageFile, page, "utf8");

/* Produkt: normalisiert die bereits erfolgreiche Teiländerung. */
let product = fs.readFileSync(productFile, "utf8");
product = ensureImport(
  product,
  'import DecisionJourney from "../../components/DecisionJourney.astro";',
  [
    'import DecisionNextSteps from "../../components/DecisionNextSteps.astro";',
    'import RelatedArticles from "@affiliate-core/components/RelatedArticles.astro";',
  ],
);
product = ensureImport(
  product,
  'import { findJourneyEntry, toJourneyEntries } from "../../domain/decisionJourney/adapters";',
  [
    'import { buildProductNextSteps } from "../../domain/recommendationLinks";',
    'import { getCachedImage } from "../../lib/imageOptimization";',
  ],
);
product = product
  .replace(/^const journeyEntries = toJourneyEntries.*\r?\n/gm, "")
  .replace(/^const currentJourneyEntry = findJourneyEntry.*\r?\n/gm, "");

const productDataPattern =
  /(const \[allProducts, pages, comparisons, manufacturers\]\s*=\s*\r?\n?\s*await Promise\.all\(\[[\s\S]*?\]\);\r?\n)/;
if (!productDataPattern.test(product)) {
  throw new Error("Produkt: Promise.all-Datenblock nicht gefunden.");
}
product = product.replace(
  productDataPattern,
  `$1const journeyEntries = toJourneyEntries({ pages, comparisons, products: allProducts });\nconst currentJourneyEntry = findJourneyEntry(journeyEntries, "product", contentProduct.slug);\n`,
);
product = ensureJourneyBlock(
  product,
  `\n    <DecisionJourney current={currentJourneyEntry} entries={journeyEntries} />\n\n`,
  [
    { label: "vor RelatedArticles", pattern: /(\r?\n\s*<RelatedArticles\b)/ },
    { label: "vor FAQ", pattern: /(\r?\n\s*<FAQ\b)/ },
    { label: "vor ProjectLayout-Ende", pattern: /(\r?\n\s*<\/ProjectLayout>)/ },
  ],
  "Produkt",
);
validateTemplate(product, "Produkt");
fs.writeFileSync(productFile, product, "utf8");

/* Vergleich: aktueller Repo-Datenblock:
   [products, manufacturers, pages, comparisons] */
let comparison = fs.readFileSync(comparisonFile, "utf8");
comparison = ensureImport(
  comparison,
  'import DecisionJourney from "../../components/DecisionJourney.astro";',
  [
    'import DecisionNextSteps from "../../components/DecisionNextSteps.astro";',
    'import RelatedArticles from "@affiliate-core/components/RelatedArticles.astro";',
  ],
);
comparison = ensureImport(
  comparison,
  'import { findJourneyEntry, toJourneyEntries } from "../../domain/decisionJourney/adapters";',
  [
    'import { buildComparisonNextSteps } from "../../domain/recommendationLinks";',
    'import { getCachedImage } from "../../lib/imageOptimization";',
  ],
);
comparison = comparison
  .replace(/^const journeyEntries = toJourneyEntries.*\r?\n/gm, "")
  .replace(/^const currentJourneyEntry = findJourneyEntry.*\r?\n/gm, "");

const comparisonDataPattern =
  /(const \[products, manufacturers, pages, comparisons\] = await Promise\.all\(\[[\s\S]*?\]\);\r?\n)/;
if (!comparisonDataPattern.test(comparison)) {
  throw new Error(
    "Vergleich: aktueller Promise.all-Datenblock [products, manufacturers, pages, comparisons] nicht gefunden.",
  );
}
comparison = comparison.replace(
  comparisonDataPattern,
  `$1const journeyEntries = toJourneyEntries({ pages, comparisons, products });\nconst currentJourneyEntry = findJourneyEntry(journeyEntries, "comparison", comparison.data.slug);\n`,
);
comparison = ensureJourneyBlock(
  comparison,
  `\n    <DecisionJourney current={currentJourneyEntry} entries={journeyEntries} />\n\n`,
  [
    {
      label: "vor bestehender DecisionNextSteps",
      pattern: /(\r?\n\s*<DecisionNextSteps\b)/,
    },
    { label: "vor FAQ", pattern: /(\r?\n\s*\{comparison\.faq\.length)/ },
    { label: "vor RelatedArticles", pattern: /(\r?\n\s*<RelatedArticles\b)/ },
  ],
  "Vergleich",
);
validateTemplate(comparison, "Vergleich");
fs.writeFileSync(comparisonFile, comparison, "utf8");

/* Alte Feeder-Sonderlogik und ihre Scripts endgültig entfernen. */
for (const file of obsolete) {
  if (!fs.existsSync(file)) continue;
  fs.rmSync(file);
  console.log(`[${PATCH_ID}] Entfernt: ${path.relative(repoRoot, file)}`);
}

/* Package-Scripts auf globale Namen umstellen. */
const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
for (const name of [
  "audit:feeder-intent",
  "audit:feeder-intent:strict",
  "test:feeder-intent",
]) {
  delete pkg.scripts[name];
}
pkg.scripts["audit:decision-journeys"] =
  "node --experimental-strip-types scripts/seo/audit-decision-journeys.mjs";
pkg.scripts["audit:decision-journeys:strict"] =
  "node --experimental-strip-types scripts/seo/audit-decision-journeys.mjs --strict";
pkg.scripts["test:decision-journeys"] =
  "node --test test/decision-journey.test.mjs";
fs.writeFileSync(packageFile, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

console.log("");
console.log(`[${PATCH_ID}] Reparatur abgeschlossen.`);
console.log("- Altdateien aus dem fehlerhaften 2.0.0-Payload entfernt");
console.log("- Ratgeber- und Produkt-Teilinstallation normalisiert");
console.log("- aktueller Vergleichs-Datenblock unterstützt");
console.log("- globale Scripts aktiviert");
console.log(`Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Validierung:");
console.log("npm --workspace apps/pfotentechnik run test:decision-journeys");
console.log("npm --workspace apps/pfotentechnik run audit:decision-journeys");
console.log("npm --workspace apps/pfotentechnik run audit:decision-journeys:strict");
console.log("npm --workspace apps/pfotentechnik run build");
