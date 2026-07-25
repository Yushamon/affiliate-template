#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ID = "pfotentechnik-comparison-data-platform-phase3-1.2.0";
const CHECK = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");
const FACTUAL_ARG = process.argv.find((arg) =>
  arg.startsWith("--factual-threshold=")
);
const FACTUAL_THRESHOLD = FACTUAL_ARG
  ? Number(FACTUAL_ARG.split("=")[1])
  : 85;

function fail(message) {
  throw new Error(message);
}

function findRoot() {
  let current = process.cwd();

  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  fail("Repository nicht gefunden.");
}

function run(root, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });

  if (result.error) fail(result.error.message);

  if (result.status !== 0) {
    fail(
      `${command} ${args.join(" ")} fehlgeschlagen ` +
      `(Exit ${result.status}).`
    );
  }
}

function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;

  for (
    const entry of fs.readdirSync(
      directory,
      { withFileTypes: true }
    )
  ) {
    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) walk(full, output);
    else if (entry.isFile()) output.push(full);
  }

  return output;
}

function writeAtomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, content, "utf8");
  fs.renameSync(temporary, file);
}

const root = findRoot();
const app = path.join(root, "apps", "pfotentechnik");
const scriptDir = path.join(
  app,
  "scripts",
  "comparison-platform"
);

const phase3Script = `import fs from "node:fs";
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
  const normalized = source.replace(/\\r\\n/g, "\\n");
  if (!normalized.startsWith("---\\n")) return null;

  const end = normalized.indexOf("\\n---", 4);
  if (end < 0) return null;

  return {
    normalized,
    frontmatter: normalized.slice(4, end),
    body: normalized.slice(end + 4).replace(/^\\n/, "")
  };
}

function itemBlocks(lines) {
  const blocks = [];
  let itemsStart = -1;
  let itemsEnd = lines.length;

  for (let index = 0; index < lines.length; index++) {
    if (/^items:\\s*$/.test(lines[index])) {
      itemsStart = index;
      break;
    }
  }

  if (itemsStart < 0) return blocks;

  for (let index = itemsStart + 1; index < lines.length; index++) {
    if (/^\\S/.test(lines[index]) && lines[index].trim()) {
      itemsEnd = index;
      break;
    }
  }

  const starts = [];

  for (let index = itemsStart + 1; index < itemsEnd; index++) {
    if (/^  -\\s+slug:\\s*/.test(lines[index])) {
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
      /^  -\\s+slug:\\s*(.+?)\\s*$/
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

  const lines = range.frontmatter.split("\\n");
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
      if (/^    values:\\s*$/.test(lines[index])) {
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
            /^      (.+?):\\s*(.*?)\\s*$/
          );

          if (match) {
            legacy.push({
              key: match[1].trim().replace(/^["']|["']$/g, ""),
              raw: match[2]
            });
          }
        }
      }

      if (/^    overrides:\\s*$/.test(lines[index])) {
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
            /^      (.+?):\\s*(.*?)\\s*$/
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
              \`      \${quoteKey(key)}: \${raw}\`
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
              \`      \${quoteKey(key)}: \${raw}\`
          )
        );
      }

      changed = true;
    }
  }

  if (!changed) return source.replace(/\\r\\n/g, "\\n");

  return (
    \`---\\n\${lines.join("\\n").trimEnd()}\\n---\\n\\n\` +
    range.body.replace(/^\\n+/, "")
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
      comparison.source.replace(/\\r\\n/g, "\\n")
    ) {
      continue;
    }

    changedComparisons++;

    console.log(
      \`\${write ? "[comparison]" : "[check comparison]"} \` +
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
    JSON.stringify(report, null, 2) + "\\n",
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
      \`Erstellt: \${report.generatedAt}\`,
      "",
      \`- Tabellenzellen: \${total}\`,
      \`- Faktisch belegt: \${factualResolved}\`,
      \`- Transparent als nicht dokumentiert markiert: \${projectedDisclosed}\`,
      \`- Faktische Datenabdeckung: \${initialFactualCoverage} %\`,
      \`- Darstellbare Abdeckung: \${projectedRenderableCoverage} %\`,
      \`- Migrierte Legacy-Werte: \${legacyValues}\`,
      \`- Geänderte Vergleiche: \${changedComparisons}\`,
      ""
    ].join("\\n"),
    "utf8"
  );

  console.log("");
  console.log("Comparison Data Platform – Phase 3");
  console.log(
    \`Faktische Datenabdeckung: \${initialFactualCoverage} %\`
  );
  console.log(
    \`Darstellbare Abdeckung: \${projectedRenderableCoverage} %\`
  );
  console.log(
    \`Transparent fehlende Angaben: \${projectedDisclosed}\`
  );
  console.log(
    \`Migrierte Legacy-Werte: \${legacyValues}\`
  );

  return report;
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(
    process.argv[1].replaceAll("\\\\", "/")
  )
) {
  runPhase3({ write: WRITE });
}
`;

