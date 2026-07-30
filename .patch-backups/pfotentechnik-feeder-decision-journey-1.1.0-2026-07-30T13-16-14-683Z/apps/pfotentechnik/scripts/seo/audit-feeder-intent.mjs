#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  FEEDER_HUB_ROUTE,
  FEEDER_INTENTS,
  buildFeederJourney,
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

function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^([A-Za-z][\w-]*):\s*(.+)$/);
    if (!item) continue;
    result[item[1]] = item[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return result;
}

const collections = [
  {
    type: "page",
    root: path.join(appRoot, "src", "content", "pages"),
    route: (slug) => `/${slug}/`,
  },
  {
    type: "comparison",
    root: path.join(appRoot, "src", "content", "comparisons"),
    route: (slug) => `/vergleiche/${slug}/`,
  },
  {
    type: "product",
    root: path.join(appRoot, "src", "content", "products"),
    route: (slug) => `/produkt/${slug}/`,
  },
  {
    type: "manufacturer",
    root: path.join(appRoot, "src", "content", "manufacturers"),
    route: (slug) => `/hersteller/${slug}/`,
  },
];

const documents = collections.flatMap((collection) =>
  walk(collection.root).map((file) => {
    const raw = fs.readFileSync(file, "utf8");
    const data = parseFrontmatter(raw);
    const slug = data.slug || path.basename(file).replace(/\.mdx?$/i, "");
    return {
      type: collection.type,
      slug,
      route: normalizeFeederRoute(collection.route(slug)),
      title: data.title || data.name || slug,
      description: data.description || data.excerpt || "",
      file: path.relative(appRoot, file).split(path.sep).join("/"),
      raw,
    };
  }),
);

const routeSet = new Set(documents.map((document) => document.route));
const feederDocuments = documents
  .filter((document) => document.type === "page" || document.type === "comparison")
  .filter((document) =>
    /futterautomat|futterautomaten|nassfutter|schling|futterneid/i.test(
      `${document.slug} ${document.title} ${document.description}`,
    ),
  )
  .map((document) => {
    const intent = getFeederIntent(document.slug);
    const journey = buildFeederJourney(document.slug, routeSet);
    return {
      ...document,
      intentId: intent?.id ?? "unclassified",
      intentStage: intent?.stage ?? "unknown",
      intentLabel: intent?.label ?? "Nicht klassifiziert",
      primaryQuestion: intent?.question ?? "",
      journey,
    };
  });

const owners = new Map();
for (const document of feederDocuments) {
  if (document.intentId === "unclassified") continue;
  const list = owners.get(document.intentId) ?? [];
  list.push(document);
  owners.set(document.intentId, list);
}

const findings = [];

if (!routeSet.has(FEEDER_HUB_ROUTE)) {
  findings.push({
    severity: "error",
    code: "HUB_MISSING",
    route: FEEDER_HUB_ROUTE,
    message: "Der zentrale Futterautomaten-Hub fehlt.",
  });
}

for (const document of feederDocuments) {
  if (document.intentId === "unclassified") {
    findings.push({
      severity: "warning",
      code: "INTENT_UNCLASSIFIED",
      route: document.route,
      file: document.file,
      message: "Futterautomaten-Inhalt hat noch keine eindeutige Intent-Zuordnung.",
    });
  }

  if (document.journey.length === 0) {
    findings.push({
      severity: "warning",
      code: "JOURNEY_MISSING",
      route: document.route,
      file: document.file,
      message: "Für diese Seite konnte kein gültiger nächster Schritt erzeugt werden.",
    });
  }
}

for (const intent of FEEDER_INTENTS) {
  const matches = owners.get(intent.id) ?? [];
  const pages = matches.filter((item) => item.type === "page");
  const comparisons = matches.filter((item) => item.type === "comparison");

  if (pages.length > 1) {
    findings.push({
      severity: "warning",
      code: "MULTIPLE_INFORMATION_OWNERS",
      intent: intent.id,
      routes: pages.map((item) => item.route),
      message: "Mehrere Ratgeber beanspruchen denselben Informations-Intent.",
      recommendation: "Zusammenführen oder Hauptfrage und Zielgruppe klarer trennen.",
    });
  }

  if (comparisons.length > 1 && intent.stage !== "comparison") {
    findings.push({
      severity: "warning",
      code: "MULTIPLE_COMPARISON_OWNERS",
      intent: intent.id,
      routes: comparisons.map((item) => item.route),
      message: "Mehrere Vergleiche beanspruchen denselben Entscheidungs-Intent.",
      recommendation: "Einen Vergleich als Owner festlegen und Varianten dorthin führen.",
    });
  }
}

const matrix = feederDocuments.map((document) => ({
  route: document.route,
  type: document.type,
  title: document.title,
  intent: document.intentId,
  stage: document.intentStage,
  primaryQuestion: document.primaryQuestion,
  nextSteps: document.journey.map((item) => item.href),
  file: document.file,
}));

const tasks = findings.map((finding, index) => ({
  id: `feeder-intent-${String(index + 1).padStart(3, "0")}`,
  cluster: "futterautomaten",
  priority:
    finding.severity === "error"
      ? "P0"
      : finding.code.includes("MULTIPLE")
        ? "P1"
        : "P2",
  title: finding.message,
  routes: finding.routes ?? (finding.route ? [finding.route] : []),
  recommendation: finding.recommendation ?? "Intent und nächste Nutzeraktion redaktionell prüfen.",
  source: "audit:feeder-intent",
}));

const report = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  status: findings.some((item) => item.severity === "error") ? "failed" : "passed",
  summary: {
    documents: feederDocuments.length,
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

console.log("=== Futterautomaten Intent- und Journey-Audit ===");
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
