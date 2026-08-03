#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-topical-authority-journey-completion-26.8.2";
const APP_RELATIVE = path.join("apps", "pfotentechnik");
const HELPER_RELATIVE = path.join(
  APP_RELATIVE,
  "src",
  "lib",
  "seo",
  "topical-authority",
  "journey-completion.ts",
);
const LOADER_RELATIVE = path.join(
  APP_RELATIVE,
  "src",
  "lib",
  "seo",
  "topical-authority",
  "loadTopicalAuthority.ts",
);
const TEST_RELATIVE = path.join(
  APP_RELATIVE,
  "test",
  "topical-authority-journey-completion-26.8.2.test.mjs",
);
const PACKAGE_RELATIVE = path.join(APP_RELATIVE, "package.json");

const HELPER_SOURCE = "export type JourneyDocument = {\n  route: string;\n  links: string[];\n};\n\nexport type JourneyRequirement = {\n  id: string;\n  source: string;\n  target: string;\n  label: string;\n};\n\nexport type JourneyCompletion = {\n  clusterId: string;\n  applicable: boolean;\n  complete: boolean;\n  completedEdges: string[];\n  missingEdges: string[];\n  requiredEdges: number;\n  completedCount: number;\n};\n\nconst REQUIREMENTS: Record<string, JourneyRequirement[]> = {\n  trinkbrunnen: [\n    {\n      id: \"hub-to-material\",\n      source: \"/trinkbrunnen/\",\n      target: \"/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/\",\n      label: \"Hub → Materialratgeber\",\n    },\n    {\n      id: \"hub-to-cleaning\",\n      source: \"/trinkbrunnen/\",\n      target: \"/katzentrinkbrunnen-richtig-reinigen/\",\n      label: \"Hub → Reinigungsratgeber\",\n    },\n    {\n      id: \"hub-to-filter\",\n      source: \"/trinkbrunnen/\",\n      target: \"/filter-im-katzentrinkbrunnen-wechseln/\",\n      label: \"Hub → Filterratgeber\",\n    },\n    {\n      id: \"hub-to-comparison\",\n      source: \"/trinkbrunnen/\",\n      target: \"/vergleiche/beste-trinkbrunnen-fuer-katzen/\",\n      label: \"Hub → Katzenvergleich\",\n    },\n    {\n      id: \"material-to-comparison\",\n      source: \"/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/\",\n      target: \"/vergleiche/beste-trinkbrunnen-fuer-katzen/\",\n      label: \"Materialratgeber → Katzenvergleich\",\n    },\n    {\n      id: \"cleaning-to-comparison\",\n      source: \"/katzentrinkbrunnen-richtig-reinigen/\",\n      target: \"/vergleiche/beste-trinkbrunnen-fuer-katzen/\",\n      label: \"Reinigungsratgeber → Katzenvergleich\",\n    },\n    {\n      id: \"filter-to-comparison\",\n      source: \"/filter-im-katzentrinkbrunnen-wechseln/\",\n      target: \"/vergleiche/beste-trinkbrunnen-fuer-katzen/\",\n      label: \"Filterratgeber → Katzenvergleich\",\n    },\n    {\n      id: \"comparison-to-material\",\n      source: \"/vergleiche/beste-trinkbrunnen-fuer-katzen/\",\n      target: \"/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/\",\n      label: \"Katzenvergleich → Materialratgeber\",\n    },\n    {\n      id: \"comparison-to-cleaning\",\n      source: \"/vergleiche/beste-trinkbrunnen-fuer-katzen/\",\n      target: \"/katzentrinkbrunnen-richtig-reinigen/\",\n      label: \"Katzenvergleich → Reinigungsratgeber\",\n    },\n    {\n      id: \"comparison-to-filter\",\n      source: \"/vergleiche/beste-trinkbrunnen-fuer-katzen/\",\n      target: \"/filter-im-katzentrinkbrunnen-wechseln/\",\n      label: \"Katzenvergleich → Filterratgeber\",\n    },\n  ],\n};\n\nconst normalizeRoute = (value: string): string => {\n  const raw = String(value ?? \"\").trim();\n  if (!raw) return \"\";\n  const withoutHash = raw.split(\"#\", 1)[0]?.split(\"?\", 1)[0] ?? \"\";\n  if (!withoutHash.startsWith(\"/\")) return withoutHash;\n  return withoutHash.endsWith(\"/\") ? withoutHash : `${withoutHash}/`;\n};\n\nexport function getJourneyRequirements(clusterId: string): JourneyRequirement[] {\n  return REQUIREMENTS[clusterId] ?? [];\n}\n\nexport function evaluateClusterJourney(\n  clusterId: string,\n  documents: JourneyDocument[],\n): JourneyCompletion {\n  const requirements = getJourneyRequirements(clusterId);\n\n  if (requirements.length === 0) {\n    return {\n      clusterId,\n      applicable: false,\n      complete: false,\n      completedEdges: [],\n      missingEdges: [],\n      requiredEdges: 0,\n      completedCount: 0,\n    };\n  }\n\n  const graph = new Map<string, Set<string>>();\n\n  for (const document of documents) {\n    const route = normalizeRoute(document.route);\n    if (!route) continue;\n\n    const targets = graph.get(route) ?? new Set<string>();\n    for (const link of document.links ?? []) {\n      const normalized = normalizeRoute(link);\n      if (normalized && normalized !== route) targets.add(normalized);\n    }\n    graph.set(route, targets);\n  }\n\n  const completedEdges: string[] = [];\n  const missingEdges: string[] = [];\n\n  for (const requirement of requirements) {\n    const source = normalizeRoute(requirement.source);\n    const target = normalizeRoute(requirement.target);\n    const present = graph.get(source)?.has(target) ?? false;\n\n    if (present) completedEdges.push(requirement.label);\n    else missingEdges.push(requirement.label);\n  }\n\n  return {\n    clusterId,\n    applicable: true,\n    complete: missingEdges.length === 0,\n    completedEdges,\n    missingEdges,\n    requiredEdges: requirements.length,\n    completedCount: completedEdges.length,\n  };\n}\n\nexport function journeyOpportunityReason(\n  completion: JourneyCompletion | undefined,\n  fallback: string,\n): string {\n  if (!completion?.applicable) return fallback;\n  if (completion.complete) {\n    return `Alle ${completion.requiredEdges} kaufnahen Pflichtkanten sind vorhanden.`;\n  }\n\n  return `${completion.completedCount}/${completion.requiredEdges} kaufnahe Pflichtkanten vorhanden. Fehlend: ${completion.missingEdges.join(\", \")}.`;\n}\n";
const TEST_SOURCE = "import assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport test from \"node:test\";\nimport {\n  evaluateClusterJourney,\n  getJourneyRequirements,\n  journeyOpportunityReason,\n} from \"../src/lib/seo/topical-authority/journey-completion.ts\";\n\nconst requirements = getJourneyRequirements(\"trinkbrunnen\");\n\nconst completeDocuments = requirements.map((requirement) => ({\n  route: requirement.source,\n  links: requirements\n    .filter((candidate) => candidate.source === requirement.source)\n    .map((candidate) => candidate.target),\n}));\n\ntest(\"Trinkbrunnen-Journey wird über konkrete Pflichtkanten bewertet\", () => {\n  const result = evaluateClusterJourney(\"trinkbrunnen\", completeDocuments);\n\n  assert.equal(result.applicable, true);\n  assert.equal(result.complete, true);\n  assert.equal(result.requiredEdges, 10);\n  assert.equal(result.completedCount, 10);\n  assert.deepEqual(result.missingEdges, []);\n});\n\ntest(\"eine fehlende Rückkante hält die Chance offen\", () => {\n  const documents = completeDocuments.map((document) =>\n    document.route === \"/vergleiche/beste-trinkbrunnen-fuer-katzen/\"\n      ? {\n          ...document,\n          links: document.links.filter(\n            (link) => link !== \"/filter-im-katzentrinkbrunnen-wechseln/\",\n          ),\n        }\n      : document,\n  );\n\n  const result = evaluateClusterJourney(\"trinkbrunnen\", documents);\n\n  assert.equal(result.complete, false);\n  assert.ok(result.missingEdges.includes(\"Katzenvergleich → Filterratgeber\"));\n  assert.match(\n    journeyOpportunityReason(result, \"Fallback\"),\n    /Fehlend: Katzenvergleich → Filterratgeber/,\n  );\n});\n\ntest(\"globale Linkquote ist kein Fertigkriterium der kaufnahen Journey\", () => {\n  const sparseCluster = [\n    ...completeDocuments,\n    ...Array.from({ length: 40 }, (_, index) => ({\n      route: `/medizinische-randseite-${index}/`,\n      links: [],\n    })),\n  ];\n\n  const result = evaluateClusterJourney(\"trinkbrunnen\", sparseCluster);\n\n  assert.equal(result.complete, true);\n  assert.equal(result.completedCount, result.requiredEdges);\n});\n\ntest(\"Cluster ohne Pflichtkanten nutzen weiterhin die bestehende Fallback-Logik\", () => {\n  const result = evaluateClusterJourney(\"gps-tracker\", []);\n\n  assert.equal(result.applicable, false);\n  assert.equal(result.complete, false);\n  assert.equal(result.requiredEdges, 0);\n});\n\ntest(\"Loader nutzt die Journey-Prüfung für Opportunity und generische Linkchance\", () => {\n  const loader = fs.readFileSync(\n    path.join(\n      process.cwd(),\n      \"src/lib/seo/topical-authority/loadTopicalAuthority.ts\",\n    ),\n    \"utf8\",\n  );\n\n  assert.match(loader, /evaluateClusterJourney/);\n  assert.match(loader, /journeyCompletion\\?\\.complete/);\n  assert.doesNotMatch(\n    loader,\n    /!byId\\.trinkbrunnen\\.coverage\\.comparisons\\s*\\|\\|\\s*byId\\.trinkbrunnen\\.linkCoverage\\s*<\\s*70/,\n  );\n  assert.match(loader, /!item\\.journeyCompletion\\?\\.complete/);\n});\n";

