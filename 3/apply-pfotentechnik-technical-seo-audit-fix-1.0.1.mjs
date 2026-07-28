#!/usr/bin/env node
/**
 * PfotenTechnik Technical SEO Audit Fix 1.0.1
 *
 * Ausführung im Repository-Root:
 *   node apply-pfotentechnik-technical-seo-audit-fix-1.0.1.mjs
 *
 * Behebt:
 * - falsch escapte Sitemap- und JSON-LD-RegEx
 * - unvollständige Schema-Typ-Erkennung bei verschachtelten JSON-LD-Nodes
 * - veralteten Ratgeber-Prüfpfad
 * - doppelten /vergleiche/vergleiche/-Pfad
 * - fehlende Product-Items in der Comparison-ItemList
 *
 * Eigenschaften:
 * - robust gegen Formatierungsabweichungen
 * - idempotent
 * - Backup vor Änderungen
 * - bricht vor Schreibzugriff ab, wenn Pflichtstellen nicht sicher erkannt werden
 */

import fs from "node:fs";
import path from "node:path";

const VERSION = "1.0.1";
const PREFIX = `[pfotentechnik-technical-seo-audit-${VERSION}]`;
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const AUDIT_FILE = path.join(
  APP,
  "scripts",
  "seo",
  "audit-week4-technical-seo.mjs"
);
const COMPARISON_FILE = path.join(
  APP,
  "src",
  "pages",
  "vergleiche",
  "[comparison].astro"
);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `pfotentechnik-technical-seo-audit-${VERSION}-${timestamp}`
);

function fail(message) {
  console.error(`\n${PREFIX} FEHLER: ${message}`);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`Datei nicht gefunden: ${path.relative(ROOT, file)}`);
  }
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

function replaceOnce(source, pattern, replacement, label, { optional = false } = {}) {
  if (!pattern.test(source)) {
    if (optional) return source;
    fail(`Anker nicht gefunden: ${label}`);
  }

  pattern.lastIndex = 0;
  return source.replace(pattern, replacement);
}

if (!fs.existsSync(path.join(ROOT, "package.json"))) {
  fail("Bitte im Root des affiliate-template-Repositories ausführen.");
}

let auditBefore = read(AUDIT_FILE);
let auditAfter = auditBefore;

/**
 * 1. Falsch escapte RegEx korrigieren.
 * Unterstützt sowohl bereits teilweise korrigierte als auch alte Varianten.
 */
auditAfter = auditAfter
  .replace(
    /\/sitemap\.\*\\\\\.xml\$\/i/g,
    String.raw`/sitemap.*\.xml$/i`
  )
  .replace(
    /application\\\/ld\\\\\+json/g,
    String.raw`application\/ld\+json`
  );

/**
 * 2. schemaTypes rekursiv machen.
 * Ersetzt nur die Funktion zwischen schemaTypes und canonicalValues.
 */
const recursiveSchemaTypes = `function collectSchemaTypes(value, result = new Set(), seen = new Set()) {
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

function canonicalValues`;

if (!auditAfter.includes("function collectSchemaTypes(")) {
  auditAfter = replaceOnce(
    auditAfter,
    /function\s+schemaTypes\s*\(\s*html\s*\)\s*\{[\s\S]*?\n\}\s*\n\s*function\s+canonicalValues/,
    recursiveSchemaTypes,
    "schemaTypes-Funktion"
  );
}

/**
 * 3. Source-Prüfung für Product-Items robust machen.
 */
if (!auditAfter.includes("itemListElement") ||
    !/ItemList enthält Product-Items/.test(auditAfter)) {
  fail("ItemList-Source-Prüfung konnte nicht sicher erkannt werden.");
}

auditAfter = auditAfter.replace(
  /check\(\s*["']ItemList enthält Product-Items["']\s*,[\s\S]*?\);\s*/,
  `check(
  "ItemList enthält Product-Items",
  /itemListElement:[\\\\s\\\\S]*?item:[\\\\s\\\\S]*?["@']@type["@']:\\\\s*["@']Product["@']/m.test(comparisonRoute)
);
`
);

/**
 * 4. Veraltete Build-Zielpfade korrigieren.
 */
auditAfter = auditAfter
  .replace(
    /["']futterautomat-ohne-wlan\/index\.html["']/g,
    `"smarte-futterautomaten/index.html"`
  )
  .replace(
    /["']vergleiche\/vergleiche\/beste-futterautomaten-ohne-wlan\/index\.html["']/g,
    `"vergleiche/beste-futterautomaten-ohne-wlan/index.html"`
  );

/**
 * Sicherstellen, dass die entscheidenden Korrekturen tatsächlich enthalten sind.
 */
const auditAssertions = [
  {
    ok: /\/sitemap\.\*\\\.xml\$\/i/.test(auditAfter),
    label: "Sitemap-RegEx"
  },
  {
    ok: /application\\\/ld\\\+json/.test(auditAfter),
    label: "JSON-LD-RegEx"
  },
  {
    ok: auditAfter.includes("function collectSchemaTypes("),
    label: "rekursive Schema-Erkennung"
  },
  {
    ok: auditAfter.includes('"smarte-futterautomaten/index.html"'),
    label: "Ratgeber-Zielpfad"
  },
  {
    ok: auditAfter.includes(
      '"vergleiche/beste-futterautomaten-ohne-wlan/index.html"'
    ),
    label: "Comparison-Zielpfad"
  },
  {
    ok: !auditAfter.includes("vergleiche/vergleiche/"),
    label: "kein doppelter Vergleichspfad"
  }
];

for (const assertion of auditAssertions) {
  if (!assertion.ok) {
    fail(`Nachprüfung fehlgeschlagen: ${assertion.label}`);
  }
}

/**
 * 5. Comparison ItemList um eingebettete Product-Nodes ergänzen.
 */
let comparisonBefore = read(COMPARISON_FILE);
let comparisonAfter = comparisonBefore;

if (!/"@type"\s*:\s*"Product"/.test(comparisonAfter)) {
  comparisonAfter = replaceOnce(
    comparisonAfter,
    /itemListElement:\s*model\.products\.map\(\s*\(\s*product\s*,\s*index\s*\)\s*=>\s*\(\s*\{([\s\S]*?)url:\s*new URL\(product\.href,\s*Astro\.site\s*\?\?\s*Astro\.url\)\.href\s*\}\s*\)\s*\)/m,
    (_match, body) => {
      return `itemListElement: model.products.map((product, index) => {
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
  })`;
    },
    "Comparison-ItemList"
  );
}

if (!/"@type"\s*:\s*"Product"/.test(comparisonAfter)) {
  fail("Product-Node wurde nicht in die Comparison-ItemList eingefügt.");
}

const changed = [
  writeChanged(AUDIT_FILE, auditBefore, auditAfter),
  writeChanged(COMPARISON_FILE, comparisonBefore, comparisonAfter)
].filter(Boolean).length;

console.log(`\n${PREFIX} Abgeschlossen.`);
console.log(`Geänderte Dateien: ${changed}`);

if (changed > 0) {
  console.log(`Backups: ${path.relative(ROOT, BACKUP_ROOT)}`);
}

console.log(`
Validierung:

  npm run seo:release:check -w @affiliate-sites/pfotentechnik

Bei einem Workspace-Problem alternativ:

  cd apps/pfotentechnik
  npm run seo:release:check
`);
