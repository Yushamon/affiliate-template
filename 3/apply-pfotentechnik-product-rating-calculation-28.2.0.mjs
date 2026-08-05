#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-rating-calculation-28.2.0";

const PRODUCT_RATINGS = {
  "sureflap-mikrochip-katzenklappe": {
    zugang_und_sicherheit: 4.3,
    richtungsrechte_und_kontrolle: 3.2,
    alltag_und_bedienung: 4.4,
    einbau_und_passform: 3.8,
    strom_und_ausfallverhalten: 4.2,
    systemabhaengigkeit_und_folgekosten: 4.8
  },
  "sureflap-dualscan-mikrochip-katzenklappe": {
    zugang_und_sicherheit: 4.3,
    richtungsrechte_und_kontrolle: 4.5,
    alltag_und_bedienung: 4.1,
    einbau_und_passform: 3.7,
    strom_und_ausfallverhalten: 4.0,
    systemabhaengigkeit_und_folgekosten: 4.6
  },
  "sureflap-mikrochip-katzenklappe-connect": {
    zugang_und_sicherheit: 4.4,
    richtungsrechte_und_kontrolle: 4.6,
    alltag_und_bedienung: 4.3,
    einbau_und_passform: 3.7,
    strom_und_ausfallverhalten: 3.7,
    systemabhaengigkeit_und_folgekosten: 2.9
  },
  "petsafe-mikrochip-katzenklappe": {
    zugang_und_sicherheit: 3.8,
    richtungsrechte_und_kontrolle: 3.3,
    alltag_und_bedienung: 4.0,
    einbau_und_passform: 3.4,
    strom_und_ausfallverhalten: 4.0,
    systemabhaengigkeit_und_folgekosten: 4.5
  },
  "onlycat-mikrochip-katzenklappe": {
    zugang_und_sicherheit: 4.0,
    richtungsrechte_und_kontrolle: 4.5,
    alltag_und_bedienung: 4.0,
    einbau_und_passform: 3.0,
    strom_und_ausfallverhalten: 3.3,
    systemabhaengigkeit_und_folgekosten: 2.5
  },
  "petwalk-medium-tiertuer": {
    zugang_und_sicherheit: 4.5,
    richtungsrechte_und_kontrolle: 4.0,
    alltag_und_bedienung: 4.1,
    einbau_und_passform: 2.6,
    strom_und_ausfallverhalten: 4.4,
    systemabhaengigkeit_und_folgekosten: 2.8
  }
};

