#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-anchor-governance-and-release-gate-1.0.6";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const AUDIT = path.join(ROOT, "scripts", "audit-internal-links.mjs");
const DIST = path.join(APP, "dist");
const REPORT = path.join(APP, "reports", "internal-linking", "internal-link-audit.json");
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const log = (message = "") => console.log(`[${NAME}] ${message}`.trimEnd());
const fail = (message) => {
  console.error(`\n[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};
const rel = (file) => path.relative(ROOT, file).replace(/\\/g, "/");

function read(file) {
  if (!fs.existsSync(file)) fail(`Erwartete Datei fehlt: ${rel(file)}`);
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const target = path.join(BACKUP_ROOT, rel(file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function run(command, args, options = {}) {
  log(`Ausführen: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      ...(options.env ?? {})
    }
  });

  if (result.error) fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  if (result.status !== 0 && !options.allowFailure) {
    fail(`Befehl fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`);
  }
  return result;
}

function printReport() {
  if (!fs.existsSync(REPORT)) return;
  try {
    const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
    const errors = (report.findings ?? []).filter((item) => item.severity === "error");
    const counts = new Map();
    for (const item of errors) counts.set(item.code, (counts.get(item.code) ?? 0) + 1);

    console.error(`\n[${NAME}] Verbleibende Fehler: ${errors.length}`);
    for (const [code, count] of [...counts].sort((a, b) => b[1] - a[1])) {
      console.error(`- ${code}: ${count}`);
    }
    for (const item of errors.slice(0, 50)) {
      console.error(
        `- ${item.code}: ${item.sourceRoute ?? item.targetRoute ?? item.anchor ?? ""}` +
        `${item.targetRoute ? ` → ${item.targetRoute}` : ""}`
      );
    }
  } catch (error) {
    console.error(`[${NAME}] Report konnte nicht gelesen werden: ${error.message}`);
  }
}

log("Vorprüfung");

for (const file of [
  path.join(ROOT, "package.json"),
  path.join(APP, "package.json"),
  AUDIT,
  DIST,
  path.join(DIST, "sitemap-index.xml")
]) {
  if (!fs.existsSync(file)) fail(`Repository-/Build-Struktur unvollständig: ${rel(file)}`);
}

let source = read(AUDIT);

if (
  !source.includes('const routeSet = new Set(docs.map((doc) => doc.route));') ||
  !source.includes('if (!routeSet.has(target) && target.startsWith("/"))')
) {
  fail("Der Source-Link-Audit entspricht nicht der erwarteten Architektur 3.0.0.");
}

const helperAnchor = `const routeSet = new Set(docs.map((doc) => doc.route));`;
const helperReplacement = `const contentRouteSet = new Set(docs.map((doc) => doc.route));

const routeForBuildFile = (file) => {
  const relative = path.relative(path.join(appRoot, "dist"), file).replace(/\\\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) {
    return normalizeTaxonomyPath(\`/\${relative.slice(0, -11)}/\`);
  }
  if (relative.endsWith(".html")) {
    return normalizeTaxonomyPath(\`/\${relative.slice(0, -5)}/\`);
  }
  return "";
};

const buildRouteSet = new Set(
  walkFiles(path.join(appRoot, "dist"))
    .filter((file) => file.endsWith(".html"))
    .map(routeForBuildFile)
    .filter(Boolean)
);

const routeSet = new Set([...contentRouteSet, ...buildRouteSet]);`;

if (!source.includes("const contentRouteSet = new Set")) {
  source = source.replace(helperAnchor, helperReplacement);
}

source = source.replace(
  `if (!routeSet.has(href)) addFinding("error", "TARGET_ROUTE_MISSING"`,
  `if (!routeSet.has(href)) addFinding("error", "TARGET_ROUTE_MISSING"`
);

source = source.replace(
  `version: "3.0.0",`,
  `version: "3.0.1",`
);

source = source.replace(
  `documents: docs.length,`,
  `documents: docs.length,
    contentRoutes: contentRouteSet.size,
    buildRoutes: buildRouteSet.size,
    validRoutes: routeSet.size,`
);

const expectedCheck =
  `if (!routeSet.has(target) && target.startsWith("/")) addFinding("error", "LINK_TARGET_ROUTE_MISSING"`;

if (!source.includes(expectedCheck)) {
  fail("Die Zielroutenprüfung konnte nicht eindeutig bestätigt werden.");
}

backup(AUDIT);
fs.writeFileSync(AUDIT, source, "utf8");
log(`Geändert: ${rel(AUDIT)}`);

run(process.execPath, ["--check", AUDIT]);

const audit = run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:internal-links:strict"],
  { allowFailure: true }
);

if (audit.status !== 0) {
  printReport();
  fail(
    "Der modernisierte Source-Link-Audit enthält weiterhin echte Fehler. " +
    `Report: ${rel(REPORT)}`
  );
}

run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:internal-link-targets:strict"]
);

run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "seo:release:check"],
  { env: { PFOTENTECHNIK_FAST_BUILD: "0" } }
);

log("");
log("ABGESCHLOSSEN.");
log("Source-Link-Audit auf Version 3.0.1 aktualisiert.");
log("Gültige Linkziele umfassen jetzt Content-Routen und reale HTML-Build-Routen.");
log("Statische Astro-Seiten werden nicht mehr fälschlich als fehlend gemeldet.");
log("Selbstlinks, fehlende Build-Ziele, Anchor-Konflikte und Clusterfehler bleiben strikt.");
log(`Backups: ${rel(BACKUP_ROOT)}`);
log(`Report: ${rel(REPORT)}`);
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");
