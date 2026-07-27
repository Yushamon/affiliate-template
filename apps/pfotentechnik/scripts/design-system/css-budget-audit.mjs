#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const appSrc = path.join(appRoot, "src");
const coreSrc = path.join(repoRoot, "packages", "affiliate-core", "src");
const baselineFile = path.join(scriptDir, "css-budget-baseline.json");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro", ".git"].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function count(text, regex) {
  return (text.match(regex) || []).length;
}

if (!fs.existsSync(baselineFile)) {
  console.error("CSS-Budget-Baseline fehlt.");
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
const cssFiles = [
  ...walk(path.join(appSrc, "styles")),
  ...walk(path.join(coreSrc, "styles")),
  ...walk(path.join(coreSrc, "components")),
].filter((file) => file.endsWith(".css"));

const current = {
  cssFiles: cssFiles.length,
  cssBytes: 0,
  importantRules: 0,
  rootBlocks: 0,
  rawHexColors: 0,
};

for (const file of cssFiles) {
  const css = fs.readFileSync(file, "utf8");
  current.cssBytes += Buffer.byteLength(css);
  current.importantRules += count(css, /!important\b/g);
  current.rootBlocks += count(css, /:root\s*\{/g);
  current.rawHexColors += count(css, /#[0-9a-fA-F]{3,8}\b/g);
}

const errors = [];
for (const [metric, limit] of Object.entries(baseline.limits)) {
  if (current[metric] > limit) {
    errors.push(
      metric + ": " + current[metric] + " überschreitet Budget " + limit
    );
  }
}

console.log("CSS-Budget:");
console.log(JSON.stringify({ current, limits: baseline.limits }, null, 2));

if (errors.length) {
  console.error("\nCSS-Budget überschritten:");
  console.error(errors.join("\n"));
  console.error(
    "\nNur nach bewusster Prüfung die Baseline aktualisieren."
  );
  process.exit(1);
}

console.log("CSS-Budget-Audit erfolgreich.");
