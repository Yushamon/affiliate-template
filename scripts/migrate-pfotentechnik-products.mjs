import { build } from "esbuild";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceFile = path.join(root, "apps/pfotentechnik/src/data/products.ts");
const targetDirectory = path.join(root, "apps/pfotentechnik/src/content/products");
const referenceSlug = "petkit-yumshare-solo-2";
const quote = (value) => JSON.stringify(value ?? "");

function addArray(lines, property, values, indent = "") {
  const items = Array.isArray(values) ? values.filter(Boolean) : [];
  if (!items.length) {
    lines.push(`${indent}${property}: []`);
    return;
  }
  lines.push(`${indent}${property}:`);
  for (const item of items) lines.push(`${indent}  - ${quote(item)}`);
}

function addRatings(lines, ratings) {
  const entries = Object.entries(ratings ?? {});
  if (!entries.length) {
    lines.push("ratings: {}");
    return;
  }
  lines.push("ratings:");
  for (const [key, value] of entries) lines.push(`  ${quote(key)}: ${value}`);
}

function addImage(lines, property, src, alt, indent = "  ") {
  if (!src) return;
  lines.push(`${indent}${property}:`, `${indent}  src: ${quote(src)}`, `${indent}  alt: ${quote(alt)}`);
}

function getSlug(product) {
  return product.productUrl.split("/").filter(Boolean).at(-1);
}

function getManufacturer(product) {
  if (product.manufacturer === "closer-pets") {
    return { key: "closer-pets", name: product.manufacturerLabel, slug: "cat-mate" };
  }
  return {
    key: product.manufacturer,
    name: product.manufacturerLabel || product.brand,
    slug: product.manufacturer
  };
}

function getAffiliateUrl(product) {
  const directUrl = product.merchantLinks?.amazon?.url ?? product.affiliateUrl;
  if (directUrl) return directUrl;
  const query = product.merchantLinks?.amazon?.searchQuery;
  return query ? `https://www.amazon.de/s?k=${encodeURIComponent(query)}` : undefined;
}

function createMarkdown(product) {
  const slug = getSlug(product);
  const manufacturer = getManufacturer(product);
  const affiliateUrl = getAffiliateUrl(product);
  const lines = [
    "---", `title: ${quote(product.name)}`, `slug: ${quote(slug)}`,
    'type: "product"', 'layout: "product"',
    `description: ${quote(product.recommendation)}`,
    `recommendation: ${quote(product.recommendation)}`,
    "manufacturer:", `  key: ${quote(manufacturer.key)}`,
    `  name: ${quote(manufacturer.name)}`, `  slug: ${quote(manufacturer.slug)}`,
    "category:", '  key: "futterautomaten"', '  label: "Futterautomaten"',
    '  path: "/futterautomaten/"', `productUrl: ${quote(product.productUrl)}`,
    'publishedAt: "2026-07-12"', 'updatedAt: "2026-07-12"',
    "author:", '  name: "PfotenTechnik Redaktion"',
    "seo:", `  title: ${quote(`${product.name} Test`)}`,
    `  description: ${quote(product.recommendation)}`,
    `  canonical: ${quote(`${product.productUrl}/`)}`, "  sitemap: true", "  priority: 0.9",
    "hub:", "  sections:", '    - "produkte"', '    - "futterautomaten"'
  ];

  addArray(lines, "tags", product.recommendationTags);
  lines.push("images:");
  addImage(lines, "hero", product.images?.hero, product.name);
  addImage(lines, "thumbnail", product.images?.thumbnail, product.name);
  addImage(lines, "comparison", product.images?.comparison, product.name);
  const gallery = product.images?.gallery ?? [];
  if (!gallery.length) lines.push("  gallery: []");
  else {
    lines.push("  gallery:");
    gallery.forEach((src, index) => {
      lines.push(`    - src: ${quote(src)}`, `      alt: ${quote(`${product.name} Ansicht ${index + 1}`)}`);
    });
  }

  if (affiliateUrl) {
    lines.push("affiliate:", '  provider: "amazon"', '  label: "Aktuellen Preis prüfen"',
      `  url: ${quote(affiliateUrl)}`);
  }
  lines.push(`rating: ${product.rating}`, `score: ${product.ranking?.overall ?? 0}`);
  addRatings(lines, product.ratings);
  lines.push("decision:");
  addArray(lines, "bestFor", product.bestFor, "  ");
  addArray(lines, "attention", product.notFor, "  ");
  lines.push("review:", `  summary: ${quote(product.review.summary)}`,
    `  verdict: ${quote(product.review.verdict)}`);
  addArray(lines, "strengths", product.pros);
  addArray(lines, "weaknesses", product.cons);
  lines.push("alternatives: []");

  if (!product.specs?.length) lines.push("specs: []");
  else {
    lines.push("specs:");
    for (const spec of product.specs) {
      lines.push(`  - label: ${quote(spec.label)}`, `    value: ${quote(spec.value)}`);
    }
  }
  lines.push("faq: []", `useCase: ${quote(product.useCase)}`,
    `capacity: ${quote(product.capacity)}`, `expandable: ${quote(product.expandable)}`);
  addArray(lines, "features", product.highlights);
  lines.push("---", "", product.recommendation, "", product.verdict, "");
  return lines.join("\n");
}

const bundle = await build({ entryPoints: [sourceFile], bundle: true, platform: "node", format: "esm", write: false });
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`;
const { products } = await import(moduleUrl);
await mkdir(targetDirectory, { recursive: true });

let created = 0;
for (const product of Object.values(products)) {
  const slug = getSlug(product);
  if (!slug) throw new Error(`Produkt ohne Routenslug: ${product.name}`);
  const targetFile = path.join(targetDirectory, `${slug}.md`);
  if (slug === referenceSlug) {
    await access(targetFile);
    console.log(`Beibehalten: ${path.relative(root, targetFile)}`);
    continue;
  }
  await writeFile(targetFile, createMarkdown(product), "utf8");
  created += 1;
  console.log(`Erstellt: ${path.relative(root, targetFile)}`);
}

console.log(`${created} Produktdateien wurden neu migriert.`);
