#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  buildDecisionJourney,
  inferCluster,
  inferStage,
  normalizeRoute,
} from "../../src/domain/decisionJourney/registry.ts";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strict = process.argv.includes("--strict");

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : /\.mdx?$/i.test(entry.name) ? [full] : [];
  });
}

function parse(raw) {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  const stack = [{ indent: -1, target: data }];

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const item = line.trim().match(/^([\w-]+):(?:\s*(.*))?$/);
    if (!item) continue;

    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1).target;
    const key = item[1];
    const rawValue = item[2] ?? "";

    if (!rawValue) {
      parent[key] = {};
      stack.push({ indent, target: parent[key] });
      continue;
    }

    parent[key] = rawValue
      .replace(/^['"]|['"]$/g, "")
      .replace(/^(true|false)$/i, (value) => value.toLowerCase());
  }
  return data;
}

const specs = [
  ["page", "pages", (slug) => `/${slug}/`],
  ["comparison", "comparisons", (slug) => `/vergleiche/${slug}/`],
  ["product", "products", (slug) => `/produkt/${slug}/`],
];

const entries = specs.flatMap(([type, folder, route]) =>
  walk(path.join(appRoot, "src", "content", folder)).map((file) => {
    const raw = fs.readFileSync(file, "utf8");
    const data = parse(raw);
    const slug = data.slug || path.basename(file).replace(/\.mdx?$/i, "");
    return {
      route: normalizeRoute(route(slug)),
      type,
      slug,
      title: data.title || data.name || slug,
      description: data.description || "",
      cluster: data.decisionJourney?.cluster,
      categoryKey: data.category?.key,
      explicit: data.decisionJourney
        ? {
            stage: data.decisionJourney.stage,
            intent: data.decisionJourney.intent,
            primaryQuestion: data.decisionJourney.primaryQuestion,
          }
        : undefined,
      file: path.relative(appRoot, file).split(path.sep).join("/"),
    };
  }),
);

const routeSet = new Set(entries.map((entry) => entry.route));
const technical = [];
const editorial = [];
const matrix = [];

for (const entry of entries) {
  const cluster = inferCluster(entry);
  if (!cluster) continue;

  const journey = buildDecisionJourney(entry, entries);
  const stage = inferStage(entry);

  matrix.push({
    route: entry.route,
    type: entry.type,
    cluster,
    stage,
    source: entry.explicit ? "frontmatter" : "derived",
    steps: journey?.steps ?? [],
    file: entry.file,
  });

  if (entry.explicit?.stage && !["orientation", "problem", "evaluation", "decision", "support"].includes(entry.explicit.stage)) {
    technical.push({
      severity: "error",
      code: "INVALID_STAGE",
      route: entry.route,
      message: `Ungültige Decision-Journey-Stufe: ${entry.explicit.stage}`,
    });
  }

  for (const step of journey?.steps ?? []) {
    if (!routeSet.has(normalizeRoute(step.href))) {
      technical.push({
        severity: "error",
        code: "BROKEN_TARGET",
        route: entry.route,
        target: step.href,
        message: "Journey-Ziel existiert nicht.",
      });
    }
    if (normalizeRoute(step.href) === entry.route) {
      technical.push({
        severity: "error",
        code: "SELF_LINK",
        route: entry.route,
        target: step.href,
        message: "Journey verweist auf die eigene Route.",
      });
    }
  }

  if (!entry.explicit) {
    editorial.push({
      severity: "warning",
      code: "DERIVED_ONLY",
      route: entry.route,
      message: "Journey wird noch heuristisch statt explizit aus dem Frontmatter erzeugt.",
    });
  }

  if (!journey || journey.steps.length === 0) {
    editorial.push({
      severity: "warning",
      code: "EDITORIAL_DEAD_END",
      route: entry.route,
      message: "Noch kein sinnvoller nächster Entscheidungsschritt vorhanden.",
    });
  }

  if (entry.type === "product") {
    const hasComparison = journey?.steps.some((step) => step.kind === "Vergleich");
    if (!hasComparison) {
      editorial.push({
        severity: "warning",
        code: "PRODUCT_WITHOUT_COMPARISON_RETURN",
        route: entry.route,
        message: "Produkt besitzt keinen Rückweg zu einem passenden Vergleich.",
      });
    }
  }
}

const intentOwners = new Map();
for (const entry of entries) {
  if (!entry.explicit?.intent) continue;
  const key = `${inferCluster(entry)}:${entry.explicit.intent}:${entry.type}`;
  const owners = intentOwners.get(key) ?? [];
  owners.push(entry.route);
  intentOwners.set(key, owners);
}
for (const [key, routes] of intentOwners) {
  if (routes.length > 1) {
    editorial.push({
      severity: "warning",
      code: "MULTIPLE_INTENT_OWNERS",
      intent: key,
      routes,
      message: "Mehrere Seiten beanspruchen denselben expliziten Intent.",
    });
  }
}

const tasks = editorial.map((finding, index) => ({
  id: `decision-journey-${String(index + 1).padStart(4, "0")}`,
  priority:
    finding.code === "EDITORIAL_DEAD_END" ? "P1" :
    finding.code === "MULTIPLE_INTENT_OWNERS" ? "P1" : "P2",
  cluster: "decision-journey",
  title: finding.message,
  routes: finding.routes ?? [finding.route],
  source: "audit:decision-journeys",
}));

const report = {
  version: "2.0.0",
  generatedAt: new Date().toISOString(),
  summary: {
    documents: matrix.length,
    technicalErrors: technical.length,
    editorialWarnings: editorial.length,
  },
  technical,
  editorial,
  matrix,
  tasks,
};

const reportDir = path.join(appRoot, "reports", "decision-journeys");
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(reportDir, "seo-copilot-tasks.json"), `${JSON.stringify(tasks, null, 2)}\n`);

console.log("=== Globaler Decision-Journey-Audit ===");
console.log(`Dokumente: ${report.summary.documents}`);
console.log(`Technische Fehler: ${report.summary.technicalErrors}`);
console.log(`Redaktionelle Warnungen: ${report.summary.editorialWarnings}`);

for (const finding of technical) {
  console.log(`FEHLER ${finding.code} · ${finding.route} · ${finding.message}`);
}
for (const finding of editorial.slice(0, 25)) {
  console.log(`WARNUNG ${finding.code} · ${finding.route ?? finding.routes?.join(", ")} · ${finding.message}`);
}
if (editorial.length > 25) {
  console.log(`… ${editorial.length - 25} weitere redaktionelle Aufgaben im Report.`);
}

if (strict && technical.length > 0) process.exit(1);
