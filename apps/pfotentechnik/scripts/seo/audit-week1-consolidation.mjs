#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const routes = [
  {
    "from": "/vergleiche/-fuer-katzen/",
    "to": "/vergleiche/-fuer-katzen/",
    "page": "src/content/pages/vergleiche/-fuer-katzen/.md"
  },
  {
    "from": "/vergleiche/-fuer-hunde/",
    "to": "/vergleiche/-fuer-hunde/",
    "page": "src/content/pages/vergleiche/-fuer-hunde/.md"
  },
  {
    "from": "/vergleiche/-fuer-zwei-katzen/",
    "to": "/vergleiche/-fuer-zwei-katzen/",
    "page": "src/content/pages/vergleiche/-fuer-zwei-katzen/.md"
  },
  {
    "from": "/vergleiche/-fuer-nassfutter/",
    "to": "/vergleiche/-fuer-nassfutter/",
    "page": "src/content/pages/vergleiche/-fuer-nassfutter/.md"
  }
];
const errors = [];
const exts = new Set([".md", ".mdx", ".astro", ".ts", ".tsx", ".js", ".mjs", ".json", ".yml", ".yaml"]);

function walk(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".astro", ".git", ".patch-backups", "reports"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, result); else result.push(full);
  }
  return result;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
}

const redirectsPath = path.join(appRoot, "public/_redirects");
const redirects = fs.existsSync(redirectsPath) ? fs.readFileSync(redirectsPath, "utf8") : "";
for (const route of routes) {
  const page = path.join(appRoot, route.page);
  if (fs.existsSync(page)) errors.push(`Altseite existiert noch: ${route.page}`);
  for (const source of [route.from, route.from + "/"]) {
    const line = `${source} ${route.to} 301`;
    if (!redirects.split(/\r?\n/).includes(line)) errors.push(`Redirect fehlt: ${line}`);
  }
}

for (const file of walk(path.join(appRoot, "src"))) {
  const rel = path.relative(appRoot, file).replaceAll(path.sep, "/");
  if (!exts.has(path.extname(file).toLowerCase()) || rel.startsWith("src/data/seo/")) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const route of routes) {
    const pattern = new RegExp(`(^|[\s\"'\(=:])${escapeRegex(route.from)}(?:/)?(?=$|[\s\"'\)#?])`, "m");
    if (pattern.test(text)) errors.push(`Veralteter interner Link in ${rel}: ${route.from}`);
  }
}

const comparisonsDir = path.join(appRoot, "src/content/comparisons");
for (const file of walk(comparisonsDir).filter((file) => file.endsWith(".md"))) {
  const text = fs.readFileSync(file, "utf8");
  const frontmatter = text.split(/^---\s*$/m)[1] ?? "";
  const itemPart = frontmatter.match(/^items:\s*$([\s\S]*?)(?=^[A-Za-z][A-Za-z0-9_-]*:|$)/m)?.[1] ?? "";
  const slugs = [...itemPart.matchAll(/^\s{2}-\s+slug:\s*["']?([^"'\s]+)["']?/gm)].map((match) => match[1]);
  const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  if (duplicates.length) errors.push(`Doppelte items in ${path.basename(file)}: ${[...new Set(duplicates)].join(", ")}`);
}

const viewModelPath = path.join(appRoot, "src/domain/comparison/buildComparisonViewModel.ts");
const viewModel = fs.readFileSync(viewModelPath, "utf8");
if (!viewModel.includes("const explicitItems = data.items.filter")) errors.push("Runtime-Deduplizierung fehlt.");
if (!viewModel.includes("const automaticItems = explicitItems.length === 0")) errors.push("Kuratierte items sind noch nicht autoritativ.");
if (viewModel.includes("const items = [...data.items, ...automaticItems]")) errors.push("Alte Items-Zusammenführung ist noch aktiv.");

if (errors.length) {
  console.error("SEO-Woche-1-Audit fehlgeschlagen:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}
console.log("SEO-Woche-1-Audit erfolgreich: Routen konsolidiert, Altlinks entfernt, Comparison-Listen eindeutig.");
