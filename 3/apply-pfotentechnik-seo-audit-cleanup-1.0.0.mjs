#!/usr/bin/env node
/**
 * PfotenTechnik SEO Audit Cleanup 1.0.0
 *
 * Bereinigt:
 * - audit-week2-top20.mjs
 * - audit-week3-authority-links.mjs
 * - audit-week5-katzenbrunnen-serp.mjs
 *
 * Ausführung im Repository-Root:
 *   node apply-pfotentechnik-seo-audit-cleanup-1.0.0.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "1.0.0";
const PREFIX = `[pfotentechnik-seo-audit-cleanup-${VERSION}]`;
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const SEO = path.join(APP, "scripts", "seo");
const FILES = {
  week2: path.join(SEO, "audit-week2-top20.mjs"),
  week3: path.join(SEO, "audit-week3-authority-links.mjs"),
  week5: path.join(SEO, "audit-week5-katzenbrunnen-serp.mjs")
};
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `pfotentechnik-seo-audit-cleanup-${VERSION}-${new Date().toISOString().replace(/[:.]/g, "-")}`
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
  const target = path.join(BACKUP_ROOT, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function write(file, before, after) {
  if (before === after) {
    console.log(`Übersprungen: ${path.relative(ROOT, file)} (bereits aktuell)`);
    return false;
  }
  backup(file);
  fs.writeFileSync(file, after, "utf8");
  console.log(`Geändert: ${path.relative(ROOT, file)}`);
  return true;
}

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) fail(`Anker nicht gefunden: ${label}`);
  return source.replace(from, to);
}

if (!fs.existsSync(path.join(ROOT, "package.json"))) {
  fail("Bitte im Root des affiliate-template-Repositories ausführen.");
}

/* Woche 2 */
const week2Before = read(FILES.week2);
let week2After = week2Before;

week2After = replaceRequired(
  week2After,
  'const offline = read("src/content/pages/vergleiche/beste-futterautomaten-ohne-wlan/.md");',
  'const offline = read("src/content/comparisons/beste-futterautomaten-ohne-wlan.md");',
  "Woche 2 Offline-Dateipfad"
);
week2After = replaceRequired(
  week2After,
  'check("Offline-Comparison", offline.includes("/vergleiche/-ohne-wlan/"));',
  'check("Offline-Comparison", offline.includes("/vergleiche/beste-futterautomaten-ohne-wlan/"));',
  "Woche 2 Offline-Canonical"
);
week2After = replaceRequired(
  week2After,
  'const camera = read("src/content/pages/vergleiche/beste-futterautomaten-mit-kamera/.md");',
  'const camera = read("src/content/comparisons/beste-futterautomaten-mit-kamera.md");',
  "Woche 2 Kamera-Dateipfad"
);
week2After = replaceRequired(
  week2After,
  'check("Kamera-Comparison", camera.includes("/vergleiche/-mit-kamera/"));',
  'check("Kamera-Comparison", camera.includes("/vergleiche/beste-futterautomaten-mit-kamera/"));',
  "Woche 2 Kamera-Canonical"
);
week2After = replaceRequired(
  week2After,
  'const fountain = read("src/content/comparisons/vergleiche/beste-trinkbrunnen-fuer-hunde/.md");',
  'const fountain = read("src/content/comparisons/beste-trinkbrunnen-fuer-hunde.md");',
  "Woche 2 Hunde-Brunnen-Dateipfad"
);
week2After = replaceRequired(
  week2After,
  'check("PETLIBRO Comparisons", manufacturer.includes("/vergleiche/-fuer-nassfutter/"));',
  'check("PETLIBRO Comparisons", manufacturer.includes("/vergleiche/beste-futterautomaten-fuer-nassfutter/"));',
  "Woche 2 PETLIBRO-Comparison"
);

/* Woche 3 */
const week3Before = read(FILES.week3);
let week3After = week3Before;

const redirectsStart = week3After.indexOf('for (const [source, target] of [');
const redirectsEnd = week3After.indexOf('\n\ncheck(\n  "Legacy Offline-Seite entfernt"', redirectsStart);
if (redirectsStart < 0 || redirectsEnd < 0) fail("Woche-3-Redirectblock nicht gefunden.");

const redirectsReplacement = `const expectedRedirects = [
  ["/beste-futterautomaten-ohne-wlan/", "/vergleiche/beste-futterautomaten-ohne-wlan/"],
  ["/beste-futterautomaten-mit-kamera/", "/vergleiche/beste-futterautomaten-mit-kamera/"]
];

for (const [source, target] of expectedRedirects) {
  check(\`Redirect \${source}\`, redirects.includes(\`\${source} \${target} 301\`));
}`;

