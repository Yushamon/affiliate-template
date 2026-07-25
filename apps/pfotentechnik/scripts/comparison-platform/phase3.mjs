import fs from "node:fs";
import path from "node:path";
import {
  COMPARISON_DIR,
  PRODUCT_DIR,
  REPORT_DIR,
  loadEntries,
  slugOf,
  splitFrontmatter,
  ensureReportDir
} from "./core.mjs";
import { resolveComparisonValue } from "./data-platform.mjs";

const WRITE = process.argv.includes("--write");
const FACTUAL_ARG = process.argv.find((arg) =>
  arg.startsWith("--factual-threshold=")
);
const FACTUAL_THRESHOLD = FACTUAL_ARG
  ? Number(FACTUAL_ARG.split("=")[1])
  : 85;

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  return Object.entries(value)
    .sort(([a], [b]) => {
      const an = Number(a);
      const bn = Number(b);
      if (Number.isFinite(an) && Number.isFinite(bn)) {
        return an - bn;
      }
      return a.localeCompare(b, "de");
    })
    .map(([, entry]) => entry)
    .filter((entry) => entry && typeof entry === "object");
};

const quoteKey = (key) =>
  /^[A-Za-z0-9_-]+$/.test(key)
    ? key
    : JSON.stringify(key);

const quoteValue = (value) =>
  JSON.stringify(String(value));

function frontmatterRange(source) {
  const normalized = source.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return null;

  const end = normalized.indexOf("\n---", 4);
  if (end < 0) return null;

  return {
    normalized,
    frontmatter: normalized.slice(4, end),
    body: normalized.slice(end + 4).replace(/^\n/, "")
  };
}

