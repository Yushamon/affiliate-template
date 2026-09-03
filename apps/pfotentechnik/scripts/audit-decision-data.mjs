import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(app, "package.json"));
const yaml = require("js-yaml");
const productDir = path.join(app, "src", "content", "products");

const litterTypes = new Set(["bentonite", "mineral-clumping", "tofu", "plant-fiber", "silica-crystal", "wood", "pellets", "paper", "non-clumping", "mixed", "unknown"]);
const litterStatuses = new Set(["complete", "partial", "unknown"]);
const clumpingStatuses = new Set(["required", "recommended", "not-required", "proprietary-system", "unknown"]);
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
    const litter = data.litterCompatibility;
    if (!litterStatuses.has(litter.status)) add("ungueltiger Streu-Coverage-Status");
    if (!clumpingStatuses.has(litter.clumpingRequirement)) add("ungueltige Klumpstreu-Anforderung");
    for (const field of ["compatibleTypes", "conditionalTypes", "incompatibleTypes"]) {
      if (!Array.isArray(litter[field]) || litter[field].some((item) => !litterTypes.has(item))) add(`ungueltige Streutypen in ${field}`);
    }
    const claimed = litter.status !== "unknown";
    if (claimed && !(litter.evidence?.length > 0)) add("belegte Streuangaben ohne Evidence");
    if (litter.evidence?.some((item) => !item.url || !item.source || !item.sourceType || !item.verifiedAt || !item.assertion)) add("unvollstaendige Streu-Evidence");
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
