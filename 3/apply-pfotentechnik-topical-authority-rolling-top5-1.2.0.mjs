#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-topical-authority-rolling-top5-1.2.0";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runBuild = !args.has("--no-build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 14; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const LOADER = path.join(APP, "src", "lib", "seo", "topical-authority", "loadTopicalAuthority.ts");
const PAGE = path.join(APP, "src", "pages", "admin", "seo", "topical-authority.astro");
const TEST = path.join(APP, "test", "topical-authority-rolling-top5-1.2.0.test.mjs");

for (const file of [LOADER, PAGE]) {
  if (!fs.existsSync(file)) throw new Error(`Pflichtdatei fehlt: ${path.relative(ROOT, file)}`);
}

const loaderOriginal = fs.readFileSync(LOADER, "utf8");
const pageOriginal = fs.readFileSync(PAGE, "utf8");

for (const marker of [
  "export function buildOpportunities(): Opportunity[]",
  "const priorityWeight: Record<Priority, number>",
  "return output.sort(",
]) {
  if (!loaderOriginal.includes(marker)) {
    throw new Error(`Opportunity-Architektur nicht erkannt: ${marker}`);
  }
}

let loaderNext = loaderOriginal;

if (!loaderNext.includes("function documentContainsMarker(")) {
  const insertBefore = "export function buildOpportunities(): Opportunity[] {";
  const helper = `
function documentContainsMarker(route: string, marker: string): boolean {
  const document = documents.find((item) => item.route === route);
  return Boolean(document?.body.includes(marker));
}

function feederConsolidationResolved(): boolean {
  return (
    documentContainsMarker(
      "/smarte-futterautomaten/",
      "feeder-intent-owner: cluster-hub",
    ) &&
    documentContainsMarker(
      "/welcher-futterautomat-ist-der-richtige/",
      "feeder-intent-owner: compact-chooser",
    )
  );
}

function pushCoverageOpportunities(
  output: Opportunity[],
  cluster: Cluster,
): void {
  const missing = [
    !cluster.coverage.hub
      ? {
          suffix: "hub",
          title: \`\${cluster.label}: zentralen Hub klären\`,
          impact: 82,
          reason: "Für den Cluster ist noch kein eindeutiger Cornerstone-Hub erkannt.",
          action:
            "Bestehende Inhalte auf Hub-Eignung prüfen und nur bei klarer Lücke einen zentralen Owner festlegen.",
        }
      : null,
    !cluster.coverage.guides
      ? {
          suffix: "guides",
          title: \`\${cluster.label}: Ratgeberabdeckung gezielt schließen\`,
          impact: 72,
          reason: \`Die fachliche Ratgeberabdeckung liegt bei \${cluster.counts.pages} Inhalten und unter dem definierten Mindestniveau.\`,
          action:
            "Bestehende Ratgeber auf fehlende Nutzerfragen prüfen; nur belegte, eigenständige Intents ergänzen.",
        }
      : null,
    !cluster.coverage.comparisons
      ? {
          suffix: "comparisons",
          title: \`\${cluster.label}: kaufnahe Vergleiche prüfen\`,
          impact: 78,
          reason: \`Der Cluster besitzt erst \${cluster.counts.comparisons} eindeutig zugeordnete Vergleiche.\`,
          action:
            "Prüfen, ob eine eigenständige kommerzielle Suchintention fehlt oder bestehende Vergleiche nur falsch zugeordnet sind.",
        }
      : null,
    !cluster.coverage.products
      ? {
          suffix: "products",
          title: \`\${cluster.label}: Produktabdeckung validieren\`,
          impact: 68,
          reason: \`Der Cluster enthält \${cluster.counts.products} eindeutig kategorisierte Produkte.\`,
          action:
            "Produktbestand, Kategorisierung und tatsächliche Vergleichsrelevanz prüfen; keine Produkte nur zur Sollzahlerfüllung anlegen.",
        }
      : null,
    !cluster.coverage.manufacturers
      ? {
          suffix: "manufacturers",
          title: \`\${cluster.label}: Herstellerabdeckung prüfen\`,
          impact: 60,
          reason: \`Der Cluster enthält \${cluster.counts.manufacturers} fachlich zugeordnete Herstellerseiten.\`,
          action:
            "Vorhandene Herstellerzuordnung prüfen und nur strategisch relevante Hersteller ergänzen.",
        }
      : null,
  ].filter(Boolean) as Array<{
    suffix: string;
    title: string;
    impact: number;
    reason: string;
    action: string;
  }>;

  for (const item of missing) {
    output.push({
      id: \`coverage-\${cluster.id}-\${item.suffix}\`,
      title: item.title,
      cluster: cluster.label,
      priority: cluster.priority === "high" ? "high" : "medium",
      impact: item.impact,
      effort: "mittel",
      reason: item.reason,
      action: item.action,
    });
  }
}

`;
  loaderNext = loaderNext.replace(insertBefore, helper + insertBefore);
}

loaderNext = loaderNext.replace(
  "if (byId.futterautomaten.counts.total >= 20) {",
  "if (byId.futterautomaten.counts.total >= 20 && !feederConsolidationResolved()) {",
);

