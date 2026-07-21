import fs from "node:fs";
import path from "node:path";

const appRoot = path.resolve("apps/pfotentechnik");
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
  const text = fs.readFileSync(full, "utf8");
  if (!text.includes(marker)) problems.push(`${relative}: ${marker} fehlt`);
}

if (problems.length) {
  console.error("Recommendation Engine 4.0 Audit fehlgeschlagen:");
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}
console.log("Recommendation Engine 4.0 Audit erfolgreich.");
