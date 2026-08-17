#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-product-data-coverage-migration-32.6.2";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

function frontmatter(raw) {
  if (!raw.startsWith("---")) return "";
  const end = raw.indexOf("\n---", 3);
  return end < 0 ? "" : raw.slice(3, end);
}

function scalar(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+?)["']?\\s*$`, "m"));
  return m ? m[1].trim() : "";
}

function extractInlineComparisons(fm) {
  const m = fm.match(/^comparisons:\s*\[([^\]]*)\]/m);
  if (m) return [...m[1].matchAll(/["']([^"']+)["']/g)].map(x => x[1]);
  const lines = fm.split(/\r?\n/);
  const start = lines.findIndex(l => /^comparisons:\s*$/.test(l));
  if (start < 0) return [];
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^[A-Za-z_][\w-]*:/.test(line)) break;
    const mm = line.match(/^\s*-\s*["']?([^"'#\n]+?)["']?\s*$/);
    if (mm) out.push(mm[1].trim());
  }
  return out;
}

function extractItems(fm) {
  const lines = fm.split(/\r?\n/);
  const start = lines.findIndex(l => /^items:\s*$/.test(l));
  if (start < 0) return [];
  const out = [];
  let currentType = "product";
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^[A-Za-z_][\w-]*:/.test(line)) break;
    const slug = line.match(/^\s*-\s*slug:\s*["']?([^"'#\n]+)["']?\s*$/);
    if (slug) {
      currentType = "product";
      out.push({ slug: slug[1].trim(), type: "product" });
      continue;
    }
    const type = line.match(/^\s+type:\s*["']?([^"'#\n]+)["']?\s*$/);
    if (type && out.length) out[out.length - 1].type = type[1].trim();
  }
  return out;
}

function getComparisonFilterBlock(fm) {
  const lines = fm.split(/\r?\n/);
  const inline = lines.find(l => /^comparisonFilters:\s*\{/.test(l));
  if (inline) return inline;

  const start = lines.findIndex(l => /^comparisonFilters:\s*$/.test(l));
  if (start < 0) return "";
  const acc = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z_][\w-]*:/.test(lines[i])) break;
    acc.push(lines[i]);
  }
  return acc.join("\n");
}

