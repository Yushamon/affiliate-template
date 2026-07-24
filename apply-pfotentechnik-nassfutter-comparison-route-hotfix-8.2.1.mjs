#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-nassfutter-comparison-route-hotfix-8.2.1";
const TARGET =
  "apps/pfotentechnik/src/domain/home/buildHomepageModel.ts";

const REPLACEMENT = `const decisionComparisonDefinitions = [
  {
    slug: "beste-futterautomaten-fuer-katzen",
    label: "Katzen · Futterautomaten",
    title: "Futterautomaten für Katzen",
    fallbackText:
      "Modelle nach Futterart, Portionierung, App, Zugang und Alltagseignung vergleichen."
  },
  {
    slug: "beste-futterautomaten-fuer-hunde",
    label: "Hunde · Futterautomaten",
    title: "Futterautomaten für Hunde",
    fallbackText:
      "Kapazität, Napfgröße, Portionierung und Ausfallsicherheit direkt gegenüberstellen."
  },
  {
    slug: "beste-futterautomaten-fuer-nassfutter",
    label: "Nassfutter · Futterautomaten",
    title: "Futterautomaten für Nassfutter",
    fallbackText:
      "Aktive Kühlung, Kühlakkus, Mahlzeitenzahl, Hygiene und Ausfallsicherheit vergleichen."
  },
  {
    slug: "beste-trinkbrunnen-fuer-katzen",
    label: "Katzen · Trinkbrunnen",
    title: "Trinkbrunnen für Katzen",
    fallbackText:
      "Material, Filter, Reinigung, Lautstärke und Trinkfläche sinnvoll vergleichen."
  },
  {
    slug: "beste-trinkbrunnen-fuer-hunde",
    label: "Hunde · Trinkbrunnen",
    title: "Trinkbrunnen für Hunde",
    fallbackText:
      "Kapazität, Standfestigkeit, Trinkhöhe und Reinigung für Hunde einordnen."
  },
  {
    slug: "beste-gps-tracker-fuer-katzen",
    label: "Katzen · GPS-Tracker",
    title: "GPS-Tracker für Katzen",
    fallbackText:
      "Gewicht, Ortungsintervall, Akkulaufzeit, Abo und Sicherheitszonen vergleichen."
  },
  {
    slug: "beste-gps-tracker-fuer-hunde",
    label: "Hunde · GPS-Tracker",
    title: "GPS-Tracker für Hunde",
    fallbackText:
      "Ortung, Robustheit, Akkulaufzeit, Größe und laufende Kosten vergleichen."
  }
] as const;`;

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");

