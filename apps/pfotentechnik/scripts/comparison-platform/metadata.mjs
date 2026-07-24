import fs from "node:fs";
import { PRODUCT_DIR, loadEntries, splitFrontmatter } from "./core.mjs";

function quote(value) {
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return JSON.stringify(String(value));
}
export function deriveComparisonData(data) {
  const result = {};
  if (data.gps && typeof data.gps === "object") {
    result.gps = {
      animal: data.gps.animal || [],
      minimumPetWeightKg: data.gps.minimumPetWeightKg,
      deviceWeightGrams: data.gps.deviceWeightGrams,
      subscriptionRequired: data.gps.subscriptionRequired,
      transmission: data.gps.transmission,
      batteryMaxDays: data.gps.batteryMaxDays,
      waterproofRating: data.gps.waterproofRating,
      liveTracking: data.gps.liveTracking,
      virtualFence: data.gps.virtualFence,
      activityTracking: data.gps.activityTracking
    };
  }
  const f = data.comparisonFilters;
  if (f && typeof f === "object") {
    result.general = {
      animal: f.animal || [],
      petSize: f.petSize || [],
      foodType: f.foodType || [],
      app: f.app,
      camera: f.camera,
      access: f.access,
      backupPower: f.backupPower,
      reservoirLiters: f.reservoirLiters,
      portionGrams: f.portionGrams,
      maxPortionsPerMeal: f.maxPortionsPerMeal,
      maxMealGrams: f.maxMealGrams,
      kibbleMaxMm: f.kibbleMaxMm,
      largeDogFit: f.largeDogFit,
      priceTier: f.priceTier || data.priceCategory
    };
  }
  result.editorial = {
    rating: data.rating,
    score: data.score,
    priceCategory: data.priceCategory,
    productStatus: data.productStatus
  };
  for (const group of Object.values(result)) {
    for (const key of Object.keys(group)) if (group[key] === undefined) delete group[key];
  }
  return result;
}
function toYaml(value, indent = 0) {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    return "\n" + value.map((v) => pad + "- " + quote(v)).join("\n");
  }
  if (value && typeof value === "object") {
    const lines = [];
    for (const [key, v] of Object.entries(value)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        lines.push(pad + key + ":");
        lines.push(toYaml(v, indent + 2));
      } else if (Array.isArray(v)) {
        if (!v.length) lines.push(pad + key + ": []");
        else {
          lines.push(pad + key + ":");
          lines.push(...v.map((item) => " ".repeat(indent + 2) + "- " + quote(item)));
        }
      } else lines.push(pad + key + ": " + quote(v));
    }
    return lines.join("\n");
  }
  return quote(value);
}
export function migrateMetadata({ check = false } = {}) {
  const entries = loadEntries(PRODUCT_DIR);
  let changed = 0;
  const skipped = [];
  for (const entry of entries) {
    if (entry.data.comparisonData) continue;
    const generated = deriveComparisonData(entry.data);
    const { frontmatter, body } = splitFrontmatter(entry.source);
    if (!frontmatter) {
      skipped.push(entry.rel);
      continue;
    }
    const block = "\ncomparisonData:\n" + toYaml(generated, 2) + "\n";
    const next = "---\n" + frontmatter.trimEnd() + block + "---\n\n" + body.replace(/^\n+/, "");
    changed++;
    if (!check) fs.writeFileSync(entry.file, next, "utf8");
    console.log((check ? "[check] " : "[migrated] ") + entry.rel);
  }
  console.log("Metadata: " + changed + " Datei(en) " + (check ? "würden geändert" : "geändert") + ", " + skipped.length + " übersprungen.");
  return { changed, skipped };
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  migrateMetadata({ check: process.argv.includes("--check") });
}
