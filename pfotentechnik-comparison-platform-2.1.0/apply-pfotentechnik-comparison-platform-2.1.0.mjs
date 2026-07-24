#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-platform-2.1.0";
const FILES = {"scripts/comparison-platform/core.mjs": "import fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\n\nconst THIS_DIR = path.dirname(fileURLToPath(import.meta.url));\nexport const APP_ROOT = path.resolve(THIS_DIR, \"../..\");\nexport const CONTENT_ROOT = path.join(APP_ROOT, \"src\", \"content\");\nexport const COMPARISON_DIR = path.join(CONTENT_ROOT, \"comparisons\");\nexport const PRODUCT_DIR = path.join(CONTENT_ROOT, \"products\");\nexport const MANUFACTURER_DIR = path.join(CONTENT_ROOT, \"manufacturers\");\nexport const REPORT_DIR = path.join(APP_ROOT, \"reports\", \"comparison-platform\");\n\nexport function walk(dir, exts = [\".md\", \".mdx\"]) {\n  if (!fs.existsSync(dir)) return [];\n  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {\n    const full = path.join(dir, entry.name);\n    return entry.isDirectory()\n      ? walk(full, exts)\n      : exts.includes(path.extname(entry.name).toLowerCase()) ? [full] : [];\n  });\n}\n\nexport function splitFrontmatter(source) {\n  const normalized = source.replace(/\\r\\n/g, \"\\n\");\n  if (!normalized.startsWith(\"---\\n\")) return { frontmatter: \"\", body: normalized };\n  const end = normalized.indexOf(\"\\n---\", 4);\n  if (end < 0) return { frontmatter: \"\", body: normalized };\n  return {\n    frontmatter: normalized.slice(4, end),\n    body: normalized.slice(end + 4).replace(/^\\n/, \"\")\n  };\n}\n\nfunction scalar(raw) {\n  const value = raw.trim();\n  if (!value) return \"\";\n  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === \"true\";\n  if (/^(null|~)$/i.test(value)) return null;\n  if (/^-?\\d+(\\.\\d+)?$/.test(value)) return Number(value);\n  if ((value.startsWith('\"') && value.endsWith('\"')) || (value.startsWith(\"'\") && value.endsWith(\"'\"))) {\n    return value.slice(1, -1).replace(/\\\\\"/g, '\"');\n  }\n  if (value.startsWith(\"[\") && value.endsWith(\"]\")) {\n    return value.slice(1, -1).split(\",\").map((v) => scalar(v)).filter((v) => v !== \"\");\n  }\n  return value;\n}\n\nexport function parseYamlSubset(text) {\n  const lines = text.replace(/\\t/g, \"  \").split(\"\\n\");\n  const root = {};\n  const stack = [{ indent: -1, value: root }];\n\n  for (let i = 0; i < lines.length; i++) {\n    const raw = lines[i];\n    if (!raw.trim() || raw.trimStart().startsWith(\"#\")) continue;\n    const indent = raw.match(/^ */)[0].length;\n    const trimmed = raw.trim();\n    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();\n    const parent = stack.at(-1).value;\n\n    if (trimmed.startsWith(\"- \")) {\n      if (!Array.isArray(parent)) continue;\n      const rest = trimmed.slice(2);\n      const pair = rest.match(/^([^:]+):(.*)$/);\n      if (pair) {\n        const obj = {};\n        parent.push(obj);\n        const key = pair[1].trim();\n        const tail = pair[2].trim();\n        obj[key] = tail ? scalar(tail) : {};\n        stack.push({ indent, value: obj });\n        if (!tail) stack.push({ indent: indent + 1, value: obj[key] });\n      } else {\n        parent.push(scalar(rest));\n      }\n      continue;\n    }\n\n    const match = trimmed.match(/^([^:]+):(.*)$/);\n    if (!match || Array.isArray(parent)) continue;\n    const key = match[1].trim();\n    const tail = match[2].trim();\n    if (tail) {\n      parent[key] = scalar(tail);\n      continue;\n    }\n\n    let j = i + 1;\n    while (j < lines.length && (!lines[j].trim() || lines[j].trimStart().startsWith(\"#\"))) j++;\n    const next = lines[j] || \"\";\n    const nextIndent = next.match(/^ */)[0].length;\n    const isArray = nextIndent > indent && next.trim().startsWith(\"- \");\n    parent[key] = isArray ? [] : {};\n    stack.push({ indent, value: parent[key] });\n  }\n  return root;\n}\n\nexport function loadEntries(dir) {\n  return walk(dir).map((file) => {\n    const source = fs.readFileSync(file, \"utf8\");\n    const { frontmatter, body } = splitFrontmatter(source);\n    return {\n      file,\n      rel: path.relative(APP_ROOT, file).replaceAll(path.sep, \"/\"),\n      source,\n      body,\n      data: parseYamlSubset(frontmatter)\n    };\n  });\n}\n\nexport function slugOf(entry) {\n  return String(entry.data.slug || path.basename(entry.file).replace(/\\.mdx?$/, \"\"));\n}\nexport function issue(level, code, entry, message, details = {}) {\n  return { level, code, file: entry?.rel || null, slug: entry ? slugOf(entry) : null, message, ...details };\n}\nexport function ensureReportDir() {\n  fs.mkdirSync(REPORT_DIR, { recursive: true });\n}\nexport function collectMarkdownLinks(body) {\n  return [...body.matchAll(/\\[[^\\]]+\\]\\(([^)]+)\\)/g)]\n    .map((m) => m[1])\n    .filter((href) => href.startsWith(\"/\") && !href.startsWith(\"//\"));\n}\n", "scripts/comparison-platform/audit.mjs": "import fs from \"node:fs\";\nimport path from \"node:path\";\nimport {\n  COMPARISON_DIR, PRODUCT_DIR, MANUFACTURER_DIR, REPORT_DIR,\n  loadEntries, slugOf, issue, ensureReportDir, collectMarkdownLinks\n} from \"./core.mjs\";\n\nexport function runAudit(options = {}) {\n  const comparisons = loadEntries(COMPARISON_DIR);\n  const products = loadEntries(PRODUCT_DIR);\n  const manufacturers = loadEntries(MANUFACTURER_DIR);\n  const productBySlug = new Map(products.map((e) => [slugOf(e), e]));\n  const manufacturerBySlug = new Map(manufacturers.map((e) => [slugOf(e), e]));\n  const issues = [];\n  const usedProducts = new Set();\n\n  for (const c of comparisons) {\n    const d = c.data;\n    const items = Array.isArray(d.items) ? d.items : [];\n    const criteria = Array.isArray(d.criteria) ? d.criteria : [];\n    const criterionKeys = new Set(criteria.map((x) => x?.key).filter(Boolean));\n\n    if (!d.title) issues.push(issue(\"error\", \"COMPARISON_TITLE_MISSING\", c, \"title fehlt.\"));\n    if (!d.comparisonType) issues.push(issue(\"error\", \"COMPARISON_TYPE_MISSING\", c, \"comparisonType fehlt.\"));\n    if (!d.group) issues.push(issue(\"error\", \"COMPARISON_GROUP_MISSING\", c, \"group fehlt.\"));\n    if (items.length < 2) issues.push(issue(\"error\", \"COMPARISON_ITEMS_TOO_FEW\", c, \"Mindestens zwei items sind erforderlich.\", { count: items.length }));\n    if (!d.recommendation || typeof d.recommendation !== \"object\") issues.push(issue(\"error\", \"RECOMMENDATION_MISSING\", c, \"recommendation fehlt.\"));\n    if (!d.tableTitle) issues.push(issue(\"warning\", \"TABLE_TITLE_MISSING\", c, \"tableTitle fehlt.\"));\n    if (!d.cardsTitle) issues.push(issue(\"warning\", \"CARDS_TITLE_MISSING\", c, \"cardsTitle fehlt.\"));\n    if (!d.heroImage) issues.push(issue(\"warning\", \"HERO_IMAGE_MISSING\", c, \"heroImage fehlt.\"));\n    if (!Array.isArray(d.faq) || d.faq.length < 3) issues.push(issue(\"warning\", \"FAQ_THIN\", c, \"Weniger als drei FAQ-Einträge.\"));\n    if (criteria.length < 3) issues.push(issue(\"warning\", \"CRITERIA_THIN\", c, \"Weniger als drei Vergleichskriterien.\", { count: criteria.length }));\n\n    const seen = new Set();\n    for (const item of items) {\n      const slug = item?.slug;\n      if (!slug) {\n        issues.push(issue(\"error\", \"ITEM_SLUG_MISSING\", c, \"Ein item besitzt keinen slug.\"));\n        continue;\n      }\n      if (seen.has(slug)) issues.push(issue(\"error\", \"ITEM_DUPLICATE\", c, \"Produkt \" + slug + \" ist doppelt enthalten.\", { itemSlug: slug }));\n      seen.add(slug);\n\n      if (item.type === \"product\") {\n        usedProducts.add(slug);\n        const product = productBySlug.get(slug);\n        if (!product) {\n          issues.push(issue(\"error\", \"PRODUCT_REFERENCE_BROKEN\", c, \"Produkt \" + slug + \" existiert nicht.\", { itemSlug: slug }));\n        } else {\n          const status = product.data.productStatus;\n          if (status === \"legacy\" || status === \"discontinued\") issues.push(issue(\"warning\", \"PRODUCT_INACTIVE\", c, slug + \" hat Status \" + status + \".\", { itemSlug: slug }));\n          const manufacturerSlug = product.data.manufacturer?.slug;\n          if (!manufacturerSlug) issues.push(issue(\"error\", \"PRODUCT_MANUFACTURER_MISSING\", product, \"manufacturer.slug fehlt.\"));\n          else if (!manufacturerBySlug.has(manufacturerSlug)) issues.push(issue(\"error\", \"MANUFACTURER_REFERENCE_BROKEN\", product, \"Hersteller \" + manufacturerSlug + \" existiert nicht.\", { manufacturerSlug }));\n          if (!product.data.images?.hero) issues.push(issue(\"error\", \"PRODUCT_HERO_MISSING\", product, \"images.hero fehlt.\"));\n          if (!product.data.comparisonData) issues.push(issue(\"warning\", \"COMPARISON_DATA_MISSING\", product, \"comparisonData fehlt.\"));\n        }\n      }\n\n      const values = item?.values && typeof item.values === \"object\" ? item.values : {};\n      for (const key of Object.keys(values)) {\n        if (criterionKeys.size && !criterionKeys.has(key)) issues.push(issue(\"warning\", \"UNKNOWN_VALUE_KEY\", c, \"values.\" + key + \" besitzt kein passendes criterion.\", { itemSlug: slug, criterionKey: key }));\n      }\n      for (const key of criterionKeys) {\n        if (!(key in values)) issues.push(issue(\"warning\", \"VALUE_MISSING\", c, slug + \": Wert für \" + key + \" fehlt.\", { itemSlug: slug, criterionKey: key }));\n      }\n    }\n\n    const winner = d.recommendation?.winnerSlug;\n    const alternative = d.recommendation?.alternativeSlug;\n    if (winner && !seen.has(winner)) issues.push(issue(\"error\", \"WINNER_NOT_IN_ITEMS\", c, \"winnerSlug \" + winner + \" ist nicht in items.\"));\n    if (alternative && !seen.has(alternative)) issues.push(issue(\"error\", \"ALTERNATIVE_NOT_IN_ITEMS\", c, \"alternativeSlug \" + alternative + \" ist nicht in items.\"));\n    if (winner && alternative && winner === alternative) issues.push(issue(\"error\", \"RECOMMENDATION_DUPLICATE\", c, \"winnerSlug und alternativeSlug sind identisch.\"));\n\n    for (const link of collectMarkdownLinks(c.body)) {\n      const pathOnly = link.split(/[?#]/)[0];\n      if (pathOnly.startsWith(\"/produkt/\")) {\n        const slug = pathOnly.replace(/^\\/produkt\\//, \"\").replace(/\\/$/, \"\");\n        if (slug && !productBySlug.has(slug)) issues.push(issue(\"warning\", \"BODY_PRODUCT_LINK_BROKEN\", c, \"Markdown-Link auf unbekanntes Produkt: \" + link));\n      }\n    }\n  }\n\n  for (const p of products) {\n    const slug = slugOf(p);\n    if (p.data.productStatus === \"active\" && !usedProducts.has(slug)) issues.push(issue(\"warning\", \"PRODUCT_NOT_COVERED\", p, \"Aktives Produkt kommt in keiner Vergleichsseite vor.\"));\n    const manufacturerSlug = p.data.manufacturer?.slug;\n    if (manufacturerSlug && !manufacturerBySlug.has(manufacturerSlug)) issues.push(issue(\"error\", \"MANUFACTURER_REFERENCE_BROKEN\", p, \"Hersteller \" + manufacturerSlug + \" existiert nicht.\"));\n  }\n\n  const errors = issues.filter((i) => i.level === \"error\");\n  const warnings = issues.filter((i) => i.level === \"warning\");\n  const coverage = products.length ? Math.round((usedProducts.size / products.length) * 1000) / 10 : 100;\n  const score = Math.max(0, Math.round(100 - errors.length * 4 - warnings.length * 0.5));\n  const report = {\n    generatedAt: new Date().toISOString(),\n    version: \"2.1.0\",\n    summary: {\n      comparisons: comparisons.length,\n      products: products.length,\n      manufacturers: manufacturers.length,\n      usedProducts: usedProducts.size,\n      productCoveragePercent: coverage,\n      errors: errors.length,\n      warnings: warnings.length,\n      qualityScore: score\n    },\n    comparisons: comparisons.map((e) => ({ slug: slugOf(e), file: e.rel })),\n    issues\n  };\n\n  if (options.write !== false) {\n    ensureReportDir();\n    fs.writeFileSync(path.join(REPORT_DIR, \"comparison-audit.json\"), JSON.stringify(report, null, 2) + \"\\n\");\n    const lines = [\n      \"# Comparison Platform Report\", \"\",\n      \"Erstellt: \" + report.generatedAt, \"\",\n      \"- Vergleiche: \" + report.summary.comparisons,\n      \"- Produkte: \" + report.summary.products,\n      \"- Hersteller: \" + report.summary.manufacturers,\n      \"- Produktabdeckung: \" + report.summary.productCoveragePercent + \" %\",\n      \"- Qualitätsscore: \" + report.summary.qualityScore + \"/100\",\n      \"- Fehler: \" + errors.length,\n      \"- Warnungen: \" + warnings.length, \"\",\n      \"## Fehler\", \"\",\n      ...(errors.length ? errors.map((x) => \"- **\" + x.code + \"** – `\" + x.file + \"`: \" + x.message) : [\"Keine Fehler.\"]),\n      \"\", \"## Warnungen\", \"\",\n      ...(warnings.length ? warnings.map((x) => \"- **\" + x.code + \"** – `\" + x.file + \"`: \" + x.message) : [\"Keine Warnungen.\"]),\n      \"\"\n    ];\n    fs.writeFileSync(path.join(REPORT_DIR, \"comparison-report.md\"), lines.join(\"\\n\"));\n  }\n  return report;\n}\n\nif (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll(\"\\\\\", \"/\"))) {\n  const strict = process.argv.includes(\"--strict\");\n  const report = runAudit();\n  const s = report.summary;\n  console.log(\"Comparison Platform 2.1.0\");\n  console.log(\"Vergleiche: \" + s.comparisons + \" | Produkte: \" + s.products + \" | Abdeckung: \" + s.productCoveragePercent + \"%\");\n  console.log(\"Score: \" + s.qualityScore + \"/100 | Fehler: \" + s.errors + \" | Warnungen: \" + s.warnings);\n  if (process.env.GITHUB_ACTIONS) {\n    for (const item of report.issues) {\n      const prefix = item.level === \"error\" ? \"::error\" : \"::warning\";\n      console.log(prefix + \" file=\" + item.file + \"::\" + item.code + \": \" + item.message);\n    }\n  }\n  if (s.errors || (strict && s.warnings)) process.exitCode = 1;\n}\n", "scripts/comparison-platform/report.mjs": "import { runAudit } from \"./audit.mjs\";\nconst report = runAudit({ write: true });\nconsole.log(JSON.stringify(report.summary, null, 2));\nif (report.summary.errors) process.exitCode = 1;\n", "scripts/comparison-platform/integrity.mjs": "import { runAudit } from \"./audit.mjs\";\nconst report = runAudit({ write: true });\nconst codes = new Set([\n  \"PRODUCT_REFERENCE_BROKEN\", \"MANUFACTURER_REFERENCE_BROKEN\",\n  \"WINNER_NOT_IN_ITEMS\", \"ALTERNATIVE_NOT_IN_ITEMS\",\n  \"ITEM_DUPLICATE\", \"RECOMMENDATION_DUPLICATE\", \"PRODUCT_HERO_MISSING\"\n]);\nconst relevant = report.issues.filter((x) => codes.has(x.code));\nfor (const x of relevant) console.log(x.level.toUpperCase() + \" \" + x.code + \" \" + x.file + \": \" + x.message);\nif (relevant.some((x) => x.level === \"error\")) process.exitCode = 1;\n", "scripts/comparison-platform/metadata.mjs": "import fs from \"node:fs\";\nimport { PRODUCT_DIR, loadEntries, splitFrontmatter } from \"./core.mjs\";\n\nfunction quote(value) {\n  if (typeof value === \"boolean\" || typeof value === \"number\") return String(value);\n  return JSON.stringify(String(value));\n}\nexport function deriveComparisonData(data) {\n  const result = {};\n  if (data.gps && typeof data.gps === \"object\") {\n    result.gps = {\n      animal: data.gps.animal || [],\n      minimumPetWeightKg: data.gps.minimumPetWeightKg,\n      deviceWeightGrams: data.gps.deviceWeightGrams,\n      subscriptionRequired: data.gps.subscriptionRequired,\n      transmission: data.gps.transmission,\n      batteryMaxDays: data.gps.batteryMaxDays,\n      waterproofRating: data.gps.waterproofRating,\n      liveTracking: data.gps.liveTracking,\n      virtualFence: data.gps.virtualFence,\n      activityTracking: data.gps.activityTracking\n    };\n  }\n  const f = data.comparisonFilters;\n  if (f && typeof f === \"object\") {\n    result.general = {\n      animal: f.animal || [],\n      petSize: f.petSize || [],\n      foodType: f.foodType || [],\n      app: f.app,\n      camera: f.camera,\n      access: f.access,\n      backupPower: f.backupPower,\n      reservoirLiters: f.reservoirLiters,\n      portionGrams: f.portionGrams,\n      maxPortionsPerMeal: f.maxPortionsPerMeal,\n      maxMealGrams: f.maxMealGrams,\n      kibbleMaxMm: f.kibbleMaxMm,\n      largeDogFit: f.largeDogFit,\n      priceTier: f.priceTier || data.priceCategory\n    };\n  }\n  result.editorial = {\n    rating: data.rating,\n    score: data.score,\n    priceCategory: data.priceCategory,\n    productStatus: data.productStatus\n  };\n  for (const group of Object.values(result)) {\n    for (const key of Object.keys(group)) if (group[key] === undefined) delete group[key];\n  }\n  return result;\n}\nfunction toYaml(value, indent = 0) {\n  const pad = \" \".repeat(indent);\n  if (Array.isArray(value)) {\n    if (!value.length) return \"[]\";\n    return \"\\n\" + value.map((v) => pad + \"- \" + quote(v)).join(\"\\n\");\n  }\n  if (value && typeof value === \"object\") {\n    const lines = [];\n    for (const [key, v] of Object.entries(value)) {\n      if (v && typeof v === \"object\" && !Array.isArray(v)) {\n        lines.push(pad + key + \":\");\n        lines.push(toYaml(v, indent + 2));\n      } else if (Array.isArray(v)) {\n        if (!v.length) lines.push(pad + key + \": []\");\n        else {\n          lines.push(pad + key + \":\");\n          lines.push(...v.map((item) => \" \".repeat(indent + 2) + \"- \" + quote(item)));\n        }\n      } else lines.push(pad + key + \": \" + quote(v));\n    }\n    return lines.join(\"\\n\");\n  }\n  return quote(value);\n}\nexport function migrateMetadata({ check = false } = {}) {\n  const entries = loadEntries(PRODUCT_DIR);\n  let changed = 0;\n  const skipped = [];\n  for (const entry of entries) {\n    if (entry.data.comparisonData) continue;\n    const generated = deriveComparisonData(entry.data);\n    const { frontmatter, body } = splitFrontmatter(entry.source);\n    if (!frontmatter) {\n      skipped.push(entry.rel);\n      continue;\n    }\n    const block = \"\\ncomparisonData:\\n\" + toYaml(generated, 2) + \"\\n\";\n    const next = \"---\\n\" + frontmatter.trimEnd() + block + \"---\\n\\n\" + body.replace(/^\\n+/, \"\");\n    changed++;\n    if (!check) fs.writeFileSync(entry.file, next, \"utf8\");\n    console.log((check ? \"[check] \" : \"[migrated] \") + entry.rel);\n  }\n  console.log(\"Metadata: \" + changed + \" Datei(en) \" + (check ? \"würden geändert\" : \"geändert\") + \", \" + skipped.length + \" übersprungen.\");\n  return { changed, skipped };\n}\nif (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll(\"\\\\\", \"/\"))) {\n  migrateMetadata({ check: process.argv.includes(\"--check\") });\n}\n"};
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--check") || args.has("--dry-run");
const force = args.has("--force");

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
      fs.existsSync(path.join(dir, "src", "content", "schema", "product.ts")) &&
      fs.existsSync(path.join(dir, "src", "content", "schema", "comparison.ts"))
    ) return dir;
  }
  throw new Error("PfotenTechnik-App nicht gefunden. Installer im Repository-Root oder in apps/pfotentechnik ausführen.");
}

