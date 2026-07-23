#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productDir = path.join(root, "src", "content", "products");
const outputDir = path.join(root, "reports");

if (!fs.existsSync(productDir)) {
  console.error(`Produktverzeichnis fehlt: ${productDir}`);
  process.exit(1);
}

const files = fs.readdirSync(productDir).filter((file) => file.endsWith(".md"));
const rows = [];

function getFrontmatter(text) {
  if (!text.startsWith("---")) return "";
  const end = text.indexOf("\n---", 3);
  return end === -1 ? "" : text.slice(3, end);
}

function has(frontmatter, key) {
  return new RegExp(`(^|\\n)\\s*${key}\\s*:`, "m").test(frontmatter);
}

for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  const frontmatter = getFrontmatter(fs.readFileSync(path.join(productDir, file), "utf8"));

  const source = has(frontmatter, "productStandard2")
    ? (has(frontmatter, "pros") || has(frontmatter, "cons") ? "hybrid" : "standard-2")
    : "legacy";

  const metadata = [
    ["animal", has(frontmatter, "animal")],
    ["petSize", has(frontmatter, "petSize") || has(frontmatter, "petSizes")],
    ["category", has(frontmatter, "category")],
    ["manufacturer", has(frontmatter, "manufacturer")]
  ];

  const missing = metadata.filter(([, ok]) => !ok).map(([name]) => name);
  const intelligenceScore = Math.round((metadata.length - missing.length) / metadata.length * 100);

  rows.push({
    slug,
    source,
    intelligenceScore,
    missingMetadata: missing
  });
}

rows.sort((a, b) => a.intelligenceScore - b.intelligenceScore);

const report = {
  generatedAt: new Date().toISOString(),
  engine: "2.1",
  summary: {
    products: rows.length,
    legacy: rows.filter((row) => row.source === "legacy").length,
    hybrid: rows.filter((row) => row.source === "hybrid").length,
    standard2: rows.filter((row) => row.source === "standard-2").length,
    incompleteMetadata: rows.filter((row) => row.missingMetadata.length).length
  },
  products: rows
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "product-engine-audit.json"),
  JSON.stringify(report, null, 2)
);

const markdown = [
  "# Product Engine 2.1 Audit",
  "",
  `Produkte: ${report.summary.products}`,
  `Legacy: ${report.summary.legacy}`,
  `Hybrid: ${report.summary.hybrid}`,
  `Standard 2: ${report.summary.standard2}`,
  "",
  "| Produkt | Quelle | Intelligence | Fehlende Metadaten |",
  "|---|---|---:|---|",
  ...rows.map((row) =>
    `| ${row.slug} | ${row.source} | ${row.intelligenceScore} % | ${row.missingMetadata.join(", ") || "–"} |`
  )
].join("\n");

fs.writeFileSync(path.join(outputDir, "product-engine-audit.md"), markdown);
console.log(markdown);
