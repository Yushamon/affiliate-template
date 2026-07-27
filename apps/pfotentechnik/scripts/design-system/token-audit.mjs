#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const auditDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(auditDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const tokenFile = path.join(appRoot, "src", "styles", "pfotentechnik-design-tokens.css");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro", ".git"].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const cssFiles = [
  ...walk(path.join(appRoot, "src", "styles")),
  ...walk(path.join(repoRoot, "packages", "affiliate-core", "src", "styles")),
  ...walk(path.join(repoRoot, "packages", "affiliate-core", "src", "components")),
].filter((file) => file.endsWith(".css") && file !== tokenFile);

const watchedValues = [
  "#0f766e", "#115e59", "#14b8a6", "#2e7d32", "#3f8f50",
  "#4f46e5", "#f59e0b", "#dc2626", "#ffffff", "#fff",
  "#f8fafc", "#f7faf8", "#17211b", "#5f6f65", "#dfe7e1", "#cbd7ce",
  "0.375rem", "0.5rem", "0.75rem", "1rem", "1.25rem", "1.5rem", "999px"
];

const allowedProperties = new Set([
  "color", "background-color", "border-color", "outline-color",
  "text-decoration-color", "fill", "stroke", "border-radius",
  "border-top-left-radius", "border-top-right-radius",
  "border-bottom-left-radius", "border-bottom-right-radius"
]);

const findings = [];
const declarationRe = /(^|[;{]\s*)([a-zA-Z-]+)\s*:\s*([^;{}]+)(;?)/gm;

for (const file of cssFiles) {
  const css = fs.readFileSync(file, "utf8");
  let match;
  while ((match = declarationRe.exec(css))) {
    const property = match[2].toLowerCase();
    if (!allowedProperties.has(property)) continue;
    const value = match[3].replace(/\s*!important\s*$/, "").trim().toLowerCase();
    if (watchedValues.includes(value)) {
      findings.push(`${path.relative(repoRoot, file)}: ${property}: ${value}`);
    }
  }
}

if (findings.length) {
  console.error("Nicht tokenisierte Standardwerte gefunden:");
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log("Design-Token-Audit erfolgreich.");