const appRoot = findAppRoot();
const backupRoot = path.join(appRoot, ".patch-backups", PATCH + "-" + Date.now());
const changed = [];
const created = [];

function normalize(s) { return s.replace(/\r\n/g, "\n"); }
function backup(file) {
  if (!fs.existsSync(file)) return;
  const target = path.join(backupRoot, path.relative(appRoot, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
function write(file, content) {
  const normalized = normalize(content).replace(/\n?$/, "\n");
  if (fs.existsSync(file) && normalize(fs.readFileSync(file, "utf8")) === normalized) return;
  if (dryRun) {
    console.log("[check] " + (fs.existsSync(file) ? "ändern: " : "anlegen: ") + path.relative(appRoot, file));
    return;
  }
  backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const existed = fs.existsSync(file);
  fs.writeFileSync(file, normalized, "utf8");
  (existed ? changed : created).push(path.relative(appRoot, file));
}
function patchFile(file, transform, label) {
  const current = fs.readFileSync(file, "utf8");
  const next = transform(current);
  if (next === current) {
    if (force || label.includes("package.json")) {
      console.warn("[warn] " + label + ": keine Änderung erforderlich.");
      return;
    }
    throw new Error(label + ": passender Anker nicht gefunden.");
  }
  write(file, next);
}

for (const [rel, content] of Object.entries(FILES)) write(path.join(appRoot, rel), content);

const productSchema = path.join(appRoot, "src", "content", "schema", "product.ts");
patchFile(productSchema, (source) => {
  if (source.includes("const productComparisonDataSchema")) return source;
  const anchor = "const productComparisonFiltersSchema =";
  if (!source.includes(anchor)) return source;
  const schema = `const comparisonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null()
]);

const comparisonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    comparisonPrimitiveSchema,
    z.array(comparisonPrimitiveSchema),
    z.record(z.string(), comparisonValueSchema)
  ])
);

const productComparisonDataSchema = z
  .record(z.string(), comparisonValueSchema)
  .optional();

`;
  let next = source.replace(anchor, schema + anchor);
  const fieldAnchor = "    comparisonFilters:\n      productComparisonFiltersSchema";
  if (!next.includes(fieldAnchor)) return source;
  return next.replace(fieldAnchor, "    comparisonData:\n      productComparisonDataSchema,\n\n" + fieldAnchor);
}, "Product-Schema erweitern");

const packageFile = path.join(appRoot, "package.json");
patchFile(packageFile, (source) => {
  const pkg = JSON.parse(source);
  pkg.scripts ||= {};
  const additions = {
    "comparison:audit": "node scripts/comparison-platform/audit.mjs",
    "comparison:audit:strict": "node scripts/comparison-platform/audit.mjs --strict",
    "comparison:report": "node scripts/comparison-platform/report.mjs",
    "comparison:integrity": "node scripts/comparison-platform/integrity.mjs",
    "comparison:metadata": "node scripts/comparison-platform/metadata.mjs",
    "comparison:metadata:check": "node scripts/comparison-platform/metadata.mjs --check"
  };
  let modified = false;
  for (const [key, value] of Object.entries(additions)) {
    if (pkg.scripts[key] !== value) { pkg.scripts[key] = value; modified = true; }
  }
  return modified ? JSON.stringify(pkg, null, 2) + "\n" : source;
}, "package.json erweitern");

const docs = `# Comparison Platform 2.1.0

Enthält Audit, Report, Integrity und Metadata.

## Befehle

\`\`\`powershell
npm run comparison:audit
npm run comparison:audit:strict
npm run comparison:report
npm run comparison:integrity
npm run comparison:metadata:check
npm run comparison:metadata
\`\`\`

Reports werden unter \`reports/comparison-platform/\` abgelegt.

Der Metadata-Migrator ergänzt nur fehlende \`comparisonData\`-Blöcke. Bestehende Daten werden nicht überschrieben.
`;
write(path.join(appRoot, "COMPARISON-PLATFORM-2.1.0.md"), docs);

if (dryRun) {
  console.log("\n" + PATCH + ": Vorprüfung erfolgreich. Es wurde nichts verändert.");
} else {
  console.log("\n" + PATCH + " erfolgreich installiert.");
  console.log("Backup: " + backupRoot);
  if (changed.length) console.log("Geändert:\n- " + changed.join("\n- "));
  if (created.length) console.log("Angelegt:\n- " + created.join("\n- "));
  console.log("\nNächster Schritt: cd apps/pfotentechnik && npm run comparison:audit");
}
