#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP = path.join(ROOT, 'apps', 'pfotentechnik');
const AUDIT = path.join(APP, 'scripts', 'seo', 'audit-week4-technical-seo.mjs');
const COMPARISON = path.join(APP, 'src', 'pages', 'vergleiche', '[comparison].astro');
const VERSION = '1.0.0';
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupRoot = path.join(ROOT, '.patch-backups', `pfotentechnik-technical-seo-audit-${VERSION}-${stamp}`);

function fail(message) {
  console.error(`\n[pfotentechnik-technical-seo-audit-${VERSION}] FEHLER: ${message}`);
  process.exit(1);
}
function read(file) {
  if (!fs.existsSync(file)) fail(`Datei nicht gefunden: ${path.relative(ROOT, file)}`);
  return fs.readFileSync(file, 'utf8');
}
function backup(file) {
  const target = path.join(backupRoot, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
function save(file, before, after) {
  if (before === after) {
    console.log(`Übersprungen: ${path.relative(ROOT, file)} (bereits aktuell)`);
    return 0;
  }
  backup(file);
  fs.writeFileSync(file, after, 'utf8');
  console.log(`Geändert: ${path.relative(ROOT, file)}`);
  return 1;
}
function replaceRequired(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) fail(`Anker nicht gefunden: ${label}`);
  return source.replace(search, replacement);
}

if (!fs.existsSync(path.join(ROOT, 'package.json'))) {
  fail('Bitte im Root des affiliate-template-Repositories ausführen.');
}

let auditBefore = read(AUDIT);
let auditAfter = auditBefore;

// Falsch doppelt escapte Regexe reparieren.
auditAfter = auditAfter
  .replace('/sitemap.*\\\\.xml$/i', '/sitemap.*\\.xml$/i')
  .replace('/application\\/ld\\\\+json/', '/application\\/ld\\+json/');

const oldParser = `function parseJsonLd(html) {
  const values = [];
  const regex = /<script[^>]+type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi;
  for (const match of html.matchAll(regex)) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed?.["@graph"] && Array.isArray(parsed["@graph"])) {
        values.push(...parsed["@graph"]);
      } else {
        values.push(parsed);
      }
    } catch {
      values.push({ "@type": "__INVALID_JSON_LD__" });
    }
  }
  return values;
}

function schemaTypes(html) {
  return parseJsonLd(html).flatMap((entry) => {
    const type = entry?.["@type"];
    return Array.isArray(type) ? type : type ? [type] : [];
  });
}`;

const newParser = `function parseJsonLd(html) {
  const values = [];
  const regex = /<script[^>]*type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi;
  for (const match of html.matchAll(regex)) {
    try {
      const raw = match[1].trim().replace(/^<!--|-->$/g, "").trim();
      if (raw) values.push(JSON.parse(raw));
    } catch {
      values.push({ "@type": "__INVALID_JSON_LD__" });
    }
  }
  return values;
}

function flattenSchemaNodes(value, result = [], seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return result;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const entry of value) flattenSchemaNodes(entry, result, seen);
    return result;
  }
  result.push(value);
  for (const [key, child] of Object.entries(value)) {
    if (key === "@context") continue;
    if (child && typeof child === "object") flattenSchemaNodes(child, result, seen);
  }
  return result;
}

function schemaTypes(html) {
  return [...new Set(
    parseJsonLd(html)
      .flatMap((entry) => flattenSchemaNodes(entry))
      .flatMap((entry) => {
        const type = entry?.["@type"];
        return Array.isArray(type) ? type : type ? [type] : [];
      })
  )];
}`;

auditAfter = replaceRequired(auditAfter, oldParser, newParser, 'JSON-LD-Parser');

const oldTargets = `    const targetSchemas = [
      ["futterautomat-ohne-wlan/index.html", ["Article"], "Ratgeber"],
      ["vergleiche/vergleiche/beste-futterautomaten-ohne-wlan/index.html", ["WebPage", "ItemList"], "Comparison"],
      ["produkt/petlibro-polar-wet-food-feeder/index.html", ["WebPage", "Product"], "Produkt"],
      ["hersteller/petlibro/index.html", ["Article"], "Hersteller"]
    ];

    for (const [relative, expectedTypes, label] of targetSchemas) {
      const file = path.join(dist, relative);
      check(\`${'${label}'}-HTML vorhanden\`, fs.existsSync(file), relative);
      if (!fs.existsSync(file)) continue;
      const types = schemaTypes(read(file));
      check(
        \`${'${label}'}-Schema vollständig\`,
        expectedTypes.every((type) => types.includes(type)),
        \`gefunden: ${'${types.join(", ")}'}\`
      );
      check(
        \`${'${label}'}-JSON-LD parsebar\`,
        !types.includes("__INVALID_JSON_LD__")
      );
    }`;

const newTargets = `    function firstExistingHtml(candidates) {
      return candidates
        .map((relative) => ({ relative, file: path.join(dist, relative) }))
        .find(({ file }) => fs.existsSync(file));
    }

    function firstHtmlIn(directory) {
      const files = walk(path.join(dist, directory), (file) => file.endsWith("index.html"));
      const file = files[0];
      return file
        ? { file, relative: path.relative(dist, file).split(path.sep).join("/") }
        : undefined;
    }

    const targetSchemas = [
      {
        label: "Ratgeber",
        expectedTypes: ["Article"],
        target: firstExistingHtml([
          "wie-funktioniert-ein-futterautomat/index.html",
          "welcher-futterautomat-ist-der-richtige/index.html",
          "smarte-futterautomaten/index.html"
        ])
      },
      {
        label: "Comparison",
        expectedTypes: ["WebPage", "ItemList", "Product"],
        target: firstExistingHtml([
          "vergleiche/beste-futterautomaten-ohne-wlan/index.html"
        ]) ?? firstHtmlIn("vergleiche")
      },
      {
        label: "Produkt",
        expectedTypes: ["WebPage", "Product"],
        target: firstExistingHtml([
          "produkt/petlibro-polar-wet-food-feeder/index.html"
        ]) ?? firstHtmlIn("produkt")
      },
      {
        label: "Hersteller",
        expectedTypes: ["Article"],
        target: firstExistingHtml([
          "hersteller/petlibro/index.html"
        ]) ?? firstHtmlIn("hersteller")
      }
    ];

    for (const { label, expectedTypes, target } of targetSchemas) {
      check(
        \`${'${label}'}-HTML vorhanden\`,
        Boolean(target?.file),
        target?.relative ?? "kein passendes Build-Ziel gefunden"
      );
      if (!target?.file) continue;
      const types = schemaTypes(read(target.file));
      check(
        \`${'${label}'}-Schema vollständig\`,
        expectedTypes.every((type) => types.includes(type)),
        \`${'${target.relative}'}; gefunden: ${'${types.join(", ") || "keine"}'}\`
      );
      check(
        \`${'${label}'}-JSON-LD parsebar\`,
        !types.includes("__INVALID_JSON_LD__"),
        target.relative
      );
    }`;

auditAfter = replaceRequired(auditAfter, oldTargets, newTargets, 'dynamische Schema-Ziele');

auditAfter = auditAfter.replace(
  `check("ItemList enthält Product-Items", comparisonRoute.includes('"@type": "Product"'));`,
  `check(\n  "ItemList enthält Product-Items",\n  /itemListElement:[\\s\\S]*?item:[\\s\\S]*?["']@type["']:\\s*["']Product["']/m.test(comparisonRoute)\n);`
);

let comparisonBefore = read(COMPARISON);
let comparisonAfter = comparisonBefore;
const oldItemList = `  // Übersichtsseite: vollständige Product-Daten stehen auf den Produktseiten.
  itemListElement: model.products.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: new URL(product.href, Astro.site ?? Astro.url).href
  }))`;
const newItemList = `  itemListElement: model.products.map((product, index) => {
    const productUrl = new URL(product.href, Astro.site ?? Astro.url).href;
    return {
      "@type": "ListItem",
      position: index + 1,
      url: productUrl,
      item: {
        "@type": "Product",
        "@id": \`${'${productUrl}'}#product\`,
        name: product.title,
        url: productUrl,
        ...(product.image?.src
          ? { image: new URL(product.image.src, Astro.site ?? Astro.url).href }
          : {})
      }
    };
  })`;
comparisonAfter = replaceRequired(comparisonAfter, oldItemList, newItemList, 'Comparison ItemList');

const changed = save(AUDIT, auditBefore, auditAfter) + save(COMPARISON, comparisonBefore, comparisonAfter);
console.log(`\n[pfotentechnik-technical-seo-audit-${VERSION}] Abgeschlossen.`);
console.log(`Geänderte Dateien: ${changed}`);
if (changed) console.log(`Backups: ${path.relative(ROOT, backupRoot)}`);
console.log('\nJetzt ausführen:\n  npm run seo:release:check -w @affiliate-sites/pfotentechnik\n');
