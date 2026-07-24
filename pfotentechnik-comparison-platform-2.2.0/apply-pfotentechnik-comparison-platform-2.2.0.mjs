#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-platform-2.2.0";
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--check") || args.has("--dry-run");

const FILES = {"scripts/comparison-platform/audit.mjs": "import fs from \"node:fs\";\nimport path from \"node:path\";\nimport {\n  COMPARISON_DIR,\n  PRODUCT_DIR,\n  MANUFACTURER_DIR,\n  REPORT_DIR,\n  loadEntries,\n  slugOf,\n  issue,\n  ensureReportDir,\n  collectMarkdownLinks\n} from \"./core.mjs\";\n\nconst CATEGORY_WEIGHTS = {\n  integrity: 4,\n  structure: 2,\n  content: 0.4,\n  coverage: 0.2,\n  metadata: 0.15\n};\n\nconst ERROR_CODES = new Set([\n  \"COMPARISON_TITLE_MISSING\",\n  \"COMPARISON_TYPE_MISSING\",\n  \"COMPARISON_GROUP_MISSING\",\n  \"COMPARISON_ITEMS_TOO_FEW\",\n  \"RECOMMENDATION_MISSING\",\n  \"ITEM_SLUG_MISSING\",\n  \"ITEM_DUPLICATE\",\n  \"PRODUCT_REFERENCE_BROKEN\",\n  \"PRODUCT_MANUFACTURER_MISSING\",\n  \"MANUFACTURER_REFERENCE_BROKEN\",\n  \"PRODUCT_HERO_MISSING\",\n  \"WINNER_NOT_IN_ITEMS\",\n  \"ALTERNATIVE_NOT_IN_ITEMS\",\n  \"RECOMMENDATION_DUPLICATE\"\n]);\n\nfunction categoryFor(code) {\n  if ([\n    \"PRODUCT_REFERENCE_BROKEN\",\n    \"MANUFACTURER_REFERENCE_BROKEN\",\n    \"WINNER_NOT_IN_ITEMS\",\n    \"ALTERNATIVE_NOT_IN_ITEMS\",\n    \"ITEM_DUPLICATE\",\n    \"RECOMMENDATION_DUPLICATE\",\n    \"PRODUCT_HERO_MISSING\",\n    \"PRODUCT_MANUFACTURER_MISSING\"\n  ].includes(code)) return \"integrity\";\n\n  if ([\n    \"COMPARISON_TITLE_MISSING\",\n    \"COMPARISON_TYPE_MISSING\",\n    \"COMPARISON_GROUP_MISSING\",\n    \"COMPARISON_ITEMS_TOO_FEW\",\n    \"RECOMMENDATION_MISSING\",\n    \"ITEM_SLUG_MISSING\"\n  ].includes(code)) return \"structure\";\n\n  if ([\n    \"TABLE_TITLE_MISSING\",\n    \"CARDS_TITLE_MISSING\",\n    \"HERO_IMAGE_MISSING\",\n    \"FAQ_THIN\",\n    \"CRITERIA_THIN\",\n    \"UNKNOWN_VALUE_KEY\",\n    \"VALUE_MISSING\",\n    \"BODY_PRODUCT_LINK_BROKEN\"\n  ].includes(code)) return \"content\";\n\n  if (code === \"PRODUCT_NOT_COVERED\") return \"coverage\";\n  if (code === \"COMPARISON_DATA_MISSING\" || code === \"PRODUCT_INACTIVE\") return \"metadata\";\n  return \"content\";\n}\n\nfunction severityFor(code) {\n  return ERROR_CODES.has(code) ? \"error\" : \"warning\";\n}\n\nfunction addIssue(issues, code, entry, message, details = {}) {\n  const level = severityFor(code);\n  issues.push({\n    ...issue(level, code, entry, message, details),\n    category: categoryFor(code)\n  });\n}\n\nfunction uniqueIssues(issues) {\n  const seen = new Set();\n  return issues.filter((item) => {\n    const key = [\n      item.level,\n      item.code,\n      item.file,\n      item.itemSlug || \"\",\n      item.criterionKey || \"\",\n      item.message\n    ].join(\"|\");\n    if (seen.has(key)) return false;\n    seen.add(key);\n    return true;\n  });\n}\n\nfunction scoreReport(issues, coverage) {\n  let penalty = 0;\n\n  for (const item of issues) {\n    const weight = CATEGORY_WEIGHTS[item.category] ?? 0.4;\n    penalty += item.level === \"error\" ? weight : weight * 0.35;\n  }\n\n  if (coverage < 80) penalty += (80 - coverage) * 0.12;\n\n  return Math.max(0, Math.round(100 - Math.min(100, penalty)));\n}\n\nfunction summarizeByCode(issues) {\n  const counts = new Map();\n  for (const item of issues) counts.set(item.code, (counts.get(item.code) || 0) + 1);\n  return [...counts.entries()]\n    .map(([code, count]) => ({ code, count, category: categoryFor(code), level: severityFor(code) }))\n    .sort((a, b) => {\n      if (a.level !== b.level) return a.level === \"error\" ? -1 : 1;\n      return b.count - a.count || a.code.localeCompare(b.code);\n    });\n}\n\nfunction summarizeByFile(issues) {\n  const counts = new Map();\n  for (const item of issues) {\n    if (!item.file) continue;\n    const current = counts.get(item.file) || { file: item.file, errors: 0, warnings: 0, total: 0 };\n    current[item.level === \"error\" ? \"errors\" : \"warnings\"]++;\n    current.total++;\n    counts.set(item.file, current);\n  }\n  return [...counts.values()].sort((a, b) => b.errors - a.errors || b.total - a.total || a.file.localeCompare(b.file));\n}\n\nfunction auditComparison(c, context, issues) {\n  const { productBySlug, manufacturerBySlug, usedProducts } = context;\n  const d = c.data;\n  const items = Array.isArray(d.items) ? d.items : [];\n  const criteria = Array.isArray(d.criteria) ? d.criteria : [];\n  const criterionKeys = new Set(criteria.map((x) => x?.key).filter(Boolean));\n\n  if (!d.title) addIssue(issues, \"COMPARISON_TITLE_MISSING\", c, \"title fehlt.\");\n  if (!d.comparisonType) addIssue(issues, \"COMPARISON_TYPE_MISSING\", c, \"comparisonType fehlt.\");\n  if (!d.group) addIssue(issues, \"COMPARISON_GROUP_MISSING\", c, \"group fehlt.\");\n  if (items.length < 2) addIssue(issues, \"COMPARISON_ITEMS_TOO_FEW\", c, \"Mindestens zwei items sind erforderlich.\", { count: items.length });\n  if (!d.recommendation || typeof d.recommendation !== \"object\") addIssue(issues, \"RECOMMENDATION_MISSING\", c, \"recommendation fehlt.\");\n  if (!d.tableTitle) addIssue(issues, \"TABLE_TITLE_MISSING\", c, \"tableTitle fehlt.\");\n  if (!d.cardsTitle) addIssue(issues, \"CARDS_TITLE_MISSING\", c, \"cardsTitle fehlt.\");\n  if (!d.heroImage) addIssue(issues, \"HERO_IMAGE_MISSING\", c, \"heroImage fehlt.\");\n  if (!Array.isArray(d.faq) || d.faq.length < 3) addIssue(issues, \"FAQ_THIN\", c, \"Weniger als drei FAQ-Einträge.\");\n  if (criteria.length < 3) addIssue(issues, \"CRITERIA_THIN\", c, \"Weniger als drei Vergleichskriterien.\", { count: criteria.length });\n\n  const seen = new Set();\n\n  for (const item of items) {\n    const slug = item?.slug;\n\n    if (!slug) {\n      addIssue(issues, \"ITEM_SLUG_MISSING\", c, \"Ein item besitzt keinen slug.\");\n      continue;\n    }\n\n    if (seen.has(slug)) addIssue(issues, \"ITEM_DUPLICATE\", c, \"Produkt \" + slug + \" ist doppelt enthalten.\", { itemSlug: slug });\n    seen.add(slug);\n\n    if (item.type === \"product\") {\n      usedProducts.add(slug);\n      const product = productBySlug.get(slug);\n\n      if (!product) {\n        addIssue(issues, \"PRODUCT_REFERENCE_BROKEN\", c, \"Produkt \" + slug + \" existiert nicht.\", { itemSlug: slug });\n      } else {\n        const status = product.data.productStatus;\n        if (status === \"legacy\" || status === \"discontinued\") {\n          addIssue(issues, \"PRODUCT_INACTIVE\", c, slug + \" hat Status \" + status + \".\", { itemSlug: slug });\n        }\n\n        const manufacturerSlug = product.data.manufacturer?.slug;\n        if (!manufacturerSlug) {\n          addIssue(issues, \"PRODUCT_MANUFACTURER_MISSING\", product, \"manufacturer.slug fehlt.\");\n        } else if (!manufacturerBySlug.has(manufacturerSlug)) {\n          addIssue(issues, \"MANUFACTURER_REFERENCE_BROKEN\", product, \"Hersteller \" + manufacturerSlug + \" existiert nicht.\", { manufacturerSlug });\n        }\n\n        if (!product.data.images?.hero) addIssue(issues, \"PRODUCT_HERO_MISSING\", product, \"images.hero fehlt.\");\n        if (!product.data.comparisonData) addIssue(issues, \"COMPARISON_DATA_MISSING\", product, \"comparisonData fehlt.\");\n      }\n    }\n\n    const values = item?.values && typeof item.values === \"object\" ? item.values : {};\n\n    for (const key of Object.keys(values)) {\n      if (criterionKeys.size && !criterionKeys.has(key)) {\n        addIssue(issues, \"UNKNOWN_VALUE_KEY\", c, \"values.\" + key + \" besitzt kein passendes criterion.\", {\n          itemSlug: slug,\n          criterionKey: key\n        });\n      }\n    }\n\n    for (const key of criterionKeys) {\n      if (!(key in values)) {\n        addIssue(issues, \"VALUE_MISSING\", c, slug + \": Wert für \" + key + \" fehlt.\", {\n          itemSlug: slug,\n          criterionKey: key\n        });\n      }\n    }\n  }\n\n  const winner = d.recommendation?.winnerSlug;\n  const alternative = d.recommendation?.alternativeSlug;\n\n  if (winner && !seen.has(winner)) addIssue(issues, \"WINNER_NOT_IN_ITEMS\", c, \"winnerSlug \" + winner + \" ist nicht in items.\");\n  if (alternative && !seen.has(alternative)) addIssue(issues, \"ALTERNATIVE_NOT_IN_ITEMS\", c, \"alternativeSlug \" + alternative + \" ist nicht in items.\");\n  if (winner && alternative && winner === alternative) addIssue(issues, \"RECOMMENDATION_DUPLICATE\", c, \"winnerSlug und alternativeSlug sind identisch.\");\n\n  for (const link of collectMarkdownLinks(c.body)) {\n    const pathOnly = link.split(/[?#]/)[0];\n    if (!pathOnly.startsWith(\"/produkt/\")) continue;\n    const slug = pathOnly.replace(/^\\/produkt\\//, \"\").replace(/\\/$/, \"\");\n    if (slug && !productBySlug.has(slug)) {\n      addIssue(issues, \"BODY_PRODUCT_LINK_BROKEN\", c, \"Markdown-Link auf unbekanntes Produkt: \" + link);\n    }\n  }\n}\n\nfunction auditProductCoverage(products, context, issues) {\n  const { manufacturerBySlug, usedProducts } = context;\n\n  for (const p of products) {\n    const slug = slugOf(p);\n\n    if (p.data.productStatus === \"active\" && !usedProducts.has(slug)) {\n      addIssue(issues, \"PRODUCT_NOT_COVERED\", p, \"Aktives Produkt kommt in keiner Vergleichsseite vor.\");\n    }\n\n    const manufacturerSlug = p.data.manufacturer?.slug;\n    if (manufacturerSlug && !manufacturerBySlug.has(manufacturerSlug)) {\n      addIssue(issues, \"MANUFACTURER_REFERENCE_BROKEN\", p, \"Hersteller \" + manufacturerSlug + \" existiert nicht.\");\n    }\n  }\n}\n\nfunction createMarkdownReport(report) {\n  const lines = [\n    \"# Comparison Platform Report\",\n    \"\",\n    \"Erstellt: \" + report.generatedAt,\n    \"\",\n    \"## Übersicht\",\n    \"\",\n    \"- Vergleiche: \" + report.summary.comparisons,\n    \"- Produkte: \" + report.summary.products,\n    \"- Hersteller: \" + report.summary.manufacturers,\n    \"- verwendete Produkte: \" + report.summary.usedProducts,\n    \"- Produktabdeckung: \" + report.summary.productCoveragePercent + \" %\",\n    \"- Qualitätsscore: \" + report.summary.qualityScore + \"/100\",\n    \"- Fehler: \" + report.summary.errors,\n    \"- Warnungen: \" + report.summary.warnings,\n    \"\",\n    \"## Häufigste Befunde\",\n    \"\"\n  ];\n\n  if (report.byCode.length) {\n    for (const item of report.byCode.slice(0, 30)) {\n      lines.push(\"- **\" + item.code + \"**: \" + item.count + \" (\" + item.level + \", \" + item.category + \")\");\n    }\n  } else {\n    lines.push(\"Keine Befunde.\");\n  }\n\n  lines.push(\"\", \"## Dateien mit den meisten Problemen\", \"\");\n\n  if (report.byFile.length) {\n    for (const item of report.byFile.slice(0, 30)) {\n      lines.push(\"- `\" + item.file + \"`: \" + item.errors + \" Fehler, \" + item.warnings + \" Warnungen\");\n    }\n  } else {\n    lines.push(\"Keine betroffenen Dateien.\");\n  }\n\n  lines.push(\"\", \"## Fehler\", \"\");\n  const errors = report.issues.filter((x) => x.level === \"error\");\n  lines.push(...(errors.length\n    ? errors.map((x) => \"- **\" + x.code + \"** – `\" + x.file + \"`: \" + x.message)\n    : [\"Keine Fehler.\"]));\n\n  lines.push(\"\", \"## Warnungen\", \"\");\n  const warnings = report.issues.filter((x) => x.level === \"warning\");\n  lines.push(...(warnings.length\n    ? warnings.map((x) => \"- **\" + x.code + \"** – `\" + x.file + \"`: \" + x.message)\n    : [\"Keine Warnungen.\"]));\n\n  lines.push(\"\");\n  return lines.join(\"\\n\");\n}\n\nexport function runAudit(options = {}) {\n  const comparisons = loadEntries(COMPARISON_DIR);\n  const products = loadEntries(PRODUCT_DIR);\n  const manufacturers = loadEntries(MANUFACTURER_DIR);\n\n  const context = {\n    productBySlug: new Map(products.map((entry) => [slugOf(entry), entry])),\n    manufacturerBySlug: new Map(manufacturers.map((entry) => [slugOf(entry), entry])),\n    usedProducts: new Set()\n  };\n\n  const issues = [];\n\n  for (const comparison of comparisons) auditComparison(comparison, context, issues);\n  auditProductCoverage(products, context, issues);\n\n  const deduplicatedIssues = uniqueIssues(issues);\n  const errors = deduplicatedIssues.filter((item) => item.level === \"error\");\n  const warnings = deduplicatedIssues.filter((item) => item.level === \"warning\");\n  const coverage = products.length\n    ? Math.round((context.usedProducts.size / products.length) * 1000) / 10\n    : 100;\n\n  const report = {\n    generatedAt: new Date().toISOString(),\n    version: \"2.2.0\",\n    summary: {\n      comparisons: comparisons.length,\n      products: products.length,\n      manufacturers: manufacturers.length,\n      usedProducts: context.usedProducts.size,\n      productCoveragePercent: coverage,\n      errors: errors.length,\n      warnings: warnings.length,\n      qualityScore: scoreReport(deduplicatedIssues, coverage)\n    },\n    byCode: summarizeByCode(deduplicatedIssues),\n    byFile: summarizeByFile(deduplicatedIssues),\n    comparisons: comparisons.map((entry) => ({ slug: slugOf(entry), file: entry.rel })),\n    issues: deduplicatedIssues\n  };\n\n  if (options.write !== false) {\n    ensureReportDir();\n    fs.writeFileSync(\n      path.join(REPORT_DIR, \"comparison-audit.json\"),\n      JSON.stringify(report, null, 2) + \"\\n\",\n      \"utf8\"\n    );\n    fs.writeFileSync(\n      path.join(REPORT_DIR, \"comparison-report.md\"),\n      createMarkdownReport(report),\n      \"utf8\"\n    );\n  }\n\n  return report;\n}\n\nfunction printReport(report) {\n  const s = report.summary;\n  console.log(\"Comparison Platform 2.2.0\");\n  console.log(\"Vergleiche: \" + s.comparisons + \" | Produkte: \" + s.products + \" | Abdeckung: \" + s.productCoveragePercent + \"%\");\n  console.log(\"Score: \" + s.qualityScore + \"/100 | Fehler: \" + s.errors + \" | Warnungen: \" + s.warnings);\n\n  if (report.byCode.length) {\n    console.log(\"\\nHäufigste Befunde:\");\n    for (const item of report.byCode.slice(0, 10)) {\n      console.log(\"- \" + item.code + \": \" + item.count);\n    }\n  }\n\n  if (process.env.GITHUB_ACTIONS) {\n    for (const item of report.issues) {\n      const prefix = item.level === \"error\" ? \"::error\" : \"::warning\";\n      console.log(prefix + \" file=\" + item.file + \"::\" + item.code + \": \" + item.message);\n    }\n  }\n}\n\nif (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll(\"\\\\\", \"/\"))) {\n  const strict = process.argv.includes(\"--strict\");\n  const report = runAudit();\n  printReport(report);\n\n  if (strict && (report.summary.errors || report.summary.warnings)) {\n    process.exitCode = 1;\n  }\n}\n", "scripts/comparison-platform/autofix.mjs": "import fs from \"node:fs\";\nimport { COMPARISON_DIR, loadEntries, splitFrontmatter } from \"./core.mjs\";\n\nfunction insertBeforeFrontmatterEnd(source, block) {\n  const { frontmatter, body } = splitFrontmatter(source);\n  if (!frontmatter) return null;\n  return \"---\\n\" + frontmatter.trimEnd() + \"\\n\" + block.trim() + \"\\n---\\n\\n\" + body.replace(/^\\n+/, \"\");\n}\n\nfunction fixComparison(entry) {\n  let source = entry.source;\n  const data = entry.data;\n  const additions = [];\n\n  if (!data.tableTitle) additions.push('tableTitle: \"Direkter Vergleich\"');\n  if (!data.cardsTitle) additions.push('cardsTitle: \"Produkte im Überblick\"');\n  if (!Array.isArray(data.faq)) additions.push(\"faq: []\");\n\n  if (!additions.length) return null;\n  return insertBeforeFrontmatterEnd(source, additions.join(\"\\n\"));\n}\n\nexport function runAutofix({ check = false } = {}) {\n  const entries = loadEntries(COMPARISON_DIR);\n  let changed = 0;\n\n  for (const entry of entries) {\n    const next = fixComparison(entry);\n    if (!next || next === entry.source) continue;\n\n    changed++;\n    console.log((check ? \"[check] \" : \"[fixed] \") + entry.rel);\n\n    if (!check) fs.writeFileSync(entry.file, next, \"utf8\");\n  }\n\n  console.log(\"Autofix: \" + changed + \" Datei(en) \" + (check ? \"würden geändert.\" : \"geändert.\"));\n  return { changed };\n}\n\nif (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll(\"\\\\\", \"/\"))) {\n  runAutofix({ check: process.argv.includes(\"--check\") });\n}\n", "scripts/comparison-platform/report.mjs": "import { runAudit } from \"./audit.mjs\";\nconst report = runAudit({ write: true });\nconsole.log(JSON.stringify(report.summary, null, 2));\n", "scripts/comparison-platform/integrity.mjs": "import { runAudit } from \"./audit.mjs\";\nconst report = runAudit({ write: true });\nconst integrity = report.issues.filter((item) => item.category === \"integrity\" || item.category === \"structure\");\nfor (const item of integrity) {\n  console.log(item.level.toUpperCase() + \" \" + item.code + \" \" + item.file + \": \" + item.message);\n}\nif (integrity.some((item) => item.level === \"error\")) process.exitCode = 1;\n"};

