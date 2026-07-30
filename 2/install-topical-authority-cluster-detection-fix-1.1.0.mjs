#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PATCH_ID = "pfotentechnik-topical-authority-cluster-detection-fix-1.1.0";

function findRepoRoot(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Root nicht gefunden.");
}

function fail(message) {
  console.error(`[${PATCH_ID}] FEHLER: ${message}`);
  process.exit(1);
}

const repoRoot = findRepoRoot(process.cwd());
const target = path.join(
  repoRoot,
  "apps",
  "pfotentechnik",
  "src",
  "lib",
  "seo",
  "topical-authority",
  "loadTopicalAuthority.ts"
);

if (!fs.existsSync(target)) {
  fail(`Datei fehlt: ${path.relative(repoRoot, target)}`);
}

const before = fs.readFileSync(target, "utf8");

const definitionStart = before.indexOf("const CLUSTER_DEFINITIONS = [");
const definitionEnd = before.indexOf("] as const;", definitionStart);
if (definitionStart < 0 || definitionEnd < 0) {
  fail("CLUSTER_DEFINITIONS konnten nicht erkannt werden.");
}

const definitions = `const CLUSTER_DEFINITIONS = [
  {
    id: "futterautomaten",
    label: "Futterautomaten",
    description: "Automatische Fütterung, Portionierung, Nassfutter, App und besondere Nutzungssituationen.",
    slugPatterns: [/futterautomat/i, /futterspender/i, /portionierer/i],
    titlePatterns: [/futterautomat/i, /futterspender/i, /automatische fütterung/i],
    bodyPatterns: [/automatische fütterung/i, /portionierung/i, /futterausgabe/i],
    excludePatterns: [/trinkbrunnen/i, /gps-tracker/i, /katzenklappe/i, /katzentoilette/i],
    hubPatterns: [/^futterautomat(?:en)?$/i, /smarte-futterautomaten/i],
    thresholds: { pages: 6, comparisons: 4, products: 8, manufacturers: 3 },
    strategy: "consolidate",
  },
  {
    id: "trinkbrunnen",
    label: "Trinkbrunnen",
    description: "Trinkverhalten, Hygiene, Filter, Materialien und Trinkbrunnen für Hunde und Katzen.",
    slugPatterns: [/trinkbrunnen/i, /katzentrinkbrunnen/i, /trinkbrunnen-filter/i, /trinkbrunnen-reinigen/i],
    titlePatterns: [/trinkbrunnen/i, /wasserbrunnen/i],
    bodyPatterns: [/trinkbrunnen/i, /wasserfontäne/i, /brunnenfilter/i],
    excludePatterns: [/futterautomat/i, /gps-tracker/i, /katzenklappe/i, /katzentoilette/i],
    hubPatterns: [/^trinkbrunnen$/i, /^katzentrinkbrunnen$/i],
    thresholds: { pages: 6, comparisons: 2, products: 6, manufacturers: 2 },
    strategy: "expand",
  },
  {
    id: "gps-tracker",
    label: "GPS-Tracker",
    description: "Ortung, Reichweite, Akkulaufzeit, Abos, Datenschutz und Nutzung mit Hund oder Katze.",
    slugPatterns: [/gps-tracker/i, /gps-halsband/i, /bluetooth-tag/i, /ortung/i, /geofence/i],
    titlePatterns: [/gps-tracker/i, /gps halsband/i, /bluetooth-tag/i, /ortung/i],
    bodyPatterns: [/gps-ortung/i, /live-ortung/i, /geofence/i, /mobilfunknetz/i],
    excludePatterns: [/futterautomat/i, /trinkbrunnen/i, /katzenklappe/i, /katzentoilette/i],
    hubPatterns: [/^gps-tracker$/i, /gps-tracker-fuer-hunde-und-katzen/i],
    thresholds: { pages: 6, comparisons: 3, products: 6, manufacturers: 2 },
    strategy: "expand",
  },
  {
    id: "katzenklappen",
    label: "Katzenklappen",
    description: "Mikrochip-, App- und selektive Katzenklappen inklusive Einbau und Mehrkatzenhaushalt.",
    slugPatterns: [/katzenklappe/i, /mikrochip-katzenklappe/i, /microchip-cat-flap/i],
    titlePatterns: [/katzenklappe/i, /mikrochipklappe/i, /microchip cat flap/i],
    bodyPatterns: [/katzenklappe/i, /mikrochipklappe/i, /selektiver zugang/i],
    excludePatterns: [/futterautomat/i, /trinkbrunnen/i, /gps-tracker/i, /katzentoilette/i],
    hubPatterns: [/^katzenklappen?$/i, /smarte-katzenklappen/i],
    thresholds: { pages: 4, comparisons: 2, products: 4, manufacturers: 2 },
    strategy: "build",
  },
  {
    id: "haustierkameras",
    label: "Haustierkameras",
    description: "Kameras zur Beobachtung, Kommunikation und Aktivitätskontrolle von Haustieren.",
    slugPatterns: [/haustierkamera/i, /tierkamera/i, /pet-camera/i],
    titlePatterns: [/haustierkamera/i, /tierkamera/i, /pet camera/i],
    bodyPatterns: [/haustierkamera/i, /tierkamera/i, /zwei-wege-audio/i],
    excludePatterns: [/futterautomat/i, /trinkbrunnen/i, /gps-tracker/i, /katzenklappe/i, /katzentoilette/i],
    hubPatterns: [/^haustierkameras?$/i],
    thresholds: { pages: 3, comparisons: 1, products: 5, manufacturers: 2 },
    strategy: "validate",
  },
  {
    id: "katzentoiletten",
    label: "Automatische Katzentoiletten",
    description: "Selbstreinigende Katzentoiletten, Hygiene, Sicherheit und laufende Kosten.",
    slugPatterns: [/katzentoilette/i, /katzenklo/i, /litter-robot/i, /selbstreinigende-katzentoilette/i],
    titlePatterns: [/katzentoilette/i, /katzenklo/i, /litter robot/i, /selbstreinigende katzentoilette/i],
    bodyPatterns: [/selbstreinigende katzentoilette/i, /automatisches katzenklo/i, /litter robot/i],
    excludePatterns: [/futterautomat/i, /trinkbrunnen/i, /gps-tracker/i, /katzenklappe/i],
    hubPatterns: [/automatische-katzentoiletten/i, /^katzentoiletten$/i],
    thresholds: { pages: 3, comparisons: 1, products: 5, manufacturers: 2 },
    strategy: "validate",
  },
] as const;`;

