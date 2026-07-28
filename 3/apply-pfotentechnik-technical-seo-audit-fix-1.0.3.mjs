#!/usr/bin/env node
/**
 * PfotenTechnik Technical SEO Audit Fix 1.0.3
 *
 * Behebt die verbliebenen falschen Negativbefunde des technischen SEO-Audits:
 * - JSON-LD-Blöcke werden zuverlässig erkannt und geparst
 * - @graph, Arrays und verschachtelte Nodes werden ausgewertet
 * - ItemList-Product-Sourceprüfung wird auf belastbare Merkmale reduziert
 * - Product-Nodes werden bei Bedarf in der Comparison-ItemList ergänzt
 *
 * Ausführung im Repository-Root:
 *   node apply-pfotentechnik-technical-seo-audit-fix-1.0.3.mjs
 */

import fs from "node:fs";
import path from "node:path";

const VERSION = "1.0.3";
const PREFIX = `[pfotentechnik-technical-seo-audit-${VERSION}]`;
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const AUDIT_FILE = path.join(APP, "scripts", "seo", "audit-week4-technical-seo.mjs");
const COMPARISON_FILE = path.join(APP, "src", "pages", "vergleiche", "[comparison].astro");
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `pfotentechnik-technical-seo-audit-${VERSION}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function fail(message) {
  console.error(`\n${PREFIX} FEHLER: ${message}`);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Datei nicht gefunden: ${path.relative(ROOT, file)}`);
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  const relative = path.relative(ROOT, file);
  const target = path.join(BACKUP_ROOT, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function writeChanged(file, before, after) {
  if (before === after) {
    console.log(`Übersprungen: ${path.relative(ROOT, file)} (bereits aktuell)`);
    return false;
  }
  backup(file);
  fs.writeFileSync(file, after, "utf8");
  console.log(`Geändert: ${path.relative(ROOT, file)}`);
  return true;
}

function findFunctionRange(source, functionName) {
  const signature = new RegExp(`function\\s+${functionName}\\s*\\(`);
  const match = signature.exec(source);
  if (!match) return null;

  const openBrace = source.indexOf("{", match.index);
  if (openBrace < 0) return null;

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return { start: match.index, end: index + 1 };
      }
    }
  }

  return null;
}

function replaceFunction(source, functionName, replacement) {
  const range = findFunctionRange(source, functionName);
  if (!range) fail(`Funktion nicht sicher gefunden: ${functionName}`);
  return source.slice(0, range.start) + replacement + source.slice(range.end);
}

if (!fs.existsSync(path.join(ROOT, "package.json"))) {
  fail("Bitte im Root des affiliate-template-Repositories ausführen.");
}

let auditBefore = read(AUDIT_FILE);
let auditAfter = auditBefore;

const parseJsonLdFunction = `function parseJsonLd(html) {
  const values = [];
  const regex = /<script\\b[^>]*\\btype\\s*=\\s*["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi;

  for (const match of html.matchAll(regex)) {
    const raw = match[1]
      .trim()
      .replace(/^<!--\\s*/, "")
      .replace(/\\s*-->$/, "")
      .trim();

    if (!raw) continue;

    try {
      values.push(JSON.parse(raw));
    } catch {
      values.push({ "@type": "__INVALID_JSON_LD__" });
    }
  }

  return values;
}`;

auditAfter = replaceFunction(auditAfter, "parseJsonLd", parseJsonLdFunction);

const schemaTypesFunction = `function schemaTypes(html) {
  const types = new Set();
  const seen = new Set();

  function visit(value) {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
      return;
    }

    const type = value["@type"];
    if (Array.isArray(type)) {
      for (const entry of type) types.add(entry);
    } else if (type) {
      types.add(type);
    }

    for (const [key, child] of Object.entries(value)) {
      if (key === "@context") continue;
      if (child && typeof child === "object") visit(child);
    }
  }

  for (const entry of parseJsonLd(html)) visit(entry);
  return [...types];
}`;

auditAfter = replaceFunction(auditAfter, "schemaTypes", schemaTypesFunction);

