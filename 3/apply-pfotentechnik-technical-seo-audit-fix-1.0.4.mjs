#!/usr/bin/env node
/**
 * PfotenTechnik Technical SEO Audit Fix 1.0.4
 *
 * Korrigiert die beiden verbliebenen falsch escapten Regex-Literale im
 * technischen SEO-Audit. Keine Funktionssuche, keine strukturellen Umbauten.
 *
 * Ausführung im Repository-Root:
 *   node apply-pfotentechnik-technical-seo-audit-fix-1.0.4.mjs
 */

import fs from "node:fs";
import path from "node:path";

const VERSION = "1.0.4";
const PREFIX = `[pfotentechnik-technical-seo-audit-${VERSION}]`;
const ROOT = process.cwd();
const FILE = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "scripts",
  "seo",
  "audit-week4-technical-seo.mjs"
);

function fail(message) {
  console.error(`\n${PREFIX} FEHLER: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(ROOT, "package.json"))) {
  fail("Bitte im Root des affiliate-template-Repositories ausführen.");
}

if (!fs.existsSync(FILE)) {
  fail(`Datei nicht gefunden: ${path.relative(ROOT, FILE)}`);
}

const before = fs.readFileSync(FILE, "utf8");
let after = before;

const replacements = [
  {
    label: "ItemList-RegEx",
    from: String.raw`/itemListElement:[\\s\\S]*?item:[\\s\\S]*?["@']@type["@']:\\s*["@']Product["@']/m`,
    to: String.raw`/itemListElement:[\s\S]*?item:[\s\S]*?["@']@type["@']:\s*["@']Product["@']/m`
  },
  {
    label: "JSON-LD-RegEx",
    from: String.raw`/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\\s\\S]*?)<\/script>/gi`,
    to: String.raw`/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi`
  }
];

const changed = [];

for (const replacement of replacements) {
  if (after.includes(replacement.to)) {
    console.log(`Übersprungen: ${replacement.label} (bereits korrigiert)`);
    continue;
  }

  if (!after.includes(replacement.from)) {
    fail(`Erwartete Stelle nicht gefunden: ${replacement.label}`);
  }

  after = after.replace(replacement.from, replacement.to);
  changed.push(replacement.label);
}

const assertions = [
  {
    label: "ItemList-RegEx korrigiert",
    ok: after.includes(
      String.raw`/itemListElement:[\s\S]*?item:[\s\S]*?["@']@type["@']:\s*["@']Product["@']/m`
    )
  },
  {
    label: "JSON-LD-RegEx korrigiert",
    ok: after.includes(
      String.raw`/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi`
    )
  },
  {
    label: "keine alte ItemList-RegEx",
    ok: !after.includes(
      String.raw`/itemListElement:[\\s\\S]*?item:[\\s\\S]*?["@']@type["@']:\\s*["@']Product["@']/m`
    )
  },
  {
    label: "keine alte JSON-LD-RegEx",
    ok: !after.includes(
      String.raw`/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\\s\\S]*?)<\/script>/gi`
    )
  }
];

for (const assertion of assertions) {
  if (!assertion.ok) fail(`Nachprüfung fehlgeschlagen: ${assertion.label}`);
}

if (after === before) {
  console.log(`\n${PREFIX} Keine Änderung nötig. Die Datei ist bereits aktuell.`);
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(
  ROOT,
  ".patch-backups",
  `pfotentechnik-technical-seo-audit-${VERSION}-${timestamp}`,
  path.relative(ROOT, FILE)
);

fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.copyFileSync(FILE, backup);
fs.writeFileSync(FILE, after, "utf8");

console.log(`\n${PREFIX} Abgeschlossen.`);
console.log(`Geändert: ${path.relative(ROOT, FILE)}`);
console.log(`Korrekturen: ${changed.join(", ")}`);
console.log(`Backup: ${path.relative(ROOT, backup)}`);

console.log(`
Jetzt ausführen:

  npm run seo:release:check -w @affiliate-sites/pfotentechnik
`);
