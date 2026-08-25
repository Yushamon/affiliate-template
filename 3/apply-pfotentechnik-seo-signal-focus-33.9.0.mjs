#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const PATCH = "pfotentechnik-seo-signal-focus-33.9.0";
const TAG = `[${PATCH}]`;
const root = process.cwd();
const skipVerify = process.env.PFOTENTECHNIK_PATCH_SKIP_VERIFY === "1";

const files = {
  platform: path.join(root, "apps/pfotentechnik/src/lib/search/platform.mjs"),
  actions: path.join(root, "apps/pfotentechnik/src/lib/search/action-service.mjs"),
  gscSync: path.join(root, "apps/pfotentechnik/scripts/gsc/sync.mjs"),
  bingSync: path.join(root, "apps/pfotentechnik/scripts/bing/sync.mjs"),
  searchTest: path.join(root, "apps/pfotentechnik/test/search-platform.test.mjs"),
  feederCat: path.join(root, "apps/pfotentechnik/src/content/pages/futterautomat-katze.md"),
  fountainClean: path.join(root, "apps/pfotentechnik/src/content/pages/katzentrinkbrunnen-richtig-reinigen.md"),
  gpsHow: path.join(root, "apps/pfotentechnik/src/content/pages/wie-funktionieren-gps-tracker.md"),
  tractiveCat: path.join(root, "apps/pfotentechnik/src/content/products/tractive-cat-6-mini.md"),
};

function fail(message) {
  console.error(`${TAG} FEHLER: ${message}`);
  process.exit(1);
}
function log(message) {
  console.log(`${TAG} ${message}`);
}
function read(file) {
  if (!fs.existsSync(file)) fail(`Erwartete Datei fehlt: ${path.relative(root, file)}`);
  return fs.readFileSync(file, "utf8");
}
function atomicWrite(file, content) {
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, file);
}
function replaceOnce(source, before, after, label) {
  if (source.includes(after)) {
    log(`${label}: bereits aktuell.`);
    return source;
  }
  const count = source.split(before).length - 1;
  if (count !== 1) fail(`${label}: Ausgangsmuster kommt ${count}× vor.`);
  log(`${label}: aktualisiert.`);
  return source.replace(before, after);
}
function removeRangeOnce(source, start, end, label) {
  if (!source.includes(start)) {
    log(`${label}: Block bereits entfernt.`);
    return source;
  }
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);
  if (startIndex < 0 || endIndex < 0) fail(`${label}: Blockgrenzen nicht eindeutig gefunden.`);
  log(`${label}: entfernt.`);
  return source.slice(0, startIndex) + source.slice(endIndex);
}
function assertContains(source, needle, label) {
  if (!source.includes(needle)) fail(`${label}: erwarteter Zielzustand fehlt.`);
}

for (const [key, file] of Object.entries(files)) read(file);

