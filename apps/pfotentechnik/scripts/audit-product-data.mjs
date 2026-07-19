#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);
const appRoot = path.resolve(scriptDir, "..");
const productsDir = path.join(appRoot, "src/content/products");
const reportsDir = path.join(appRoot, "reports");
const strict = process.argv.includes("--strict");

const CATEGORY_RULES = {
  futterautomaten: {
    requiredSpecs: [
      ["kapazität", "kapazitaet", "fassungsvermögen", "fassungsvermoegen"],
      ["futterart"],
      ["stromversorgung", "betrieb"],
      ["geeignet für", "geeignet fuer", "zielgruppe"],
      ["portionierung", "portionsgröße", "portionsgroesse", "mahlzeiten"]
    ],
    recommendedSpecs: [
      ["app-steuerung", "app", "konnektivität", "konnektivitaet"],
      ["kamera"],
      ["napf", "napfmaterial"],
      ["reinigung", "spülmaschinengeeignet", "spuelmaschinengeeignet"],
      ["wlan", "wifi"],
      ["batterie", "notstrom", "backup"],
      ["maße", "masse", "abmessungen"],
      ["gewicht"]
    ]
  },
  trinkbrunnen: {
    requiredSpecs: [
      ["kapazität", "kapazitaet", "fassungsvermögen", "fassungsvermoegen"],
      ["material", "trinkfläche", "trinkflaeche"],
      ["stromversorgung", "betrieb"],
      ["geeignet für", "geeignet fuer", "zielgruppe"]
    ],
    recommendedSpecs: [
      ["lautstärke", "lautstaerke", "geräusch", "geraeusch"],
      ["filter", "filtertyp"],
      ["reinigung", "spülmaschinengeeignet", "spuelmaschinengeeignet"],
      ["akku", "akkulaufzeit", "kabellos"],
      ["app"],
      ["uv", "uvc"],
      ["trinkhöhe", "trinkhoehe"],
      ["wasserfluss", "durchfluss"],
      ["ersatzfilter"],
      ["maße", "masse", "abmessungen"],
      ["gewicht"]
    ]
  }
};

const files = await walk(productsDir);
const products = [];

for (const file of files) {
  const source = await fs.readFile(file, "utf8");
  const frontmatter = extractFrontmatter(source, file);
  products.push(parseProduct(frontmatter, source, file));
}

const slugMap = new Map();
for (const product of products) {
  const values = slugMap.get(product.slug) ?? [];
  values.push(product.file);
  slugMap.set(product.slug, values);
}

const duplicateSlugs = [...slugMap.entries()]
  .filter(([, files]) => files.length > 1)
  .map(([slug, files]) => ({ slug, files }));

const results = products.map(auditProduct);
const summary = {
  generatedAt: new Date().toISOString(),
  totalProducts: results.length,
  byCategory: countBy(results, (item) => item.category),
  errors: results.reduce((sum, item) => sum + item.errors.length, 0),
  warnings: results.reduce((sum, item) => sum + item.warnings.length, 0),
  duplicateSlugs: duplicateSlugs.length
};

await fs.mkdir(reportsDir, { recursive: true });
await fs.writeFile(
  path.join(reportsDir, "product-data-audit.json"),
  JSON.stringify({ summary, duplicateSlugs, products: results }, null, 2),
  "utf8"
);
await fs.writeFile(
  path.join(reportsDir, "product-data-audit.md"),
  renderMarkdown(summary, duplicateSlugs, results),
  "utf8"
);

printSummary(summary, duplicateSlugs, results);

if (strict && (summary.errors > 0 || duplicateSlugs.length > 0)) {
  process.exitCode = 1;
}

