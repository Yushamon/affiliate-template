#!/usr/bin/env node
/**
 * PfotenTechnik Technical SEO Audit Fix 1.0.2
 *
 * Ausführung im Repository-Root:
 *   node apply-pfotentechnik-technical-seo-audit-fix-1.0.2.mjs
 *
 * Robust gegen abweichende Formatierung und bereits teilweise angewendete Fixes.
 */

import fs from "node:fs";
import path from "node:path";

const VERSION = "1.0.2";
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

if (!fs.existsSync(path.join(ROOT, "package.json"))) {
  fail("Bitte im Root des affiliate-template-Repositories ausführen.");
}

let auditBefore = read(AUDIT_FILE);
let auditAfter = auditBefore;

/* 1) Regex-Escaping korrigieren */
auditAfter = auditAfter
  .replace(/\/sitemap\.\*\\\\\.xml\$\/i/g, String.raw`/sitemap.*\.xml$/i`)
  .replace(/application\\\/ld\\\\\+json/g, String.raw`application\/ld\+json`);

/* 2) Rekursive Schema-Typ-Erkennung ergänzen */
if (!auditAfter.includes("function collectSchemaTypes(")) {
  const schemaFunctionPattern =
    /function\s+schemaTypes\s*\(\s*html\s*\)\s*\{[\s\S]*?\n\}\s*(?=\nfunction\s+canonicalValues)/m;

  if (!schemaFunctionPattern.test(auditAfter)) {
    fail("schemaTypes-Funktion konnte nicht sicher erkannt werden.");
  }

  const replacement = `function collectSchemaTypes(value, result = new Set(), seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return result;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const entry of value) collectSchemaTypes(entry, result, seen);
    return result;
  }

  const type = value["@type"];
  if (Array.isArray(type)) {
    for (const entry of type) result.add(entry);
  } else if (type) {
    result.add(type);
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === "@context") continue;
    if (child && typeof child === "object") {
      collectSchemaTypes(child, result, seen);
    }
  }

  return result;
}

function schemaTypes(html) {
  return [
    ...parseJsonLd(html).reduce(
      (result, entry) => collectSchemaTypes(entry, result),
      new Set()
    )
  ];
}
`;

  auditAfter = auditAfter.replace(schemaFunctionPattern, replacement.trimEnd());
}

/* 3) ItemList-Source-Check ersetzen, ohne itemListElement vorher vorauszusetzen */
const itemCheckPattern =
  /check\(\s*["']ItemList enthält Product-Items["']\s*,[\s\S]*?\);\s*/m;

if (!itemCheckPattern.test(auditAfter)) {
  fail("ItemList-Source-Prüfung konnte nicht erkannt werden.");
}

auditAfter = auditAfter.replace(
  itemCheckPattern,
  `check(
  "ItemList enthält Product-Items",
  /itemListElement:[\\\\s\\\\S]*?item:[\\\\s\\\\S]*?["@']@type["@']:\\\\s*["@']Product["@']/m.test(comparisonRoute)
);
`
);

/* 4) Veraltete harte Build-Pfade korrigieren */
auditAfter = auditAfter
  .replace(
    /["']futterautomat-ohne-wlan\/index\.html["']/g,
    `"smarte-futterautomaten/index.html"`
  )
  .replace(
    /["']vergleiche\/vergleiche\/beste-futterautomaten-ohne-wlan\/index\.html["']/g,
    `"vergleiche/beste-futterautomaten-ohne-wlan/index.html"`
  );

/* 5) Comparison-ItemList um Product-Knoten ergänzen */
let comparisonBefore = read(COMPARISON_FILE);
let comparisonAfter = comparisonBefore;

if (!/"@type"\s*:\s*"Product"/.test(comparisonAfter)) {
  const oldMapPattern =
    /itemListElement:\s*model\.products\.map\(\s*\(\s*product\s*,\s*index\s*\)\s*=>\s*\(\s*\{[\s\S]*?position:\s*index\s*\+\s*1,[\s\S]*?url:\s*new URL\(\s*product\.href\s*,\s*Astro\.site\s*\?\?\s*Astro\.url\s*\)\.href[\s\S]*?\}\s*\)\s*\)/m;

  if (!oldMapPattern.test(comparisonAfter)) {
    fail("Comparison-ItemList konnte nicht sicher erkannt werden.");
  }

  comparisonAfter = comparisonAfter.replace(
    oldMapPattern,
    `itemListElement: model.products.map((product, index) => {
    const productUrl = new URL(
      product.href,
      Astro.site ?? Astro.url
    ).href;

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
  })`
  );
}

/* 6) Nachprüfung */
const assertions = [
  ["Sitemap-RegEx", /\/sitemap\.\*\\\.xml\$\/i/.test(auditAfter)],
  ["JSON-LD-RegEx", /application\\\/ld\\\+json/.test(auditAfter)],
  ["rekursive Schema-Erkennung", auditAfter.includes("function collectSchemaTypes(")],
  ["Ratgeber-Pfad", auditAfter.includes('"smarte-futterautomaten/index.html"')],
  ["Comparison-Pfad", auditAfter.includes('"vergleiche/beste-futterautomaten-ohne-wlan/index.html"')],
  ["kein Doppelpfad", !auditAfter.includes("vergleiche/vergleiche/")],
  ["Product-Node", /"@type"\s*:\s*"Product"/.test(comparisonAfter)]
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
Validierung:

  npm run seo:release:check -w @affiliate-sites/pfotentechnik
`);
