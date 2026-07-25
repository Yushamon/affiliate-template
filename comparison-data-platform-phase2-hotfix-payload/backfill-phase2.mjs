import fs from "node:fs";
import path from "node:path";
import {
  COMPARISON_DIR,
  PRODUCT_DIR,
  loadEntries,
  slugOf,
  splitFrontmatter
} from "./core.mjs";
import { resolveComparisonValue } from "./data-platform.mjs";

const WRITE = process.argv.includes("--write");

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  return Object.entries(value)
    .sort(([a], [b]) => {
      const aNumber = Number(a);
      const bNumber = Number(b);

      if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
        return aNumber - bNumber;
      }

      return a.localeCompare(b, "de");
    })
    .map(([, entry]) => entry)
    .filter((entry) => entry && typeof entry === "object");
};

const quote = (value) =>
  JSON.stringify(String(value));

function insertCustom(source, additions) {
  if (!additions.length) return source;

  const normalized = source.replace(/\r\n/g, "\n");
  const { frontmatter, body } = splitFrontmatter(normalized);
  const lines = frontmatter.split("\n");

  let comparisonStart = lines.findIndex((line) =>
    /^comparisonData:\s*$/.test(line)
  );

  if (comparisonStart < 0) {
    let insertAt = lines.findIndex((line) =>
      /^comparisonFilters:\s*$/.test(line)
    );

    if (insertAt < 0) insertAt = lines.length;

    lines.splice(
      insertAt,
      0,
      "comparisonData:",
      "  version: 1",
      "  custom:",
      ...additions.map(({ key, value }) =>
        `    ${key}: ${quote(value)}`
      )
    );
  } else {
    let comparisonEnd = lines.length;

    for (
      let index = comparisonStart + 1;
      index < lines.length;
      index++
    ) {
      if (/^\S/.test(lines[index]) && lines[index].trim()) {
        comparisonEnd = index;
        break;
      }
    }

    let customStart = -1;

    for (
      let index = comparisonStart + 1;
      index < comparisonEnd;
      index++
    ) {
      if (/^  custom:\s*$/.test(lines[index])) {
        customStart = index;
        break;
      }
    }

    if (customStart < 0) {
      lines.splice(
        comparisonEnd,
        0,
        "  custom:",
        ...additions.map(({ key, value }) =>
          `    ${key}: ${quote(value)}`
        )
      );
    } else {
      let customEnd = comparisonEnd;

      for (
        let index = customStart + 1;
        index < comparisonEnd;
        index++
      ) {
        if (lines[index].trim() && !/^    /.test(lines[index])) {
          customEnd = index;
          break;
        }
      }

      const existingKeys = new Set(
        lines
          .slice(customStart + 1, customEnd)
          .map((line) => line.match(/^    ([^:]+):/)?.[1]?.trim())
          .filter(Boolean)
      );

      const missing = additions.filter(
        ({ key }) => !existingKeys.has(key)
      );

      lines.splice(
        customEnd,
        0,
        ...missing.map(({ key, value }) =>
          `    ${key}: ${quote(value)}`
        )
      );
    }
  }

  return (
    `---\n${lines.join("\n").trimEnd()}\n---\n\n` +
    body.replace(/^\n+/, "")
  );
}

export function runBackfill({ write = WRITE } = {}) {
  const comparisons = loadEntries(COMPARISON_DIR);
  const products = loadEntries(PRODUCT_DIR);

  const productBySlug = new Map(
    products.map((entry) => [slugOf(entry), entry])
  );

  const proposals = new Map();
  let malformedComparisons = 0;
  let malformedItems = 0;

  for (const comparison of comparisons) {
    const items = asList(comparison.data.items);
    const criteria = asList(comparison.data.criteria);

    if (
      comparison.data.items &&
      !Array.isArray(comparison.data.items)
    ) {
      malformedComparisons++;
      console.log(
        `[compat] items als Objekt gelesen: ${comparison.rel}`
      );
    }

    for (const item of items) {
      if (!item || typeof item !== "object") {
        malformedItems++;
        continue;
      }

      if (item.type !== "product") continue;

      const product = productBySlug.get(item.slug);
      if (!product) continue;

      for (const criterion of criteria) {
        if (
          !criterion ||
          typeof criterion !== "object" ||
          !criterion.key
        ) {
          malformedItems++;
          continue;
        }

        const value = resolveComparisonValue({
          product: product.data,
          item,
          criterion
        });

        if (!value || value === "–") continue;

        const productProposals =
          proposals.get(item.slug) ?? new Map();

        const values =
          productProposals.get(criterion.key) ?? new Set();

        values.add(value);
        productProposals.set(criterion.key, values);
        proposals.set(item.slug, productProposals);
      }
    }
  }

  let changed = 0;
  let conflicts = 0;

  for (const [slug, criteria] of proposals) {
    const product = productBySlug.get(slug);
    if (!product) continue;

    const additions = [];

    for (const [key, values] of criteria) {
      if (values.size === 1) {
        additions.push({
          key,
          value: [...values][0]
        });
      } else {
        conflicts++;
      }
    }

    const next = insertCustom(product.source, additions);

    if (next === product.source.replace(/\r\n/g, "\n")) {
      continue;
    }

    changed++;

    console.log(
      `${write ? "[product]" : "[check product]"} ` +
      path.basename(product.file)
    );

    if (write) {
      fs.writeFileSync(product.file, next, "utf8");
    }
  }

  console.log("");
  console.log(
    `Phase-2-Backfill: ${changed} Produktdatei(en) ` +
    `${write ? "geändert" : "würden geändert"}.`
  );
  console.log(`Konflikte: ${conflicts}`);
  console.log(
    `Parser-Kompatibilität: ${malformedComparisons} ` +
    `Vergleich(e) mit Objektstruktur erkannt.`
  );

  if (malformedItems > 0) {
    console.log(
      `Übersprungene unvollständige Einträge: ${malformedItems}`
    );
  }

  return {
    changed,
    conflicts,
    malformedComparisons,
    malformedItems
  };
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(
    process.argv[1].replaceAll("\\", "/")
  )
) {
  runBackfill({ write: WRITE });
}
