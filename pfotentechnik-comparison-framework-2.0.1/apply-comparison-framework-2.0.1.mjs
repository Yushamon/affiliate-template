#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const packageRoot = path.dirname(new URL(import.meta.url).pathname);
const generatorPath = path.join(repoRoot, "apps/pfotentechnik/scripts/generate-water-fountain-comparisons.mjs");
const engineSource = path.join(packageRoot, "payload/apps/pfotentechnik/src/domain/comparison/waterFountainRecommendationEngine.mjs");
const engineTarget = path.join(repoRoot, "apps/pfotentechnik/src/domain/comparison/waterFountainRecommendationEngine.mjs");

function fail(message) {
  console.error(`[Comparison Framework 2.0.1] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(generatorPath)) fail(`Generator nicht gefunden: ${generatorPath}`);
if (!fs.existsSync(engineSource)) fail(`Payload nicht gefunden: ${engineSource}`);

const original = fs.readFileSync(generatorPath, "utf8");
let next = original;

const importLine = `import {
  buildWaterFountainRecommendations,
  renderScenarioRecommendationMarkdown
} from "../src/domain/comparison/waterFountainRecommendationEngine.mjs";
`;

if (!next.includes("waterFountainRecommendationEngine.mjs")) {
  const anchor = `import process from "node:process";`;
  if (!next.includes(anchor)) fail("Import-Anker nicht gefunden.");
  next = next.replace(anchor, `${anchor}\n\n${importLine}`);
}

const oldWinner = `  const winner = [...products].sort((a, b) => b.rating - a.rating)[0];
  const alternative = [...products].sort((a, b) => b.rating - a.rating)[1];`;

const newWinner = `  const scenarioRecommendations = buildWaterFountainRecommendations(products, audience);
  const winner = scenarioRecommendations.overall[0]?.product ?? products[0];
  const alternative = scenarioRecommendations.overall[1]?.product ?? products[1];`;

if (next.includes(oldWinner)) {
  next = next.replace(oldWinner, newWinner);
} else if (!next.includes("buildWaterFountainRecommendations(products, audience)")) {
  fail("Gewinnerlogik-Anker nicht gefunden.");
}

const contentAnchor = `## Material und Hygiene`;
const injected = `\${renderScenarioRecommendationMarkdown(scenarioRecommendations, audience)}

## Material und Hygiene`;

if (!next.includes("renderScenarioRecommendationMarkdown(scenarioRecommendations, audience)")) {
  const index = next.indexOf(contentAnchor);
  if (index < 0) fail("Inhaltsanker nicht gefunden.");
  next = next.slice(0, index) + injected + next.slice(index + contentAnchor.length);
}

const backupDir = path.join(repoRoot, ".comparison-framework-2.0.1-backup");
fs.mkdirSync(path.dirname(engineTarget), { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });

fs.writeFileSync(
  path.join(backupDir, "generate-water-fountain-comparisons.mjs"),
  original,
  "utf8"
);
fs.copyFileSync(engineSource, engineTarget);
fs.writeFileSync(generatorPath, next, "utf8");

console.log("[Comparison Framework 2.0.1] Installation erfolgreich.");
console.log("Geändert:");
console.log("- apps/pfotentechnik/scripts/generate-water-fountain-comparisons.mjs");
console.log("- apps/pfotentechnik/src/domain/comparison/waterFountainRecommendationEngine.mjs");
console.log("");
console.log("Jetzt ausführen:");
console.log("node ./apps/pfotentechnik/scripts/generate-water-fountain-comparisons.mjs --write --force");
console.log("npm run build:pfotentechnik");
