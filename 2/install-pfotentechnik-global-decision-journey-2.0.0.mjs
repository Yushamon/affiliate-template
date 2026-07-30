#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-global-decision-journey-2.0.0";
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

function removeLegacy(source) {
  return source
    .replace(/^import FeederIntentJourney.*\r?\n/gm, "")
    .replace(/\s*<FeederIntentJourney\b[\s\S]*?\/>\s*/g, "\n");
}

function addImport(source, importStatement, anchors) {
  source = source.replace(
    new RegExp(`^${importStatement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\r?\\n`, "gm"),
    "",
  );
  const anchor = anchors.find((candidate) => source.includes(candidate));
  if (!anchor) throw new Error(`Kein Import-Anker gefunden für ${importStatement}`);
  return source.replace(anchor, `${anchor}\n${importStatement}`);
}

function insertOnce(source, block, strategies, name) {
  source = source.replace(/\s*<DecisionJourney\b[\s\S]*?\/>\s*/g, "\n");
  for (const strategy of strategies) {
    const match = source.match(strategy.pattern);
    if (!match) continue;
    source = strategy.after
      ? source.replace(strategy.pattern, `$1${block}`)
      : source.replace(strategy.pattern, `${block}$1`);
    console.log(`[${PATCH_ID}] ${name}: ${strategy.label}`);
    return source;
  }
  throw new Error(`Kein sicherer Einfügepunkt für ${name} gefunden.`);
}

const repoRoot = findRepoRoot(process.cwd());
const appRoot = path.join(repoRoot, "apps", "pfotentechnik");
const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

const templates = [
  path.join(appRoot, "src", "pages", "[slug].astro"),
  path.join(appRoot, "src", "pages", "vergleiche", "[comparison].astro"),
  path.join(appRoot, "src", "pages", "produkt", "[product].astro"),
];
for (const file of [...templates, path.join(appRoot, "package.json"), ...walk(payloadRoot).map((f) => path.join(repoRoot, path.relative(payloadRoot, f)))]) {
  backup(repoRoot, backupRoot, file);
}

for (const source of walk(payloadRoot)) {
  const relative = path.relative(payloadRoot, source);
  const target = path.join(repoRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`[${PATCH_ID}] Geschrieben: ${relative}`);
}

const importDecision = 'import DecisionJourney from "../components/DecisionJourney.astro";';
const importAdapters = 'import { findJourneyEntry, toJourneyEntries } from "../domain/decisionJourney/adapters";';

