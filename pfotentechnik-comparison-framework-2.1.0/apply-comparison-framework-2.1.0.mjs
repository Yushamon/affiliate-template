#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repo = process.cwd();
const packageRoot = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));
const backupRoot = path.join(repo, ".comparison-framework-2.1.0-backup");

const paths = {
  schema: "apps/pfotentechnik/src/content/schema/comparison.ts",
  model: "packages/affiliate-core/src/comparison/model.ts",
  viewModel: "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts",
  page: "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro"
};

function fail(message) {
  console.error(`[Comparison Framework 2.1.0] ${message}`);
  process.exit(1);
}
function read(relative) {
  const file = path.join(repo, relative);
  if (!fs.existsSync(file)) fail(`Datei nicht gefunden: ${relative}`);
  return fs.readFileSync(file, "utf8");
}
function backup(relative, content) {
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}
function write(relative, content) {
  const target = path.join(repo, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}
function copyPayload(relative) {
  const source = path.join(packageRoot, "payload", relative);
  if (!fs.existsSync(source)) fail(`Payload fehlt: ${relative}`);
  write(relative, fs.readFileSync(source, "utf8"));
}
function replaceOnce(source, oldText, newText, label) {
  if (!source.includes(oldText)) fail(`Anker nicht gefunden: ${label}`);
  return source.replace(oldText, newText);
}

fs.mkdirSync(backupRoot, { recursive: true });

let schema = read(paths.schema);
backup(paths.schema, schema);
if (!schema.includes("automaticRecommendations:")) {
  schema = replaceOnce(
    schema,
    `    recommendation:
      comparisonResultSchema,

    tableTitle:`,
    `    automaticRecommendations: z
      .object({
        enabled: z.boolean().default(false),
        scenarios: z
          .array(
            z.object({
              key: z.string(),
              label: z.string()
            })
          )
          .optional()
      })
      .optional(),

    recommendation:
      comparisonResultSchema,

    tableTitle:`,
    "Comparison Schema"
  );
}
write(paths.schema, schema);

let model = read(paths.model);
backup(paths.model, model);
if (!model.includes("scenarioRecommendations:")) {
  model = replaceOnce(
    model,
    `  initialVisibleProducts: number;
  verdict: {`,
    `  initialVisibleProducts: number;
  scenarioRecommendations: Array<{
    key: string;
    label: string;
    score: number;
    reason: string;
    winner: ComparisonProduct;
    alternative?: ComparisonProduct;
  }>;
  verdict: {`,
    "Comparison ViewModel Type"
  );
}
write(paths.model, model);

let vm = read(paths.viewModel);
backup(paths.viewModel, vm);
if (!vm.includes('from "./recommendationEngine"')) {
  vm = replaceOnce(
    vm,
    `import petTechHeroImage from "../../assets/images/project/pfotentechnik/pet-tech-hero.webp";`,
    `import petTechHeroImage from "../../assets/images/project/pfotentechnik/pet-tech-hero.webp";
import { buildAutomaticRecommendations } from "./recommendationEngine";`,
    "ViewModel Import"
  );
}
if (!vm.includes("const automaticRecommendation = buildAutomaticRecommendations")) {
  vm = replaceOnce(
    vm,
    `  const items = [...data.items, ...automaticItems];

  const getCriterionValue`,
    `  const items = [...data.items, ...automaticItems];

  const automaticRecommendation = buildAutomaticRecommendations({
    comparison,
    products,
    itemSlugs: items
      .filter((item) => item.type === "product")
      .map((item) => item.slug)
  });
  const resolvedWinnerSlug =
    automaticRecommendation.winnerSlug ??
    data.recommendation.winnerSlug;
  const resolvedAlternativeSlug =
    automaticRecommendation.alternativeSlug ??
    data.recommendation.alternativeSlug;

  const getCriterionValue`,
    "Automatic Recommendation Setup"
  );
}
vm = vm.replaceAll("data.recommendation.winnerSlug", "resolvedWinnerSlug");
vm = vm.replaceAll("data.recommendation.alternativeSlug", "resolvedAlternativeSlug");
// Repair accidental self references introduced by replaceAll.
vm = vm.replace(
  "automaticRecommendation.winnerSlug ??\n    resolvedWinnerSlug;",
  "automaticRecommendation.winnerSlug ??\n    data.recommendation.winnerSlug;"
).replace(
  "automaticRecommendation.alternativeSlug ??\n    resolvedAlternativeSlug;",
  "automaticRecommendation.alternativeSlug ??\n    data.recommendation.alternativeSlug;"
)
if (!vm.includes("const scenarioRecommendations = automaticRecommendation.scenarios")) {
  vm = replaceOnce(
    vm,
    `  const recommendations = [
    winner,`,
    `  const scenarioRecommendations = automaticRecommendation.scenarios
    .map((scenario) => {
      const scenarioWinner = views.find(
        (product) => product.slug === scenario.winnerSlug
      );
      if (!scenarioWinner) return null;

      return {
        key: scenario.key,
        label: scenario.label,
        score: scenario.score,
        reason: scenario.reason,
        winner: scenarioWinner,
        alternative: views.find(
          (product) => product.slug === scenario.alternativeSlug
        )
      };
    })
    .filter((scenario): scenario is NonNullable<typeof scenario> =>
      scenario !== null
    );

  const recommendations = [
    winner,`,
    "Scenario View Models"
  );
}
vm = replaceOnce(
  vm,
  `    initialVisibleProducts: 5,
    verdict: {
      title: data.recommendation.title,
      text: data.recommendation.text,`,
  `    initialVisibleProducts: 5,
    scenarioRecommendations,
    verdict: {
      title: automaticRecommendation.title,
      text: automaticRecommendation.text,`,
  "ViewModel Return"
);
write(paths.viewModel, vm);

let page = read(paths.page);
backup(paths.page, page);
if (!page.includes("ScenarioRecommendations.astro")) {
  page = replaceOnce(
    page,
    `import ComparisonShell from "@affiliate-core/components/comparison/ComparisonShell.astro";`,
    `import ComparisonShell from "@affiliate-core/components/comparison/ComparisonShell.astro";
import ScenarioRecommendations from "../../components/comparison/ScenarioRecommendations.astro";`,
    "Page Component Import"
  );
}
if (!page.includes("<ScenarioRecommendations scenarios={model.scenarioRecommendations} />")) {
  page = replaceOnce(
    page,
    `    <ComparisonShell model={model} />

    <article class="comparison-content">`,
    `    <ComparisonShell model={model} />

    <ScenarioRecommendations scenarios={model.scenarioRecommendations} />

    <article class="comparison-content">`,
    "Page Component"
  );
}
write(paths.page, page);

copyPayload("apps/pfotentechnik/src/domain/comparison/recommendationEngine.ts");
copyPayload("apps/pfotentechnik/src/components/comparison/ScenarioRecommendations.astro");
copyPayload("apps/pfotentechnik/scripts/migrate-comparison-framework-2.1.mjs");

console.log("[Comparison Framework 2.1.0] Kernsystem installiert.");
console.log("");
console.log("1. Migration als Vorschau:");
console.log("node ./apps/pfotentechnik/scripts/migrate-comparison-framework-2.1.mjs");
console.log("");
console.log("2. Bestehende Vergleiche migrieren:");
console.log("node ./apps/pfotentechnik/scripts/migrate-comparison-framework-2.1.mjs --write");
console.log("");
console.log("3. Build:");
console.log("npm run build:pfotentechnik");
