#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { atomicWriteFile } from "../../src/lib/admin/atomic-file.mjs";
import {
  buildGpsSubscriptionSnapshot,
  loadGpsProducts,
  renderGpsSubscriptionMarkdown,
} from "../../src/lib/authority-distribution/gps-subscriptions.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const productDirectory = path.join(appRoot, "src/content/products");
const outputDirectory = path.join(appRoot, "reports/authority-distribution/data-assets");
const jsonFile = path.join(outputDirectory, "gps-subscriptions.json");
const markdownFile = path.join(outputDirectory, "gps-subscriptions.md");

const previousSnapshot = await fs.readFile(jsonFile, "utf8")
  .then((source) => JSON.parse(source))
  .catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));

const products = await loadGpsProducts(productDirectory);
const snapshot = buildGpsSubscriptionSnapshot(products, {
  generatedAt: new Date().toISOString(),
  previousSnapshot,
});

await atomicWriteFile(jsonFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
await atomicWriteFile(markdownFile, renderGpsSubscriptionMarkdown(snapshot), "utf8");

console.log(`GPS-Abos: ${snapshot.population.counts.eligible}/${snapshot.population.counts.total} auswertbar; required ${snapshot.population.counts.required}, optional ${snapshot.population.counts.optional}, none ${snapshot.population.counts.none}.`);
console.log(`Snapshot: ${path.relative(appRoot, jsonFile)} · Version ${snapshot.snapshotVersion}`);
console.log(snapshot.changeFinding ? `Change Finding: ${snapshot.changeFinding.changes.length} Änderung(en).` : "Change Finding: keines.");

if (!snapshot.validation.passed) {
  console.error(`Validation Gate BLOCKED: ${snapshot.validation.errors.join("; ")}`);
  process.exitCode = 1;
}
