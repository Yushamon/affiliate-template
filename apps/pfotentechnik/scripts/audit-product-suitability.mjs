import fs from "node:fs";
import path from "node:path";

const productsDir = path.resolve("src/content/products");

function splitFrontmatter(source) {
  const match = source.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  return match?.[1] ?? null;
}

function parseInlineArray(raw) {
  const value = raw.trim();
  if (!value.startsWith("[") || !value.endsWith("]")) return null;
  return value
    .slice(1, -1)
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function parseInlineObjectArray(raw, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = raw.match(new RegExp(`(?:^|[,\\s{])${escapedKey}\\s*:\\s*(\\[[^\\]]*\\])`));
  return match ? parseInlineArray(match[1]) : null;
}

function inspect(frontmatter) {
  const lines = frontmatter.split(/\r?\n/);
  const topLevelForbidden = [];
  let comparisonStart = -1;
  let comparisonCount = 0;

  lines.forEach((line, index) => {
    const top = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:/)?.[1];
    if (["animal", "petSize", "suitabilityConfidence", "suitabilityReviewRequired"].includes(top)) {
      topLevelForbidden.push(top);
    }
    if (top === "comparisonFilters") {
      comparisonStart = index;
      comparisonCount += 1;
    }
  });

  const result = {
    animal: [],
    petSize: [],
    comparisonCount,
    topLevelForbidden,
    malformed: [],
  };

  if (comparisonStart < 0) return result;

  const comparisonDeclaration = lines[comparisonStart].replace(/^comparisonFilters\s*:\s*/, "").trim();
  if (comparisonDeclaration) {
    for (const key of ["animal", "petSize"]) {
      const parsed = parseInlineObjectArray(comparisonDeclaration, key);
      if (parsed === null) result.malformed.push(key);
      else result[key] = parsed;
    }
    return result;
  }

  for (let i = comparisonStart + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() && !/^[ \t]/.test(line)) break;

    const child = line.match(/^  ([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!child) continue;

    if (child[1] === "animal" || child[1] === "petSize") {
      const key = child[1];
      const rawValue = child[2].trim();
      if (rawValue) {
        const parsed = parseInlineArray(rawValue);
        if (parsed === null) result.malformed.push(key);
        else result[key] = parsed;
        continue;
      }

      const values = [];
      let cursor = i + 1;
      for (; cursor < lines.length; cursor += 1) {
        const nested = lines[cursor];
        if (!nested.trim()) continue;
        if (/^  [A-Za-z][A-Za-z0-9_-]*\s*:/.test(nested) || !/^[ \t]/.test(nested)) break;
        const item = nested.match(/^\s{4,}-\s*(.+?)\s*$/)?.[1];
        if (!item) break;
        values.push(item.replace(/^['"]|['"]$/g, ""));
      }
      if (!values.length) result.malformed.push(key);
      else result[key] = values;
      i = cursor - 1;
    }
  }

  return result;
}

const files = fs.readdirSync(productsDir)
  .filter((name) => name.endsWith(".md"))
  .sort();

const rows = [];
let hardErrors = 0;

for (const file of files) {
  const source = fs.readFileSync(path.join(productsDir, file), "utf8");
  const frontmatter = splitFrontmatter(source);

  if (!frontmatter) {
    rows.push({ file, error: "invalid-frontmatter" });
    hardErrors += 1;
    continue;
  }

  const result = inspect(frontmatter);
  const errors = [];

  if (result.comparisonCount > 1) errors.push("duplicate-comparisonFilters");
  if (result.topLevelForbidden.length) errors.push("forbidden-top-level-fields");
  if (result.malformed.length) errors.push("malformed-inline-arrays");
  if (!result.animal.length) errors.push("animal-missing");

  if (errors.length) hardErrors += 1;

  rows.push({
    file,
    animal: result.animal,
    petSize: result.petSize,
    errors,
    reviewRequired: result.petSize.length === 0,
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  totalProducts: rows.length,
  withAnimal: rows.filter((row) => row.animal?.length).length,
  withPetSize: rows.filter((row) => row.petSize?.length).length,
  reviewRequired: rows.filter((row) => row.reviewRequired).length,
  errors: hardErrors,
};

console.log("Product Suitability Audit");
console.log(JSON.stringify(summary, null, 2));

const reportDir = path.resolve("reports");
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, "product-suitability.json"),
  JSON.stringify({ summary, products: rows }, null, 2) + "\n",
  "utf8"
);

process.exitCode = hardErrors > 0 ? 1 : 0;