if (!loaderNext.includes("pushCoverageOpportunities(output, cluster);")) {
  const anchor = `
  for (const definition of CLUSTER_DEFINITIONS.filter(
    (item) => item.expansion,
  )) {`;
  if (!loaderNext.includes(anchor)) throw new Error("Einfügeposition für Coverage-Chancen nicht gefunden.");
  loaderNext = loaderNext.replace(
    anchor,
    `
  for (const cluster of clusters) {
    pushCoverageOpportunities(output, cluster);
  }

${anchor}`,
  );
}

if (!loaderNext.includes("const deduplicated =")) {
  const oldReturn = `  return output.sort(
    (a, b) =>
      priorityWeight[b.priority] - priorityWeight[a.priority] ||
      b.impact - a.impact,
  );`;
  const newReturn = `  const deduplicated = [
    ...new Map(output.map((opportunity) => [opportunity.id, opportunity])).values(),
  ];

  return deduplicated.sort(
    (a, b) =>
      priorityWeight[b.priority] - priorityWeight[a.priority] ||
      b.impact - a.impact ||
      a.title.localeCompare(b.title, "de"),
  );`;
  if (!loaderNext.includes(oldReturn)) throw new Error("Sortierblock nicht gefunden.");
  loaderNext = loaderNext.replace(oldReturn, newReturn);
}

let pageNext = pageOriginal
  .replace(
    "const roadmapOpportunities = data.opportunities.map((opportunity) => ({",
    "const roadmapOpportunities = data.opportunities.slice(0, 5).map((opportunity) => ({",
  )
  .replace("<h2>Strategische Chancen</h2>", "<h2>Top 5 aktive Chancen</h2>");

if (!pageNext.includes("Erledigte Punkte verschwinden")) {
  pageNext = pageNext.replace(
    `        </div>
      </div>

      <div class="ta-opportunities">`,
    `        </div>
        <small>Erledigte Punkte verschwinden nach dem nächsten Audit automatisch; die nächsthöher priorisierten Chancen rücken nach.</small>
      </div>

      <div class="ta-opportunities">`,
  );
}

for (const marker of [
  "data.opportunities.slice(0, 5)",
  "Top 5 aktive Chancen",
  "Erledigte Punkte verschwinden",
]) {
  if (!pageNext.includes(marker)) throw new Error(`Top-5-Seitenmarker fehlt: ${marker}`);
}

for (const marker of [
  "feederConsolidationResolved",
  "pushCoverageOpportunities",
  "coverage-${cluster.id}",
  "const deduplicated =",
]) {
  if (!loaderNext.includes(marker)) throw new Error(`Rolling-Opportunity-Marker fehlt: ${marker}`);
}

const testSource = `import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), "utf8");

test("Topical Authority zeigt nur die fünf wichtigsten aktiven Chancen", () => {
  const page = read("src/pages/admin/seo/topical-authority.astro");
  assert.match(page, /data\\.opportunities\\.slice\\(0, 5\\)/);
  assert.match(page, /Top 5 aktive Chancen/);
  assert.match(page, /nächsthöher priorisierten Chancen rücken nach/);
});

test("Erledigte Futterautomaten-Konsolidierung verschwindet", () => {
  const loader = read("src/lib/seo/topical-authority/loadTopicalAuthority.ts");
  assert.match(loader, /feederConsolidationResolved/);
  assert.match(loader, /feeder-intent-owner: cluster-hub/);
  assert.match(loader, /feeder-intent-owner: compact-chooser/);
  assert.match(loader, /counts\\.total >= 20 && !feederConsolidationResolved\\(\\)/);
});

test("Coverage-Chancen bilden eine rollierende Nachrückliste", () => {
  const loader = read("src/lib/seo/topical-authority/loadTopicalAuthority.ts");
  assert.match(loader, /pushCoverageOpportunities/);
  assert.match(loader, /coverage-\\$\\{cluster\\.id\\}/);
  assert.match(loader, /const deduplicated =/);
  assert.match(loader, /a\\.title\\.localeCompare/);
});
`;

const currentTest = fs.existsSync(TEST) ? fs.readFileSync(TEST, "utf8") : "";
const changes = [
  [LOADER, loaderOriginal, loaderNext],
  [PAGE, pageOriginal, pageNext],
  [TEST, currentTest, testSource],
].filter(([, before, after]) => before !== after);

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(`[${NAME}] Zu ändernde Dateien: ${changes.length}`);
  for (const [file] of changes) console.log(`- ${path.relative(ROOT, file)}`);
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);

for (const [file, , after] of changes) {
  if (fs.existsSync(file)) {
    const backup = path.join(backupRoot, path.relative(ROOT, file));
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(file, backup);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, after, "utf8");
  console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, file)}`);
}

if (changes.length) console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);

execFileSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--test",
    "apps/pfotentechnik/test/topical-authority-rolling-top5-1.2.0.test.mjs",
    "apps/pfotentechnik/test/topical-authority-roadmap-prompts-1.0.1.test.mjs",
    "apps/pfotentechnik/test/topical-authority-center.test.mjs",
  ],
  { cwd: ROOT, stdio: "inherit" },
);

const runNpm = (script) => {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/d", "/s", "/c", `npm --workspace apps/pfotentechnik run ${script}`], {
      cwd: ROOT,
      stdio: "inherit",
    });
  } else {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", script], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
};

runNpm("audit:topical-authority:strict");
if (runBuild) runNpm("build");

console.log(`[${NAME}] Fertig.`);
