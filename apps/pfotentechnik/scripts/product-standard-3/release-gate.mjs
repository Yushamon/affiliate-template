#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SKIP_BUILD = process.argv.includes("--skip-build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const REPORT_DIR = path.join(APP, "reports", "product-standard-3");
const REPORT_JSON = path.join(REPORT_DIR, "product-standard-3-release-latest.json");
const REPORT_MD = path.join(REPORT_DIR, "product-standard-3-release-latest.md");

const steps = [
  {
    id: "tests",
    label: "Product-Standard-3-Tests",
    command: "npm",
    args: ["--workspace", "apps/pfotentechnik", "run", "test:product-standard-3"]
  },
  {
    id: "enricher-tests",
    label: "Enricher-Tests",
    command: "npm",
    args: ["--workspace", "apps/pfotentechnik", "run", "test:product-standard-3:enricher"]
  },
  {
    id: "audit",
    label: "Product-Standard-3-Audit",
    command: "npm",
    args: ["--workspace", "apps/pfotentechnik", "run", "audit:product-standard-3:strict"]
  },
  {
    id: "enrichment-preview",
    label: "Enrichment-Vorschau",
    command: "npm",
    args: ["--workspace", "apps/pfotentechnik", "run", "product-standard-3:enrich"]
  }
];

if (!SKIP_BUILD) {
  steps.push({
    id: "build",
    label: "Astro-Build",
    command: "npm",
    args: ["--workspace", "apps/pfotentechnik", "run", "build"]
  });
}

const results = [];

for (const step of steps) {
  console.log(`\n[product-standard-3-release] ${step.label}`);
  const startedAt = Date.now();
  const result = spawnSync(step.command, step.args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  const status = result.status === 0 ? "passed" : "failed";
  results.push({
    id: step.id,
    label: step.label,
    status,
    durationMs: Date.now() - startedAt,
    exitCode: result.status ?? 1
  });

  if (status === "failed") break;
}

const auditPath = path.join(REPORT_DIR, "product-standard-3-latest.json");
const enrichmentPath = path.join(REPORT_DIR, "product-standard-3-enrichment-latest.json");

const readJson = (file) => {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

const audit = readJson(auditPath);
const enrichment = readJson(enrichmentPath);
const passed = results.every((result) => result.status === "passed");

const report = {
  version: "25.5.0",
  generatedAt: new Date().toISOString(),
  passed,
  skipBuild: SKIP_BUILD,
  steps: results,
  auditSummary: audit?.summary ?? null,
  enrichmentSummary: enrichment?.summary ?? null
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");

const markdown = [
  "# Product Standard 3 Release Gate",
  "",
  `- Status: ${passed ? "BESTANDEN" : "FEHLGESCHLAGEN"}`,
  `- Build übersprungen: ${SKIP_BUILD ? "ja" : "nein"}`,
  "",
  "## Schritte",
  "",
  "| Prüfung | Status | Dauer |",
  "|---|---|---:|",
  ...results.map((result) =>
    `| ${result.label} | ${result.status} | ${(result.durationMs / 1000).toFixed(2)} s |`
  ),
  "",
  "## Audit",
  "",
  audit?.summary
    ? [
        `- Produkte: ${audit.summary.products}`,
        `- Blockiert: ${audit.summary.blocked}`,
        `- Verbesserungsbedarf: ${audit.summary.needsWork}`,
        `- Gut: ${audit.summary.good}`,
        `- Stark: ${audit.summary.strong}`,
        `- Fehler: ${audit.summary.errors}`,
        `- Warnungen: ${audit.summary.warnings}`
      ].join("\n")
    : "Kein Audit-Report verfügbar.",
  "",
  "## Enrichment",
  "",
  enrichment?.summary
    ? [
        `- Produkte: ${enrichment.summary.products}`,
        `- sicher anreicherbar: ${enrichment.summary.eligible}`,
        `- geschrieben: ${enrichment.summary.changed}`,
        `- bereits vorhanden: ${enrichment.summary.alreadyPresent}`,
        `- keine sicheren Ableitungen: ${enrichment.summary.noSafeFacts}`
      ].join("\n")
    : "Kein Enrichment-Report verfügbar.",
  "",
  "## Freigaberegel",
  "",
  "Der Standard gilt technisch als freigegeben, wenn alle Tests, der Strict-Audit und der Build erfolgreich durchlaufen.",
  "Community-Insights und Fehlkauf-Szenarien bleiben redaktionelle Qualitätsmerkmale und blockieren die technische Freigabe nicht.",
  ""
].join("\n");

fs.writeFileSync(REPORT_MD, markdown);

console.log(`\n[product-standard-3-release] Status: ${passed ? "BESTANDEN" : "FEHLGESCHLAGEN"}`);
console.log(`[product-standard-3-release] Report: ${path.relative(ROOT, REPORT_MD)}`);

if (!passed) process.exitCode = 1;