const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
for (const file of Object.values(files)) {
  const relative = path.relative(root, file);
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
log(`Backup: ${path.relative(root, backupRoot)}`);

// 1) Einzel-Provider-Sync muss nach erfolgreichem Provider-Write immer Combined + Advisor neu bauen.
let platform = read(files.platform);
platform = replaceOnce(
  platform,
  `export async function syncSearchPlatform({ onProgress } = {}) {`,
  `export async function syncSingleSearchProvider(provider, { onProgress } = {}) {\n  if (!new Set(["google", "bing"]).has(provider)) {\n    throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: \`Unbekannter Search-Provider: \${provider}\` });\n  }\n\n  return withSearchLock("search-sync", async () => {\n    const started = Date.now();\n    onProgress?.({ step: \`\${provider}-sync\`, message: \`\${provider === "google" ? "Google Search Console" : "Bing Webmaster Tools"} wird synchronisiert.\` });\n    const providerResult = await getSearchProvider(provider).sync({ onProgress });\n\n    onProgress?.({ step: "combine", message: "Lokale Google- und Bing-Daten werden nach dem Provider-Sync neu zusammengeführt." });\n    const google = readProviderDashboard("google");\n    const bing = readProviderDashboard("bing");\n    if (!google?.ranges && !bing?.ranges) {\n      throw new SearchError("SEARCH_NO_DATA", { message: "Nach dem Provider-Sync sind keine gültigen Search-Dashboards vorhanden." });\n    }\n\n    const combinedPayload = buildCombinedDashboard({ google, bing, staleProviders: [] });\n    const combined = writeCombinedDashboard(combinedPayload);\n    onProgress?.({ step: "advisor", message: "SEO-Advisor-Datenquelle wird mit dem neuen Combined-Stand validiert." });\n    const advisor = rebuildAdvisorSource();\n\n    updateProviderStatus("combined", {\n      status: "succeeded",\n      lastAttemptAt: combinedPayload.generatedAt,\n      lastSuccessfulSyncAt: combinedPayload.generatedAt,\n      lastDurationMs: Date.now() - started,\n      lastError: null,\n      pagesCount: combined.pagesCount,\n      queriesCount: combined.queriesCount,\n      metrics: combined.metrics,\n      dataUpdatedAt: combinedPayload.dataUpdatedAt,\n    });\n\n    searchLog({ provider: "combined", action: \`\${provider}-sync-recombine\`, status: "succeeded", durationMs: Date.now() - started, records: combined.pagesCount + combined.queriesCount });\n    return {\n      ...providerResult,\n      combined: { ...combined, generatedAt: combinedPayload.generatedAt, dataUpdatedAt: combinedPayload.dataUpdatedAt },\n      advisor,\n    };\n  });\n}\n\nexport async function syncSearchPlatform({ onProgress } = {}) {`,
  "Single-Provider Recombine"
);
atomicWrite(files.platform, platform);

let actions = read(files.actions);
actions = replaceOnce(
  actions,
  `import { rebuildAdvisorSource, syncSearchPlatform, testSearchPlatform } from "./platform.mjs";`,
  `import { rebuildAdvisorSource, syncSearchPlatform, syncSingleSearchProvider, testSearchPlatform } from "./platform.mjs";`,
  "Action-Service Import"
);
actions = replaceOnce(
  actions,
  `  "google.sync": ({ progress }) => getSearchProvider("google").sync({ onProgress: progress }),`,
  `  "google.sync": ({ progress }) => syncSingleSearchProvider("google", { onProgress: progress }),`,
  "Cockpit Google Sync"
);
actions = replaceOnce(
  actions,
  `  "bing.sync": ({ progress }) => getSearchProvider("bing").sync({ onProgress: progress }),`,
  `  "bing.sync": ({ progress }) => syncSingleSearchProvider("bing", { onProgress: progress }),`,
  "Cockpit Bing Sync"
);
atomicWrite(files.actions, actions);

let gscSync = read(files.gscSync);
gscSync = replaceOnce(
  gscSync,
  `import { syncGoogleSearch } from "../../src/lib/search/providers/google/sync.mjs";`,
  `import { syncSingleSearchProvider } from "../../src/lib/search/platform.mjs";`,
  "GSC CLI Import"
);
gscSync = replaceOnce(
  gscSync,
  `  const result = await syncGoogleSearch({ onProgress: (progress) => console.log(progress.message) });`,
  `  const result = await syncSingleSearchProvider("google", { onProgress: (progress) => console.log(progress.message) });`,
  "GSC CLI Recombine"
);
gscSync = replaceOnce(
  gscSync,
  `  console.log(` + "`" + `- Dauer: \${result.durationMs} ms` + "`" + `);`,
  `  console.log(` + "`" + `- Dauer: \${result.durationMs} ms` + "`" + `);\n  console.log(` + "`" + `- Combined: \${result.combined?.generatedAt || "nicht erzeugt"}` + "`" + `);`,
  "GSC CLI Ausgabe"
);
atomicWrite(files.gscSync, gscSync);

let bingSync = read(files.bingSync);
bingSync = replaceOnce(
  bingSync,
  `import { syncBingSearch } from "../../src/lib/search/providers/bing/sync.mjs";`,
  `import { syncSingleSearchProvider } from "../../src/lib/search/platform.mjs";`,
  "Bing CLI Import"
);
bingSync = replaceOnce(
  bingSync,
  `try { const result = await syncBingSearch({ onProgress: (progress) => console.log(progress.message) }); console.log(` + "`" + `\\nBing synchronisiert\\n- Website: \${result.siteUrl}\\n- Seiten: \${result.pagesCount}\\n- Queries: \${result.queriesCount}\\n- Crawl-Zeilen: \${result.crawlRowsCount}\\n- Datenstand: \${result.dataUpdatedAt || "keine datierten Daten"}` + "`" + `); }`,
  `try { const result = await syncSingleSearchProvider("bing", { onProgress: (progress) => console.log(progress.message) }); console.log(` + "`" + `\\nBing synchronisiert\\n- Website: \${result.siteUrl}\\n- Seiten: \${result.pagesCount}\\n- Queries: \${result.queriesCount}\\n- Crawl-Zeilen: \${result.crawlRowsCount}\\n- Datenstand: \${result.dataUpdatedAt || "keine datierten Daten"}\\n- Combined: \${result.combined?.generatedAt || "nicht erzeugt"}` + "`" + `); }`,
  "Bing CLI Recombine"
);
atomicWrite(files.bingSync, bingSync);

let searchTest = read(files.searchTest);
searchTest = replaceOnce(
  searchTest,
  `import { classifyProviderResults } from "../src/lib/search/platform.mjs";`,
  `import { classifyProviderResults, syncSingleSearchProvider } from "../src/lib/search/platform.mjs";`,
  "Search-Test Import"
);
const regressionTest = `\n\ntest("Einzel-Provider-Sync baut Combined nach dem frischen Provider-Write neu", async () => {\n  const actionSource = fs.readFileSync(new URL("../src/lib/search/action-service.mjs", import.meta.url), "utf8");\n  const gscSource = fs.readFileSync(new URL("../scripts/gsc/sync.mjs", import.meta.url), "utf8");\n  const bingSource = fs.readFileSync(new URL("../scripts/bing/sync.mjs", import.meta.url), "utf8");\n\n  assert.match(actionSource, /google\\.sync[\\s\\S]*syncSingleSearchProvider\\(\"google\"/);\n  assert.match(actionSource, /bing\\.sync[\\s\\S]*syncSingleSearchProvider\\(\"bing\"/);\n  assert.match(gscSource, /syncSingleSearchProvider\\(\"google\"/);\n  assert.match(bingSource, /syncSingleSearchProvider\\(\"bing\"/);\n  assert.equal(typeof syncSingleSearchProvider, "function");\n});\n`;
if (!searchTest.includes(`Einzel-Provider-Sync baut Combined nach dem frischen Provider-Write neu`)) {
  searchTest += regressionTest;
  log("Search Regressionstest: ergänzt.");
} else {
  log("Search Regressionstest: bereits vorhanden.");
}
atomicWrite(files.searchTest, searchTest);

// 2) Futterautomat Katze: Orientierung von der eigentlichen Vergleichs-URL trennen.
let feeder = read(files.feederCat);
feeder = replaceOnce(feeder, `seoTitle: "Futterautomat für Katzen: Modelle im Vergleich"`, `seoTitle: "Futterautomat für Katzen: Futterart, Portion & Auswahl"`, "Katze SEO-Titel");
feeder = replaceOnce(feeder, `\ndescription: "Futterautomaten für Katzen im Vergleich: Portionierung, App, Mehrkatzenhaushalt und Nassfutter richtig einordnen."`, `\ndescription: "Futterautomaten für Katzen auswählen: Futterart, Portionsgröße, Stromreserve und Mehrkatzenhaushalt richtig einordnen."`, "Katze Description");
feeder = replaceOnce(feeder, `seoDescription: "Welcher Futterautomat passt zu Katzen? Vergleich von App-Modellen, Nassfutter-Lösungen und Funktionen für verlässliche Routinen."`, `seoDescription: "Welcher Futterautomat passt zur Katze? Futterart, Portionsgröße, Mehrkatzenhaushalt, Stromreserve und App vor dem Modellvergleich klären."`, "Katze SEO-Description");
feeder = replaceOnce(feeder, `updatedAt: "2026-07-08"`, `updatedAt: "2026-08-24"`, "Katze UpdatedAt");
feeder = replaceOnce(feeder, `  description: "Futterautomaten für Katzen im Vergleich: Portionierung, App, Mehrkatzenhaushalt und Nassfutter richtig einordnen."`, `  description: "Futterart, Portionsgröße, Stromreserve und Zugang klären, bevor konkrete Modelle verglichen werden."`, "Katze Hub-Description");
feeder = removeRangeOnce(feeder, `  - type: "quickFacts"\n`, `healthBridge:\n`, "Katze eingebetteter Modellvergleich");
feeder = replaceOnce(
  feeder,
  `Katzen profitieren von gleichmäßigen Abläufen, stellen an einen Automaten aber besondere Anforderungen: Portionen sind oft klein, manche Tiere reagieren sensibel auf Motorgeräusche und in Mehrkatzenhaushalten ist nicht automatisch klar, wer tatsächlich gefressen hat.`,
  `Katzen profitieren von gleichmäßigen Abläufen, stellen an einen Automaten aber besondere Anforderungen: Portionen sind oft klein, manche Tiere reagieren sensibel auf Motorgeräusche und in Mehrkatzenhaushalten ist nicht automatisch klar, wer tatsächlich gefressen hat. Diese Seite hilft zuerst bei der Auswahl der passenden Bauart. Konkrete Geräte, Gewinner und Alternativen stehen bewusst getrennt im [Vergleich der besten Futterautomaten für Katzen](/vergleiche/beste-futterautomaten-fuer-katzen/).`,
  "Katze Intent-Brücke"
);
feeder = replaceOnce(
  feeder,
  `## So bewerten wir Katzen-Futterautomaten\n\nWir gewichten kleine Portionen, Zuverlässigkeit, Reinigung, Geräuschentwicklung, Stromreserve und eine verständliche Bedienung. Kamera oder App sind Zusatznutzen, keine Voraussetzung für eine gute Fütterungsroutine. Einen breiteren Überblick bietet der [Vergleich smarter Futterautomaten](/smarte-futterautomaten/).`,
  `## Welche Kriterien zuerst entscheiden\n\nPrüfe vor dem Modellvergleich kleine und reproduzierbare Portionen, Zuverlässigkeit, Reinigung, Geräuschentwicklung, Stromreserve und den tatsächlichen Zugang zum Napf. Kamera oder App sind Zusatznutzen, keine Voraussetzung für eine gute Fütterungsroutine. Die Grundlagen zu Bauarten und Funktionen bündelt der [Ratgeber zu smarten Futterautomaten](/smarte-futterautomaten/); konkrete Modelle werden im [Katzen-Futterautomaten-Vergleich](/vergleiche/beste-futterautomaten-fuer-katzen/) bewertet.`,
  "Katze Auswahlkriterien"
);
atomicWrite(files.feederCat, feeder);

// 3) Bing-Gewinner: konkrete Suchlücken auf bestehenden URLs schließen.
let fountain = read(files.fountainClean);
fountain = replaceOnce(fountain, `updatedAt: "2026-07-25"`, `updatedAt: "2026-08-24"`, "Brunnen UpdatedAt");
fountain = replaceOnce(
  fountain,
  `Die Pumpe ist häufig die am stärksten übersehene Stelle. Öffne Pumpenabdeckung und Rotorraum nur so weit, wie es die Anleitung vorsieht. Bei vielen Modellen lässt sich der kleine Rotor oder Impeller vorsichtig herausziehen.`,
  `Die Pumpe ist häufig die am stärksten übersehene Stelle. Öffne Pumpenabdeckung und Rotorraum nur so weit, wie es die Anleitung vorsieht. Bei vielen Modellen lässt sich der kleine Rotor oder Impeller vorsichtig herausziehen. Wenn du genau diesen Teil zerlegen willst, zeigt die separate Anleitung [Pumpe im Katzentrinkbrunnen reinigen](/pumpe-katzentrinkbrunnen-reinigen/) die Reihenfolge für Abdeckung, Rotor, Ansaugung und Zusammenbau kompakt.`,
  "Brunnen Pumpen-Link"
);
atomicWrite(files.fountainClean, fountain);

let gps = read(files.gpsHow);
gps = replaceOnce(gps, `updatedAt: "2026-07-20"`, `updatedAt: "2026-08-24"`, "GPS UpdatedAt");
gps = replaceOnce(
  gps,
  `  - { question: "Was passiert ohne Mobilfunk?", answer: "Ein Mobilfunktracker kann unter Umständen weiter Positionen bestimmen, sie aber nicht sofort zur App übertragen. Manche Geräte speichern Verlauf und senden später. VHF-Systeme benötigen keinen Mobilfunk, müssen aber den eigenen Funkempfänger erreichen." }`,
  `  - { question: "Was passiert ohne Mobilfunk?", answer: "Ein Mobilfunktracker kann unter Umständen weiter Positionen bestimmen, sie aber nicht sofort zur App übertragen. Manche Geräte speichern Verlauf und senden später. VHF-Systeme benötigen keinen Mobilfunk, müssen aber den eigenen Funkempfänger erreichen." }\n  - { question: "Warum piept ein GPS-Tracker für Haustiere?", answer: "Ein Ton kommt nicht vom GPS-Satellitensignal selbst. Je nach Modell kann er zu einer Such- oder Tonfunktion, Kopplung, Statusmeldung oder Warnung gehören. Wenn ein Tracker regelmäßig und unerwartet piept, prüfe zuerst App-Einstellungen und das Handbuch des konkreten Modells statt den Ton als Ortungssignal zu interpretieren." }`,
  "GPS Piepsen FAQ"
);
gps = replaceOnce(
  gps,
  `## Warum Live-Modus Akku kostet`,
  `## Warum piept ein GPS-Tracker manchmal?\n\nEin regelmäßiger Ton ist **kein Bestandteil der GPS-Ortung selbst**. Satellitensignale sind für den Nutzer nicht hörbar. Ob ein Haustiertracker piept und was der Ton bedeutet, hängt vom Modell ab. Möglich sind eine bewusst ausgelöste Such- oder Tonfunktion, Kopplungs- und Statussignale oder Warnhinweise.\n\nTritt der Ton ohne erkennbaren Anlass auf, prüfe in dieser Reihenfolge: aktive Ton- oder Suchfunktion in der App, Lade- und Akkustatus, Verbindungs- beziehungsweise Kopplungshinweise und anschließend die Signaltabelle im Handbuch des konkreten Trackers. Ein universeller Piepscode für Haustier-GPS-Tracker existiert nicht.\n\n## Warum Live-Modus Akku kostet`,
  "GPS Piepsen Abschnitt"
);
atomicWrite(files.gpsHow, gps);

let tractive = read(files.tractiveCat);
tractive = replaceOnce(tractive, `updatedAt: "2026-07-22"`, `updatedAt: "2026-08-24"`, "Tractive UpdatedAt");
tractive = replaceOnce(tractive, `  title: "Tractive CAT 6 Mini: Gewicht, Akku und Daten"`, `  title: "Tractive CAT 6 Mini: Akku, Abo, Gewicht & Preis"`, "Tractive SEO-Titel");
tractive = replaceOnce(tractive, `  provider: "manufacturer"\n  label: "Beim Hersteller ansehen"\n  url: "https://amzn.to/3Ts7OyY"`, `  provider: "amazon"\n  label: "Aktuellen Preis bei Amazon prüfen"\n  url: "https://amzn.to/3Ts7OyY"`, "Tractive Amazon-Metadaten");
atomicWrite(files.tractiveCat, tractive);

// Zielzustand hart prüfen.
assertContains(read(files.platform), `export async function syncSingleSearchProvider`, "Platform Helper");
assertContains(read(files.actions), `syncSingleSearchProvider("google"`, "Google Action");
assertContains(read(files.actions), `syncSingleSearchProvider("bing"`, "Bing Action");
assertContains(read(files.feederCat), `seoTitle: "Futterautomat für Katzen: Futterart, Portion & Auswahl"`, "Feeder Intent");
assertContains(read(files.feederCat), `[Vergleich der besten Futterautomaten für Katzen](/vergleiche/beste-futterautomaten-fuer-katzen/)`, "Feeder Comparison Bridge");
assertContains(read(files.fountainClean), `[Pumpe im Katzentrinkbrunnen reinigen](/pumpe-katzentrinkbrunnen-reinigen/)`, "Pumpen-Link");
assertContains(read(files.gpsHow), `## Warum piept ein GPS-Tracker manchmal?`, "GPS Suchlücke");
assertContains(read(files.tractiveCat), `provider: "amazon"`, "Amazon Provider");

if (!skipVerify) {
  for (const file of [files.platform, files.actions, files.gscSync, files.bingSync, files.searchTest]) {
    execFileSync(process.execPath, ["--check", file], { cwd: root, stdio: "inherit" });
  }
  log("Node-Syntaxprüfung bestanden.");

  execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["--workspace", "apps/pfotentechnik", "run", "test:search"], { cwd: root, stdio: "inherit" });
  log("Search-Regressionstests bestanden.");
} else {
  log("Verifikation per PFOTENTECHNIK_PATCH_SKIP_VERIFY=1 übersprungen.");
}

log("Fertig. Keine Redirects, keine neuen URLs, keine Netzabfrage.");
log("Optional danach: npm --workspace apps/pfotentechnik run seo:recovery");