function findAppRoot(start = process.cwd()) {
  const candidates = [
    start,
    path.join(start, "apps", "pfotentechnik"),
    path.resolve(start, ".."),
    path.resolve(start, "..", "apps", "pfotentechnik")
  ];

  for (const dir of candidates) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "scripts", "comparison-platform", "core.mjs"))
    ) return dir;
  }

  throw new Error("PfotenTechnik Comparison Platform wurde nicht gefunden.");
}

const appRoot = findAppRoot();
const backupRoot = path.join(appRoot, ".patch-backups", PATCH + "-" + Date.now());

function backup(file) {
  if (!fs.existsSync(file)) return;
  const target = path.join(backupRoot, path.relative(appRoot, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\n?$/, "\n");
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n") : null;

  if (existing === normalized) return;

  if (dryRun) {
    console.log("[check] " + (existing === null ? "anlegen: " : "ersetzen: ") + path.relative(appRoot, file));
    return;
  }

  backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalized, "utf8");
  console.log((existing === null ? "[created] " : "[replaced] ") + path.relative(appRoot, file));
}

for (const [rel, content] of Object.entries(FILES)) {
  write(path.join(appRoot, rel), content);
}

const packageFile = path.join(appRoot, "package.json");
const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
pkg.scripts ||= {};