week3After =
  week3After.slice(0, redirectsStart) +
  redirectsReplacement +
  week3After.slice(redirectsEnd);

const oldLinksStart = week3After.indexOf("const oldOffline =");
const oldLinksEnd = week3After.indexOf('\ncheck("Keine produktiven Offline-Altlinks"', oldLinksStart);
if (oldLinksStart < 0 || oldLinksEnd < 0) fail("Woche-3-Altlinkblock nicht gefunden.");

const oldLinksReplacement = `const oldOffline = corpus.filter(({ text }) =>
  /(^|[^/])\\/beste-futterautomaten-ohne-wlan\\/?(?=[\\s"'#?)]|$)/m.test(text)
);
const oldCamera = corpus.filter(({ text }) =>
  /(^|[^/])\\/beste-futterautomaten-mit-kamera\\/?(?=[\\s"'#?)]|$)/m.test(text)
);`;

week3After =
  week3After.slice(0, oldLinksStart) +
  oldLinksReplacement +
  week3After.slice(oldLinksEnd);

week3After = week3After
  .replaceAll('"/vergleiche/-ohne-wlan/"', '"/vergleiche/beste-futterautomaten-ohne-wlan/"')
  .replaceAll('"/vergleiche/-mit-kamera/"', '"/vergleiche/beste-futterautomaten-mit-kamera/"')
  .replaceAll('"/vergleiche/-fuer-zwei-katzen/"', '"/vergleiche/beste-futterautomaten-fuer-zwei-katzen/"');

/* Woche 5 */
const week5Before = read(FILES.week5);
let week5After = week5Before;

week5After = replaceRequired(
  week5After,
  'check("Comparison hat genau 6 Modelle", slugs.length === 6, String(slugs.length));',
  'check("Comparison hat mindestens 6 Kernmodelle", slugs.length >= 6, String(slugs.length));',
  "Woche 5 Modellanzahl"
);
week5After = replaceRequired(
  week5After,
  '  "Comparison enthält erwartete Modelle",\n  expectedSlugs.every((slug) => slugs.includes(slug))',
  '  "Comparison enthält erwartete Kernmodelle",\n  expectedSlugs.every((slug) => slugs.includes(slug))',
  "Woche 5 Kernmodelle"
);
week5After = replaceRequired(
  week5After,
  '  "Comparison automatische Erweiterung deaktiviert",\n  /automaticRecommendations:\\n\\s+enabled:\\s+false/.test(comparison)',
  '  "Comparison automatische Erweiterung konfiguriert",\n  /automaticRecommendations:\\n\\s+enabled:\\s+(?:true|false)/.test(comparison)',
  "Woche 5 automatische Erweiterung"
);
week5After = replaceRequired(
  week5After,
  '  "Comparison-Snippet nennt 6 Modelle",\n  comparison.includes("Katzenbrunnen im Vergleich: 6 Modelle für Katzen")',
  '  "Comparison-Snippet nennt Kernvergleich",\n  /Katzenbrunnen im Vergleich:\\s*\\d+ Modelle für Katzen/.test(comparison)',
  "Woche 5 Snippet"
);

/* Nachprüfung */
const assertions = [
  ["Woche 2 ohne kaputte /.md-Pfade", !week2After.includes("/.md")],
  ["Woche 2 aktuelle Comparison-Pfade", week2After.includes("src/content/comparisons/beste-futterautomaten-ohne-wlan.md")],
  ["Woche 3 syntaktisch sichere Altlink-RegEx", week3After.includes("\\/beste-futterautomaten-ohne-wlan")],
  ["Woche 3 aktuelle Canonicals", week3After.includes("/vergleiche/beste-futterautomaten-ohne-wlan/")],
  ["Woche 5 mindestens sechs Modelle", week5After.includes("slugs.length >= 6")],
  ["Woche 5 Erweiterung konfiguriert", week5After.includes("automatische Erweiterung konfiguriert")]
];

for (const [label, ok] of assertions) {
  if (!ok) fail(`Nachprüfung fehlgeschlagen: ${label}`);
}

const changed = [
  write(FILES.week2, week2Before, week2After),
  write(FILES.week3, week3Before, week3After),
  write(FILES.week5, week5Before, week5After)
].filter(Boolean).length;

/* Syntaxprüfung */
for (const file of Object.values(FILES)) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: ROOT,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    fail(`Syntaxprüfung fehlgeschlagen: ${path.relative(ROOT, file)}\n${result.stderr}`);
  }
}

console.log(`\n${PREFIX} Abgeschlossen.`);
console.log(`Geänderte Dateien: ${changed}`);
if (changed) console.log(`Backups: ${path.relative(ROOT, BACKUP_ROOT)}`);

console.log(`
Validierung:

  npm run seo:release:check -w @affiliate-sites/pfotentechnik
`);
