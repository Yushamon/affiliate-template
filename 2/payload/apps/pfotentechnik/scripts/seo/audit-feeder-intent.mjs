#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  FEEDER_HUB_ROUTE,
  FEEDER_INTENTS,
  buildFeederDecisionJourney,
  getFeederIntent,
  normalizeFeederRoute,
} from "../../src/domain/seo/feederIntentMatrix.ts";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strict = process.argv.includes("--strict");

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.mdx?$/i.test(entry.name) ? [full] : [];
  });
}

function frontmatter(raw) {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^([A-Za-z][\w-]*):\s*(.+)$/);
    if (item) data[item[1]] = item[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return data;
}

const specs = [
  ["page", "pages", (slug) => `/${slug}/`],
  ["comparison", "comparisons", (slug) => `/vergleiche/${slug}/`],
  ["product", "products", (slug) => `/produkt/${slug}/`],
];

const documents = specs.flatMap(([type, folder, route]) =>
  walk(path.join(appRoot, "src", "content", folder)).map((file) => {
    const raw = fs.readFileSync(file, "utf8");
    const data = frontmatter(raw);
    const slug = data.slug || path.basename(file).replace(/\.mdx?$/i, "");
    return {
      type,
      slug,
      route: normalizeFeederRoute(route(slug)),
      title: data.title || data.name || slug,
      description: data.description || data.excerpt || "",
      file: path.relative(appRoot, file).split(path.sep).join("/"),
    };
  }),
);

const routes = new Set(documents.map((item) => item.route));
const feederDocs = documents
  .filter((item) => item.type !== "product")
  .filter((item) =>
    /futterautomat|futterautomaten|nassfutter|schling|futterneid/i.test(
      `${item.slug} ${item.title} ${item.description}`,
    ),
  )
  .map((item) => {
    const intent = getFeederIntent(item.slug);
    const journey = buildFeederDecisionJourney(item.slug, routes);
    return {
      ...item,
      intent: intent?.id ?? "unclassified",
      stage: intent?.stage ?? "unknown",
      primaryQuestion: intent?.question ?? "",
      journey,
    };
  });

const findings = [];

if (!routes.has(FEEDER_HUB_ROUTE)) {
  findings.push({
    severity: "error",
    code: "HUB_MISSING",
    route: FEEDER_HUB_ROUTE,
    message: "Der zentrale Futterautomaten-Hub fehlt.",
  });
}

for (const item of feederDocs) {
  if (item.intent === "unclassified") {
    findings.push({
      severity: "warning",
      code: "INTENT_UNCLASSIFIED",
      route: item.route,
      message: "Die Seite besitzt keinen eindeutigen Entscheidungs-Intent.",
    });
  }

  if (item.journey.length === 0) {
    findings.push({
      severity: "error",
      code: "DECISION_DEAD_END",
      route: item.route,
      message: "Die Seite endet ohne gültigen nächsten Entscheidungsschritt.",
    });
  }

  if (
    item.stage === "problem" &&
    !item.journey.some((step) => step.kind === "Vergleich")
  ) {
    findings.push({
      severity: "warning",
      code: "PROBLEM_WITHOUT_COMPARISON",
      route: item.route,
      message: "Problemseite besitzt keinen direkten Weg zu einem passenden Vergleich.",
    });
  }
}

for (const intent of FEEDER_INTENTS) {
  const owners = feederDocs.filter((item) => item.intent === intent.id);
  const pageOwners = owners.filter((item) => item.type === "page");
  const comparisonOwners = owners.filter((item) => item.type === "comparison");

  if (pageOwners.length > 1) {
    findings.push({
      severity: "warning",
      code: "MULTIPLE_INFORMATION_OWNERS",
      intent: intent.id,
      routes: pageOwners.map((item) => item.route),
      message: "Mehrere Ratgeber beanspruchen dieselbe Hauptfrage.",
      recommendation: "Zusammenführen oder Hauptfrage und Zielgruppe klar trennen.",
    });
  }

  if (comparisonOwners.length > 1) {
    findings.push({
      severity: "warning",
      code: "MULTIPLE_COMPARISON_OWNERS",
      intent: intent.id,
      routes: comparisonOwners.map((item) => item.route),
      message: "Mehrere Vergleiche beanspruchen denselben Entscheidungs-Intent.",
      recommendation: "Einen primären Vergleich festlegen und Varianten klar abgrenzen.",
    });
  }
}

const matrix = feederDocs.map((item) => ({
  route: item.route,
  type: item.type,
  title: item.title,
  intent: item.intent,
  stage: item.stage,
  primaryQuestion: item.primaryQuestion,
  nextSteps: item.journey,
  file: item.file,
}));

const tasks = findings.map((finding, index) => ({
  id: `feeder-decision-${String(index + 1).padStart(3, "0")}`,
  cluster: "futterautomaten",
  priority:
    finding.severity === "error"
      ? "P0"
      : finding.code.includes("MULTIPLE")
        ? "P1"
        : "P2",
  title: finding.message,
  routes: finding.routes ?? (finding.route ? [finding.route] : []),
  recommendation:
    finding.recommendation ??
    "Intent, Zielseite und nächsten Entscheidungsschritt redaktionell prüfen.",
  source: "audit:feeder-decision-journey",
}));

const report = {
  version: "1.1.0",
  generatedAt: new Date().toISOString(),
  summary: {
    documents: feederDocs.length,
    intents: new Set(matrix.map((item) => item.intent)).size,
    findings: findings.length,
    errors: findings.filter((item) => item.severity === "error").length,
    warnings: findings.filter((item) => item.severity === "warning").length,
  },
  matrix,
  findings,
  tasks,
};

const reportDir = path.join(appRoot, "reports", "futterautomaten-intent");
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, "intent-matrix.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(reportDir, "seo-copilot-tasks.json"),
  `${JSON.stringify(tasks, null, 2)}\n`,
);

console.log("=== Futterautomaten Decision-Journey-Audit ===");
console.log(`Dokumente: ${report.summary.documents}`);
console.log(`Intents: ${report.summary.intents}`);
console.log(`Fehler: ${report.summary.errors}`);
console.log(`Warnungen: ${report.summary.warnings}`);

for (const finding of findings) {
  console.log(
    `${finding.severity === "error" ? "FEHLER" : "WARNUNG"} ${finding.code} · ${finding.message}`,
  );
}

if (strict && report.summary.errors > 0) process.exit(1);
