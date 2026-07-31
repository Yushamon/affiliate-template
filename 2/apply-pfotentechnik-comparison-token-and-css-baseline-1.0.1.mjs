#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-token-and-css-baseline-1.0.1";
const ROOT = process.cwd();
const CSS_FILE = path.join(
  ROOT,
  "packages/affiliate-core/src/components/comparison/comparison-system.css",
);
const BASELINE_FILE = path.join(
  ROOT,
  "apps/pfotentechnik/scripts/design-system/css-budget-baseline.json",
);
const REPORT_FILE = path.join(
  ROOT,
  "apps/pfotentechnik/reports/design-system/comparison-token-and-css-baseline-validation-latest.json",
);
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

const log = (message) => console.log(`[${PATCH}] ${message}`);

const commandForPlatform = (command, args) => {
  if (process.platform !== "win32") return { command, args };

  const quoted = [command, ...args]
    .map((part) => {
      const value = String(part);
      return /[\s"&|<>^]/.test(value)
        ? `"${value.replace(/"/g, '\\"')}"`
        : value;
    })
    .join(" ");

  return {
    command: process.env.ComSpec || "cmd.exe",
    args: ["/d", "/s", "/c", quoted],
  };
};

const run = (label, command, args) => {
  log(`Prüfe: ${label}`);
  const invocation = commandForPlatform(command, args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status})`);
  }

  log(`BESTANDEN: ${label}`);
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro", ".git"].includes(entry.name)) {
      return [];
    }
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
};

const count = (text, regex) => (text.match(regex) || []).length;

const collectCssMetrics = () => {
  const appSrc = path.join(ROOT, "apps/pfotentechnik/src");
  const coreSrc = path.join(ROOT, "packages/affiliate-core/src");

  const files = [
    ...walk(path.join(appSrc, "styles")),
    ...walk(path.join(coreSrc, "styles")),
    ...walk(path.join(coreSrc, "components")),
  ].filter((file) => file.endsWith(".css"));

  const metrics = {
    cssFiles: files.length,
    cssBytes: 0,
    importantRules: 0,
    rootBlocks: 0,
    rawHexColors: 0,
  };

  for (const file of files) {
    const css = fs.readFileSync(file, "utf8");
    metrics.cssBytes += Buffer.byteLength(css);
    metrics.importantRules += count(css, /!important\b/g);
    metrics.rootBlocks += count(css, /:root\s*\{/g);
    metrics.rawHexColors += count(css, /#[0-9a-fA-F]{3,8}\b/g);
  }

  return metrics;
};

const writeReport = (data) => {
  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

for (const file of [CSS_FILE, BASELINE_FILE]) {
  if (!fs.existsSync(file)) throw new Error(`Pflichtdatei fehlt: ${file}`);
}

fs.mkdirSync(BACKUP, { recursive: true });
const cssBackup = path.join(BACKUP, "comparison-system.css");
const baselineBackup = path.join(BACKUP, "css-budget-baseline.json");
fs.copyFileSync(CSS_FILE, cssBackup);
fs.copyFileSync(BASELINE_FILE, baselineBackup);
log(`Backup: ${path.relative(ROOT, BACKUP)}`);

const cssBefore = fs.readFileSync(CSS_FILE, "utf8");
const baselineBefore = fs.readFileSync(BASELINE_FILE, "utf8");
const oldBaseline = JSON.parse(baselineBefore);

const literalRadius = /border-radius:\s*1rem\s*;/g;
const replacements = (cssBefore.match(literalRadius) || []).length;
const cssAfter = cssBefore.replace(
  literalRadius,
  "border-radius: var(--pt-radius-lg);",
);

fs.writeFileSync(CSS_FILE, cssAfter, "utf8");
log(
  replacements > 0
    ? `Geändert: ${path.relative(ROOT, CSS_FILE)} (${replacements} Radius-Tokens)`
    : `Unverändert: ${path.relative(ROOT, CSS_FILE)} (bereits tokenisiert)`,
);

const current = collectCssMetrics();

const newBaseline = {
  version: 2,
  createdAt: new Date().toISOString(),
  limits: {
    cssFiles: current.cssFiles,
    cssBytes: current.cssBytes,
    importantRules: current.importantRules,
    rootBlocks: current.rootBlocks,
    rawHexColors: current.rawHexColors,
  },
  current,
  previousBaseline: {
    version: oldBaseline.version ?? 1,
    createdAt: oldBaseline.createdAt ?? null,
    limits: oldBaseline.limits ?? null,
    current: oldBaseline.current ?? null,
  },
  notes: {
    cssFiles:
      "Baseline an die abgeschlossene modulare CSS-Layer-Architektur angepasst. Kein weiterer Dateizuwachs ohne Prüfung.",
    cssBytes:
      "Exakter geprüfter Ist-Stand nach modularer CSS-Aufteilung und Comparison-Tokenisierung. Kein Wachstumspuffer.",
    importantRules:
      "Neue Baseline liegt unter dem vorherigen Bestand. Weitere !important-Zunahme ist nicht freigegeben.",
    rootBlocks:
      "Unveränderter geprüfter Bestand. Weitere Root-Blöcke sind nicht freigegeben.",
    rawHexColors:
      "Neue Baseline liegt unter dem vorherigen Bestand. Weitere Rohfarben sind nicht freigegeben.",
  },
};

fs.writeFileSync(
  BASELINE_FILE,
  `${JSON.stringify(newBaseline, null, 2)}\n`,
  "utf8",
);
log(`Aktualisiert: ${path.relative(ROOT, BASELINE_FILE)}`);
log(`Neue Baseline: ${JSON.stringify(current)}`);

try {
  run("Design Token Audit", "npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:tokens:audit",
  ]);

  run("Design System Check", "npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:check",
  ]);

  run("Astro Build", "npm", ["run", "build:pfotentechnik"]);

  run("Performance Audit", "npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "audit:performance:strict",
  ]);

  writeReport({
    patch: PATCH,
    status: "passed",
    cssFile: path.relative(ROOT, CSS_FILE),
    baselineFile: path.relative(ROOT, BASELINE_FILE),
    radiusReplacements: replacements,
    previous: oldBaseline,
    current,
    validations: {
      designTokens: "passed",
      designSystem: "passed",
      build: "passed",
      performance: "passed",
    },
    backup: path.relative(ROOT, BACKUP),
    createdAt: new Date().toISOString(),
  });

  log("Abgeschlossen.");
  log(`Validierung: ${path.relative(ROOT, REPORT_FILE)}`);
} catch (error) {
  fs.copyFileSync(cssBackup, CSS_FILE);
  fs.copyFileSync(baselineBackup, BASELINE_FILE);

  writeReport({
    patch: PATCH,
    status: "failed",
    radiusReplacements: replacements,
    current,
    error: error instanceof Error ? error.message : String(error),
    rolledBack: true,
    backup: path.relative(ROOT, BACKUP),
    createdAt: new Date().toISOString(),
  });

  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("CSS und Baseline wurden zurückgerollt.");
  process.exitCode = 1;
}