function auditProduct(product) {
  const errors = [];
  const warnings = [];

  for (const field of [
    "title",
    "slug",
    "description",
    "recommendation",
    "manufacturer",
    "category",
    "rating"
  ]) {
    if (!product[field] && product[field] !== 0) {
      errors.push(`Pflichtfeld fehlt: ${field}`);
    }
  }

  if (product.rating !== undefined && (
    !Number.isFinite(product.rating) ||
    product.rating < 0 ||
    product.rating > 5
  )) {
    errors.push(`Ungültige Bewertung: ${product.rating}`);
  }

  if (product.score !== undefined && (
    !Number.isFinite(product.score) ||
    product.score < 0 ||
    product.score > 100
  )) {
    errors.push(`Ungültiger Score: ${product.score}`);
  }

  if (product.strengths.length < 3) {
    warnings.push(`Nur ${product.strengths.length} Stärken hinterlegt`);
  }

  if (product.weaknesses.length < 2) {
    warnings.push(`Nur ${product.weaknesses.length} Schwächen hinterlegt`);
  }

  if (product.decisionBestFor.length < 2) {
    warnings.push("decision.bestFor ist zu knapp oder fehlt");
  }

  if (product.decisionAttention.length < 2) {
    warnings.push("decision.attention ist zu knapp oder fehlt");
  }

  if (!product.images.hero) errors.push("Hero-Bild fehlt");
  if (!product.images.thumbnail) warnings.push("Thumbnail fehlt");
  if (!product.images.comparison) warnings.push("Comparison-Bild fehlt");

  if (product.images.galleryCount < 2) {
    warnings.push(`Nur ${product.images.galleryCount} Galerie-Bilder hinterlegt`);
  }

  if (!product.affiliateUrl) {
    warnings.push("Affiliate-Link fehlt");
  } else if (product.affiliateUrl.includes("/s?k=")) {
    warnings.push("Affiliate-Link ist nur eine Amazon-Suche, kein direkter Produktlink");
  }

  const rules = CATEGORY_RULES[product.category];
  if (rules) {
    for (const aliases of rules.requiredSpecs) {
      if (!hasSpec(product.specs, aliases)) {
        errors.push(`Vergleichsfeld fehlt: ${aliases[0]}`);
      }
    }

    for (const aliases of rules.recommendedSpecs) {
      if (!hasSpec(product.specs, aliases)) {
        warnings.push(`Empfohlenes Feld fehlt: ${aliases[0]}`);
      }
    }
  }

  detectContradictions(product, errors, warnings);

  return {
    file: path.relative(appRoot, product.file),
    slug: product.slug,
    title: product.title,
    category: product.category || "unbekannt",
    errors,
    warnings,
    specs: product.specs,
    completeness: calculateCompleteness(errors, warnings)
  };
}

function detectContradictions(product, errors, warnings) {
  const evidence = normalize([
    product.description,
    product.recommendation,
    ...product.tags,
    ...product.decisionBestFor,
    ...product.decisionAttention,
    ...product.strengths,
    ...product.weaknesses,
    ...product.specs.map((spec) => `${spec.label} ${spec.value}`)
  ].join(" "));
  const evidenceWithoutNegativeLargeDogClaims = evidence
    .replaceAll("nicht fuer grosse hunde", "");

  if (
    /(?:geeignet fuer|best for|fuer) grosse hunde/.test(
      evidenceWithoutNegativeLargeDogClaims
    ) &&
    evidence.includes("nicht fuer grosse hunde")
  ) {
    errors.push("Widerspruch: zugleich für große Hunde geeignet und nicht geeignet");
  }

  if (
    product.category === "futterautomaten" &&
    evidence.includes("nassfutter") &&
    evidence.includes("nur trockenfutter")
  ) {
    errors.push("Widerspruch: Nassfutter und nur Trockenfutter");
  }

  if (
    evidence.includes("keine app") &&
    (
      evidence.includes("app steuerung ja") ||
      evidence.includes("mit app")
    )
  ) {
    errors.push("Widerspruch: App vorhanden und keine App");
  }

  if (
    product.category === "trinkbrunnen" &&
    product.tags.includes("hunde") &&
    evidence.includes("katzenhalter") &&
    !evidence.includes("hundehalter")
  ) {
    warnings.push("Zielgruppenhinweis prüfen: Hunde-Tag, Text richtet sich aber nur an Katzenhalter");
  }

  if (
    product.capacity &&
    !hasSpec(product.specs, ["kapazität", "kapazitaet", "fassungsvermögen"])
  ) {
    warnings.push("capacity ist vorhanden, aber nicht als Spec normalisiert");
  }
}

