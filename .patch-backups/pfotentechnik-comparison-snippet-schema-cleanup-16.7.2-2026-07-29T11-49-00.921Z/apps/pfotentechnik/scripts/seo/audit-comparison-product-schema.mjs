#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const sourceFile = path.join(app, "src", "pages", "vergleiche", "[comparison].astro");
const source = fs.readFileSync(sourceFile, "utf8")
  .replace(/^\uFEFF/, "")
  .replace(/\r\n?/g, "\n");

const schema = source.match(/const comparisonItemListSchema = \{[\s\S]*?\n\};/)?.[0] ?? "";
const errors = [];
const warnings = [];

if (!schema) {
  errors.push("comparisonItemListSchema fehlt.");
}

if (
  schema.includes('"@type": "Product"') ||
  schema.includes("item: {") ||
  schema.includes("#product")
) {
  errors.push(
    "Vergleichs-ItemList enthält Product-Markup. Auf Übersichtsseiten dürfen ListItems nur auf die Produktseiten verweisen."
  );
}

for (const required of [
  '"@type": "ItemList"',
  '"@type": "ListItem"',
  "position: index + 1",
  "name: product.title",
  "url: new URL(product.href, Astro.site ?? Astro.url).href"
]) {
  if (!schema.includes(required)) {
    errors.push(`ItemList-Anforderung fehlt: ${required}`);
  }
}

function htmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
  });
}

function schemaTypes(node) {
  const type = node?.["@type"];
  return Array.isArray(type) ? type : type ? [type] : [];
}

function walk(value, visit) {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visit));
    return;
  }

  if (!value || typeof value !== "object") return;

  visit(value);
  Object.values(value).forEach((child) => walk(child, visit));
}

let checkedPages = 0;
let checkedItemLists = 0;

for (const file of htmlFiles(path.join(app, "dist", "vergleiche"))) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )
  ];

  const pageSchemas = [];

  for (const match of scripts) {
    try {
      pageSchemas.push(JSON.parse(match[1]));
    } catch {
      errors.push(`${path.relative(app, file)} enthält ungültiges JSON-LD.`);
    }
  }

  checkedPages += 1;
  let pageItemListCount = 0;

  for (const data of pageSchemas) {
    walk(data, (node) => {
      const types = schemaTypes(node);

      if (types.includes("Product")) {
        const hasEligibility =
          node.offers ||
          node.review ||
          node.aggregateRating;

        if (!hasEligibility) {
          errors.push(
            `${path.relative(app, file)} enthält Product ohne offers, review oder aggregateRating.`
          );
        }

        errors.push(
          `${path.relative(app, file)} enthält Product-Markup auf einer Vergleichs-Übersichtsseite.`
        );
      }

      if (!types.includes("ItemList")) return;

      pageItemListCount += 1;
      checkedItemLists += 1;

      const items = Array.isArray(node.itemListElement)
        ? node.itemListElement
        : [];

      if (node.numberOfItems !== items.length) {
        errors.push(
          `${path.relative(app, file)}: numberOfItems stimmt nicht mit itemListElement überein.`
        );
      }

      const positions = new Set();

      for (const item of items) {
        if (!schemaTypes(item).includes("ListItem")) {
          errors.push(
            `${path.relative(app, file)} enthält ein ItemList-Element ohne ListItem-Typ.`
          );
          continue;
        }

        if (!Number.isInteger(item.position) || item.position < 1) {
          errors.push(
            `${path.relative(app, file)} enthält eine ungültige ListItem-Position.`
          );
        } else if (positions.has(item.position)) {
          errors.push(
            `${path.relative(app, file)} enthält eine doppelte ListItem-Position.`
          );
        } else {
          positions.add(item.position);
        }

        if (typeof item.url !== "string" || !/^https?:\/\//.test(item.url)) {
          errors.push(
            `${path.relative(app, file)} enthält eine ungültige direkte Produkt-URL.`
          );
        }

        if (typeof item.name !== "string" || !item.name.trim()) {
          errors.push(
            `${path.relative(app, file)} enthält ein ListItem ohne Produktnamen.`
          );
        }

        if ("item" in item) {
          errors.push(
            `${path.relative(app, file)} verschachtelt erneut ein item-Objekt im ListItem.`
          );
        }
      }
    });
  }

  if (pageItemListCount !== 1) {
    errors.push(
      `${path.relative(app, file)} enthält ${pageItemListCount} ItemList-Schemata statt genau einem.`
    );
  }

  const faqCount = pageSchemas.reduce((count, data) => {
    let found = 0;
    walk(data, (node) => {
      if (schemaTypes(node).includes("FAQPage")) found += 1;
    });
    return count + found;
  }, 0);

  if (faqCount > 1) {
    errors.push(
      `${path.relative(app, file)} enthält mehrfaches FAQPage-Markup.`
    );
  }
}

if (!checkedPages) {
  warnings.push(
    "Kein dist/vergleiche gefunden; nur Quellcodeprüfung ausgeführt."
  );
}

warnings.forEach((warning) => console.warn(`INFO  ${warning}`));

if (errors.length) {
  [...new Set(errors)].forEach((error) => console.error(`FEHLER  ${error}`));
  process.exit(1);
}

console.log("OK  Vergleichsseiten enthalten keine unvollständigen Product-Snippets.");
console.log("OK  ItemList nutzt direkte ListItem-URLs mit stabilen Positionen.");
console.log("OK  Doppelte ItemList- und FAQPage-Schemata werden erkannt.");
console.log(
  checkedPages
    ? `INFO  ${checkedPages} gebaute Vergleichsseiten und ${checkedItemLists} ItemLists geprüft.`
    : "INFO  Quellcodeprüfung erfolgreich."
);
