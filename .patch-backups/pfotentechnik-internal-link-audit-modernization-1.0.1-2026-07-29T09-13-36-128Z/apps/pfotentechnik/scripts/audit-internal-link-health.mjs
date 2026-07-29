#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "../..");
const root = path.resolve(appRoot, "../..");
const reportDir = path.join(appRoot, "reports/internal-linking");
const strict = process.argv.includes("--strict");
const skipBuild = process.argv.includes("--skip-build");

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    env: process.env
  });
  return result;
};

const normalizeRoute = (value) => {
  if (!value) return "/";
  let route = String(value).trim();
  try {
    if (/^https?:\/\//i.test(route)) route = new URL(route).pathname;
  } catch {}
  route = route.split(/[?#]/, 1)[0] || "/";
  if (!route.startsWith("/")) route = `/${route}`;
  route = route.replace(/\/{2,}/g, "/");
  if (!path.posix.extname(route) && !route.endsWith("/")) route += "/";
  return route;
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result;
};

const routeFromHtml = (file, dist) => {
  const relative = path.relative(dist, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return normalizeRoute(`/${relative.slice(0, -"/index.html".length)}/`);
  return normalizeRoute(`/${relative.replace(/\.html$/i, "")}`);
};

fs.mkdirSync(reportDir, { recursive: true });

if (!skipBuild && !fs.existsSync(path.join(appRoot, "dist"))) {
  const build = run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const legacy = run("node", [path.join(root, "scripts/audit-internal-links.mjs")], { capture: true });
if (legacy.stdout) process.stdout.write(legacy.stdout);
if (legacy.stderr) process.stderr.write(legacy.stderr);

const targetAudit = run("node", [path.join(appRoot, "scripts/audit-internal-link-targets.mjs")], { capture: true });
if (targetAudit.stdout) process.stdout.write(targetAudit.stdout);
if (targetAudit.stderr) process.stderr.write(targetAudit.stderr);

const legacyPath = path.join(reportDir, "internal-link-audit.json");
const targetPath = path.join(reportDir, "internal-link-target-audit.json");
if (!fs.existsSync(legacyPath)) throw new Error(`Legacy-Bericht fehlt: ${legacyPath}`);
if (!fs.existsSync(targetPath)) throw new Error(`Build-Bericht fehlt: ${targetPath}`);

const legacyReport = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
const targetReport = JSON.parse(fs.readFileSync(targetPath, "utf8"));
const dist = path.join(appRoot, "dist");
const builtRoutes = new Set(
  walk(dist)
    .filter((file) => file.endsWith(".html"))
    .map((file) => routeFromHtml(file, dist))
);

const runtimeFindings = (targetReport.findings ?? []).filter((item) => item.severity === "error");
const runtimeKeys = new Set(runtimeFindings.map((item) =>
  [item.code, normalizeRoute(item.canonical || item.sourceRoute), normalizeRoute(item.normalizedTarget || item.targetRoute || item.href)].join("|")
));

const architectureCriticalCodes = new Set([
  "TARGET_ROUTE_MISSING",
  "BLOCKED_GENERIC_ANCHOR",
  "BLOCKED_ANCHOR_EFFECTIVE",
  "SEMANTIC_ANCHOR_EXPANSION_PRESENT",
  "MANUFACTURER_PRODUCT_ALIAS_CONFLICT"
]);

const classified = [];
for (const finding of legacyReport.findings ?? []) {
  const targetRoute = normalizeRoute(finding.targetRoute);
  const sourceRoute = normalizeRoute(finding.sourceRoute);
  let classification = "advisory";
  let effectiveSeverity = finding.severity;
  let rationale = "Redaktioneller oder Governance-Befund ohne nachgewiesenen Fehler im gebauten HTML.";

  if (finding.code === "LINK_TARGET_ROUTE_MISSING") {
    if (builtRoutes.has(targetRoute)) {
      classification = "source-model-false-positive";
      effectiveSeverity = "info";
      rationale = `Ziel ${targetRoute} ist im Build vorhanden; der Legacy-Audit kann Astro-/Hub-Routen nicht vollständig modellieren.`;
    } else {
      const runtimeMatch = [...runtimeKeys].some((key) => key.includes(`|${sourceRoute}|${targetRoute}`));
      classification = runtimeMatch ? "verified-runtime-error" : "unverified-source-error";
      effectiveSeverity = runtimeMatch ? "error" : "warning";
      rationale = runtimeMatch
        ? "Der Fehler wurde im gebauten HTML bestätigt."
        : "Das Ziel fehlt im Content-Modell und im Build, wurde aber im HTML-Audit nicht als produktiver Link bestätigt.";
    }
  } else if (finding.code === "SELF_LINK") {
    const runtimeMatch = runtimeFindings.some((item) =>
      item.code === "SELF_LINK" && normalizeRoute(item.canonical || item.sourceRoute) === sourceRoute
    );
    classification = runtimeMatch ? "verified-runtime-error" : "source-only-finding";
    effectiveSeverity = runtimeMatch ? "error" : "warning";
    rationale = runtimeMatch ? "Selflink im gebauten HTML bestätigt." : "Nur im Quellmodell erkannt, nicht im gebauten HTML.";
  } else if (finding.code === "UNRESOLVED_ANCHOR_CONFLICT") {
    classification = "anchor-governance-review";
    effectiveSeverity = "warning";
    rationale = "Mehrere Ziele beanspruchen denselben Alias. Das ist eine Ownership-Entscheidung, aber kein automatisch nachgewiesener kaputter Link.";
  } else if (finding.code === "WRONG_CLUSTER_TARGET_HIGH_CONFIDENCE") {
    classification = "simulation-quality-review";
    effectiveSeverity = "warning";
    rationale = "Der Befund stammt aus einer Simulation. Vor einer Korrektur muss der tatsächlich gerenderte Link geprüft werden.";
  } else if (architectureCriticalCodes.has(finding.code)) {
    classification = "architecture-error";
    effectiveSeverity = "error";
    rationale = "Deterministischer Architektur- oder Taxonomiefehler.";
  } else if (finding.severity === "error") {
    classification = "source-quality-review";
    effectiveSeverity = "warning";
  }

  classified.push({
    ...finding,
    originalSeverity: finding.severity,
    effectiveSeverity,
    classification,
    rationale
  });
}

for (const finding of runtimeFindings) {
  const alreadyRepresented = classified.some((item) =>
    item.classification === "verified-runtime-error" &&
    normalizeRoute(item.sourceRoute) === normalizeRoute(finding.canonical || finding.sourceRoute) &&
    normalizeRoute(item.targetRoute) === normalizeRoute(finding.normalizedTarget || finding.targetRoute || finding.href)
  );
  if (!alreadyRepresented) {
    classified.push({
      ...finding,
      originalSeverity: finding.severity,
      effectiveSeverity: "error",
      classification: "verified-runtime-error",
      rationale: "Direkt im gebauten HTML durch den Linkziel-Audit bestätigt."
    });
  }
}

const counts = (key) => Object.fromEntries(
  [...new Set(classified.map((item) => item[key]))]
    .sort()
    .map((value) => [value, classified.filter((item) => item[key] === value).length])
);

const strictFindings = classified.filter((item) => item.effectiveSeverity === "error");
const report = {
  version: "4.0.0",
  generatedAt: new Date().toISOString(),
  strict,
  inputs: {
    legacyVersion: legacyReport.version,
    targetAuditVersion: targetReport.version ?? "unknown",
    builtRoutes: builtRoutes.size
  },
  summary: {
    documents: legacyReport.summary?.documents ?? 0,
    legacyErrors: legacyReport.summary?.errors ?? 0,
    legacyWarnings: legacyReport.summary?.warnings ?? 0,
    runtimeErrors: runtimeFindings.length,
    effectiveErrors: strictFindings.length,
    effectiveWarnings: classified.filter((item) => item.effectiveSeverity === "warning").length,
    falsePositives: classified.filter((item) => item.classification === "source-model-false-positive").length
  },
  classifications: counts("classification"),
  effectiveSeverities: counts("effectiveSeverity"),
  findings: classified
};

const jsonPath = path.join(reportDir, "internal-link-health-audit.json");
const mdPath = path.join(reportDir, "internal-link-health-audit.md");
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const sections = [
  ["Verifizierte Laufzeitfehler", classified.filter((f) => f.classification === "verified-runtime-error")],
  ["Architekturfehler", classified.filter((f) => f.classification === "architecture-error")],
  ["False Positives des Quellmodells", classified.filter((f) => f.classification === "source-model-false-positive")],
  ["Anchor-Governance", classified.filter((f) => f.classification === "anchor-governance-review")],
  ["Weitere Prüfhinweise", classified.filter((f) => !["verified-runtime-error","architecture-error","source-model-false-positive","anchor-governance-review"].includes(f.classification))]
];

const md = [
  "# Internal-Link Health Audit 4.0",
  "",
  `Erstellt: ${report.generatedAt}`,
  "",
  "## Zusammenfassung",
  "",
  `- Dokumente: ${report.summary.documents}`,
  `- Legacy-Fehler: ${report.summary.legacyErrors}`,
  `- Build-verifizierte Laufzeitfehler: ${report.summary.runtimeErrors}`,
  `- Effektive Strict-Fehler: ${report.summary.effectiveErrors}`,
  `- Effektive Warnungen: ${report.summary.effectiveWarnings}`,
  `- Erkannte False Positives: ${report.summary.falsePositives}`,
  "",
  "## Bewertungslogik",
  "",
  "- Der gebaute HTML-Linkziel-Audit ist für 404-Ziele und Selflinks maßgeblich.",
  "- Astro-Seiten und Hub-Routen werden über den tatsächlichen `dist`-Bestand validiert.",
  "- Alias-Konflikte bleiben Governance-Warnungen, bis ein falscher gerenderter Link nachgewiesen ist.",
  "- Strict scheitert nur bei verifizierten Laufzeitfehlern oder deterministischen Architekturfehlern.",
  "",
  ...sections.flatMap(([title, items]) => [
    `## ${title}`,
    "",
    ...(items.length ? items.map((item) =>
      `- **${item.effectiveSeverity.toUpperCase()} · ${item.code} · ${item.classification}:** ${item.message ?? `${item.file ?? ""}`} — ${item.rationale}`
    ) : ["Keine Befunde."]),
    ""
  ])
].join("\n");

fs.writeFileSync(mdPath, md, "utf8");

console.log("");
console.log(`Internal-Link Health Audit 4.0: ${report.summary.documents} Dokumente`);
console.log(`Legacy: ${report.summary.legacyErrors} Fehler / ${report.summary.legacyWarnings} Warnungen`);
console.log(`Build-verifiziert: ${report.summary.runtimeErrors} Laufzeitfehler`);
console.log(`Effektiv: ${report.summary.effectiveErrors} Fehler / ${report.summary.effectiveWarnings} Warnungen`);
console.log(`False Positives: ${report.summary.falsePositives}`);
console.log(`Berichte: ${path.relative(root, jsonPath)} und ${path.relative(root, mdPath)}`);

if (strict && strictFindings.length) process.exit(1);