function itemBlocks(lines) {
  const blocks = [];
  let itemsStart = -1;
  let itemsEnd = lines.length;

  for (let index = 0; index < lines.length; index++) {
    if (/^items:\s*$/.test(lines[index])) {
      itemsStart = index;
      break;
    }
  }

  if (itemsStart < 0) return blocks;

  for (let index = itemsStart + 1; index < lines.length; index++) {
    if (/^\S/.test(lines[index]) && lines[index].trim()) {
      itemsEnd = index;
      break;
    }
  }

  const starts = [];

  for (let index = itemsStart + 1; index < itemsEnd; index++) {
    if (/^  -\s+slug:\s*/.test(lines[index])) {
      starts.push(index);
    }
  }

  for (let position = 0; position < starts.length; position++) {
    const start = starts[position];
    const end =
      position + 1 < starts.length
        ? starts[position + 1]
        : itemsEnd;

    const match = lines[start].match(
      /^  -\s+slug:\s*(.+?)\s*$/
    );

    const slug = match
      ? match[1].trim().replace(/^["']|["']$/g, "")
      : "";

    blocks.push({ slug, start, end });
  }

  return blocks;
}

function migrateLegacyAndAddMissing(
  source,
  missingBySlug
) {
  const range = frontmatterRange(source);
  if (!range) return source;

  const lines = range.frontmatter.split("\n");
  const blocks = itemBlocks(lines)
    .sort((a, b) => b.start - a.start);

  let changed = false;

  for (const block of blocks) {
    const missing = missingBySlug.get(block.slug) ?? [];
    const legacy = [];
    const existingOverrides = new Map();

    let valuesStart = -1;
    let valuesEnd = -1;
    let overridesStart = -1;
    let overridesEnd = -1;

    for (
      let index = block.start + 1;
      index < block.end;
      index++
    ) {
      if (/^    values:\s*$/.test(lines[index])) {
        valuesStart = index;
        valuesEnd = index + 1;

        for (
          let child = index + 1;
          child < block.end;
          child++
        ) {
          if (
            lines[child].trim() &&
            !/^      /.test(lines[child])
          ) {
            break;
          }

          valuesEnd = child + 1;

          const match = lines[child].match(
            /^      (.+?):\s*(.*?)\s*$/
          );

          if (match) {
            legacy.push({
              key: match[1].trim().replace(/^["']|["']$/g, ""),
              raw: match[2]
            });
          }
        }
      }

      if (/^    overrides:\s*$/.test(lines[index])) {
        overridesStart = index;
        overridesEnd = index + 1;

        for (
          let child = index + 1;
          child < block.end;
          child++
        ) {
          if (
            lines[child].trim() &&
            !/^      /.test(lines[child])
          ) {
            break;
          }

          overridesEnd = child + 1;

          const match = lines[child].match(
            /^      (.+?):\s*(.*?)\s*$/
          );

          if (match) {
            existingOverrides.set(
              match[1].trim().replace(/^["']|["']$/g, ""),
              match[2]
            );
          }
        }
      }
    }

    const additions = [];

    for (const entry of legacy) {
      if (!existingOverrides.has(entry.key)) {
        additions.push(entry);
        existingOverrides.set(entry.key, entry.raw);
      }
    }

    for (const criterionKey of missing) {
      if (!existingOverrides.has(criterionKey)) {
        additions.push({
          key: criterionKey,
          raw: quoteValue("Nicht dokumentiert")
        });
        existingOverrides.set(
          criterionKey,
          quoteValue("Nicht dokumentiert")
        );
      }
    }

    if (valuesStart >= 0) {
      lines.splice(
        valuesStart,
        valuesEnd - valuesStart
      );
      changed = true;

      if (overridesStart > valuesStart) {
        const removed = valuesEnd - valuesStart;
        overridesStart -= removed;
        overridesEnd -= removed;
      }
    }

    if (additions.length) {
      if (overridesStart >= 0) {
        lines.splice(
          overridesEnd,
          0,
          ...additions.map(
            ({ key, raw }) =>
              `      ${quoteKey(key)}: ${raw}`
          )
        );
      } else {
        const insertAt =
          valuesStart >= 0
            ? valuesStart
            : block.start + 1;

        lines.splice(
          insertAt,
          0,
          "    overrides:",
          ...additions.map(
            ({ key, raw }) =>
              `      ${quoteKey(key)}: ${raw}`
          )
        );
      }

      changed = true;
    }
  }

  if (!changed) return source.replace(/\r\n/g, "\n");

  return (
    `---\n${lines.join("\n").trimEnd()}\n---\n\n` +
    range.body.replace(/^\n+/, "")
  );
}

export function runPhase3({ write = WRITE } = {}) {
  const comparisons = loadEntries(COMPARISON_DIR);
  const products = loadEntries(PRODUCT_DIR);

  const productBySlug = new Map(
    products.map((entry) => [slugOf(entry), entry.data])
  );

  const missingByFile = new Map();
  let factualResolved = 0;
  let disclosedMissing = 0;
  let total = 0;
  let legacyValues = 0;

  for (const comparison of comparisons) {
    const items = asList(comparison.data.items);
    const criteria = asList(comparison.data.criteria);

    for (const item of items) {
      const legacy =
        item?.values &&
        typeof item.values === "object"
          ? item.values
          : {};

      legacyValues += Object.keys(legacy).length;

      const product =
        item.type === "product"
          ? productBySlug.get(item.slug)
          : undefined;

      for (const criterion of criteria) {
        if (!criterion?.key) continue;
        total++;

        const value = resolveComparisonValue({
          product,
          item,
          criterion
        });

        if (value && value !== "–") {
          if (value === "Nicht dokumentiert") {
            disclosedMissing++;
          } else {
            factualResolved++;
          }
          continue;
        }

        const fileMap =
          missingByFile.get(comparison.file) ?? new Map();

        const keys = fileMap.get(item.slug) ?? [];
        if (!keys.includes(criterion.key)) {
          keys.push(criterion.key);
        }

        fileMap.set(item.slug, keys);
        missingByFile.set(comparison.file, fileMap);
      }
    }
  }

  let changedComparisons = 0;

  for (const comparison of comparisons) {
    const missing =
      missingByFile.get(comparison.file) ?? new Map();

    const next = migrateLegacyAndAddMissing(
      comparison.source,
      missing
    );

    if (
      next ===
      comparison.source.replace(/\r\n/g, "\n")
    ) {
      continue;
    }

    changedComparisons++;

    console.log(
      `${write ? "[comparison]" : "[check comparison]"} ` +
      path.basename(comparison.file)
    );

    if (write) {
      fs.writeFileSync(
        comparison.file,
        next,
        "utf8"
      );
    }
  }

  const initialFactualCoverage = total
    ? Math.round(
        (factualResolved / total) * 1000
      ) / 10
    : 100;

  const projectedDisclosed =
    disclosedMissing +
    [...missingByFile.values()]
      .reduce(
        (sum, fileMap) =>
          sum +
          [...fileMap.values()]
            .reduce(
              (inner, keys) => inner + keys.length,
              0
            ),
        0
      );

  const projectedRenderableCoverage = total
    ? Math.round(
        (
          (
            factualResolved +
            projectedDisclosed
          ) /
          total
        ) *
        1000
      ) / 10
    : 100;

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      comparisons: comparisons.length,
      products: products.length,
      cells: total,
      factualResolved,
      disclosedMissing: projectedDisclosed,
      unresolvedAfterPhase3:
        total -
        factualResolved -
        projectedDisclosed,
      factualCoverage:
        initialFactualCoverage,
      renderableCoverage:
        projectedRenderableCoverage,
      migratedLegacyValues:
        legacyValues,
      changedComparisons
    }
  };

  ensureReportDir();

  fs.writeFileSync(
    path.join(
      REPORT_DIR,
      "comparison-data-phase3.json"
    ),
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  fs.writeFileSync(
    path.join(
      REPORT_DIR,
      "comparison-data-phase3.md"
    ),
    [
      "# Comparison Data Platform – Phase 3",
      "",
      `Erstellt: ${report.generatedAt}`,
      "",
      `- Tabellenzellen: ${total}`,
      `- Faktisch belegt: ${factualResolved}`,
      `- Transparent als nicht dokumentiert markiert: ${projectedDisclosed}`,
      `- Faktische Datenabdeckung: ${initialFactualCoverage} %`,
      `- Darstellbare Abdeckung: ${projectedRenderableCoverage} %`,
      `- Migrierte Legacy-Werte: ${legacyValues}`,
      `- Geänderte Vergleiche: ${changedComparisons}`,
      ""
    ].join("\n"),
    "utf8"
  );

  console.log("");
  console.log("Comparison Data Platform – Phase 3");
  console.log(
    `Faktische Datenabdeckung: ${initialFactualCoverage} %`
  );
  console.log(
    `Darstellbare Abdeckung: ${projectedRenderableCoverage} %`
  );
  console.log(
    `Transparent fehlende Angaben: ${projectedDisclosed}`
  );
  console.log(
    `Migrierte Legacy-Werte: ${legacyValues}`
  );

  return report;
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(
    process.argv[1].replaceAll("\\", "/")
  )
) {
  runPhase3({ write: WRITE });
}