function argumentValue(name) {
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1];

  const prefix = `${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function isRepoRoot(candidate) {
  return (
    fs.existsSync(path.join(candidate, "package.json")) &&
    fs.existsSync(
      path.join(candidate, "apps", "pfotentechnik", "src")
    )
  );
}

function ancestors(start) {
  const result = [];
  let current = path.resolve(start);

  while (true) {
    result.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return result;
}

function resolveRepoRoot() {
  const explicit = argumentValue("--repo");

  if (explicit) {
    const resolved = path.resolve(explicit);
    if (!isRepoRoot(resolved)) {
      throw new Error(
        `Kein Repository unter --repo gefunden: ${resolved}`
      );
    }
    return resolved;
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    ...ancestors(process.cwd()),
    ...ancestors(scriptDir)
  ];

  for (const candidate of [...new Set(candidates)]) {
    if (isRepoRoot(candidate)) return candidate;
  }

  throw new Error(
    "Repository nicht gefunden. Installer im Repository-Root starten oder --repo verwenden."
  );
}

function replaceDefinitions(source) {
  const startMarker =
    "const decisionComparisonDefinitions = [";
  const endMarker = "] as const;";

  const start = source.indexOf(startMarker);
  if (start < 0) {
    throw new Error(
      "Startanker decisionComparisonDefinitions nicht gefunden."
    );
  }

  const endStart = source.indexOf(endMarker, start);
  if (endStart < 0) {
    throw new Error(
      "Endanker von decisionComparisonDefinitions nicht gefunden."
    );
  }

  const end = endStart + endMarker.length;

  return (
    source.slice(0, start) +
    REPLACEMENT +
    source.slice(end)
  );
}

function validate(source) {
  const requiredSlugs = [
    "beste-futterautomaten-fuer-katzen",
    "beste-futterautomaten-fuer-hunde",
    "beste-futterautomaten-fuer-nassfutter",
    "beste-trinkbrunnen-fuer-katzen",
    "beste-trinkbrunnen-fuer-hunde",
    "beste-gps-tracker-fuer-katzen",
    "beste-gps-tracker-fuer-hunde"
  ];

  const start =
    source.indexOf("const decisionComparisonDefinitions = [");
  const end = source.indexOf("] as const;", start);

  if (start < 0 || end < 0) {
    throw new Error(
      "Definitionsblock ist nach der Reparatur nicht vollständig."
    );
  }

  const block = source.slice(start, end + 11);

  for (const slug of requiredSlugs) {
    const count = block.split(`slug: "${slug}"`).length - 1;
    if (count !== 1) {
      throw new Error(
        `Slug fehlt oder ist doppelt: ${slug} (${count})`
      );
    }
  }

  if (/}\s*\{/.test(block)) {
    throw new Error(
      "Im Array stehen weiterhin zwei Objekte ohne Komma nebeneinander."
    );
  }

  const objectStarts =
    block.match(/^\s{2}\{$/gm)?.length ?? 0;
  const commaClosings =
    block.match(/^\s{2}\},$/gm)?.length ?? 0;
  const finalClosing =
    block.match(/^\s{2}\}$/gm)?.length ?? 0;

  if (
    objectStarts !== 7 ||
    commaClosings !== 6 ||
    finalClosing !== 1
  ) {
    throw new Error(
      "Unerwartete Array-Struktur nach der Reparatur."
    );
  }
}

function timestamp() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-");
}

try {
  const repoRoot = resolveRepoRoot();
  const targetPath = path.join(repoRoot, TARGET);

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Datei nicht gefunden: ${TARGET}`);
  }

  const before = fs.readFileSync(targetPath, "utf8");
  const after = replaceDefinitions(before);

  validate(after);

  console.log(`\n[${PATCH_ID}] Repository: ${repoRoot}`);
  console.log(`[${PATCH_ID}] Datei: ${TARGET}`);
  console.log(
    `[${PATCH_ID}] Modus: ${
      checkOnly ? "nur prüfen" : "anwenden"
    }`
  );

  if (before === after) {
    console.log(
      "\nDer Definitionsblock ist bereits korrekt. Keine Änderung nötig."
    );
    process.exit(0);
  }

  if (checkOnly) {
    console.log(
      "\nPrüfung erfolgreich. Der fehlerhafte Array-Block kann repariert werden."
    );
    console.log("Es wurde nichts verändert.");
    process.exit(0);
  }

  const backupRoot = path.join(
    repoRoot,
    ".patch-backups",
    `${PATCH_ID}-${timestamp()}`
  );
  const backupPath = path.join(backupRoot, TARGET);

  fs.mkdirSync(path.dirname(backupPath), {
    recursive: true
  });
  fs.writeFileSync(backupPath, before, "utf8");

  try {
    fs.writeFileSync(targetPath, after, "utf8");
    validate(fs.readFileSync(targetPath, "utf8"));
  } catch (error) {
    fs.writeFileSync(targetPath, before, "utf8");
    throw error;
  }

  console.log("\nDefinitionsblock erfolgreich ersetzt.");
  console.log(`Backup: ${backupRoot}`);
  console.log(
    "Jetzt erneut ausführen: npm run build:pfotentechnik"
  );
} catch (error) {
  console.error(`\n[${PATCH_ID}] FEHLER: ${error.message}`);
  process.exit(1);
}