const verifyScript = `import fs from "node:fs";
import path from "node:path";
import {
  COMPARISON_DIR,
  PRODUCT_DIR,
  REPORT_DIR,
  loadEntries,
  slugOf,
  ensureReportDir
} from "./core.mjs";
import { resolveComparisonValue } from "./data-platform.mjs";

const thresholdArg = process.argv.find((arg) =>
  arg.startsWith("--factual-threshold=")
);
const FACTUAL_THRESHOLD = thresholdArg
  ? Number(thresholdArg.split("=")[1])
  : 85;

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  return Object.values(value)
    .filter((entry) => entry && typeof entry === "object");
};

const comparisons = loadEntries(COMPARISON_DIR);
const products = loadEntries(PRODUCT_DIR);
const productBySlug = new Map(
  products.map((entry) => [slugOf(entry), entry.data])
);

let total = 0;
let factual = 0;
let disclosed = 0;
let unresolved = 0;
let legacy = 0;

for (const comparison of comparisons) {
  for (const item of asList(comparison.data.items)) {
    legacy += Object.keys(
      item?.values &&
      typeof item.values === "object"
        ? item.values
        : {}
    ).length;

    const product =
      item.type === "product"
        ? productBySlug.get(item.slug)
        : undefined;

    for (const criterion of asList(comparison.data.criteria)) {
      if (!criterion?.key) continue;
      total++;

      const value = resolveComparisonValue({
        product,
        item,
        criterion
      });

      if (!value || value === "–") unresolved++;
      else if (value === "Nicht dokumentiert") disclosed++;
      else factual++;
    }
  }
}

const factualCoverage = total
  ? Math.round((factual / total) * 1000) / 10
  : 100;

const renderableCoverage = total
  ? Math.round(
      ((factual + disclosed) / total) * 1000
    ) / 10
  : 100;

console.log("Comparison Data Platform – Phase-3-Verifikation");
console.log(\`Faktische Abdeckung: \${factualCoverage} %\`);
console.log(\`Darstellbare Abdeckung: \${renderableCoverage} %\`);
console.log(\`Transparent fehlend: \${disclosed}\`);
console.log(\`Nicht aufgelöst: \${unresolved}\`);
console.log(\`Legacy-values: \${legacy}\`);
console.log(\`Faktischer Schwellenwert: \${FACTUAL_THRESHOLD} %\`);

if (
  renderableCoverage !== 100 ||
  unresolved !== 0 ||
  legacy !== 0 ||
  factualCoverage < FACTUAL_THRESHOLD
) {
  process.exitCode = 1;
}
`;

const files = {
  "apps/pfotentechnik/scripts/comparison-platform/phase3.mjs":
    phase3Script,
  "apps/pfotentechnik/scripts/comparison-platform/phase3-verify.mjs":
    verifyScript
};

console.log(`[${ID}] Repository: ${root}`);
console.log(
  `[${ID}] Faktischer Schwellenwert: ` +
  `${FACTUAL_THRESHOLD} %`
);

const plans = Object.entries(files).map(
  ([relativePath, content]) => {
    const file = path.join(root, relativePath);
    const original = fs.existsSync(file)
      ? fs.readFileSync(file, "utf8")
      : null;

    console.log(
      `[${ID}] ${
        original === content ? "OK" : "ÄNDERN"
      }: ${relativePath}`
    );

    return {
      relativePath,
      file,
      original,
      content,
      changed: original !== content
    };
  }
);

if (CHECK) process.exit(0);

const affected = [
  ...plans.map((plan) => plan.file),
  ...walk(
    path.join(
      app,
      "src",
      "content",
      "comparisons"
    )
  ).filter((file) => /\.mdx?$/.test(file))
];

const backup = path.join(
  root,
  ".patch-backups",
  `${ID}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

for (const file of affected) {
  if (!fs.existsSync(file)) continue;

  const destination = path.join(
    backup,
    path.relative(root, file)
  );

  fs.mkdirSync(path.dirname(destination), {
    recursive: true
  });

  fs.copyFileSync(file, destination);
}

try {
  for (const plan of plans) {
    writeAtomic(plan.file, plan.content);
  }

  run(root, "node", [
    "apps/pfotentechnik/scripts/comparison-platform/phase3.mjs",
    "--write",
    `--factual-threshold=${FACTUAL_THRESHOLD}`
  ]);

  run(root, "node", [
    "apps/pfotentechnik/scripts/comparison-platform/phase3-verify.mjs",
    `--factual-threshold=${FACTUAL_THRESHOLD}`
  ]);

  if (!SKIP_BUILD) {
    run(root, "npm", [
      "run",
      "build:pfotentechnik"
    ]);
  }

  console.log(`[${ID}] Phase 3 erfolgreich.`);
} catch (error) {
  console.error(`[${ID}] Rollback ...`);

  for (const file of affected) {
    const backupFile = path.join(
      backup,
      path.relative(root, file)
    );

    if (!fs.existsSync(backupFile)) continue;

    fs.mkdirSync(path.dirname(file), {
      recursive: true
    });

    fs.copyFileSync(backupFile, file);
  }

  console.error(`[${ID}] Rollback abgeschlossen.`);
  throw error;
}
