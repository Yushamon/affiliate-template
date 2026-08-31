import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(app, "package.json"));
const yaml = require("js-yaml");
const productDir = path.join(app, "src", "content", "products");

const litterFields = ["bentoniteClumping", "tofu", "plantBased", "woodPellets", "crystal", "nonClumping"];
const claimStatuses = new Set(["supported", "conditional", "notSupported", "unknown", "notApplicable"]);
const capabilityStatuses = new Set(["supported", "partial", "unavailable", "unknown", "notApplicable"]);
const methods = new Set(["microchip", "rfidTag", "weight", "cameraAi", "other", "none", "unknown"]);
const litterSlugs = new Set([
  "devoko-90l-automatisches-katzenklo", "litter-robot-4", "litter-robot-5-pro", "neakasa-m1-lite", "neakasa-m1-plus",
  "petkit-puramax-2", "petkit-purobot-crystal-duo", "petkit-purobot-max-3", "petkit-purobot-max-pro-2",
  "petlibro-luma-smart-litter-box", "petsnowy-snow-plus"
]);

function parse(file) {
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Frontmatter fehlt: ${file}`);
  return yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
}

export function validateDecisionData(data) {
  const errors = [];
  const add = (message) => errors.push(`${data.slug ?? "unbekannt"}: ${message}`);
  if (data.litterCompatibility) {
    for (const field of litterFields) {
      const entry = data.litterCompatibility[field];
      if (!entry || !claimStatuses.has(entry.status)) add(`ungueltiger Streustatus ${field}`);
    }
    const claimed = litterFields.some((field) => !["unknown", "notApplicable"].includes(data.litterCompatibility[field]?.status));
    if (claimed && !(data.litterCompatibility.evidenceSourceUrls?.length > 0)) add("belegte Streuangaben ohne evidenceSourceUrls");
  }
  if (data.multiPet) {
    if (!capabilityStatuses.has(data.multiPet.sharedUse)) add("ungueltiger sharedUse-Status");
    for (const field of ["individualProfiles", "individualAccess", "individualFeeding", "individualUsageData"]) {
      if (data.multiPet[field] != null && !capabilityStatuses.has(data.multiPet[field])) add(`ungueltiger Multi-Pet-Status ${field}`);
    }
    if (!Array.isArray(data.multiPet.identificationMethods) || data.multiPet.identificationMethods.some((item) => !methods.has(item))) add("ungueltige identificationMethods");
    const hasIdentification = data.multiPet.identificationMethods?.some((item) => !["none", "unknown"].includes(item));
    const individualClaim = ["individualAccess", "individualFeeding", "individualUsageData"].some((field) => data.multiPet[field] === "supported");
    if (!hasIdentification && individualClaim) add("individuelle Leistung ohne Identifikationsmethode");
    const claimed = ["sharedUse", "individualProfiles", "individualAccess", "individualFeeding", "individualUsageData"]
      .some((field) => ![undefined, "unknown", "notApplicable"].includes(data.multiPet[field]));
    if (claimed && !(data.multiPet.evidenceSourceUrls?.length > 0)) add("Multi-Pet-Angabe ohne evidenceSourceUrls");
  }
  return errors;
}

const products = fs.readdirSync(productDir).filter((name) => name.endsWith(".md")).map((name) => parse(path.join(productDir, name)));
const errors = products.flatMap(validateDecisionData);
for (const product of products.filter((item) => litterSlugs.has(item.slug))) {
  if (!product.litterCompatibility) errors.push(`${product.slug}: litterCompatibility fehlt`);
  if (!product.multiPet) errors.push(`${product.slug}: multiPet fehlt`);
}
if (products.filter((item) => litterSlugs.has(item.slug)).length !== litterSlugs.size) errors.push("Litter-Produktmenge ist unvollstaendig");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Decision-Data-Audit bestanden: ${products.length} Produkte, ${litterSlugs.size} automatische Katzentoiletten.`);
}
