#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import YAML from "yaml";

const root = process.cwd();
const productsDir = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "content",
  "products"
);

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const write = !checkOnly;

if (!fs.existsSync(productsDir)) {
  console.error(`Produktverzeichnis fehlt: ${productsDir}`);
  process.exit(1);
}

const extractFrontmatter = (source, file) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(`Kein gültiges Frontmatter in ${file}`);
  }

  return {
    raw: match[1],
    full: match[0],
    body: source.slice(match[0].length)
  };
};

const roundRating = (value) =>
  Math.round((value + Number.EPSILON) * 10) / 10;

const roundScore = (value) =>
  Math.round((value + Number.EPSILON) * 20);

const formatRating = (value) =>
  value.toFixed(1);

const replaceTopLevelNumber = (frontmatter, key, value) => {
  const linePattern = new RegExp(
    `^${key}:\\s*[-+]?\\d+(?:\\.\\d+)?\\s*$`,
    "m"
  );

  if (linePattern.test(frontmatter)) {
    return frontmatter.replace(linePattern, `${key}: ${value}`);
  }

  const ratingsIndex = frontmatter.search(/^ratings:\s*/m);
  if (ratingsIndex >= 0) {
    return (
      frontmatter.slice(0, ratingsIndex) +
      `${key}: ${value}\n` +
      frontmatter.slice(ratingsIndex)
    );
  }

  return `${frontmatter.trimEnd()}\n${key}: ${value}`;
};

const files = fs
  .readdirSync(productsDir)
  .filter((name) => name.endsWith(".md"))
  .sort();

const report = {
  generatedAt: new Date().toISOString(),
  mode: checkOnly ? "check" : "write",
  rounding: {
    rating: "arithmetic mean rounded to one decimal",
    score: "arithmetic mean multiplied by 20 and rounded to integer"
  },
  scanned: files.length,
  withRatings: 0,
  changed: 0,
  valid: 0,
  skipped: [],
  invalid: [],
  differences: []
};

for (const name of files) {
  const file = path.join(productsDir, name);
  const source = fs.readFileSync(file, "utf8");

  try {
    const { raw, full, body } = extractFrontmatter(source, name);
    const data = YAML.parse(raw);

    if (!data?.ratings || typeof data.ratings !== "object") {
      report.skipped.push({
        file: name,
        reason: "Kein ratings-Objekt"
      });
      continue;
    }

    const entries = Object.entries(data.ratings);
    const numericEntries = entries.filter(
      ([, value]) => typeof value === "number" && Number.isFinite(value)
    );

    if (numericEntries.length === 0) {
      report.skipped.push({
        file: name,
        reason: "Keine numerischen Einzelbewertungen"
      });
      continue;
    }

    report.withRatings += 1;

    const invalidEntries = numericEntries.filter(
      ([, value]) => value < 0 || value > 5
    );

    if (invalidEntries.length > 0) {
      report.invalid.push({
        file: name,
        reason: "Einzelbewertung außerhalb 0–5",
        entries: Object.fromEntries(invalidEntries)
      });
      continue;
    }

    if (numericEntries.length !== entries.length) {
      report.invalid.push({
        file: name,
        reason: "ratings enthält nichtnumerische Werte"
      });
      continue;
    }

    const average =
      numericEntries.reduce((sum, [, value]) => sum + value, 0) /
      numericEntries.length;

    const expectedRating = roundRating(average);
    const expectedScore = roundScore(average);

    const currentRating =
      typeof data.rating === "number" ? data.rating : null;
    const currentScore =
      typeof data.score === "number" ? data.score : null;

    const ratingMatches =
      currentRating !== null &&
      Math.abs(currentRating - expectedRating) < 0.000001;
    const scoreMatches =
      currentScore !== null &&
      currentScore === expectedScore;

    if (ratingMatches && scoreMatches) {
      report.valid += 1;
      continue;
    }

    report.differences.push({
      file: name,
      criteria: Object.fromEntries(numericEntries),
      exactAverage: Number(average.toFixed(4)),
      currentRating,
      expectedRating,
      currentScore,
      expectedScore
    });

    if (write) {
      let nextFrontmatter = raw;
      nextFrontmatter = replaceTopLevelNumber(
        nextFrontmatter,
        "rating",
        formatRating(expectedRating)
      );
      nextFrontmatter = replaceTopLevelNumber(
        nextFrontmatter,
        "score",
        String(expectedScore)
      );

      const nextSource = `---\n${nextFrontmatter.trim()}\n---\n${body}`;
      fs.writeFileSync(file, nextSource, "utf8");
      report.changed += 1;
    }
  } catch (error) {
    report.invalid.push({
      file: name,
      reason: error instanceof Error ? error.message : String(error)
    });
  }
}

const reportDir = path.join(root, "apps", "pfotentechnik", "reports");
fs.mkdirSync(reportDir, { recursive: true });

const reportFile = path.join(
  reportDir,
  "product-rating-normalization-6.2.0.json"
);
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log(`Produkte geprüft: ${report.scanned}`);
console.log(`Mit Einzelbewertungen: ${report.withRatings}`);
console.log(`Bereits korrekt: ${report.valid}`);
console.log(`Abweichungen: ${report.differences.length}`);
console.log(`Geändert: ${report.changed}`);
console.log(`Ungültig: ${report.invalid.length}`);
console.log(`Report: ${path.relative(root, reportFile)}`);

if (report.invalid.length > 0) {
  console.error(
    "Mindestens ein Produkt enthält ungültige Bewertungsdaten. Details stehen im Report."
  );
  process.exit(1);
}

if (checkOnly && report.differences.length > 0) {
  console.error(
    "Bewertungsdurchschnitte sind nicht synchron. Führe npm run ratings:fix aus."
  );
  process.exit(1);
}
