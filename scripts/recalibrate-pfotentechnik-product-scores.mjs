#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const root = process.cwd();
const productsDir = path.join(root, "apps/pfotentechnik/src/content/products");
const reportDir = path.join(root, "apps/pfotentechnik/reports");
const reportPath = path.join(reportDir, "product-score-recalibration-2.0.json");
const manifestPath = path.join(root, ".product-score-recalibration-2.0-manifest.json");

if (!fs.existsSync(productsDir)) {
  console.error("Produktverzeichnis fehlt:", productsDir);
  process.exit(1);
}

const files = fs.readdirSync(productsDir).filter((file) => file.endsWith(".md")).sort();

const getScalar = (text, key) => {
  const match = text.match(new RegExp(`^${key}:\\s*["']?([^\\n"']+)["']?\\s*$`, "m"));
  return match ? match[1].trim() : null;
};

const getNumber = (text, key) => {
  const value = getScalar(text, key);
  return value !== null && Number.isFinite(Number(value)) ? Number(value) : null;
};

const getRatings = (text) => {
  const block = text.match(/^ratings:\s*\n((?:\s{2}.+\n?)+)/m);
  if (!block) return [];

  return [...block[1].matchAll(/^\s{2}["']?([^:"']+)["']?:\s*([0-9.]+)\s*$/gm)]
    .map((match) => ({
      key: match[1].trim(),
      source: Number(match[2]),
      normalized: Number(match[2]) <= 5 ? Number(match[2]) * 20 : Number(match[2])
    }))
    .filter((item) => Number.isFinite(item.normalized));
};

const countUnknownSpecs = (text) => {
  const specs = text.match(/^specs:\s*\n((?:\s{2}.+\n?)+?)(?=^[A-Za-z][A-Za-z0-9_-]*:|\s*---)/m);
  if (!specs) return { unknown: 0, total: 0, ratio: 0 };

  const total = [...specs[1].matchAll(/label:/g)].length;
  const unknown = [...specs[1].matchAll(/Nicht vom Hersteller ausgewiesen/gi)].length;

  return {
    unknown,
    total,
    ratio: total ? unknown / total : 0
  };
};

const evidenceProfile = (text) => {
  const testStatus = (getScalar(text, "testStatus") ?? "unknown").toLowerCase();
  const productStatus = (getScalar(text, "productStatus") ?? "unknown").toLowerCase();
  const unknownSpecs = countUnknownSpecs(text);

  const handsOn =
    /tested|hands-on|long-term|langzeittest|praxistest|eigener-test/.test(testStatus);

  const editorial = /editorial-review|redaktion/.test(testStatus);

  let factor = handsOn ? 0.9 : editorial ? 0.72 : 0.65;
  let penalty = handsOn ? 0 : editorial ? 3 : 5;
  let cap = handsOn ? 95 : editorial ? 89 : 84;

  if (/unknown|unbekannt|nicht-verifiziert/.test(productStatus)) {
    penalty += 1;
    cap -= 1;
  }

  if (unknownSpecs.ratio >= 0.4) penalty += 3;
  else if (unknownSpecs.ratio >= 0.2) penalty += 2;
  else if (unknownSpecs.ratio > 0) penalty += 1;

  if (unknownSpecs.ratio >= 0.4) cap -= 2;

  return {
    testStatus,
    productStatus,
    handsOn,
    editorial,
    factor,
    penalty,
    cap,
    unknownSpecs
  };
};

const calibrateCriterion = (raw, profile) => {
  let value;

  if (raw >= 75) {
    value = 75 + (raw - 75) * profile.factor - profile.penalty;
  } else {
    value = raw - profile.penalty * 0.5;
  }

  value = Math.min(value, profile.cap);
  value = Math.max(45, value);

  return Math.round(value);
};

const labelForScore = (score) => {
  if (score >= 95) return "Referenzklasse";
  if (score >= 90) return "Hervorragend";
  if (score >= 85) return "Sehr gut";
  if (score >= 80) return "Gut";
  if (score >= 75) return "Empfehlenswert";
  if (score >= 70) return "Solide";
  return "Mit deutlichen Einschränkungen";
};

const replaceTopLevelNumber = (text, key, value) => {
  const pattern = new RegExp(`^${key}:\\s*[0-9.]+\\s*$`, "m");
  if (pattern.test(text)) return text.replace(pattern, `${key}: ${value}`);
  return text;
};

const replaceRatingValue = (text, key, sourceValue, calibrated100) => {
  const newValue = sourceValue <= 5
    ? Number((calibrated100 / 20).toFixed(2))
    : calibrated100;

  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `^(\\s{2}["']?${escaped}["']?:\\s*)[0-9.]+(\\s*)$`,
    "m"
  );

  return {
    text: text.replace(pattern, `$1${newValue}$2`),
    newValue
  };
};

const results = [];
const changedFiles = [];

let backupRoot = null;

if (apply) {
  backupRoot = path.join(
    root,
    `.product-score-recalibration-2.0-backup-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}`
  );
}

