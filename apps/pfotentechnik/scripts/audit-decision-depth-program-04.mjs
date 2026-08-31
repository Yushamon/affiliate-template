import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(app, "package.json"));
const yaml = require("js-yaml");
const productDir = path.join(app, "src", "content", "products");
const statuses = new Set(["supported", "conditional", "unavailable", "unknown", "notApplicable"]);
const unsourced = new Set(["unknown", "notApplicable"]);

function parse(file) {
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Frontmatter fehlt: ${file}`);
  return yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
}

function hasEvidence(claim) {
  return Boolean(claim?.sourceUrl && claim?.sourceType && claim?.verifiedAt);
}

function validateClaim(claim, label, errors) {
  if (!claim) return;
  if (!statuses.has(claim.status)) errors.push(`${label}: ungueltiger Status ${claim.status}`);
  if (!unsourced.has(claim.status) && !hasEvidence(claim)) errors.push(`${label}: belegter Claim ohne Evidence-Triple`);
}

export function validateDecisionDepthProduct(product) {
  const errors = [];
  const slug = product.slug ?? "unbekannt";
  const add = (message) => errors.push(`${slug}: ${message}`);

  if (product.dispensingPrecision) {
    const data = product.dispensingPrecision;
    if (!["documented", "partial", "unknown", "notApplicable"].includes(data.status)) add("ungueltiger Dispensing-Status");
    for (const key of ["nominalPortionGrams", "nominalPortionMilliliters", "minimumPortionsPerDispense", "maximumPortionsPerDispense"]) {
      if (data[key] != null && !(data[key] > 0)) add(`${key} muss positiv sein`);
    }
    if (data.nominalPortionGrams != null && data.portionIsApproximate == null) add("nominale Grammportion muss approximate explizit ausweisen");
    if (["documented", "partial"].includes(data.status) && !hasEvidence(data)) add("belegte Portionierdaten ohne Evidence-Triple");
    for (const key of ["kibbleDependency", "fillLevelDependency", "integratedScale", "calibrationSupported"]) {
      validateClaim(data[key], `${slug}.dispensingPrecision.${key}`, errors);
    }
    if (data.dualBowlDistribution) {
      validateClaim(data.dualBowlDistribution.adjustableSplitRatio, `${slug}.dispensingPrecision.adjustableSplitRatio`, errors);
      validateClaim(data.dualBowlDistribution.individualPortioning, `${slug}.dispensingPrecision.individualPortioning`, errors);
    }
  }

  for (const part of product.repairability?.parts ?? []) {
    if (!statuses.has(part.status)) add(`ungueltiger Ersatzteilstatus ${part.type}`);
    if (!unsourced.has(part.status) && !hasEvidence(part)) add(`belegtes Ersatzteil ${part.type} ohne Evidence-Triple`);
    if (part.status === "supported" && part.officialPart !== true) add(`supported Ersatzteil ${part.type} ist nicht als officialPart markiert`);
  }

  if (product.dataPortability) {
    for (const key of ["history", "export", "localDownload", "cloudRetention", "postSubscriptionAccess", "deviceMigration", "sharedAccess"]) {
      validateClaim(product.dataPortability[key], `${slug}.dataPortability.${key}`, errors);
    }
    if (product.dataPortability.historyRetentionDays != null && !(product.dataPortability.historyRetentionDays > 0)) add("historyRetentionDays muss positiv sein");
  }

  if (product.sensorLimits) {
    for (const key of ["minimumOperationalWeightKg", "automaticModeMinimumWeightKg", "baselineDaysRequired"]) {
      if (product.sensorLimits[key] != null && product.sensorLimits[key] < 0) add(`${key} darf nicht negativ sein`);
    }
    const numeric = ["minimumOperationalWeightKg", "automaticModeMinimumWeightKg", "baselineDaysRequired"]
      .some((key) => product.sensorLimits[key] != null);
    if (numeric && !hasEvidence(product.sensorLimits)) add("numerische Sensorgrenze ohne Evidence-Triple");
    for (const key of ["calibrationRequirement", "environmentDependency", "identificationLimitation"]) {
      validateClaim(product.sensorLimits[key], `${slug}.sensorLimits.${key}`, errors);
    }
  }

  for (const key of ["profilePersistence", "settingsPersistence", "subscriptionTransfer", "serviceEndFallback"]) {
    validateClaim(product.lifecycleDependency?.[key], `${slug}.lifecycleDependency.${key}`, errors);
  }

  return errors;
}

const products = fs.readdirSync(productDir)
  .filter((name) => name.endsWith(".md"))
  .map((name) => parse(path.join(productDir, name)));
const errors = products.flatMap(validateDecisionDepthProduct);
const counts = Object.fromEntries(["dispensingPrecision", "repairability", "dataPortability", "sensorLimits", "lifecycleDependency"]
  .map((field) => [field, products.filter((product) => product[field]).length]));

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Program-04-Decision-Audit bestanden: ${products.length} Produkte; ${JSON.stringify(counts)}.`);
}
