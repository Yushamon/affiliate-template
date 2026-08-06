#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-score-consistency-32.1.0";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const skipBuild = process.argv.includes("--skip-build");

const targets = {
  viewModel: path.join(app, "src", "domain", "comparison", "buildComparisonViewModel.ts"),
  dataPlatformTs: path.join(app, "src", "domain", "comparison", "comparisonDataPlatform.ts"),
  recommendationEngine: path.join(app, "src", "domain", "comparison", "recommendationEngine.ts"),
  dataPlatformMjs: path.join(app, "scripts", "comparison-platform", "data-platform.mjs"),
  test: path.join(app, "test", "comparison-score-consistency-32.1.0.test.mjs")
};

const relative = (file) => path.relative(root, file);

for (const [key, file] of Object.entries(targets)) {
  if (key === "test") continue;
  if (!fs.existsSync(file)) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${relative(file)}`);
  }
}

const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${timestamp}`);
let backupCreated = false;
const changed = [];

const ensureBackup = (file) => {
  if (!fs.existsSync(file)) return;
  const destination = path.join(backupRoot, relative(file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
  backupCreated = true;
};

const replaceOnce = (source, before, after, label) => {
  if (source.includes(after)) return source;
  if (!source.includes(before)) {
    throw new Error(`[${PATCH}] Patchanker nicht gefunden: ${label}`);
  }
  return source.replace(before, after);
};

const writeIfChanged = (file, next) => {
  const previous = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (previous === next) {
    console.log(`[${PATCH}] Unverändert: ${relative(file)}`);
    return;
  }
  ensureBackup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  changed.push(relative(file));
  console.log(`[${PATCH}] Geändert: ${relative(file)}`);
};

const patchViewModel = () => {
  const file = targets.viewModel;
  let source = fs.readFileSync(file, "utf8");

  source = replaceOnce(
    source,
    'import { buildPriceIndex } from "../price/engine";\n',
    'import { buildPriceIndex } from "../price/engine";\nimport { calculateProductScore } from "../productScore.ts";\n',
    "buildComparisonViewModel: Score-Import"
  );

  source = replaceOnce(
    source,
    '        rating:\n          product.data.score ??\n          Math.round(product.data.rating * 20),',
    '        rating:\n          calculateProductScore(product.data).score ?? 0,',
    "buildComparisonViewModel: Produktbewertung"
  );

  writeIfChanged(file, source);
};

const patchRecommendationEngine = () => {
  const file = targets.recommendationEngine;
  let source = fs.readFileSync(file, "utf8");

  source = replaceOnce(
    source,
    'import { deriveProductOperations, recommendationTieBreaker } from "../../lib/product-operations/policy.mjs";\n',
    'import { deriveProductOperations, recommendationTieBreaker } from "../../lib/product-operations/policy.mjs";\nimport { calculateProductScore } from "../productScore.ts";\n',
    "recommendationEngine: Score-Import"
  );

  source = replaceOnce(
    source,
    '  const baseScore = Number(data.score ?? Math.round(data.rating * 20));',
    '  const baseScore = calculateProductScore(data).score ?? 0;',
    "recommendationEngine: Basisbewertung"
  );

  writeIfChanged(file, source);
};

const patchDataPlatformTs = () => {
  const file = targets.dataPlatformTs;
  let source = fs.readFileSync(file, "utf8");

  source = replaceOnce(
    source,
    'import type { CollectionEntry } from "astro:content";\n',
    'import type { CollectionEntry } from "astro:content";\nimport { calculateProductScore } from "../productScore.ts";\n',
    "comparisonDataPlatform.ts: Score-Import"
  );

  source = replaceOnce(
    source,
    '    case "score": return data.score ?? Math.round(data.rating * 20);\n    case "bewertung": return data.rating;',
    '    case "score": return calculateProductScore(data).score ?? undefined;\n    case "bewertung": return calculateProductScore(data).rating ?? undefined;',
    "comparisonDataPlatform.ts: bekannte Scorewerte"
  );

  source = replaceOnce(
    source,
    '  const normalized = normalizeKey(criterion.key);\n  const candidates = comparisonAliasCandidates(normalized, criterion.label);\n\n  for (const record of [item.overrides, item.values]) {',
    '  const normalized = normalizeKey(criterion.key);\n  const candidates = comparisonAliasCandidates(normalized, criterion.label);\n  const isScoreCriterion = candidates.has("score") || candidates.has("editorialscore");\n  const isRatingCriterion = candidates.has("bewertung") || candidates.has("rating");\n\n  // Bewertungen stammen ausschließlich aus der zentralen Produktberechnung.\n  // Vergleichsspezifische values, overrides oder Quellen dürfen sie nicht abweichend überschreiben.\n  if (product && (isScoreCriterion || isRatingCriterion)) {\n    const calculated = calculateProductScore(product.data);\n    const canonicalValue = isScoreCriterion ? calculated.score : calculated.rating;\n    const formatted = formatValue(canonicalValue ?? undefined, criterion);\n    if (formatted !== undefined) return formatted;\n  }\n\n  for (const record of [item.overrides, item.values]) {',
    "comparisonDataPlatform.ts: kanonischer Vorrang"
  );

  writeIfChanged(file, source);
};

const patchDataPlatformMjs = () => {
  const file = targets.dataPlatformMjs;
  let source = fs.readFileSync(file, "utf8");

  const scoreHelper = `\n// Spiegel der zentralen Berechnung in src/domain/productScore.ts.\n// Der Regressionstest vergleicht beide Implementierungen, damit Skript-Audits\n// und gerenderte Vergleichsseiten dieselben Werte verwenden.\nconst clampScoreValue = (value, min, max) =>\n  Math.min(max, Math.max(min, value));\n\nconst positiveScoreNumber = (value) => {\n  const parsed = Number(value);\n  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;\n};\n\nconst productCriterionValues = (ratings) =>\n  Object.values(ratings ?? {})\n    .map(Number)\n    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 5);\n\nexport const calculateProductScore = (input = {}) => {\n  const explicitScore = positiveScoreNumber(input.score);\n  if (explicitScore !== null) {\n    const score = Math.round(clampScoreValue(explicitScore <= 5 ? explicitScore * 20 : explicitScore, 0, 100));\n    return {\n      score,\n      rating: Math.round((score / 20 + Number.EPSILON) * 10) / 10,\n      criteriaCount: productCriterionValues(input.ratings).length,\n      source: "score"\n    };\n  }\n\n  const criteria = productCriterionValues(input.ratings);\n  if (criteria.length > 0) {\n    const average = criteria.reduce((sum, value) => sum + value, 0) / criteria.length;\n    return {\n      score: Math.round((average + Number.EPSILON) * 20),\n      rating: Math.round((average + Number.EPSILON) * 10) / 10,\n      criteriaCount: criteria.length,\n      source: "criteria"\n    };\n  }\n\n  const explicitRating = positiveScoreNumber(input.rating);\n  if (explicitRating !== null) {\n    const rating = clampScoreValue(explicitRating, 0, 5);\n    return {\n      score: Math.round(rating * 20),\n      rating: Math.round((rating + Number.EPSILON) * 10) / 10,\n      criteriaCount: 0,\n      source: "rating"\n    };\n  }\n\n  return {\n    score: null,\n    rating: null,\n    criteriaCount: 0,\n    source: "unrated"\n  };\n};\n`;

  if (!source.includes("export const calculateProductScore = (input = {}) =>")) {
    const anchor = 'export const normalizeKey = (value) =>\n  String(value ?? "")\n    .toLocaleLowerCase("de-DE")\n    .replaceAll("ä", "ae")\n    .replaceAll("ö", "oe")\n    .replaceAll("ü", "ue")\n    .replaceAll("ß", "ss")\n    .replace(/[^a-z0-9]/g, "");\n';
    if (!source.includes(anchor)) {
      throw new Error(`[${PATCH}] Patchanker nicht gefunden: data-platform.mjs Score-Helfer`);
    }
    source = source.replace(anchor, `${anchor}${scoreHelper}`);
  }

  source = replaceOnce(
    source,
    '    case "score": return product?.score ?? (typeof product?.rating === "number" ? Math.round(product.rating * 20) : undefined);\n    case "bewertung": return product?.rating;',
    '    case "score": return calculateProductScore(product).score ?? undefined;\n    case "bewertung": return calculateProductScore(product).rating ?? undefined;',
    "data-platform.mjs: bekannte Scorewerte"
  );

  source = replaceOnce(
    source,
    '  const normalized = normalizeKey(criterion.key);\n  const candidates = comparisonAliasCandidates(normalized, criterion.label);\n\n  for (const record of [item.overrides, item.values]) {',
    '  const normalized = normalizeKey(criterion.key);\n  const candidates = comparisonAliasCandidates(normalized, criterion.label);\n  const isScoreCriterion = candidates.has("score") || candidates.has("editorialscore");\n  const isRatingCriterion = candidates.has("bewertung") || candidates.has("rating");\n\n  if (product && (isScoreCriterion || isRatingCriterion)) {\n    const calculated = calculateProductScore(product);\n    const canonicalValue = isScoreCriterion ? calculated.score : calculated.rating;\n    const formatted = formatValue(canonicalValue ?? undefined, criterion);\n    if (formatted !== undefined) return formatted;\n  }\n\n  for (const record of [item.overrides, item.values]) {',
    "data-platform.mjs: kanonischer Vorrang"
  );

  writeIfChanged(file, source);
};

const testSource = `import test from "node:test";\nimport assert from "node:assert/strict";\nimport fs from "node:fs";\nimport path from "node:path";\nimport { fileURLToPath } from "node:url";\nimport { calculateProductScore as calculateCentralProductScore } from "../src/domain/productScore.ts";\nimport {\n  calculateProductScore as calculateScriptProductScore,\n  resolveComparisonValue\n} from "../scripts/comparison-platform/data-platform.mjs";\n\nconst ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");\nconst APP = path.join(ROOT, "apps", "pfotentechnik");\n\nconst examples = [\n  { score: 88, rating: 2.2, ratings: { a: 1, b: 2 } },\n  { score: 4.2, rating: 2.2, ratings: { a: 1, b: 2 } },\n  { rating: 3.8, ratings: { a: 3.8, b: 3.1, c: 4.0, d: 2.8, e: 2.8 } },\n  { rating: 4.1, ratings: {} },\n  { rating: 0, ratings: {} }\n];\n\ntest("Vergleichsskripte und Produktseiten berechnen denselben Score", () => {\n  for (const input of examples) {\n    assert.deepEqual(\n      calculateScriptProductScore(input),\n      calculateCentralProductScore(input)\n    );\n  }\n});\n\ntest("Vergleichswerte ignorieren abweichende Score-Overrides", () => {\n  const product = {\n    title: "Litter-Robot 5 Pro",\n    manufacturer: { name: "Whisker" },\n    rating: 3.8,\n    ratings: {\n      sicherheit: 3.8,\n      platz: 3.1,\n      reinigung: 4.0,\n      folgekosten: 2.8,\n      datenschutz: 2.8\n    },\n    comparisonData: { custom: { score: 99, bewertung: 4.9 } },\n    comparisonFilters: {},\n    specs: []\n  };\n  const item = {\n    slug: "litter-robot-5-pro",\n    values: { score: 99, bewertung: 4.9 },\n    overrides: { score: 100, bewertung: 5.0 }\n  };\n\n  assert.equal(resolveComparisonValue({\n    product,\n    item,\n    criterion: { key: "score", label: "Redaktioneller Score", format: "number" }\n  }), "66");\n\n  assert.equal(resolveComparisonValue({\n    product,\n    item,\n    criterion: { key: "bewertung", label: "Bewertung", format: "number" }\n  }), "3,3");\n});\n\ntest("Gerenderte Vergleichsansicht und Empfehlung verwenden calculateProductScore", () => {\n  const viewModel = fs.readFileSync(\n    path.join(APP, "src", "domain", "comparison", "buildComparisonViewModel.ts"),\n    "utf8"\n  );\n  const recommendation = fs.readFileSync(\n    path.join(APP, "src", "domain", "comparison", "recommendationEngine.ts"),\n    "utf8"\n  );\n  const platform = fs.readFileSync(\n    path.join(APP, "src", "domain", "comparison", "comparisonDataPlatform.ts"),\n    "utf8"\n  );\n\n  assert.match(viewModel, /calculateProductScore\\(product\\.data\\)\\.score/);\n  assert.match(recommendation, /calculateProductScore\\(data\\)\\.score/);\n  assert.match(platform, /calculateProductScore\\(product\\.data\\)/);\n  assert.doesNotMatch(viewModel, /Math\\.round\\(product\\.data\\.rating \\* 20\\)/);\n  assert.doesNotMatch(recommendation, /Math\\.round\\(data\\.rating \\* 20\\)/);\n});\n`;

const run = (command, args, options = {}) => {
  console.log(`[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options
  });
  if (result.status !== 0) {
    throw new Error(`[${PATCH}] Befehl fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`);
  }
};

patchViewModel();
patchRecommendationEngine();
patchDataPlatformTs();
patchDataPlatformMjs();
writeIfChanged(targets.test, testSource);

if (backupCreated) {
  console.log(`[${PATCH}] Backup: ${relative(backupRoot)}`);
}

run(process.execPath, ["--check", targets.dataPlatformMjs]);
run(process.execPath, ["--check", targets.test]);
run(process.execPath, [
  "--experimental-strip-types",
  "--test",
  targets.test,
  path.join(app, "test", "product-rating-calculation-28.2.0.test.mjs")
]);
run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:data:test"]);

if (!skipBuild) {
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);
} else {
  console.log(`[${PATCH}] Build übersprungen (--skip-build).`);
}

console.log(`[${PATCH}] Fertig. Geänderte Dateien: ${changed.length}`);
for (const file of changed) console.log(`- ${file}`);