function arrFromBlock(block, key) {
  const m = block.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`));
  if (!m) return [];
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map(x => x[1]);
}

function boolFromBlock(block, key) {
  const m = block.match(new RegExp(`${key}:\\s*(true|false)`));
  return m ? m[1] === "true" : undefined;
}

function stringFromBlock(block, key) {
  const m = block.match(new RegExp(`${key}:\\s*["']?([^"',}\\n]+)["']?`));
  return m?.[1]?.trim();
}

function getCategoryKey(fm) {
  const inline = fm.split(/\r?\n/).find(l => /^category:\s*\{/.test(l));
  if (inline) {
    const m = inline.match(/key:\s*["']([^"']+)["']/);
    if (m) return m[1];
  }
  const lines = fm.split(/\r?\n/);
  const start = lines.findIndex(l => /^category:\s*$/.test(l));
  if (start < 0) return "";
  for (let i = start + 1; i < Math.min(start + 8, lines.length); i++) {
    const m = lines[i].match(/^\s+key:\s*["']?([^"'#\n]+)["']?/);
    if (m) return m[1].trim();
    if (/^[A-Za-z_][\w-]*:/.test(lines[i])) break;
  }
  return "";
}

function collectEvidence(raw, fm) {
  const specText = [...fm.matchAll(/label:\s*["']([^"']+)["'][^\\n]*value:\s*["']?([^"'}\\n]+)["']?/g)]
    .map(m => `${m[1]}: ${m[2]}`)
    .join(" ");
  return `${raw}\n${specText}`.toLowerCase();
}

function inferTechnicalSignals(product) {
  const evidence = product.evidence;
  const inferred = {};

  // Only positive evidence is inferred. Absence never becomes false.
  const animals = new Set(product.current.animal);
  if (/\bkatze(n|r)?\b|cat\b/.test(evidence)) animals.add("cat");
  if (/\bhund(e|en|er)?\b|dog\b/.test(evidence)) animals.add("dog");
  inferred.animal = [...animals];

  const foodTypes = new Set(product.current.foodType);
  if (/nassfutter|wet food|refrigerated|gekühlt|kühlakku|kuehlakku/.test(evidence)) foodTypes.add("wet");
  if (/trockenfutter|dry food|krokette/.test(evidence)) foodTypes.add("dry");
  inferred.foodType = [...foodTypes];

  if (product.current.camera !== undefined) inferred.camera = product.current.camera;
  else if (/ohne kamera|keine kamera/.test(evidence)) inferred.camera = false;
  else if (/kamera|camera|video/.test(evidence)) inferred.camera = true;

  if (product.current.app !== undefined) inferred.app = product.current.app;
  else if (/ohne app|keine app/.test(evidence)) inferred.app = false;
  else if (/\bapp\b|wlan|wi-fi|wifi/.test(evidence)) inferred.app = true;

  if (product.current.backupPower !== undefined) inferred.backupPower = product.current.backupPower;
  else if (/batterie[- ]?backup|notstrom|backup[- ]?power|batteriebetrieb|doppelte stromversorgung/.test(evidence)) inferred.backupPower = true;

  if (product.current.access) inferred.access = product.current.access;
  else if (/mikrochip|microchip|rfid/.test(evidence)) inferred.access = "microchip";

  return inferred;
}

function insertOrReplaceComparisonFilters(raw, fm, next) {
  const currentBlock = getComparisonFilterBlock(fm);
  const current = {
    animal: arrFromBlock(currentBlock, "animal"),
    petSize: arrFromBlock(currentBlock, "petSize"),
    foodType: arrFromBlock(currentBlock, "foodType"),
    app: boolFromBlock(currentBlock, "app"),
    camera: boolFromBlock(currentBlock, "camera"),
    backupPower: boolFromBlock(currentBlock, "backupPower"),
    access: stringFromBlock(currentBlock, "access"),
    priceTier: stringFromBlock(currentBlock, "priceTier")
  };

  // Never overwrite an explicit conflicting value.
  const conflicts = [];
  for (const key of ["app", "camera", "backupPower", "access"]) {
    if (current[key] !== undefined && next[key] !== undefined && current[key] !== next[key]) {
      conflicts.push({ key, current: current[key], inferred: next[key] });
    }
  }

  const merged = {
    animal: [...new Set([...(current.animal || []), ...(next.animal || [])])],
    petSize: current.petSize || [],
    foodType: [...new Set([...(current.foodType || []), ...(next.foodType || [])])],
    app: current.app !== undefined ? current.app : next.app,
    camera: current.camera !== undefined ? current.camera : next.camera,
    backupPower: current.backupPower !== undefined ? current.backupPower : next.backupPower,
    access: current.access || next.access,
    priceTier: current.priceTier
  };

  const lines = [];
  lines.push("comparisonFilters:");
  if (merged.animal.length) lines.push(`  animal: [${merged.animal.map(v => `"${v}"`).join(", ")}]`);
  if (merged.petSize.length) lines.push(`  petSize: [${merged.petSize.map(v => `"${v}"`).join(", ")}]`);
  if (merged.foodType.length) lines.push(`  foodType: [${merged.foodType.map(v => `"${v}"`).join(", ")}]`);
  if (merged.app !== undefined) lines.push(`  app: ${merged.app}`);
  if (merged.camera !== undefined) lines.push(`  camera: ${merged.camera}`);
  if (merged.backupPower !== undefined) lines.push(`  backupPower: ${merged.backupPower}`);
  if (merged.access) lines.push(`  access: "${merged.access}"`);
  if (merged.priceTier) lines.push(`  priceTier: "${merged.priceTier}"`);

  const block = lines.join("\n");

  const fmStart = raw.indexOf("---");
  const fmEnd = raw.indexOf("\n---", fmStart + 3);
  if (fmEnd < 0) throw new Error("Ungültiges Frontmatter.");

  let fmRaw = raw.slice(fmStart + 3, fmEnd);

  const linesFm = fmRaw.split(/\r?\n/);
  const inlineIndex = linesFm.findIndex(l => /^comparisonFilters:\s*\{/.test(l));
  if (inlineIndex >= 0) {
    linesFm[inlineIndex] = block;
    fmRaw = linesFm.join("\n");
    return { raw: raw.slice(0, fmStart + 3) + fmRaw + raw.slice(fmEnd), conflicts };
  }

  const start = linesFm.findIndex(l => /^comparisonFilters:\s*$/.test(l));
  if (start >= 0) {
    let end = start + 1;
    while (end < linesFm.length && !/^[A-Za-z_][\w-]*:/.test(linesFm[end])) end++;
    linesFm.splice(start, end - start, ...block.split("\n"));
    fmRaw = linesFm.join("\n");
    return { raw: raw.slice(0, fmStart + 3) + fmRaw + raw.slice(fmEnd), conflicts };
  }

  // Insert before comparisons if possible, otherwise before end of FM.
  const comparisonIndex = linesFm.findIndex(l => /^comparisons:/.test(l));
  const insertAt = comparisonIndex >= 0 ? comparisonIndex : linesFm.length;
  linesFm.splice(insertAt, 0, ...block.split("\n"));
  fmRaw = linesFm.join("\n");
  return { raw: raw.slice(0, fmStart + 3) + fmRaw + raw.slice(fmEnd), conflicts };
}

const root = findRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const productDir = path.join(app, "src", "content", "products");
const comparisonDir = path.join(app, "src", "content", "comparisons");
const reportDir = path.join(app, "reports", "comparison-selection");
fs.mkdirSync(reportDir, { recursive: true });

const productFiles = fs.readdirSync(productDir)
  .filter(f => f.endsWith(".md") && !f.includes(".bak"))
  .map(f => path.join(productDir, f));

const products = [];
for (const file of productFiles) {
  const raw = fs.readFileSync(file, "utf8");
  const fm = frontmatter(raw);
  const slug = scalar(fm, "slug");
  if (!slug) continue;
  const block = getComparisonFilterBlock(fm);
  products.push({
    file,
    raw,
    fm,
    slug,
    title: scalar(fm, "title") || slug,
    category: getCategoryKey(fm),
    comparisons: extractInlineComparisons(fm),
    evidence: collectEvidence(raw, fm),
    current: {
      animal: arrFromBlock(block, "animal"),
      petSize: arrFromBlock(block, "petSize"),
      foodType: arrFromBlock(block, "foodType"),
      app: boolFromBlock(block, "app"),
      camera: boolFromBlock(block, "camera"),
      backupPower: boolFromBlock(block, "backupPower"),
      access: stringFromBlock(block, "access"),
      priceTier: stringFromBlock(block, "priceTier")
    }
  });
}

const comparisonsBefore = new Map();
for (const file of fs.readdirSync(comparisonDir).filter(f => f.endsWith(".md") && !f.includes(".bak"))) {
  const full = path.join(comparisonDir, file);
  const fm = frontmatter(fs.readFileSync(full, "utf8"));
  const slug = scalar(fm, "slug") || path.basename(file, ".md");
  const visible = extractItems(fm).filter(i => i.type === "product").map(i => i.slug);
  comparisonsBefore.set(slug, visible);
}

const conflicts = [];
const changed = [];
const inferredSummary = [];

for (const product of products) {
  const inferred = inferTechnicalSignals(product);

  const additions = {};
  if (inferred.animal?.length > product.current.animal.length) additions.animal = inferred.animal;
  if (inferred.foodType?.length > product.current.foodType.length) additions.foodType = inferred.foodType;
  if (product.current.camera === undefined && inferred.camera !== undefined) additions.camera = inferred.camera;
  if (product.current.app === undefined && inferred.app !== undefined) additions.app = inferred.app;
  if (product.current.backupPower === undefined && inferred.backupPower !== undefined) additions.backupPower = inferred.backupPower;
  if (!product.current.access && inferred.access) additions.access = inferred.access;

  if (!Object.keys(additions).length) continue;

  const result = insertOrReplaceComparisonFilters(product.raw, product.fm, inferred);

  if (result.conflicts.length) {
    for (const conflict of result.conflicts) {
      conflicts.push({ slug: product.slug, ...conflict });
    }
  }

  // This migration only adds known fields. It never removes comparisons[] or changes items[].
  if (result.raw !== product.raw) {
    const backup = `${product.file}.${PATCH}.bak`;
    if (!fs.existsSync(backup)) fs.copyFileSync(product.file, backup);
    fs.writeFileSync(product.file, result.raw, "utf8");
    changed.push(path.relative(root, product.file));
    inferredSummary.push({ slug: product.slug, additions });
  }
}

// Hard invariant: no comparison file was touched and item counts remain identical.
const comparisonRegressions = [];
for (const [slug, before] of comparisonsBefore) {
  const file = path.join(comparisonDir, `${slug}.md`);
  if (!fs.existsSync(file)) continue;
  const fm = frontmatter(fs.readFileSync(file, "utf8"));
  const after = extractItems(fm).filter(i => i.type === "product").map(i => i.slug);

  if (after.length < before.length) {
    comparisonRegressions.push({ slug, before: before.length, after: after.length });
  }
}

if (comparisonRegressions.length) {
  console.error(`[${PATCH}] NO COMPARISON REGRESSION verletzt:`);
  for (const item of comparisonRegressions) {
    console.error(`- ${item.slug}: vorher ${item.before}, nachher ${item.after}`);
  }
  process.exit(1);
}

const reportLines = [
  "# Product Data Coverage Migration 32.6.2",
  "",
  `Erstellt: ${new Date().toISOString()}`,
  "",
  "## Sicherheitsregeln",
  "",
  "- Keine Comparison-MD wurde verändert.",
  "- Kein bestehendes items[]-Produkt wurde entfernt.",
  "- comparisons[] wurde nicht verändert.",
  "- Fehlende Information wurde nicht als false interpretiert.",
  "- Nur positive bzw. ausdrücklich negative Evidenz wurde übernommen.",
  "- Widersprüche überschreiben keine vorhandenen strukturierten Werte.",
  "",
  `## Ergebnis`,
  "",
  `- Produkte geprüft: ${products.length}`,
  `- Produkt-MDs ergänzt: ${changed.length}`,
  `- Konflikte: ${conflicts.length}`,
  `- Comparison-Regressions: ${comparisonRegressions.length}`,
  "",
  "## Ergänzte Produktdaten",
  ""
];

