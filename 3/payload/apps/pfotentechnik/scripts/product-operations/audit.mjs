#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readProductDocument, readProductFiles } from "../../src/lib/price-intelligence/frontmatter-price.mjs";
import {
  buildOperationsDashboard,
  deriveProductOperations,
  operationFieldsFrom
} from "../../src/lib/product-operations/policy.mjs";

const strict = process.argv.includes("--strict");
const appRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const productsDir = path.join(appRoot, "src", "content", "products");
const files = await readProductFiles(productsDir);
const rows = [];
const errors = [];
const warnings = [];

const normalize = (value) => value instanceof Date ? value.toISOString() : value;
for (const file of files) {
  const document = await readProductDocument(file);
  const expected = operationFieldsFrom(document.data);
  const operations = deriveProductOperations(document.data);
  rows.push({ slug: document.slug, operations });

  for (const [key, value] of Object.entries(expected)) {
    if (String(normalize(document.data[key]) ?? "") !== String(normalize(value) ?? "")) {
      errors.push(`${document.slug}: ${key} ist nicht mit der Pflegelogik synchronisiert.`);
    }
  }

  if (operations.consciouslyUnavailable && operations.isTask) {
    errors.push(`${document.slug}: bewusst nicht verfügbares Produkt wird als offene Aufgabe geführt.`);
  }
  if (operations.archived && operations.warnings.length) {
    errors.push(`${document.slug}: archiviertes Produkt erzeugt offene Warnungen.`);
  }
  if (operations.availability === "discontinued" && operations.autoRecommendationEligible) {
    errors.push(`${document.slug}: eingestelltes Produkt ist automatisch empfehlbar.`);
  }
  if (operations.priceState === "removed" && operations.current != null) {
    errors.push(`${document.slug}: bewusst entfernter Preis enthält weiterhin einen Wert.`);
  }
  if (operations.priceAgeDays != null && operations.priceAgeDays > 30 && operations.priceAgeDays <= 90) {
    warnings.push(`${document.slug}: Preis ist älter als 30 Tage.`);
  }
}

const dashboard = buildOperationsDashboard(rows);
console.log("Product-Operations-Audit abgeschlossen");
console.log(JSON.stringify(dashboard, null, 2));
console.log(`Fehler: ${errors.length}, Hinweise: ${warnings.length}`);
for (const error of errors.slice(0, 50)) console.error(`FEHLER ${error}`);
for (const warning of warnings.slice(0, 20)) console.warn(`HINWEIS ${warning}`);
if (errors.length) process.exitCode = 1;
if (strict && !errors.length) console.log("Strict-Modus: keine Inkonsistenzen.");
