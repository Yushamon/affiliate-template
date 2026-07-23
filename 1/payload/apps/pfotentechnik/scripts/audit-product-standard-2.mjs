#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productsDir = path.join(root, "src", "content", "products");
const reportsDir = path.join(root, "reports");
const strict = process.argv.includes("--strict");

if (!fs.existsSync(productsDir)) {
  console.error(`Produktverzeichnis nicht gefunden: ${productsDir}`);
  process.exit(1);
}

function splitFrontmatter(content) {
  if (!content.startsWith("---")) return { frontmatter: "", body: content };
  const end = content.indexOf("\n---", 3);
  if (end === -1) return { frontmatter: "", body: content };
  return { frontmatter: content.slice(3, end), body: content.slice(end + 4) };
}

function hasKey(frontmatter, key) {
  return new RegExp(`(^|\\n)\\s*${key}\\s*:`, "m").test(frontmatter);
}

function countArrayEntries(frontmatter, key) {
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^\\s*${key}\\s*:`).test(line));
  if (start < 0) return 0;
  const indent = lines[start].match(/^\s*/)?.[0].length ?? 0;
  let count = 0;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const currentIndent = line.match(/^\s*/)?.[0].length ?? 0;
    if (currentIndent <= indent && !line.trimStart().startsWith("-")) break;
    if (line.trimStart().startsWith("-")) count += 1;
  }
  return count;
}

function imageRef(frontmatter, name) {
  return new RegExp(`(^|\\n)\\s*${name}\\s*:\\s*['"]?([^\\n'"]+)`, "mi").exec(frontmatter)?.[2]?.trim();
}

function resolveImage(productSlug, ref) {
  if (!ref) return false;
  const cleaned = ref.replace(/^\/+/, "");
  const candidates = [
    path.join(root, "public", cleaned),
    path.join(root, "src", cleaned),
    path.join(root, "public", "images", "products", productSlug, path.basename(cleaned)),
    path.join(root, "src", "assets", "images", "products", productSlug, path.basename(cleaned))
  ];
  return candidates.some((candidate) => fs.existsSync(candidate));
}

const imageRequirements = [
  { key: "hero", aliases: ["hero"] },
  { key: "thumbnail", aliases: ["thumbnail"] },
  { key: "comparison", aliases: ["comparison"] },
  { key: "gallery-1", aliases: ["gallery-1", "gallery1"] },
  { key: "gallery-2", aliases: ["gallery-2", "gallery2"] },
  { key: "gallery-3", aliases: ["gallery-3", "gallery3"] },
  { key: "detail", aliases: ["detail", "gallery-4", "gallery4"] },
  { key: "app", aliases: ["app", "appScreenshot", "gallery-5", "gallery5"] },
  { key: "size-comparison", aliases: ["sizeComparison", "gallery-6", "gallery6"] }
];

const results = [];

for (const name of fs.readdirSync(productsDir).filter((file) => file.endsWith(".md"))) {
  const file = path.join(productsDir, name);
  const slug = name.replace(/\.md$/, "");
  const content = fs.readFileSync(file, "utf8");
  const { frontmatter, body } = splitFrontmatter(content);

  const images = imageRequirements.map((requirement) => {
    const ref = requirement.aliases
      .map((alias) => imageRef(frontmatter, alias))
      .find(Boolean);
    return { name: requirement.key, ref: ref ?? null, exists: resolveImage(slug, ref) };
  });

  const checks = {
    productStandard2: hasKey(frontmatter, "productStandard2"),
    decision: hasKey(frontmatter, "decision") || body.includes("Passt zu dir"),
    quickFacts: hasKey(frontmatter, "quickFacts") || hasKey(frontmatter, "specs"),
    suitability: hasKey(frontmatter, "suitability"),
    contextSpecs: hasKey(frontmatter, "contextSpecs"),
    trust: hasKey(frontmatter, "testStatus") && (hasKey(frontmatter, "updatedAt") || hasKey(frontmatter, "dateModified")),
    pros: countArrayEntries(frontmatter, "pros") >= 2,
    cons: countArrayEntries(frontmatter, "cons") >= 1,
    alternatives: countArrayEntries(frontmatter, "alternatives") >= 2,
    faq: hasKey(frontmatter, "faq")
  };

  const coreImages = images.slice(0, 6);
  const extendedImages = images.slice(6);
  const coreImageScore = Math.round(coreImages.filter((image) => image.exists).length / coreImages.length * 100);
  const extendedImageScore = Math.round(extendedImages.filter((image) => image.exists).length / extendedImages.length * 100);
  const imageScore = Math.round(coreImageScore * .75 + extendedImageScore * .25);

  const contentValues = Object.values(checks);
  const contentScore = Math.round(contentValues.filter(Boolean).length / contentValues.length * 100);
  const overall = Math.round(imageScore * 0.4 + contentScore * 0.6);

  const missing = [
    ...images.filter((image) => !image.exists).map((image) => `Bild: ${image.name}`),
    ...Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => `Inhalt: ${key}`)
  ];

  const severity = overall < 50 ? "critical" : overall < 75 ? "warning" : overall < 100 ? "improvement" : "complete";

  results.push({
    slug,
    file: path.relative(root, file),
    overall,
    imageScore,
    coreImageScore,
    extendedImageScore,
    contentScore,
    severity,
    missing,
    checks,
    images
  });
}

results.sort((a, b) => a.overall - b.overall);
fs.mkdirSync(reportsDir, { recursive: true });

const report = {
  generatedAt: new Date().toISOString(),
  standard: "2.0",
  summary: {
    products: results.length,
    complete: results.filter((item) => item.severity === "complete").length,
    improvement: results.filter((item) => item.severity === "improvement").length,
    warning: results.filter((item) => item.severity === "warning").length,
    critical: results.filter((item) => item.severity === "critical").length
  },
  products: results
};

const jsonPath = path.join(reportsDir, "product-standard-2-audit.json");
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

const md = [
  "# Produktstandard 2.0 Audit",
  "",
  `Stand: ${new Date().toLocaleString("de-DE")}`,
  "",
  `- Produkte: ${results.length}`,
  `- Vollständig: ${report.summary.complete}`,
  `- Verbesserungswürdig: ${report.summary.improvement}`,
  `- Warnung: ${report.summary.warning}`,
  `- Kritisch: ${report.summary.critical}`,
  "",
  "| Produkt | Gesamt | Bilder | Kernbilder | Zusatzbilder | Inhalte | Status |",
  "|---|---:|---:|---:|---:|---:|---|",
  ...results.map((item) =>
    `| ${item.slug} | ${item.overall} % | ${item.imageScore} % | ${item.coreImageScore} % | ${item.extendedImageScore} % | ${item.contentScore} % | ${item.severity} |`
  ),
  "",
  "## Fehlende Elemente",
  "",
  ...results.flatMap((item) => [
    `### ${item.slug} — ${item.overall} %`,
    "",
    ...(item.missing.length ? item.missing.map((entry) => `- ${entry}`) : ["- Vollständig"]),
    ""
  ])
].join("\n");

fs.writeFileSync(path.join(reportsDir, "product-standard-2-audit.md"), md);
console.log(md);
console.log(`\nJSON: ${jsonPath}`);

if (strict && results.some((item) => item.overall < 100)) process.exit(2);