const desiredScripts = {
  "comparison:audit": "node scripts/comparison-platform/audit.mjs",
  "comparison:audit:strict": "node scripts/comparison-platform/audit.mjs --strict",
  "comparison:report": "node scripts/comparison-platform/report.mjs",
  "comparison:integrity": "node scripts/comparison-platform/integrity.mjs",
  "comparison:fix": "node scripts/comparison-platform/autofix.mjs",
  "comparison:fix:check": "node scripts/comparison-platform/autofix.mjs --check"
};

let changed = false;
for (const [key, value] of Object.entries(desiredScripts)) {
  if (pkg.scripts[key] !== value) {
    pkg.scripts[key] = value;
    changed = true;
  }
}

if (changed) write(packageFile, JSON.stringify(pkg, null, 2) + "\n");

const docs = `# Comparison Platform 2.2.0

Diese Version ersetzt die Audit-Engine vollständig und atomar.

## Befehle

\`\`\`bash
npm run comparison:audit
npm run comparison:audit:strict
npm run comparison:report
npm run comparison:integrity
npm run comparison:fix:check
npm run comparison:fix
\`\`\`

Der normale Audit liefert immer einen Report und endet erfolgreich.
Nur der strikte Audit sowie der Integrity-Check können den Prozess mit Code 1 beenden.

Der Autofix ergänzt ausschließlich sichere Standardfelder:
- tableTitle
- cardsTitle
- faq: []
`;
write(path.join(appRoot, "COMPARISON-PLATFORM-2.2.0.md"), docs);

if (dryRun) {
  console.log("\n" + PATCH + ": Vorprüfung erfolgreich. Es wurde nichts verändert.");
} else {
  console.log("\n" + PATCH + " erfolgreich installiert.");
  console.log("Backup: " + backupRoot);
  console.log("Nächster Schritt: cd apps/pfotentechnik && npm run comparison:audit");
}
