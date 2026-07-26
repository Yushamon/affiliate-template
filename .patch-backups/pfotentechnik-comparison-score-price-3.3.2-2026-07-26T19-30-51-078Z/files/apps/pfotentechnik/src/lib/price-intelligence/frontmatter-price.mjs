import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { atomicWriteFile } from "../admin/atomic-file.mjs";

const quote = (value) => JSON.stringify(String(value));

export function splitFrontmatter(source, file = "Produktdatei") {
  const match = String(source).replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${file}: gültiges YAML-Frontmatter fehlt.`);
  return { yaml: match[1], body: source.slice(match[0].length), prefix: source.slice(0, match.index || 0) };
}

function replaceTopLevelBlock(frontmatter, key, block) {
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*(?:#.*)?$`).test(line));
  if (start >= 0) {
    let end = start + 1;
    while (end < lines.length && (/^\s+/.test(lines[end]) || !lines[end].trim())) end += 1;
    lines.splice(start, end - start, ...block.split("\n"));
    return lines.join("\n");
  }
  const anchors = ["affiliate:", "conversion:", "rating:", "score:"];
  let insertAt = lines.findIndex((line) => anchors.includes(line.trim()));
  if (insertAt < 0) insertAt = lines.length;
  lines.splice(insertAt, 0, ...block.split("\n"), "");
  return lines.join("\n");
}

export function renderPriceBlock(price) {
  const source = price.source ?? {};
  const lines = [
    "price:",
    `  current: ${price.current == null ? "null" : Number(price.current)}`,
    `  currency: ${quote(price.currency || "EUR")}`,
    `  status: ${quote(price.status || "unknown")}`
  ];
  if (price.comparisonText) lines.push(`  comparisonText: ${quote(price.comparisonText)}`);
  if (price.checkedAt) lines.push(`  checkedAt: ${quote(price.checkedAt)}`);
  if (price.affiliateUrl) lines.push(`  affiliateUrl: ${quote(price.affiliateUrl)}`);
  if (source.id || source.label || source.url) {
    lines.push("  source:");
    if (source.id) lines.push(`    id: ${quote(source.id)}`);
    if (source.label) lines.push(`    label: ${quote(source.label)}`);
    lines.push(`    type: ${quote(source.type || "merchant")}`);
    if (source.url) lines.push(`    url: ${quote(source.url)}`);
  }
  return lines.join("\n");
}

export async function updateProductPrice(file, price) {
  const source = await fs.readFile(file, "utf8");
  const parts = splitFrontmatter(source, file);
  const nextYaml = replaceTopLevelBlock(parts.yaml, "price", renderPriceBlock(price));
  yaml.load(nextYaml);
  const next = `---\n${nextYaml.replace(/\s+$/, "")}\n---\n${parts.body}`;
  await atomicWriteFile(file, next, "utf8");
  return next;
}

export async function readProductFiles(productsDir) {
  const entries = await fs.readdir(productsDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isFile() && /\.mdx?$/.test(entry.name)) files.push(path.join(productsDir, entry.name));
  }
  return files.sort();
}

export async function readProductDocument(file) {
  const source = await fs.readFile(file, "utf8");
  const { yaml: frontmatter } = splitFrontmatter(source, file);
  const data = yaml.load(frontmatter) ?? {};
  return { file, source, data, slug: String(data.slug || path.basename(file).replace(/\.mdx?$/, "")) };
}