function calculateCompleteness(errors, warnings) {
  return Math.max(0, 100 - errors.length * 10 - warnings.length * 3);
}

function hasSpec(specs, aliases) {
  const normalizedAliases = aliases.map(normalize);
  return specs.some((spec) => {
    const label = normalize(spec.label);
    return normalizedAliases.some(
      (alias) => label === alias || label.includes(alias)
    );
  });
}

function parseProduct(frontmatter, source, file) {
  const categoryObject = getObject(frontmatter, "category");
  const manufacturerObject = getObject(frontmatter, "manufacturer");
  const imagesBlock = getBlock(frontmatter, "images");
  const decisionBlock = getBlock(frontmatter, "decision");
  const affiliateBlock = getBlock(frontmatter, "affiliate");
  const inlineDecision = getObject(frontmatter, "decision");
  const inlineAffiliate = getObject(frontmatter, "affiliate");

  return {
    file,
    title: getScalar(frontmatter, "title"),
    slug: getScalar(frontmatter, "slug") ??
      path.basename(file).replace(/\.mdx?$/i, ""),
    description: getScalar(frontmatter, "description"),
    recommendation: getScalar(frontmatter, "recommendation"),
    manufacturer:
      manufacturerObject.name ??
      getNestedScalar(frontmatter, "manufacturer", "name"),
    category:
      categoryObject.key ??
      getNestedScalar(frontmatter, "category", "key"),
    rating: toNumber(getScalar(frontmatter, "rating")),
    score: toNumber(getScalar(frontmatter, "score")),
    capacity: getScalar(frontmatter, "capacity"),
    tags: getArray(frontmatter, "tags"),
    strengths: getArray(frontmatter, "strengths"),
    weaknesses: getArray(frontmatter, "weaknesses"),
    decisionBestFor:
      getNestedArray(decisionBlock, "bestFor").length
        ? getNestedArray(decisionBlock, "bestFor")
        : parseInlineArray(inlineDecision.bestFor),
    decisionAttention:
      getNestedArray(decisionBlock, "attention").length
        ? getNestedArray(decisionBlock, "attention")
        : parseInlineArray(inlineDecision.attention),
    specs: getSpecs(frontmatter),
    images: {
      hero: hasNestedKey(imagesBlock, "hero"),
      thumbnail: hasNestedKey(imagesBlock, "thumbnail"),
      comparison: hasNestedKey(imagesBlock, "comparison"),
      galleryCount: countGallery(imagesBlock)
    },
    affiliateUrl:
      getNestedScalar(affiliateBlock, "", "url") ??
      getNestedScalar(frontmatter, "affiliate", "url") ??
      inlineAffiliate.url,
    source
  };
}

function extractFrontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Kein Frontmatter: ${file}`);
  return match[1];
}

function getScalar(frontmatter, key) {
  const match = frontmatter.match(
    new RegExp(`^${escapeRegExp(key)}\\s*:\\s*(.+?)\\s*$`, "m")
  );
  return match ? stripQuotes(match[1]) : undefined;
}

function getBlock(frontmatter, key) {
  if (!key) return frontmatter;
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex(
    (line) => new RegExp(`^${escapeRegExp(key)}\\s*:\\s*$`).test(line)
  );
  if (start < 0) return "";

  const result = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\S/.test(line) && line.trim()) break;
    result.push(line);
  }
  return result.join("\n");
}

function getObject(frontmatter, key) {
  const scalar = getScalar(frontmatter, key);
  if (!scalar?.startsWith("{") || !scalar.endsWith("}")) return {};

  const result = {};
  for (const part of splitTopLevel(scalar.slice(1, -1), ",")) {
    const separator = part.indexOf(":");
    if (separator < 0) continue;
    result[part.slice(0, separator).trim()] =
      stripQuotes(part.slice(separator + 1).trim());
  }
  return result;
}

function getArray(frontmatter, key) {
  const scalar = getScalar(frontmatter, key);
  if (scalar?.startsWith("[") && scalar.endsWith("]")) {
    return splitTopLevel(scalar.slice(1, -1), ",")
      .map((item) => stripQuotes(item.trim()))
      .filter(Boolean);
  }

  const block = getBlock(frontmatter, key);
  return [...block.matchAll(/^\s*-\s*(.+?)\s*$/gm)]
    .map((match) => stripQuotes(match[1]))
    .filter((value) => !value.includes(":"));
}

function getNestedArray(block, key) {
  const scalar = block.match(
    new RegExp(`^\\s*${escapeRegExp(key)}\\s*:\\s*(\\[.*\\])\\s*$`, "m")
  )?.[1];

  if (scalar) {
    return splitTopLevel(scalar.slice(1, -1), ",")
      .map((item) => stripQuotes(item.trim()))
      .filter(Boolean);
  }

  const lines = block.split(/\r?\n/);
  const start = lines.findIndex(
    (line) => new RegExp(`^\\s*${escapeRegExp(key)}\\s*:\\s*$`).test(line)
  );
  if (start < 0) return [];

  const result = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s{2,}\w[\w-]*\s*:/.test(line)) break;
    const item = line.match(/^\s*-\s*(.+?)\s*$/);
    if (item) result.push(stripQuotes(item[1]));
  }
  return result;
}

function parseInlineArray(value) {
  if (!value?.startsWith("[") || !value.endsWith("]")) return [];
  return splitTopLevel(value.slice(1, -1), ",")
    .map((item) => stripQuotes(item.trim()))
    .filter(Boolean);
}

function getNestedScalar(blockOrFrontmatter, parent, child) {
  const block = parent ? getBlock(blockOrFrontmatter, parent) : blockOrFrontmatter;
  const match = block.match(
    new RegExp(`^\\s*${escapeRegExp(child)}\\s*:\\s*(.+?)\\s*$`, "m")
  );
  return match ? stripQuotes(match[1]) : undefined;
}

function getSpecs(frontmatter) {
  const block = getBlock(frontmatter, "specs");
  const specs = [];

  for (const match of block.matchAll(
    /^\s*-\s*\{\s*label\s*:\s*([^,]+),\s*value\s*:\s*(.+?)\s*\}\s*$/gm
  )) {
    specs.push({
      label: stripQuotes(match[1].trim()),
      value: stripQuotes(match[2].trim())
    });
  }

  const lines = block.split(/\r?\n/);
  let current;

  for (const line of lines) {
    const label = line.match(/^\s*-\s*label\s*:\s*(.+?)\s*$/);
    if (label) {
      if (current?.label && current?.value !== undefined) specs.push(current);
      current = { label: stripQuotes(label[1]) };
      continue;
    }

    const value = line.match(/^\s*value\s*:\s*(.+?)\s*$/);
    if (value && current) current.value = stripQuotes(value[1]);
  }

  if (current?.label && current?.value !== undefined) specs.push(current);

  return uniqueBy(specs, (spec) => normalize(spec.label));
}

function hasNestedKey(block, key) {
  return new RegExp(`^\\s*${escapeRegExp(key)}\\s*:`, "m").test(block);
}

function countGallery(block) {
  const galleryIndex = block.search(/^\s*gallery\s*:\s*$/m);
  if (galleryIndex < 0) return 0;
  return (block.slice(galleryIndex).match(
    /^\s*-\s*(?:src\s*:|\{\s*src\s*:)/gm
  ) ?? []).length;
}

function splitTopLevel(value, separator) {
  const result = [];
  let current = "";
  let quote = null;
  let squareDepth = 0;
  let curlyDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (quote) {
      current += char;
      if (char === quote && value[index - 1] !== "\\") quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "[") squareDepth += 1;
    if (char === "]") squareDepth -= 1;
    if (char === "{") curlyDepth += 1;
    if (char === "}") curlyDepth -= 1;

    if (
      char === separator &&
      squareDepth === 0 &&
      curlyDepth === 0
    ) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) result.push(current.trim());
  return result;
}

async function walk(directory) {
  const result = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else if (/\.mdx?$/i.test(entry.name)) result.push(full);
  }
  return result;
}

function renderMarkdown(summary, duplicateSlugs, results) {
  const lines = [
    "# Produktdaten-Audit",
    "",
    `Erstellt: ${summary.generatedAt}`,
    "",
    "## Zusammenfassung",
    "",
    `- Produkte: ${summary.totalProducts}`,
    `- Fehler: ${summary.errors}`,
    `- Warnungen: ${summary.warnings}`,
    `- Doppelte Slugs: ${summary.duplicateSlugs}`,
    "",
    "## Kategorien",
    ""
  ];

  for (const [category, count] of Object.entries(summary.byCategory)) {
    lines.push(`- ${category}: ${count}`);
  }

  if (duplicateSlugs.length) {
    lines.push("", "## Doppelte Slugs", "");
    for (const duplicate of duplicateSlugs) {
      lines.push(`- \`${duplicate.slug}\`: ${duplicate.files.join(", ")}`);
    }
  }

  lines.push("", "## Produkte mit Handlungsbedarf", "");

  for (const product of results
    .filter((item) => item.errors.length || item.warnings.length)
    .sort((a, b) =>
      a.completeness - b.completeness ||
      a.title.localeCompare(b.title, "de")
    )) {
    lines.push(
      `### ${product.title}`,
      "",
      `- Datei: \`${product.file}\``,
      `- Kategorie: ${product.category}`,
      `- Vollständigkeit: ${product.completeness}%`
    );

    if (product.errors.length) {
      lines.push("- Fehler:");
      for (const issue of product.errors) lines.push(`  - ${issue}`);
    }

    if (product.warnings.length) {
      lines.push("- Warnungen:");
      for (const issue of product.warnings) lines.push(`  - ${issue}`);
    }

    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function printSummary(summary, duplicateSlugs, results) {
  console.log("Produktdaten-Audit abgeschlossen");
  console.log(`Produkte: ${summary.totalProducts}`);
  console.log(`Fehler: ${summary.errors}`);
  console.log(`Warnungen: ${summary.warnings}`);
  console.log(`Doppelte Slugs: ${duplicateSlugs.length}`);
  console.log("");
  console.log("Größter Handlungsbedarf:");

  for (const item of [...results]
    .sort((a, b) => a.completeness - b.completeness)
    .slice(0, 10)) {
    console.log(
      `- ${item.completeness}% ${item.title} ` +
      `(${item.errors.length} Fehler, ${item.warnings.length} Warnungen)`
    );
  }

  console.log("");
  console.log("Berichte:");
  console.log("apps/pfotentechnik/reports/product-data-audit.md");
  console.log("apps/pfotentechnik/reports/product-data-audit.json");
}

function normalize(value) {
  return String(value ?? "")
    .toLocaleLowerCase("de")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stripQuotes(value) {
  return String(value ?? "")
    .trim()
    .replace(/^([\"'])(.*)\1$/, "$2");
}

function toNumber(value) {
  if (value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countBy(items, getKey) {
  return items.reduce((result, item) => {
    const key = getKey(item) || "unbekannt";
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
