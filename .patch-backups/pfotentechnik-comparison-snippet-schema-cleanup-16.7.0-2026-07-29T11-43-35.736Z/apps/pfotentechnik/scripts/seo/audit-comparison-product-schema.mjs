#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const sourceFile = path.join(app, "src", "pages", "vergleiche", "[comparison].astro");
const source = fs.readFileSync(sourceFile, "utf8").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
const schema = source.match(/const comparisonItemListSchema = \{[\s\S]*?\n\};/)?.[0] ?? "";
const errors = [];

if (!schema) errors.push("comparisonItemListSchema fehlt.");
if (schema.includes('"@type": "Product"') || schema.includes("item: {")) {
  errors.push("Vergleichs-ItemList enthält unvollständige Product-Objekte.");
}
if (!schema.includes('"@type": "ListItem"') ||
    !schema.includes("url: new URL(product.href, Astro.site ?? Astro.url).href")) {
  errors.push("ListItem benötigt position und direkte Produkt-URL.");
}

function htmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
  });
}

function walk(value, visit) {
  if (Array.isArray(value)) return value.forEach((item) => walk(item, visit));
  if (!value || typeof value !== "object") return;
  visit(value);
  Object.values(value).forEach((child) => walk(child, visit));
}

let checked = 0;
for (const file of htmlFiles(path.join(app, "dist", "vergleiche"))) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try { data = JSON.parse(match[1]); } catch { continue; }
    walk(data, (node) => {
      if (node["@type"] !== "ItemList") return;
      checked += 1;
      for (const item of Array.isArray(node.itemListElement) ? node.itemListElement : []) {
        if (item?.item?.["@type"] === "Product") {
          errors.push(`${path.relative(app, file)} enthält Product in ItemList.`);
        }
        if (item?.["@type"] === "ListItem" &&
            (!Number.isInteger(item.position) || typeof item.url !== "string")) {
          errors.push(`${path.relative(app, file)} enthält ungültiges ListItem.`);
        }
      }
    });
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`FEHLER  ${error}`));
  process.exit(1);
}

console.log("OK  Vergleichs-ItemList ohne unvollständige Product-Objekte.");
console.log(checked
  ? `INFO  ${checked} gebaute ItemList-Schemata geprüft.`
  : "INFO  Kein dist-Verzeichnis gefunden; Quellcodeprüfung erfolgreich.");