let page = removeLegacy(fs.readFileSync(templates[0], "utf8"));
page = addImport(page, importDecision, [
  'import DecisionNextSteps from "../components/DecisionNextSteps.astro";',
  'import ConversionJourney from "../components/ConversionJourney.astro";',
]);
page = addImport(page, importAdapters, [
  'import { buildMoneyPageNextSteps } from "../domain/recommendationLinks";',
  'import { assembleContentPage } from "../domain/contentPlatform";',
]);
if (!page.includes("const journeyEntries = toJourneyEntries")) {
  page = page.replace(
    /const \[pages, products, comparisons, manufacturers\] = await Promise\.all\(\[[\s\S]*?\]\);\r?\n/,
    (match) => `${match}const journeyEntries = toJourneyEntries({ pages, comparisons, products });\nconst currentJourneyEntry = findJourneyEntry(journeyEntries, "page", page.data.slug);\n`,
  );
}
page = insertOnce(page, `
    <DecisionJourney current={currentJourneyEntry} entries={journeyEntries} />

`, [
  { label: "vor DecisionNextSteps", pattern: /(\r?\n\s*\{\s*\r?\n\s*isRecommendationPage\s*&&\s*moneyPageNextSteps\.length)/ },
  { label: "nach Content", pattern: /(<Content\s*\/>\s*\r?\n\s*<\/AutoLinkContent>\s*\r?\n)/, after: true },
], "Ratgeber");
fs.writeFileSync(templates[0], page);

function patchTemplate(file, type, importPrefix, currentSlugExpression) {
  let source = fs.readFileSync(file, "utf8");
  const decisionImport = `import DecisionJourney from "${importPrefix}components/DecisionJourney.astro";`;
  const adapterImport = `import { findJourneyEntry, toJourneyEntries } from "${importPrefix}domain/decisionJourney/adapters";`;

  source = addImport(source, decisionImport, [
    `import DecisionNextSteps from "${importPrefix}components/DecisionNextSteps.astro";`,
    'import RelatedArticles from "@affiliate-core/components/RelatedArticles.astro";',
    `import EditorialTransparency from "${importPrefix}components/EditorialTransparency.astro";`,
  ]);
  source = addImport(source, adapterImport, [
    `import { buildProductNextSteps } from "${importPrefix}domain/recommendationLinks";`,
    `import { getCachedImage } from "${importPrefix}lib/imageOptimization";`,
    `import { getComparisons,`,
  ]);

  const hasJourneyEntries = source.includes("const journeyEntries = toJourneyEntries");
  if (!hasJourneyEntries) {
    const promisePattern = /const \[(?:allProducts|products), pages, comparisons, manufacturers\]\s*=\s*\r?\n?\s*await Promise\.all\(\[[\s\S]*?\]\);\r?\n/;
    const promiseMatch = source.match(promisePattern);
    if (promiseMatch) {
      source = source.replace(
        promisePattern,
        (match) => `${match}const journeyEntries = toJourneyEntries({ pages, comparisons, products: ${type === "product" ? "allProducts" : "products"} });\nconst currentJourneyEntry = findJourneyEntry(journeyEntries, "${type}", ${currentSlugExpression});\n`,
      );
    } else {
      throw new Error(`Daten-Anker in ${file} nicht gefunden.`);
    }
  }

  source = insertOnce(source, `
    <DecisionJourney current={currentJourneyEntry} entries={journeyEntries} />

`, [
    { label: "vor RelatedArticles", pattern: /(\r?\n\s*<RelatedArticles\b)/ },
    { label: "vor FAQ", pattern: /(\r?\n\s*<FAQ\b)/ },
    { label: "vor schließendem article", pattern: /(\r?\n\s*<\/article>)/ },
  ], type);

  fs.writeFileSync(file, source);
}

patchTemplate(
  templates[2],
  "product",
  "../../",
  "contentProduct.slug",
);

let comparison = fs.readFileSync(templates[1], "utf8");
const compDecisionImport = 'import DecisionJourney from "../../components/DecisionJourney.astro";';
const compAdapterImport = 'import { findJourneyEntry, toJourneyEntries } from "../../domain/decisionJourney/adapters";';
comparison = addImport(comparison, compDecisionImport, [
  'import RelatedArticles from "@affiliate-core/components/RelatedArticles.astro";',
  'import EditorialTransparency from "../../components/EditorialTransparency.astro";',
]);
comparison = addImport(comparison, compAdapterImport, [
  'import { getCachedImage } from "../../lib/imageOptimization";',
  'import {',
]);
if (!comparison.includes("const journeyEntries = toJourneyEntries")) {
  const patterns = [
    /const \[pages, products, comparisons, manufacturers\] = await Promise\.all\(\[[\s\S]*?\]\);\r?\n/,
    /const \[products, pages, comparisons, manufacturers\] = await Promise\.all\(\[[\s\S]*?\]\);\r?\n/,
  ];
  const pattern = patterns.find((candidate) => candidate.test(comparison));
  if (!pattern) throw new Error("Daten-Anker im Vergleichs-Template nicht gefunden.");
  comparison = comparison.replace(pattern, (match) =>
    `${match}const journeyEntries = toJourneyEntries({ pages, comparisons, products });\nconst currentJourneyEntry = findJourneyEntry(journeyEntries, "comparison", comparison.data.slug);\n`
  );
}
comparison = insertOnce(comparison, `
    <DecisionJourney current={currentJourneyEntry} entries={journeyEntries} />

`, [
  { label: "vor RelatedArticles", pattern: /(\r?\n\s*<RelatedArticles\b)/ },
  { label: "vor FAQ", pattern: /(\r?\n\s*<FAQ\b)/ },
  { label: "vor schließendem article", pattern: /(\r?\n\s*<\/article>)/ },
], "Vergleich");
fs.writeFileSync(templates[1], comparison);

for (const [file, label] of [[templates[0], "Ratgeber"], [templates[1], "Vergleich"], [templates[2], "Produkt"]]) {
  const source = fs.readFileSync(file, "utf8");
  if (count(source, /import DecisionJourney/g) !== 1) throw new Error(`${label}: Import nicht exakt einmal.`);
  if (count(source, /<DecisionJourney/g) !== 1) throw new Error(`${label}: Komponente nicht exakt einmal.`);
  if (/FeederIntentJourney/.test(source)) throw new Error(`${label}: alte Feeder-Komponente noch vorhanden.`);
}

const packageFile = path.join(appRoot, "package.json");
const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
delete pkg.scripts["audit:feeder-intent"];
delete pkg.scripts["audit:feeder-intent:strict"];
delete pkg.scripts["test:feeder-intent"];
pkg.scripts["audit:decision-journeys"] =
  "node --experimental-strip-types scripts/seo/audit-decision-journeys.mjs";
pkg.scripts["audit:decision-journeys:strict"] =
  "node --experimental-strip-types scripts/seo/audit-decision-journeys.mjs --strict";
pkg.scripts["test:decision-journeys"] =
  "node --test test/decision-journey.test.mjs";
fs.writeFileSync(packageFile, `${JSON.stringify(pkg, null, 2)}\n`);

for (const obsolete of [
  path.join(appRoot, "src", "components", "FeederIntentJourney.astro"),
  path.join(appRoot, "src", "domain", "seo", "feederIntentMatrix.ts"),
  path.join(appRoot, "scripts", "seo", "audit-feeder-intent.mjs"),
  path.join(appRoot, "test", "feeder-intent.test.mjs"),
]) {
  if (fs.existsSync(obsolete)) {
    fs.rmSync(obsolete);
    console.log(`[${PATCH_ID}] Entfernt: ${path.relative(repoRoot, obsolete)}`);
  }
}

console.log("");
console.log("Abgeschlossen:");
console.log("- globale Decision-Journey-Engine für alle Kerncluster");
console.log("- Einbau in Ratgeber, Vergleiche und Produktseiten");
console.log("- Frontmatter-first, Heuristik nur als Migration-Fallback");
console.log("- Hersteller aus dem Standardfunnel entfernt");
console.log("- Strict blockiert nur technische Defekte");
console.log("- redaktionelle Lücken als SEO-Copilot-Aufgaben");
console.log(`Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Validierung:");
console.log("npm --workspace apps/pfotentechnik run test:decision-journeys");
console.log("npm --workspace apps/pfotentechnik run audit:decision-journeys");
console.log("npm --workspace apps/pfotentechnik run audit:decision-journeys:strict");
console.log("npm --workspace apps/pfotentechnik run build");