let after = before.slice(0, definitionStart) + definitions + before.slice(definitionEnd + "] as const;".length);

const oldFunctionsStart = after.indexOf("function documentText(document: TopicalDocument): string {");
const oldFunctionsEnd = after.indexOf("function round(value: number): number {", oldFunctionsStart);
if (oldFunctionsStart < 0 || oldFunctionsEnd < 0) {
  fail("Alte Cluster-Erkennungsfunktionen konnten nicht erkannt werden.");
}

const strictFunctions = `function normalized(value: string | undefined): string {
  return String(value || "").toLocaleLowerCase("de-DE");
}

function matchesAny(value: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function belongsToCluster(
  document: TopicalDocument,
  definition: typeof CLUSTER_DEFINITIONS[number]
): boolean {
  const slug = normalized(document.slug);
  const title = normalized(document.title);
  const description = normalized(document.description);
  const manufacturer = normalized(document.manufacturer);
  const body = normalized(document.body);

  const slugMatch = matchesAny(slug, definition.slugPatterns);
  const titleMatch = matchesAny(title, definition.titlePatterns);
  const descriptionMatch = matchesAny(description, definition.titlePatterns);
  const bodyMatch = matchesAny(body, definition.bodyPatterns);
  const excludedPrimary = matchesAny([slug, title, description].join(" "), definition.excludePatterns);

  // Primäre Taxonomie-Signale: Slug oder Titel müssen das Thema eindeutig tragen.
  if (slugMatch || titleMatch) return !excludedPrimary;

  // Produkte und Hersteller dürfen nicht allein durch beiläufige Body-Erwähnungen
  // oder allgemeine Tierbegriffe in einen Cluster geraten.
  if (document.type === "product") {
    return descriptionMatch && bodyMatch && !excludedPrimary;
  }

  if (document.type === "manufacturer") {
    // Hersteller werden nur zugeordnet, wenn Titel/Slug selbst thematisch sind.
    // Ein breit aufgestellter Hersteller wie PETKIT oder PETLIBRO gehört nicht
    // automatisch zu jedem Cluster, in dem er Produkte anbietet.
    return false;
  }

  // Bei redaktionellen Seiten reicht Body-Treffer allein nicht.
  // Beschreibung und Body müssen beide ein spezifisches Clustersignal liefern.
  return descriptionMatch && bodyMatch && !excludedPrimary;
}

`;

after = after.slice(0, oldFunctionsStart) + strictFunctions + after.slice(oldFunctionsEnd);

after = after.replace(
  "const members = documents.filter((document) => belongsToCluster(document, definition.patterns));",
  "const members = documents.filter((document) => belongsToCluster(document, definition));"
);

if (after === before) {
  fail("Keine Änderungen erzeugt.");
}

const backupDir = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const backupFile = path.join(backupDir, path.relative(repoRoot, target));
fs.mkdirSync(path.dirname(backupFile), { recursive: true });
fs.copyFileSync(target, backupFile);
fs.writeFileSync(target, after, "utf8");

console.log(`[${PATCH_ID}] Korrigiert: ${path.relative(repoRoot, target)}`);
console.log(`[${PATCH_ID}] Backup: ${path.relative(repoRoot, backupDir)}`);
console.log("");
console.log("Wirkung:");
console.log("- keine Cluster-Zuordnung mehr über allgemeine Wörter wie Katze, Hund oder Hygiene");
console.log("- Slug und Titel sind die primären Signale");
console.log("- Body-Treffer allein zählen nicht");
console.log("- breit aufgestellte Hersteller werden nicht pauschal Clustern zugerechnet");
console.log("- automatische Katzentoiletten bleiben bei 0, solange keine echten Inhalte existieren");
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run test:topical-authority");
console.log("npm --workspace apps/pfotentechnik run audit:topical-authority:strict");
console.log("npm --workspace apps/pfotentechnik run build");