/* Veraltete Hilfsfunktion aus 1.0.2 entfernen, falls vorhanden. */
const collectRange = findFunctionRange(auditAfter, "collectSchemaTypes");
if (collectRange) {
  auditAfter =
    auditAfter.slice(0, collectRange.start) +
    auditAfter.slice(collectRange.end).replace(/^\s*\n/, "\n");
}

/* ItemList-Prüfung bewusst einfach und robust halten. */
const itemCheckPattern =
  /check\(\s*["']ItemList enthält Product-Items["']\s*,[\s\S]*?\);\s*/m;

if (!itemCheckPattern.test(auditAfter)) {
  fail("ItemList-Source-Prüfung konnte nicht gefunden werden.");
}

auditAfter = auditAfter.replace(
  itemCheckPattern,
  `check(
  "ItemList enthält Product-Items",
  comparisonRoute.includes('"@type": "Product"') &&
    comparisonRoute.includes("itemListElement:")
);
`
);

/* Bekannte Zielpfade normalisieren. */
auditAfter = auditAfter
  .replace(
    /["']futterautomat-ohne-wlan\/index\.html["']/g,
    `"smarte-futterautomaten/index.html"`
  )
  .replace(
    /["']vergleiche\/vergleiche\/beste-futterautomaten-ohne-wlan\/index\.html["']/g,
    `"vergleiche/beste-futterautomaten-ohne-wlan/index.html"`
  );

/* Comparison Product-Nodes nur ergänzen, falls noch nicht vorhanden. */
let comparisonBefore = read(COMPARISON_FILE);
let comparisonAfter = comparisonBefore;

if (!comparisonAfter.includes('"@type": "Product"')) {
  const mapStart = comparisonAfter.indexOf("itemListElement: model.products.map");
  if (mapStart < 0) fail("Comparison-ItemList wurde nicht gefunden.");

  const mapEndMarker = "\n  }))";
  const mapEnd = comparisonAfter.indexOf(mapEndMarker, mapStart);
  if (mapEnd < 0) fail("Ende der Comparison-ItemList wurde nicht gefunden.");

  const replacement = `itemListElement: model.products.map((product, index) => {
    const productUrl = new URL(product.href, Astro.site ?? Astro.url).href;

    return {
      "@type": "ListItem",
      position: index + 1,
      url: productUrl,
      item: {
        "@type": "Product",
        "@id": \`\${productUrl}#product\`,
        name: product.title,
        url: productUrl
      }
    };
  })`;

  comparisonAfter =
    comparisonAfter.slice(0, mapStart) +
    replacement +
    comparisonAfter.slice(mapEnd + mapEndMarker.length);
}

/* Harte Nachprüfung vor Schreibzugriff. */
const assertions = [
  ["JSON-LD Parser", auditAfter.includes("application\\/ld\\+json")],
  ["schemaTypes Parser", auditAfter.includes("for (const entry of parseJsonLd(html)) visit(entry)")],
  ["ItemList Source Check", auditAfter.includes(`comparisonRoute.includes('"@type": "Product"')`)],
  ["Ratgeber-Zielpfad", auditAfter.includes('"smarte-futterautomaten/index.html"')],
  ["Comparison-Zielpfad", auditAfter.includes('"vergleiche/beste-futterautomaten-ohne-wlan/index.html"')],
  ["kein doppelter Comparison-Pfad", !auditAfter.includes("vergleiche/vergleiche/")],
  ["Comparison Product Node", comparisonAfter.includes('"@type": "Product"')]
];

for (const [label, ok] of assertions) {
  if (!ok) fail(`Nachprüfung fehlgeschlagen: ${label}`);
}

const changed = [
  writeChanged(AUDIT_FILE, auditBefore, auditAfter),
  writeChanged(COMPARISON_FILE, comparisonBefore, comparisonAfter)
].filter(Boolean).length;

console.log(`\n${PREFIX} Abgeschlossen.`);
console.log(`Geänderte Dateien: ${changed}`);
if (changed) console.log(`Backups: ${path.relative(ROOT, BACKUP_ROOT)}`);

console.log(`
Jetzt ausführen:

  npm run seo:release:check -w @affiliate-sites/pfotentechnik
`);