for (const file of files) {
  const fullPath = path.join(productsDir, file);
  const original = fs.readFileSync(fullPath, "utf8");
  const ratings = getRatings(original);

  if (!ratings.length) {
    results.push({
      file,
      status: "skipped",
      reason: "Keine Einzelbewertungen vorhanden"
    });
    continue;
  }

  const profile = evidenceProfile(original);
  const oldScore = getNumber(original, "score");
  const oldRating = getNumber(original, "rating");

  const criteria = ratings.map((item) => ({
    key: item.key,
    old: Math.round(item.normalized),
    calibrated: calibrateCriterion(item.normalized, profile)
  }));

  const calculatedOld = Math.round(
    ratings.reduce((sum, item) => sum + item.normalized, 0) / ratings.length
  );

  let newScore = Math.round(
    criteria.reduce((sum, item) => sum + item.calibrated, 0) / criteria.length
  );

  newScore = Math.min(newScore, profile.cap);
  const newRating = Number((newScore / 20).toFixed(1));

  const shouldChange =
    oldScore !== newScore ||
    oldRating === null ||
    Math.abs(oldRating - newRating) > 0.05 ||
    criteria.some((item) => item.old !== item.calibrated);

  const reasons = [];

  if (oldScore !== calculatedOld) {
    reasons.push(`Gesamtscore ${oldScore} entspricht nicht dem sichtbaren Mittel ${calculatedOld}`);
  }
  if (!profile.handsOn) {
    reasons.push(`Kein bestätigter Praxistest (${profile.testStatus})`);
  }
  if (/unknown|unbekannt|nicht-verifiziert/.test(profile.productStatus)) {
    reasons.push(`Produktstatus nicht verifiziert (${profile.productStatus})`);
  }
  if (profile.unknownSpecs.unknown > 0) {
    reasons.push(
      `${profile.unknownSpecs.unknown} von ${profile.unknownSpecs.total} Spezifikationen nicht ausgewiesen`
    );
  }
  if ((oldScore ?? calculatedOld) >= 90) {
    reasons.push("Bisheriger Wert liegt im außergewöhnlichen 90+-Bereich");
  }

  results.push({
    file,
    slug: getScalar(original, "slug"),
    title: getScalar(original, "title"),
    testStatus: profile.testStatus,
    productStatus: profile.productStatus,
    oldScore,
    calculatedOld,
    newScore,
    oldRating,
    newRating,
    oldLabel: oldScore !== null ? labelForScore(oldScore) : null,
    newLabel: labelForScore(newScore),
    evidenceCap: profile.cap,
    unknownSpecs: profile.unknownSpecs,
    reasons,
    criteria,
    changed: shouldChange
  });

  if (!apply || !shouldChange) continue;

  const backup = path.join(backupRoot, path.relative(root, fullPath));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(fullPath, backup);

  let updated = original;

  for (const item of ratings) {
    const criterion = criteria.find((entry) => entry.key === item.key);
    const replacement = replaceRatingValue(
      updated,
      item.key,
      item.source,
      criterion.calibrated
    );
    updated = replacement.text;
  }

  updated = replaceTopLevelNumber(updated, "score", newScore);
  updated = replaceTopLevelNumber(updated, "rating", newRating);

  fs.writeFileSync(fullPath, updated, "utf8");
  changedFiles.push(path.relative(root, fullPath));
}

const analyzed = results.filter((item) => item.status !== "skipped");
const changed = analyzed.filter((item) => item.changed);
const oldScores = analyzed.map((item) => item.oldScore).filter(Number.isFinite);
const newScores = analyzed.map((item) => item.newScore).filter(Number.isFinite);

const report = {
  generatedAt: new Date().toISOString(),
  mode: apply ? "applied" : "dry-run",
  methodology: {
    scale: "0-100",
    total: "Gerundeter Mittelwert aller sichtbaren Kriterien",
    ranges: {
      "95-100": "Referenzklasse – nur belegte Ausnahmeprodukte",
      "90-94": "Hervorragend",
      "85-89": "Sehr gut",
      "80-84": "Gut",
      "75-79": "Empfehlenswert",
      "70-74": "Solide",
      "<70": "Mit deutlichen Einschränkungen"
    },
    evidenceRules: [
      "Bewertungen werden bei rein redaktioneller Einordnung konservativer kalibriert.",
      "Unbekannter Produktstatus reduziert Score und Obergrenze.",
      "Nicht ausgewiesene Spezifikationen reduzieren die Evidenz.",
      "90+ ist ohne bestätigten Praxistest grundsätzlich ausgeschlossen.",
      "Der Gesamtscore wird nicht länger unabhängig von Einzelkriterien gepflegt."
    ]
  },
  summary: {
    totalFiles: files.length,
    analyzed: analyzed.length,
    skipped: results.length - analyzed.length,
    changed: changed.length,
    averageOld:
      oldScores.length
        ? Number((oldScores.reduce((a, b) => a + b, 0) / oldScores.length).toFixed(1))
        : null,
    averageNew:
      newScores.length
        ? Number((newScores.reduce((a, b) => a + b, 0) / newScores.length).toFixed(1))
        : null,
    oldScores90Plus: oldScores.filter((score) => score >= 90).length,
    newScores90Plus: newScores.filter((score) => score >= 90).length
  },
  products: results
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

if (apply) {
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        installedAt: new Date().toISOString(),
        backupRoot,
        changedFiles,
        reportPath: path.relative(root, reportPath)
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
}

console.log("");
console.log(apply ? "Score-Neukalibrierung angewendet." : "Score-Audit abgeschlossen.");
console.log("Produktdateien:", files.length);
console.log("Analysiert:", analyzed.length);
console.log("Zu ändern:", changed.length);
console.log("Durchschnitt alt:", report.summary.averageOld);
console.log("Durchschnitt neu:", report.summary.averageNew);
console.log("90+ alt:", report.summary.oldScores90Plus);
console.log("90+ neu:", report.summary.newScores90Plus);
console.log("Report:", path.relative(root, reportPath));
console.log("");

if (!apply) {
  console.log("Änderungen anwenden mit:");
  console.log("  node scripts/recalibrate-pfotentechnik-product-scores.mjs --apply");
}
