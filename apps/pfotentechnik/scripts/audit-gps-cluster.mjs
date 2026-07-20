import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productDir = path.join(root, "src/content/products");
const comparisonDir = path.join(root, "src/content/comparisons");
const pageDir = path.join(root, "src/content/pages");

const requiredProducts = [
  "tractive-dog-6",
  "tractive-dog-6-xl",
  "tractive-cat-6-mini",
  "weenect-xs",
  "weenect-xt",
  "paj-pet-finder-4g-mini",
  "garmin-alpha-t-20",
  "garmin-alpha-tt-25"
];

const requiredComparisons = [
  "beste-gps-tracker-fuer-hunde",
  "beste-gps-tracker-fuer-katzen",
  "gps-tracker-ohne-abo",
  "gps-tracker-mit-langer-akkulaufzeit",
  "kleine-gps-tracker-fuer-katzen"
];

const errors = [];
const warnings = [];
const read = (file) => fs.readFileSync(file, "utf8");

for (const slug of requiredProducts) {
  const file = path.join(productDir, `${slug}.md`);
  if (!fs.existsSync(file)) {
    errors.push(`Produkt fehlt: ${slug}`);
    continue;
  }
  const text = read(file);
  for (const field of ["gps:", "animal:", "subscriptionRequired:", "transmission:", "weightBasis:"]) {
    if (!text.includes(field)) errors.push(`${slug}: GPS-Feld fehlt: ${field}`);
  }
  if (!text.includes('category: { key: "gps-tracker"')) {
    warnings.push(`${slug}: Kategorie ist nicht eindeutig gps-tracker`);
  }
}

for (const slug of requiredComparisons) {
  if (!fs.existsSync(path.join(comparisonDir, `${slug}.md`))) {
    errors.push(`Vergleich fehlt: ${slug}`);
  }
}

const hub = path.join(pageDir, "gps-tracker.md");
if (!fs.existsSync(hub)) {
  errors.push("GPS-Cornerstone fehlt");
} else {
  const text = read(hub);
  for (const slug of requiredComparisons) {
    if (!text.includes(`/vergleiche/${slug}/`)) {
      warnings.push(`Cornerstone verlinkt Vergleich nicht: ${slug}`);
    }
  }
}

console.log("# GPS-Cluster Audit");
console.log(`Produkte geprüft: ${requiredProducts.length}`);
console.log(`Vergleiche geprüft: ${requiredComparisons.length}`);
console.log(`Fehler: ${errors.length}`);
console.log(`Warnungen: ${warnings.length}`);
errors.forEach((entry) => console.log(`ERROR: ${entry}`));
warnings.forEach((entry) => console.log(`WARNING: ${entry}`));
if (errors.length > 0) process.exit(1);
