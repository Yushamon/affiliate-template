import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const appRoot = fs.existsSync(path.join(cwd, "src", "pages", "[slug].astro"))
  ? cwd
  : path.join(cwd, "apps", "pfotentechnik");

const checks = [
  ["src/domain/recommendationLinks.ts", "buildManufacturerNextSteps"],
  ["src/pages/[slug].astro", "buildMoneyPageNextSteps"],
  ["src/pages/produkt/[product].astro", "buildProductNextSteps"],
  ["src/pages/vergleiche/[comparison].astro", "buildComparisonNextSteps"],
  ["src/pages/hersteller/[manufacturer].astro", "buildManufacturerNextSteps"]
];

const problems = [];
for (const [relative, marker] of checks) {
  const full = path.join(appRoot, relative);
  if (!fs.existsSync(full)) {
    problems.push(`Fehlende Datei: ${relative}`);
    continue;
  }
  const content = fs.readFileSync(full, "utf8");
  if (!content.includes(marker)) problems.push(`${relative}: ${marker} fehlt`);
}

if (problems.length) {
  console.error("Recommendation Engine 4.0 Audit fehlgeschlagen:");
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}

console.log("Recommendation Engine 4.0 Audit erfolgreich.");