for (const item of inferredSummary) {
  reportLines.push(`### ${item.slug}`, "");
  for (const [key, value] of Object.entries(item.additions)) {
    reportLines.push(`- ${key}: ${JSON.stringify(value)}`);
  }
  reportLines.push("");
}

reportLines.push("## Konflikte", "");
if (!conflicts.length) {
  reportLines.push("Keine Konflikte erkannt.");
} else {
  for (const c of conflicts) {
    reportLines.push(`- ${c.slug}: ${c.key} · vorhanden=${JSON.stringify(c.current)} · inferred=${JSON.stringify(c.inferred)}`);
  }
}

reportLines.push(
  "",
  "## Nächster Schritt",
  "",
  "Nach dieser Migration muss der Comparison Selection Audit erneut laufen.",
  "Erst wenn die Coverage einfacher Vergleiche belastbar ist, darf eine Comparison von curated/hybrid auf ready wechseln."
);

const reportPath = path.join(reportDir, "product-data-coverage-migration-32.6.2.md");
fs.writeFileSync(reportPath, reportLines.join("\n"));

const jsonPath = path.join(reportDir, "product-data-coverage-migration-32.6.2.json");
fs.writeFileSync(jsonPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  productsChecked: products.length,
  productsChanged: changed,
  inferredSummary,
  conflicts,
  comparisonRegressions
}, null, 2));

console.log(`[${PATCH}] Produkte geprüft: ${products.length}`);
console.log(`[${PATCH}] Produkt-MDs ergänzt: ${changed.length}`);
console.log(`[${PATCH}] Konflikte: ${conflicts.length}`);
console.log(`[${PATCH}] Comparison-Regressions: ${comparisonRegressions.length}`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] JSON: ${path.relative(root, jsonPath)}`);
console.log(`[${PATCH}] NO COMPARISON REGRESSION: bestanden`);
console.log(`[${PATCH}] Fertig. Keine Comparison-MD wurde verändert.`);
