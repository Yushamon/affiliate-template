import fs from "node:fs";
import path from "node:path";
import {
  COMPARISON_DIR,
  PRODUCT_DIR,
  walk,
  splitFrontmatter
} from "./core.mjs";
import { normalizeKey } from "./data-platform.mjs";

const WRITE = process.argv.includes("--write");

const EDITORIAL_KEYS = new Set([
  "profil",
  "einordnung",
  "einsatzprofil",
  "besonderheit",
  "wichtigstervorteil",
  "grenze",
  "einschraenkung",
  "fazit",
  "empfehlung"
]);

const scalarText = (raw) => raw.trim().replace(/^["']|["']$/g, "");

function frontmatterLines(source) {
  const normalized = source.replace(/\r\n/g, "\n");
  const split = splitFrontmatter(normalized);
  return {
    frontmatter: split.frontmatter,
    body: split.body,
    lines: split.frontmatter.split("\n")
  };
}

function parseInlineValue(raw) {
  const text = scalarText(raw);
  if (text === "true") return true;
  if (text === "false") return false;
  if (text === "null" || text === "~") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  return text;
}

function quoteKey(key) {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : JSON.stringify(key);
}

function parseItemBlocks(file) {
  const source = fs.readFileSync(file, "utf8");
  const { lines } = frontmatterLines(source);
  const blocks = [];
  const itemStarts = [];
  let inItems = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (/^items:\s*$/.test(line)) {
      inItems = true;
      continue;
    }
    if (inItems && /^\S/.test(line) && !/^items:/.test(line)) break;
    if (inItems && /^  -\s+slug:\s*/.test(line)) itemStarts.push(index);
  }

  for (let i = 0; i < itemStarts.length; i++) {
    const start = itemStarts[i];
    const end = i + 1 < itemStarts.length
      ? itemStarts[i + 1]
      : (() => {
          for (let j = start + 1; j < lines.length; j++) {
            if (/^\S/.test(lines[j]) && lines[j].trim()) return j;
          }
          return lines.length;
        })();

    const slugMatch = lines[start].match(/^  -\s+slug:\s*(.+?)\s*$/);
    const slug = slugMatch ? scalarText(slugMatch[1]) : "";
    const values = [];
    const overrides = [];
    let valuesStart = -1;
    let valuesEnd = -1;
    let overridesStart = -1;
    let overridesEnd = -1;

    for (let j = start + 1; j < end; j++) {
      if (/^    values:\s*$/.test(lines[j])) {
        valuesStart = j;
        valuesEnd = j + 1;
        for (let k = j + 1; k < end; k++) {
          if (lines[k].trim() && !/^      /.test(lines[k])) break;
          valuesEnd = k + 1;
          const match = lines[k].match(/^      (.+?):\s*(.*?)\s*$/);
          if (match) values.push({ key: scalarText(match[1]), raw: match[2] });
        }
      }

      if (/^    overrides:\s*$/.test(lines[j])) {
        overridesStart = j;
        overridesEnd = j + 1;
        for (let k = j + 1; k < end; k++) {
          if (lines[k].trim() && !/^      /.test(lines[k])) break;
          overridesEnd = k + 1;
          const match = lines[k].match(/^      (.+?):\s*(.*?)\s*$/);
          if (match) overrides.push({ key: scalarText(match[1]), raw: match[2] });
        }
      }
    }

    blocks.push({
      file,
      source,
      lines,
      start,
      end,
      slug,
      values,
      overrides,
      valuesStart,
      valuesEnd,
      overridesStart,
      overridesEnd
    });
  }

  return blocks;
}

function productSlug(file) {
  const source = fs.readFileSync(file, "utf8");
  const { frontmatter } = splitFrontmatter(source);
  const match = frontmatter.match(/^slug:\s*(.+?)\s*$/m);
  return match ? scalarText(match[1]) : path.basename(file).replace(/\.mdx?$/, "");
}

function existingCustomKeys(source) {
  const { frontmatter } = splitFrontmatter(source);
  const lines = frontmatter.split(/\r?\n/);
  const keys = new Map();
  let inComparison = false;
  let inCustom = false;

  for (const line of lines) {
    if (/^comparisonData:\s*$/.test(line)) {
      inComparison = true;
      inCustom = false;
      continue;
    }
    if (inComparison && /^\S/.test(line) && line.trim()) break;
    if (inComparison && /^  custom:\s*$/.test(line)) {
      inCustom = true;
      continue;
    }
    if (inCustom && line.trim() && !/^    /.test(line)) inCustom = false;
    if (inCustom) {
      const match = line.match(/^    (.+?):\s*(.*?)\s*$/);
      if (match) keys.set(normalizeKey(scalarText(match[1])), match[2]);
    }
  }

  return keys;
}

function insertCustomValues(source, additions) {
  if (!additions.length) return source.replace(/\r\n/g, "\n");

  const normalized = source.replace(/\r\n/g, "\n");
  const { frontmatter, body } = splitFrontmatter(normalized);
  const lines = frontmatter.split("\n");
  let comparisonStart = lines.findIndex((line) => /^comparisonData:\s*$/.test(line));

  if (comparisonStart < 0) {
    let insertAt = lines.findIndex((line) => /^comparisonFilters:\s*$/.test(line));
    if (insertAt < 0) insertAt = lines.length;
    lines.splice(
      insertAt,
      0,
      "comparisonData:",
      "  version: 1",
      "  custom:",
      ...additions.map(({ key, raw }) => `    ${quoteKey(key)}: ${raw}`)
    );
  } else {
    let comparisonEnd = lines.length;
    for (let i = comparisonStart + 1; i < lines.length; i++) {
      if (/^\S/.test(lines[i]) && lines[i].trim()) {
        comparisonEnd = i;
        break;
      }
    }

    let customStart = -1;
    for (let i = comparisonStart + 1; i < comparisonEnd; i++) {
      if (/^  custom:\s*$/.test(lines[i])) {
        customStart = i;
        break;
      }
    }

    if (!lines.slice(comparisonStart, comparisonEnd).some((line) => /^  version:\s*/.test(line))) {
      lines.splice(comparisonStart + 1, 0, "  version: 1");
      comparisonEnd++;
      if (customStart >= 0) customStart++;
    }

    if (customStart < 0) {
      lines.splice(
        comparisonEnd,
        0,
        "  custom:",
        ...additions.map(({ key, raw }) => `    ${quoteKey(key)}: ${raw}`)
      );
    } else {
      let customEnd = comparisonEnd;
      for (let i = customStart + 1; i < comparisonEnd; i++) {
        if (lines[i].trim() && !/^    /.test(lines[i])) {
          customEnd = i;
          break;
        }
      }
      lines.splice(
        customEnd,
        0,
        ...additions.map(({ key, raw }) => `    ${quoteKey(key)}: ${raw}`)
      );
    }
  }

  return `---\n${lines.join("\n").trimEnd()}\n---\n\n${body.replace(/^\n+/, "")}`;
}

function migrateComparisonFile(file, centralized) {
  const source = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const { frontmatter, body } = splitFrontmatter(source);
  const lines = frontmatter.split("\n");
  const blocks = parseItemBlocks(file).sort((a, b) => b.start - a.start);
  let changed = false;

  for (const block of blocks) {
    if (block.valuesStart < 0 || !block.values.length) continue;

    const keep = block.values.filter((entry) => {
      const id = `${block.slug}|${normalizeKey(entry.key)}|${entry.raw}`;
      return !centralized.has(id);
    });

    const existingOverrideKeys = new Set(
      block.overrides.map((entry) => normalizeKey(entry.key))
    );
    const additions = keep.filter((entry) =>
      !existingOverrideKeys.has(normalizeKey(entry.key))
    );

    lines.splice(block.valuesStart, block.valuesEnd - block.valuesStart);

    if (additions.length) {
      if (block.overridesStart >= 0) {
        const shift = block.valuesStart < block.overridesStart
          ? block.valuesEnd - block.valuesStart
          : 0;
        lines.splice(
          block.overridesEnd - shift,
          0,
          ...additions.map(({ key, raw }) => `      ${quoteKey(key)}: ${raw}`)
        );
      } else {
        lines.splice(
          block.valuesStart,
          0,
          "    overrides:",
          ...additions.map(({ key, raw }) => `      ${quoteKey(key)}: ${raw}`)
        );
      }
    }

    changed = true;
  }

  return changed
    ? {
        changed: true,
        source: `---\n${lines.join("\n").trimEnd()}\n---\n\n${body.replace(/^\n+/, "")}`
      }
    : { changed: false, source };
}

export function runMigration({ write = WRITE } = {}) {
  const comparisonFiles = walk(COMPARISON_DIR);
  const productFiles = walk(PRODUCT_DIR);
  const productBySlug = new Map(productFiles.map((file) => [productSlug(file), file]));
  const occurrences = new Map();

  for (const file of comparisonFiles) {
    for (const block of parseItemBlocks(file)) {
      for (const entry of block.values) {
        const normalizedKey = normalizeKey(entry.key);
        const groupKey = `${block.slug}|${normalizedKey}`;
        const list = occurrences.get(groupKey) ?? [];
        list.push({ ...entry, slug: block.slug, file });
        occurrences.set(groupKey, list);
      }
    }
  }

  const additionsByProduct = new Map();
  const centralized = new Set();
  let conflicts = 0;
  let editorial = 0;

  for (const [groupKey, list] of occurrences) {
    const [slug, normalizedKey] = groupKey.split("|");
    if (!productBySlug.has(slug)) continue;

    if (EDITORIAL_KEYS.has(normalizedKey)) {
      editorial += list.length;
      continue;
    }

    const unique = new Set(list.map((entry) =>
      JSON.stringify(parseInlineValue(entry.raw))
    ));

    if (unique.size !== 1) {
      conflicts += list.length;
      continue;
    }

    const productFile = productBySlug.get(slug);
    const currentSource = fs.readFileSync(productFile, "utf8");
    const existing = existingCustomKeys(currentSource);
    const representative = list[0];

    if (existing.has(normalizedKey)) {
      const existingValue = JSON.stringify(parseInlineValue(existing.get(normalizedKey)));
      if (existingValue !== [...unique][0]) {
        conflicts += list.length;
        continue;
      }
    } else {
      const additions = additionsByProduct.get(slug) ?? [];
      additions.push({ key: representative.key, raw: representative.raw });
      additionsByProduct.set(slug, additions);
    }

    for (const entry of list) {
      centralized.add(`${slug}|${normalizedKey}|${entry.raw}`);
    }
  }

  let productChanges = 0;
  for (const [slug, additions] of additionsByProduct) {
    const file = productBySlug.get(slug);
    const source = fs.readFileSync(file, "utf8");
    const next = insertCustomValues(source, additions);
    if (next === source.replace(/\r\n/g, "\n")) continue;
    productChanges++;
    console.log(`${write ? "[product]" : "[check product]"} ${path.relative(PRODUCT_DIR, file)}`);
    if (write) fs.writeFileSync(file, next, "utf8");
  }

  let comparisonChanges = 0;
  for (const file of comparisonFiles) {
    const result = migrateComparisonFile(file, centralized);
    if (!result.changed) continue;
    comparisonChanges++;
    console.log(`${write ? "[comparison]" : "[check comparison]"} ${path.relative(COMPARISON_DIR, file)}`);
    if (write) fs.writeFileSync(file, result.source, "utf8");
  }

  const stats = {
    productChanges,
    comparisonChanges,
    centralizedValues: centralized.size,
    retainedEditorialValues: editorial,
    retainedConflictingValues: conflicts
  };

  console.log("");
  console.log(`Comparison Data Migration ${write ? "angewendet" : "geprüft"}:`);
  console.log(`- Produktdateien: ${productChanges}`);
  console.log(`- Vergleichsdateien: ${comparisonChanges}`);
  console.log(`- zentralisierte Werte: ${centralized.size}`);
  console.log(`- redaktionelle Overrides: ${editorial}`);
  console.log(`- widersprüchliche Overrides: ${conflicts}`);

  return stats;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  runMigration({ write: WRITE });
}