function log(message) {
  console.log(`[${PATCH}] ${message}`);
}

function findRoot(start) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 16; depth += 1) {
    if (fs.existsSync(path.join(current, PACKAGE_RELATIVE))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel mit apps/pfotentechnik/package.json nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, APP_RELATIVE);
const HELPER = path.join(ROOT, HELPER_RELATIVE);
const LOADER = path.join(ROOT, LOADER_RELATIVE);
const TEST = path.join(ROOT, TEST_RELATIVE);
const PACKAGE = path.join(ROOT, PACKAGE_RELATIVE);
const TARGETS = [HELPER, LOADER, TEST];
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

function hasConflictMarkers(source) {
  return /^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(source);
}

function readPreflight(file, label) {
  if (!fs.existsSync(file)) {
    throw new Error(`${label} fehlt: ${path.relative(ROOT, file)}`);
  }
  const source = fs.readFileSync(file, "utf8");
  if (hasConflictMarkers(source)) {
    throw new Error(
      `${label} enthält ungelöste Git-Konfliktmarker: ${path.relative(ROOT, file)}`,
    );
  }
  return source;
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const destination = path.join(BACKUP, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}

function rollback() {
  for (const file of TARGETS) {
    const source = path.join(BACKUP, path.relative(ROOT, file));
    if (fs.existsSync(source)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(source, file);
    } else if (fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
}

function writeIfChanged(file, content) {
  const previous = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (previous === content) {
    log(`Bereits aktuell: ${path.relative(ROOT, file)}`);
    return false;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  log(`Geändert: ${path.relative(ROOT, file)}`);
  return true;
}

function replaceOnce(source, oldValue, newValue, label) {
  if (source.includes(newValue)) return source;
  const first = source.indexOf(oldValue);
  if (first < 0) throw new Error(`${label}: erwarteter Strukturanker fehlt.`);
  if (source.indexOf(oldValue, first + oldValue.length) >= 0) {
    throw new Error(`${label}: Strukturanker ist nicht eindeutig.`);
  }
  return `${source.slice(0, first)}${newValue}${source.slice(first + oldValue.length)}`;
}

function run(command, args, label, cwd = ROOT) {
  log(`Prüfe: ${label}`);
  const executable =
    process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  }
  log(`BESTANDEN: ${label}`);
}

const loaderSource = readPreflight(LOADER, "Topical-Authority-Loader");
const packageSource = readPreflight(PACKAGE, "package.json");

let packageJson;
try {
  packageJson = JSON.parse(packageSource);
} catch (error) {
  throw new Error(
    `package.json ist kein gültiges JSON: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

const requiredScripts = [
  "audit:topical-authority:strict",
  "audit:decision-journeys:strict",
  "audit:internal-link-health:strict",
  "audit:content-quality:strict",
  "build",
];

for (const script of requiredScripts) {
  if (typeof packageJson.scripts?.[script] !== "string") {
    throw new Error(`Erforderliches npm-Skript fehlt: ${script}`);
  }
}

fs.mkdirSync(BACKUP, { recursive: true });
for (const file of TARGETS) backup(file);
log(`Backup: ${path.relative(ROOT, BACKUP)}`);

try {
  writeIfChanged(HELPER, HELPER_SOURCE);
  writeIfChanged(TEST, TEST_SOURCE);

  let loader = loaderSource;

  loader = replaceOnce(
    loader,
    'import { fileURLToPath } from "node:url";',
    'import { fileURLToPath } from "node:url";\nimport {\n  evaluateClusterJourney,\n  journeyOpportunityReason,\n  type JourneyCompletion,\n} from "./journey-completion.ts";',
    "Import",
  );

  loader = replaceOnce(
    loader,
    "  linkCoverage: number;\n  gaps: string[];",
    "  linkCoverage: number;\n  journeyCompletion?: JourneyCompletion;\n  gaps: string[];",
    "Cluster-Typ",
  );

  loader = replaceOnce(
    loader,
    "  const linkCoverage = calculateLinkCoverage(members);\n  const targets = definition.targets;",
    "  const linkCoverage = calculateLinkCoverage(members);\n  const journeyCompletion = evaluateClusterJourney(definition.id, members);\n  const targets = definition.targets;",
    "Journey-Auswertung",
  );

  loader = replaceOnce(
    loader,
    "  coverage.journey =\n    hub &&\n    coverage.comparisons &&\n    coverage.products &&\n    linkCoverage >= 55;",
    "  coverage.journey =\n    hub &&\n    coverage.comparisons &&\n    coverage.products &&\n    (journeyCompletion.applicable\n      ? journeyCompletion.complete\n      : linkCoverage >= 55);",
    "Journey-Coverage",
  );

  loader = replaceOnce(
    loader,
    "    members.length > 1 && linkCoverage < 55\n      ? `Interne Linkabdeckung nur ${linkCoverage} %`\n      : \"\",",
    "    members.length > 1 &&\n    linkCoverage < 55 &&\n    !journeyCompletion.complete\n      ? journeyCompletion.applicable\n        ? `Kaufnahe Journey unvollständig: ${journeyCompletion.missingEdges.join(\", \")}`\n        : `Interne Linkabdeckung nur ${linkCoverage} %`\n      : \"\",",
    "Cluster-Lücke",
  );

  loader = replaceOnce(
    loader,
    "    linkCoverage,\n    gaps,",
    "    linkCoverage,\n    journeyCompletion,\n    gaps,",
    "Cluster-Ausgabe",
  );

  loader = replaceOnce(
    loader,
    "  if (\n    !byId.trinkbrunnen.coverage.comparisons ||\n    byId.trinkbrunnen.linkCoverage < 70\n  ) {",
    "  if (\n    !byId.trinkbrunnen.coverage.comparisons ||\n    !byId.trinkbrunnen.journeyCompletion?.complete\n  ) {",
    "Trinkbrunnen-Opportunity",
  );

  loader = replaceOnce(
    loader,
    '      reason:\n        "Wissensabdeckung und Kaufentscheidung sind noch nicht gleich stark verbunden.",',
    '      reason: journeyOpportunityReason(\n        byId.trinkbrunnen.journeyCompletion,\n        "Wissensabdeckung und Kaufentscheidung sind noch nicht gleich stark verbunden.",\n      ),',
    "Opportunity-Begründung",
  );

  loader = replaceOnce(
    loader,
    "  for (const cluster of clusters.filter(\n    (item) => item.documents.length > 2 && item.linkCoverage < 55,\n  )) {",
    "  for (const cluster of clusters.filter(\n    (item) =>\n      item.documents.length > 2 &&\n      item.linkCoverage < 55 &&\n      !item.journeyCompletion?.complete,\n  )) {",
    "Generische Journey-Opportunity",
  );

  if (!loader.includes("journeyCompletion?: JourneyCompletion")) {
    throw new Error("Zielzustand im Cluster-Typ fehlt.");
  }
  if (!loader.includes("!byId.trinkbrunnen.journeyCompletion?.complete")) {
    throw new Error("Zielzustand der Trinkbrunnen-Opportunity fehlt.");
  }
  if (!loader.includes("!item.journeyCompletion?.complete")) {
    throw new Error("Zielzustand der generischen Journey-Opportunity fehlt.");
  }

  writeIfChanged(LOADER, loader);

  run(
    process.execPath,
    ["--test", path.relative(APP, TEST)],
    "Journey-Completion-Test",
    APP,
  );
  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "test:topical-authority"],
    "Topical-Authority-Tests",
  );

  for (const script of requiredScripts) {
    run(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", script],
      script,
    );
  }

  const reportFile = path.join(
    APP,
    "reports",
    "topical-authority",
    "journey-completion-validation-26.8.2.json",
  );
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });
  fs.writeFileSync(
    reportFile,
    `${JSON.stringify(
      {
        patch: PATCH,
        status: "passed",
        behavior: {
          commercialOpportunityUsesRequiredEdges: true,
          genericLinkOpportunityIgnoresCompletedRegisteredJourney: true,
          globalLinkCoveragePreservedAsDiagnostic: true,
          newPages: 0,
          contentFilesChanged: 0,
        },
        requiredEdges: 10,
        validation: [
          "Journey-Completion-Test",
          "test:topical-authority",
          ...requiredScripts,
        ],
        backup: path.relative(ROOT, BACKUP),
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  log(`Report: ${path.relative(ROOT, reportFile)}`);
  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}
