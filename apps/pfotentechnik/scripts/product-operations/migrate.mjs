#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  migrateProductOperations,
  readProductDocument,
  readProductFiles
} from "../../src/lib/price-intelligence/frontmatter-price.mjs";
import { operationFieldsFrom } from "../../src/lib/product-operations/policy.mjs";

const appRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const productsDir = path.join(appRoot, "src", "content", "products");
const write = process.argv.includes("--write");
const files = await readProductFiles(productsDir);
const differences = [];

const same = (left, right) => {
  if (left instanceof Date) left = left.toISOString();
  if (right instanceof Date) right = right.toISOString();
  return String(left ?? "") === String(right ?? "");
};

for (const file of files) {
  const before = await readProductDocument(file);
  const expected = operationFieldsFrom(before.data);
  const changedKeys = Object.entries(expected)
    .filter(([key, value]) => !same(before.data[key], value))
    .map(([key]) => key);

  if (!changedKeys.length) continue;
  differences.push({ slug: before.slug, fields: changedKeys });
  if (write) await migrateProductOperations(file);
}

console.log(`Product-Operations-Migration: ${files.length} Produkte geprüft.`);
console.log(`${differences.length} Produkte ${write ? "migriert" : "würden migriert"}.`);
for (const item of differences.slice(0, 30)) console.log(`- ${item.slug}: ${item.fields.join(", ")}`);
if (differences.length > 30) console.log(`- … ${differences.length - 30} weitere`);

if (!write && differences.length) process.exitCode = 1;
