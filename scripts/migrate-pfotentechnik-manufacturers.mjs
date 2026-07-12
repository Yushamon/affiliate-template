import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceFile = path.join(root, "apps/pfotentechnik/src/data/manufacturers.ts");
const targetDirectory = path.join(root, "apps/pfotentechnik/src/content/manufacturers");
const migratedSlugs = new Set([
  "petkit", "cat-mate", "xiaomi", "surefeed", "honeyguardian",
  "wopet", "oneisall", "imipaw", "pawbby"
]);

const quote = (value) => JSON.stringify(value ?? "");
const toKey = (value) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function addArray(lines, property, values, indent = "") {
  const items = Array.isArray(values) ? values.filter(Boolean) : [];
  if (!items.length) {
    lines.push(`${indent}${property}: []`);
    return;
  }
  lines.push(`${indent}${property}:`);
  for (const item of items) lines.push(`${indent}  - ${quote(item)}`);
}

function createMarkdown(manufacturer, order) {
  const experience = manufacturer.customerExperience;
  const summary = experience?.summary ?? manufacturer.description;
  const lines = [
    "---", `title: ${quote(manufacturer.name)}`, `slug: ${quote(manufacturer.slug)}`,
    'type: "manufacturer"', 'layout: "manufacturer"', "",
    `description: ${quote(manufacturer.description)}`, `key: ${quote(manufacturer.key)}`,
    `name: ${quote(manufacturer.name)}`, `recommendation: ${quote(manufacturer.description)}`,
    `summary: ${quote(summary)}`, 'publishedAt: "2026-07-12"',
    'updatedAt: "2026-07-12"', "author:", '  name: "PfotenTechnik Redaktion"',
    '  role: "Redaktion für smarte Haustiertechnik"', "tags:", '  - "hersteller"',
    `  - ${quote(manufacturer.slug)}`, '  - "futterautomaten"', "hub:", "  sections:",
    '    - "hersteller"', `  title: ${quote(manufacturer.name)}`,
    `  description: ${quote(manufacturer.description)}`, '  icon: "🏭"',
    `  order: ${order}`, "  featured: false", "seo:",
    `  title: ${quote(`${manufacturer.name} Erfahrungen: Produkte, Bewertung und Empfehlungen`)}`,
    `  description: ${quote(manufacturer.description)}`,
    `  canonical: ${quote(`/hersteller/${manufacturer.slug}/`)}`,
    "  noindex: false", "  sitemap: true", "  priority: 0.8", '  changefreq: "monthly"',
    `website: ${quote(manufacturer.website)}`, `rating: ${manufacturer.rating ?? 0}`,
    "images:", "  hero:",
    `    src: ${quote(`/images/manufacturers/${manufacturer.slug}/hero.webp`)}`,
    `    alt: ${quote(`${manufacturer.name} Herstellerübersicht`)}`, "  gallery: []"
  ];

  addArray(lines, "productCategories", manufacturer.productCategories);
  addArray(lines, "productAreas", manufacturer.productAreas?.map((area) => area.name));
  addArray(lines, "focus", manufacturer.focus);
  addArray(lines, "suitableFor", manufacturer.suitableFor);
  addArray(lines, "attention", manufacturer.lessSuitableFor);
  addArray(lines, "strengths", manufacturer.strengths);
  addArray(lines, "weaknesses", manufacturer.limitations);
  addArray(lines, "productSlugs", manufacturer.products);
  addArray(lines, "featuredProductSlugs", manufacturer.products?.slice(0, 3));

  if (!manufacturer.series?.length) lines.push("series: []");
  else {
    lines.push("series:");
    for (const series of manufacturer.series) {
      lines.push(`  - key: ${quote(toKey(series.name))}`, `    name: ${quote(series.name)}`,
        `    description: ${quote(series.description)}`);
      addArray(lines, "suitableFor", series.suitableFor ? [series.suitableFor] : [], "    ");
      lines.push("    productSlugs: []");
    }
  }

  if (experience) {
    lines.push("experience:", `  summary: ${quote(experience.summary)}`);
    addArray(lines, "positives", experience.positives, "  ");
    addArray(lines, "criticism", experience.criticism, "  ");
    lines.push(`  support: ${quote(experience.supportAssessment)}`);
  }
  addArray(lines, "alternativeManufacturerSlugs", manufacturer.alternatives);

  if (!manufacturer.sources?.length) lines.push("sources: []");
  else {
    lines.push("sources:");
    for (const source of manufacturer.sources) {
      lines.push(`  - label: ${quote(source.label)}`, `    url: ${quote(source.url)}`);
    }
  }
  if (!manufacturer.faq?.length) lines.push("faq: []");
  else {
    lines.push("faq:");
    for (const faq of manufacturer.faq) {
      lines.push(`  - question: ${quote(faq.question)}`, `    answer: ${quote(faq.answer)}`);
    }
  }
  lines.push("---", "", manufacturer.description, "");
  return lines.join("\n");
}

const bundle = await build({ entryPoints: [sourceFile], bundle: true, platform: "node", format: "esm", write: false });
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`;
const { manufacturers: allManufacturers } = await import(moduleUrl);
const manufacturers = allManufacturers.filter(({ slug }) => migratedSlugs.has(slug));
if (manufacturers.length !== migratedSlugs.size) throw new Error("Nicht alle neun Quelldatensätze wurden gefunden.");
await mkdir(targetDirectory, { recursive: true });
for (const [index, manufacturer] of manufacturers.entries()) {
  const targetFile = path.join(targetDirectory, `${manufacturer.slug}.md`);
  await writeFile(targetFile, createMarkdown(manufacturer, 20 + index * 10), "utf8");
  console.log(`Erstellt: ${path.relative(root, targetFile)}`);
}
console.log(`${manufacturers.length} Hersteller wurden migriert.`);
