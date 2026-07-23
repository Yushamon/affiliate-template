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
function hasKey(fm, key) {
  return new RegExp(`(^|\\n)\\s*${key}\\s*:`, "m").test(fm);
}
function valueFor(fm, key) {
  return new RegExp(`(^|\\n)\\s*${key}\\s*:\\s*['"]?([^\\n'"]+)`, "mi").exec(fm)?.[2]?.trim();
}
function existsImage(slug, ref) {
  if (!ref) return false;
  const clean = ref.replace(/^\/+/, "");
  return [
    path.join(root, "public", clean),
    path.join(root, "src", clean),
    path.join(root, "public", "images", "products", slug, path.basename(clean)),
    path.join(root, "src", "assets", "images", "products", slug, path.basename(clean))
  ].some(fs.existsSync);
}

const imageNames = ["hero", "thumbnail", "comparison", "gallery-1", "gallery-2", "gallery-3"];
const results = [];

for (const fileName of fs.readdirSync(productsDir).filter((f) => f.endsWith(".md"))) {
  const slug = fileName.replace(/\.md$/, "");
  const file = path.join(productsDir, fileName);
  const { frontmatter, body } = splitFrontmatter(fs.readFileSync(file, "utf8"));

  const images = imageNames.map((name) => {
    const ref = valueFor(frontmatter, name) ||
      valueFor(frontmatter, name.replace("-", "")) ||
      (name.startsWith("gallery-") ? valueFor(frontmatter, `gallery${name.at(-1)}`) : null);
    return { name, ref: ref ?? null, exists: existsImage(slug, ref) };
  });

  const checks = {
    productStandard2: hasKey(frontmatter, "productStandard2"),
    decision: hasKey(frontmatter, "decision") || body.includes("Passt zu dir"),
    quickFacts: hasKey(frontmatter, "quickFacts") || hasKey(frontmatter, "specs"),
    trust: hasKey(frontmatter, "testStatus") && (hasKey(frontmatter, "updatedAt") || hasKey(frontmatter, "dateModified")),
    prosCons: hasKey(frontmatter, "pros") && hasKey(frontmatter, "cons"),
    alternatives: hasKey(frontmatter, "alternatives"),
    faq: hasKey(frontmatter, "faq")
  };

  const imageScore = Math.round(images.filter((i) => i.exists).length / imageNames.length * 100);
  const contentScore = Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100);
  const overall = Math.round(imageScore * 0.4 + contentScore * 0.6);
  const missing = [
    ...images.filter((i) => !i.exists).map((i) => `Bild: ${i.name}`),
    ...Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => `Inhalt: ${key}`)
  ];

  results.push({ slug, file: path.relative(root, file), overall, imageScore, contentScore, missing });
}

results.sort((a, b) => a.overall - b.overall);
fs.mkdirSync(reportsDir, { recursive: true });

const output = {
  generatedAt: new Date().toISOString(),
  standard: "2.0",
  summary: {
    products: results.length,
    complete: results.filter((r) => r.overall === 100).length,
    incomplete: results.filter((r) => r.overall < 100).length,
    critical: results.filter((r) => r.overall < 50).length
  },
  products: results
};

fs.writeFileSync(path.join(reportsDir, "product-standard-2-audit.json"), JSON.stringify(output, null, 2));
const md = [
  "# Produktstandard 2.0 Audit",
  "",
  `Stand: ${new Date().toLocaleString("de-DE")}`,
  "",
  `- Produkte: ${output.summary.products}`,
  `- Vollständig: ${output.summary.complete}`,
  `- Unvollständig: ${output.summary.incomplete}`,
  `- Kritisch (< 50 %): ${output.summary.critical}`,
  "",
  "| Produkt | Gesamt | Bilder | Inhalte | Fehlend |",
  "|---|---:|---:|---:|---|",
  ...results.map((r) => `| ${r.slug} | ${r.overall} % | ${r.imageScore} % | ${r.contentScore} % | ${r.missing.join(", ") || "–"} |`)
].join("\n");
fs.writeFileSync(path.join(reportsDir, "product-standard-2-audit.md"), md);
console.log(md);
if (strict && results.some((r) => r.overall < 100)) process.exit(2);
