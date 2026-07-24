import fs from "node:fs";
import { COMPARISON_DIR, loadEntries, splitFrontmatter } from "./core.mjs";

function insertBeforeFrontmatterEnd(source, block) {
  const { frontmatter, body } = splitFrontmatter(source);
  if (!frontmatter) return null;
  return "---\n" + frontmatter.trimEnd() + "\n" + block.trim() + "\n---\n\n" + body.replace(/^\n+/, "");
}

function fixComparison(entry) {
  let source = entry.source;
  const data = entry.data;
  const additions = [];

  if (!data.tableTitle) additions.push('tableTitle: "Direkter Vergleich"');
  if (!data.cardsTitle) additions.push('cardsTitle: "Produkte im Überblick"');
  if (!Array.isArray(data.faq)) additions.push("faq: []");

  if (!additions.length) return null;
  return insertBeforeFrontmatterEnd(source, additions.join("\n"));
}

export function runAutofix({ check = false } = {}) {
  const entries = loadEntries(COMPARISON_DIR);
  let changed = 0;

  for (const entry of entries) {
    const next = fixComparison(entry);
    if (!next || next === entry.source) continue;

    changed++;
    console.log((check ? "[check] " : "[fixed] ") + entry.rel);

    if (!check) fs.writeFileSync(entry.file, next, "utf8");
  }

  console.log("Autofix: " + changed + " Datei(en) " + (check ? "würden geändert." : "geändert."));
  return { changed };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  runAutofix({ check: process.argv.includes("--check") });
}