function findRoot(start) {
  let directory = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(directory, "apps", "pfotentechnik", "package.json"))) {
      return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

function log(message) {
  console.log(`[${NAME}] ${message}`);
}

function backup(root, backupRoot, target) {
  if (!fs.existsSync(target)) return;
  const destination = path.join(backupRoot, path.relative(root, target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

function writeChanged(root, backupRoot, target, content) {
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (current === content) {
    log(`Bereits aktuell: ${path.relative(root, target)}`);
    return false;
  }
  backup(root, backupRoot, target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  log(`${current === null ? "Geschrieben" : "Geändert"}: ${path.relative(root, target)}`);
  return true;
}

function replaceOnce(source, before, after, fileLabel) {
  if (source.includes(after)) return source;
  const count = source.split(before).length - 1;
  if (count === 0) {
    throw new Error(`Erwarteter Block fehlt in ${fileLabel}.`);
  }
  if (count !== 1) {
    throw new Error(`Erwarteter Block in ${fileLabel} ist ${count}-mal vorhanden.`);
  }
  return source.replace(before, after);
}

function splitDocument(source, fileLabel) {
  const lines = source.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    throw new Error(`Frontmatter-Start fehlt in ${fileLabel}.`);
  }
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end < 0) throw new Error(`Frontmatter-Ende fehlt in ${fileLabel}.`);
  return {
    frontmatter: lines.slice(1, end),
    body: lines.slice(end + 1)
  };
}

function topLevelKey(line) {
  if (!line || /^\s/.test(line)) return null;
  const separator = line.indexOf(":");
  if (separator <= 0) return null;
  const key = line.slice(0, separator).trim();
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : null;
}

function findTopLevelRange(lines, key) {
  const start = lines.findIndex((line) => topLevelKey(line) === key);
  if (start < 0) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (topLevelKey(lines[index])) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function replaceTopLevelBlock(lines, key, block) {
  const range = findTopLevelRange(lines, key);
  if (!range) return [...lines, ...block];
  return [...lines.slice(0, range.start), ...block, ...lines.slice(range.end)];
}

function serializeDocument(frontmatter, body) {
  return ["---", ...frontmatter, "---", ...body].join("\n");
}

function calculateFromRatings(ratings) {
  const values = Object.values(ratings);
  if (!values.length || values.some((value) => !Number.isFinite(value) || value < 0 || value > 5)) {
    throw new Error("Ungültige Kriterienbewertung im Patch.");
  }
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    rating: Math.round((average + Number.EPSILON) * 10) / 10,
    score: Math.round((average + Number.EPSILON) * 20)
  };
}

function updateProductRatings(root, backupRoot, productsDir, slug, ratings) {
  const target = path.join(productsDir, `${slug}.md`);
  if (!fs.existsSync(target)) throw new Error(`Produktdatei fehlt: ${path.relative(root, target)}`);

  const original = fs.readFileSync(target, "utf8");
  const document = splitDocument(original, target);
  const calculated = calculateFromRatings(ratings);
  let frontmatter = [...document.frontmatter];

  frontmatter = replaceTopLevelBlock(frontmatter, "rating", [`rating: ${calculated.rating.toFixed(1)}`]);
  frontmatter = replaceTopLevelBlock(frontmatter, "score", [`score: ${calculated.score}`]);
  frontmatter = replaceTopLevelBlock(frontmatter, "ratings", [
    "ratings:",
    ...Object.entries(ratings).map(([key, value]) => `  ${key}: ${value.toFixed(1)}`)
  ]);

  const next = serializeDocument(frontmatter, document.body);
  writeChanged(root, backupRoot, target, next);
  return calculated;
}

function run(command, args, cwd) {
  const executable = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  execFileSync(executable, args, { cwd, stdio: "inherit", windowsHide: true });
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCTS = path.join(APP, "src", "content", "products");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const SCORE_HELPER = path.join(APP, "src", "domain", "productScore.ts");
const MODEL = path.join(APP, "src", "domain", "productExperience", "model.ts");
const ROUTE = path.join(APP, "src", "pages", "produkt", "[product].astro");
const HERO = path.join(APP, "src", "components", "product-experience-2", "ProductHero2.astro");
const NORMALIZER = path.join(APP, "scripts", "normalize-product-ratings.mjs");
const TEST = path.join(APP, "test", "product-rating-calculation-28.2.0.test.mjs");

for (const target of [MODEL, ROUTE, HERO, NORMALIZER]) {
  if (!fs.existsSync(target)) throw new Error(`Erwartete Datei fehlt: ${path.relative(ROOT, target)}`);
}

const scoreHelperSource = `export type ProductScoreSource = "score" | "criteria" | "rating" | "unrated";

export type ProductScoreResult = {
  score: number | null;
  rating: number | null;
  criteriaCount: number;
  source: ProductScoreSource;
};

type ProductScoreInput = {
  score?: unknown;
  rating?: unknown;
  ratings?: Record<string, unknown> | null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const positiveNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const criterionValues = (ratings: ProductScoreInput["ratings"]): number[] =>
  Object.values(ratings ?? {})
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 5);

export const calculateProductScore = (input: ProductScoreInput): ProductScoreResult => {
  const explicitScore = positiveNumber(input.score);
  if (explicitScore !== null) {
    const score = Math.round(clamp(explicitScore <= 5 ? explicitScore * 20 : explicitScore, 0, 100));
    return {
      score,
      rating: Math.round((score / 20 + Number.EPSILON) * 10) / 10,
      criteriaCount: criterionValues(input.ratings).length,
      source: "score"
    };
  }

  const criteria = criterionValues(input.ratings);
  if (criteria.length > 0) {
    const average = criteria.reduce((sum, value) => sum + value, 0) / criteria.length;
    return {
      score: Math.round((average + Number.EPSILON) * 20),
      rating: Math.round((average + Number.EPSILON) * 10) / 10,
      criteriaCount: criteria.length,
      source: "criteria"
    };
  }

  const explicitRating = positiveNumber(input.rating);
  if (explicitRating !== null) {
    const rating = clamp(explicitRating, 0, 5);
    return {
      score: Math.round(rating * 20),
      rating: Math.round((rating + Number.EPSILON) * 10) / 10,
      criteriaCount: 0,
      source: "rating"
    };
  }

  return {
    score: null,
    rating: null,
    criteriaCount: 0,
    source: "unrated"
  };
};
`;
writeChanged(ROOT, BACKUP, SCORE_HELPER, scoreHelperSource);

let modelSource = fs.readFileSync(MODEL, "utf8");
modelSource = replaceOnce(
  modelSource,
  `import { uniqueTextItems } from "./contentLists.ts";\n`,
  `import { uniqueTextItems } from "./contentLists.ts";\nimport { calculateProductScore } from "../productScore.ts";\n`,
  MODEL
);
modelSource = replaceOnce(
  modelSource,
  `const editorialScore = (data: any): number => {\n  const score = Number(data?.score);\n  if (Number.isFinite(score)) return score <= 5 ? score * 20 : score;\n  const rating = Number(data?.rating);\n  return Number.isFinite(rating) ? rating * 20 : 0;\n};`,
  `const calculatedEditorialScore = (data: any): number | null =>\n  calculateProductScore(data).score;\n\nconst editorialScore = (data: any): number =>\n  calculatedEditorialScore(data) ?? 0;`,
  MODEL
);
modelSource = replaceOnce(
  modelSource,
  `  const scoreRaw = Number.isFinite(Number(reviewProduct.score)) ? Number(reviewProduct.score) : editorialScore(data);\n  const score = scoreRaw > 0 && scoreRaw <= 10 ? Math.round(scoreRaw * 10) : Math.max(0, Math.min(100, Math.round(scoreRaw)));`,
  `  const reviewScore = Number(reviewProduct.score);\n  const scoreRaw = Number.isFinite(reviewScore) && reviewScore > 0\n    ? reviewScore\n    : calculatedEditorialScore(data);\n  const score = scoreRaw == null\n    ? null\n    : scoreRaw > 0 && scoreRaw <= 10\n      ? Math.round(scoreRaw * 10)\n      : Math.max(0, Math.min(100, Math.round(scoreRaw)));`,
  MODEL
);
modelSource = replaceOnce(
  modelSource,
  `    scoreLabel: score >= 90 ? "Hervorragend" : score >= 80 ? "Sehr gut" : score >= 70 ? "Gut" : score > 0 ? "Mit Einschränkungen" : "Noch offen",`,
  `    scoreLabel: score == null ? "Noch nicht bewertet" : score >= 90 ? "Hervorragend" : score >= 80 ? "Sehr gut" : score >= 70 ? "Gut" : score > 0 ? "Mit Einschränkungen" : "Noch offen",`,
  MODEL
);
writeChanged(ROOT, BACKUP, MODEL, modelSource);

let routeSource = fs.readFileSync(ROUTE, "utf8");
routeSource = replaceOnce(
  routeSource,
  `import { deriveProductOperations } from "../../lib/product-operations/policy.mjs";\n`,
  `import { deriveProductOperations } from "../../lib/product-operations/policy.mjs";\nimport { calculateProductScore } from "../../domain/productScore";\n`,
  ROUTE
);
routeSource = replaceOnce(
  routeSource,
  `const productScoreRaw = Number(contentProduct.score ?? contentProduct.rating ?? 0);\nconst productScore100 =\n  productScoreRaw > 0 && productScoreRaw <= 10\n    ? Math.round(productScoreRaw * 10)\n    : Math.max(0, Math.min(100, Math.round(productScoreRaw)));`,
  `const calculatedProductScore = calculateProductScore(contentProduct);\nconst productScore100 = calculatedProductScore.score;`,
  ROUTE
);
routeSource = replaceOnce(
  routeSource,
  `        score: productScore100,`,
  `        score: productScore100 ?? undefined,`,
  ROUTE
);
routeSource = replaceOnce(
  routeSource,
  `  ...((contentProduct.score ?? 0) > 0 || (contentProduct.rating ?? 0) > 0 ? { review: {`,
  `  ...(productScore100 !== null && productScore100 > 0 ? { review: {`,
  ROUTE
);
writeChanged(ROOT, BACKUP, ROUTE, routeSource);

let heroSource = fs.readFileSync(HERO, "utf8");
heroSource = replaceOnce(
  heroSource,
  `    <div class="px2-hero__scoreline">\n      <EditorialScore\n        value={model.score}\n        scale={100}\n        variant="ring"\n        description="Redaktionelle Eignungsbewertung auf Basis der dokumentierten Quellen."\n      />\n    </div>`,
  `    <div class="px2-hero__scoreline">\n      {model.score != null && model.score > 0 ? (\n        <EditorialScore\n          value={model.score}\n          scale={100}\n          variant="ring"\n          description="Redaktionelle Eignungsbewertung auf Basis der dokumentierten Quellen."\n        />\n      ) : (\n        <div class="px2-hero__score-pending" role="status">\n          <strong>Noch nicht bewertet</strong>\n          <span>Eine vollständige Kriterienbewertung liegt noch nicht vor.</span>\n        </div>\n      )}\n    </div>`,
  HERO
);
heroSource = replaceOnce(
  heroSource,
  `  .px2-hero__scoreline {\n    min-width: 0;\n  }\n`,
  `  .px2-hero__scoreline {\n    min-width: 0;\n  }\n\n  .px2-hero__score-pending {\n    display: grid;\n    gap: 3px;\n    padding: 12px 13px;\n    border: 1px solid var(--px2-border);\n    border-radius: 14px;\n    background: var(--px2-surface-raised);\n  }\n\n  .px2-hero__score-pending strong {\n    color: var(--px2-text);\n    font-size: .92rem;\n  }\n\n  .px2-hero__score-pending span {\n    color: var(--px2-muted);\n    font-size: .76rem;\n    line-height: 1.42;\n  }\n`,
  HERO
);
writeChanged(ROOT, BACKUP, HERO, heroSource);

let normalizerSource = fs.readFileSync(NORMALIZER, "utf8");
normalizerSource = replaceOnce(
  normalizerSource,
  `const formatRating = (value) =>\n  value.toFixed(1);\n`,
  `const formatRating = (value) =>\n  value.toFixed(1);\n\nconst requiresMissingRatingFailure = (data) => {\n  const editorialStatus = String(data?.editorialStatus ?? "").toLowerCase();\n  const productStatus = String(data?.productStatus ?? "").toLowerCase();\n  const storedScore = Number(data?.score);\n  const storedRating = Number(data?.rating);\n\n  return (\n    ["complete", "recommended"].includes(editorialStatus) &&\n    productStatus !== "discontinued" &&\n    !(Number.isFinite(storedScore) && storedScore > 0) &&\n    !(Number.isFinite(storedRating) && storedRating > 0)\n  );\n};\n`,
  NORMALIZER
);
normalizerSource = replaceOnce(
  normalizerSource,
  `    if (!data?.ratings || typeof data.ratings !== "object") {\n      report.skipped.push({\n        file: name,\n        reason: "Kein ratings-Objekt"\n      });\n      continue;\n    }`,
  `    if (!data?.ratings || typeof data.ratings !== "object") {\n      if (requiresMissingRatingFailure(data)) {\n        report.invalid.push({\n          file: name,\n          reason: "Redaktionell vollständiges Produkt ohne Kriterienbewertung"\n        });\n      } else {\n        report.skipped.push({\n          file: name,\n          reason: "Kein ratings-Objekt"\n        });\n      }\n      continue;\n    }`,
  NORMALIZER
);
normalizerSource = replaceOnce(
  normalizerSource,
  `    if (numericEntries.length === 0) {\n      report.skipped.push({\n        file: name,\n        reason: "Keine numerischen Einzelbewertungen"\n      });\n      continue;\n    }`,
  `    if (numericEntries.length === 0) {\n      if (requiresMissingRatingFailure(data)) {\n        report.invalid.push({\n          file: name,\n          reason: "Redaktionell vollständiges Produkt ohne numerische Kriterienbewertung"\n        });\n      } else {\n        report.skipped.push({\n          file: name,\n          reason: "Keine numerischen Einzelbewertungen"\n        });\n      }\n      continue;\n    }`,
  NORMALIZER
);
writeChanged(ROOT, BACKUP, NORMALIZER, normalizerSource);

const calculatedProducts = Object.fromEntries(
  Object.entries(PRODUCT_RATINGS).map(([slug, ratings]) => [
    slug,
    updateProductRatings(ROOT, BACKUP, PRODUCTS, slug, ratings)
  ])
);

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateProductScore } from "../src/domain/productScore.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCTS = path.join(APP, "src", "content", "products");

const expected = ${JSON.stringify(calculatedProducts, null, 2)};

const readScoreData = (file) => {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---(?:\\r?\\n|$)/);
  assert.ok(match, "Frontmatter fehlt: " + file);
  const frontmatter = match[1];
  const readNumber = (key) => {
    const value = frontmatter.match(new RegExp("^" + key + ":\\\\s*([0-9.]+)\\\\s*$", "m"));
    return value ? Number(value[1]) : null;
  };
  const block = frontmatter.match(/^ratings:\\s*\\n((?:\\s{2}.+\\n?)+)/m);
  const ratings = Object.fromEntries(
    [...(block?.[1] ?? "").matchAll(/^\\s{2}([^:]+):\\s*([0-9.]+)\\s*$/gm)]
      .map((entry) => [entry[1].trim(), Number(entry[2])])
  );
  return { rating: readNumber("rating"), score: readNumber("score"), ratings };
};

test("Kriterien werden berechnet, wenn kein positiver Gesamtscore vorliegt", () => {
  assert.deepEqual(
    calculateProductScore({ rating: 0, ratings: { a: 4.0, b: 3.0 } }),
    { score: 70, rating: 3.5, criteriaCount: 2, source: "criteria" }
  );
});

test("Fehlende Bewertung bleibt unbewertet statt 0/100", () => {
  assert.deepEqual(
    calculateProductScore({ rating: 0, ratings: {} }),
    { score: null, rating: null, criteriaCount: 0, source: "unrated" }
  );
});

test("Katzenklappen besitzen synchronisierte Kriterien, Rating und Score", () => {
  for (const [slug, values] of Object.entries(expected)) {
    const data = readScoreData(path.join(PRODUCTS, slug + ".md"));
    assert.equal(data.rating, values.rating, slug + ": rating");
    assert.equal(data.score, values.score, slug + ": score");
    assert.equal(Object.keys(data.ratings ?? {}).length, 6, slug + ": Kriterienanzahl");
    assert.deepEqual(calculateProductScore(data).score, values.score, slug + ": Laufzeitberechnung");
  }
});

test("Hero zeigt unbewertete Produkte nicht als nicht empfohlen", () => {
  const source = fs.readFileSync(
    path.join(APP, "src", "components", "product-experience-2", "ProductHero2.astro"),
    "utf8"
  );
  assert.match(source, /model\\.score != null && model\\.score > 0/);
  assert.match(source, /Noch nicht bewertet/);
});

test("Route und Modell verwenden die zentrale Score-Berechnung", () => {
  const route = fs.readFileSync(path.join(APP, "src", "pages", "produkt", "[product].astro"), "utf8");
  const model = fs.readFileSync(path.join(APP, "src", "domain", "productExperience", "model.ts"), "utf8");
  assert.match(route, /calculateProductScore\\(contentProduct\\)/);
  assert.match(model, /calculateProductScore\\(data\\)\\.score/);
});
`;
writeChanged(ROOT, BACKUP, TEST, testSource);

log("Führe Regressionstests aus …");
run("node", ["--experimental-strip-types", "--test", TEST], ROOT);

log("Führe Astro-Build aus …");
run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], ROOT);

log("Fertig.");
log("Erwartete Scores: " + Object.entries(calculatedProducts).map(([slug, value]) => `${slug}=${value.score}`).join(", "));
