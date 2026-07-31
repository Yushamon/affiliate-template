#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-admin-panels-cleanup-22.9.1";
const CHECK = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const STYLES = path.join(APP, "src", "styles");
const SOURCE = path.join(STYLES, "seo-admin.css");
const PANELS = path.join(STYLES, "seo-admin-panels.css");
const TEST = path.join(APP, "test", "css-admin-panels.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-admin-panels-22.9.1.json");
const REPORT_MD = path.join(REPORT_DIR, "css-admin-panels-22.9.1.md");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const FOUNDATION_IMPORT = '@import "./seo-admin-foundation.css";';
const PANELS_IMPORT = '@import "./seo-admin-panels.css";';
const START_MARKER = `.seo-panel,
.seo-card {`;
const END_MARKER = `.seo-metric span { font-size: .76rem; }`;

const HEADER =
`/* SEO Admin panels: surfaces, stacks, grids and metrics.
 * Aus seo-admin.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.
 */

`;

const log = (message) => console.log("[" + NAME + "] " + message);

for (const file of [SOURCE, PACKAGE]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

const sourceBefore = fs.readFileSync(SOURCE, "utf8");
if (!sourceBefore.startsWith(FOUNDATION_IMPORT)) {
  throw new Error("22.9.0 Admin Foundation wurde noch nicht angewendet.");
}

const alreadyInstalled =
  sourceBefore.includes(PANELS_IMPORT) &&
  fs.existsSync(PANELS);

let sourceAfter = sourceBefore;
let panelsContent = fs.existsSync(PANELS)
  ? fs.readFileSync(PANELS, "utf8")
  : "";

if (!alreadyInstalled) {
  const startIndex = sourceBefore.indexOf(START_MARKER);
  const endIndex = sourceBefore.indexOf(END_MARKER);

  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
    throw new Error("Sichere Grenzen des Admin-Panel-Systems nicht gefunden.");
  }

  const blockEnd = endIndex + END_MARKER.length;
  const prefix = sourceBefore.slice(0, startIndex);
  const block = sourceBefore.slice(startIndex, blockEnd).trim();
  const remainder = sourceBefore.slice(blockEnd).trimStart();

  for (const required of [
    ".seo-panel",
    ".seo-card",
    ".seo-stack",
    ".seo-stack-lg",
    ".seo-grid",
    ".seo-metrics",
    ".seo-metric"
  ]) {
    if (!block.includes(required)) {
      throw new Error("Admin-Panel-System unvollständig; fehlt: " + required);
    }
  }

  for (const forbidden of [
    ".seo-badge",
    ".seo-filter-grid",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    if (block.includes(forbidden)) {
      throw new Error("Feature-Regel liegt unerwartet innerhalb der Panel-Grenze: " + forbidden);
    }
  }

  panelsContent = HEADER + block + "\n";

  const importPrefix = prefix.trimEnd();
  if (!importPrefix.startsWith(FOUNDATION_IMPORT)) {
    throw new Error("Import-Reihenfolge vor Panel-Migration ist unerwartet.");
  }

  sourceAfter =
    importPrefix +
    "\n" +
    PANELS_IMPORT +
    "\n\n" +
    remainder;
}

if (!panelsContent.startsWith(HEADER)) {
  throw new Error("Admin-Panels-Layer besitzt nicht den erwarteten Migrationsheader.");
}

const migratedPayload = panelsContent.slice(HEADER.length).trim();
const migratedBlockHash = crypto
  .createHash("sha256")
  .update(migratedPayload)
  .digest("hex");

const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
pkg.scripts ||= {};
pkg.scripts["test:css-admin-panels"] = "node --test test/css-admin-panels.test.mjs";
const packageAfter = JSON.stringify(pkg, null, 2) + "\n";

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const sourceFile = path.join(styles, "seo-admin.css");
const panelsFile = path.join(styles, "seo-admin-panels.css");
const expectedHash = "${migratedBlockHash}";
const foundationImport = '@import "./seo-admin-foundation.css";';
const panelsImport = '@import "./seo-admin-panels.css";';
const header = ${JSON.stringify(HEADER)};

test("Admin-Imports sind in stabiler Reihenfolge", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const foundationIndex = source.indexOf(foundationImport);
  const panelsIndex = source.indexOf(panelsImport);
  assert.equal(foundationIndex, 0);
  assert.ok(panelsIndex > foundationIndex);
  assert.ok(fs.existsSync(panelsFile));
});

test("Exakt migrierter Panel-Block ist unverändert", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.ok(panels.startsWith(header));
  const payload = panels.slice(header.length).trim();
  const actualHash = crypto.createHash("sha256").update(payload).digest("hex");
  assert.equal(actualHash, expectedHash);
});

test("Panel-Layer enthält Oberflächen, Grids und Metriken", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  for (const required of [
    ".seo-panel",
    ".seo-card",
    ".seo-stack",
    ".seo-stack-lg",
    ".seo-grid",
    ".seo-metrics",
    ".seo-metric"
  ]) {
    assert.ok(panels.includes(required), "Fehlt: " + required);
  }
});

test("Nachfolgende Feature-Systeme bleiben in seo-admin.css", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  for (const required of [
    ".seo-badge",
    ".seo-filter-grid",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(source.includes(required), "Fehlt im Hauptlayer: " + required);
  }
});

test("Nachfolgende Features wurden nicht in Panels verschoben", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  for (const forbidden of [
    ".seo-badge",
    ".seo-filter-grid",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(!panels.includes(forbidden), "Unerwartet im Panel-Layer: " + forbidden);
  }
});

test("seo-admin.css beginnt nach Imports mit Badge-System", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const remainder = source
    .replace(/^@import "\\.\\/seo-admin-foundation\\.css";\\s*/, "")
    .replace(/^@import "\\.\\/seo-admin-panels\\.css";\\s*/, "")
    .trimStart();
  assert.ok(remainder.startsWith(".seo-badges,"));
});

test("Dark-Mode-System-Fallback bleibt im Hauptlayer", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.includes("@media (prefers-color-scheme: dark)"));
});

test("Migration fügt kein important hinzu", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.ok(!panels.includes("!important"));
});
`;

const report = {
  patch: NAME,
  alreadyInstalled,
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  panelsBytes: Buffer.byteLength(panelsContent),
  migratedBlockHash,
  migratedSystems: [
    "panel surface",
    "card surface",
    "stack utilities",
    "responsive grid primitives",
    "metric grid",
    "metric cards and severity borders"
  ],
  retainedSystems: [
    "badges",
    "actions and tabs",
    "filters and toolbar",
    "tables",
    "lists and empty states",
    "status",
    "anchor cards",
    "findings",
    "workspace summary",
    "responsive feature overrides",
    "system dark-mode fallback"
  ],
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Admin Panels 22.9.1

- seo-admin.css vorher: ${report.sourceBytesBefore} Bytes
- seo-admin.css nachher: ${report.sourceBytesAfter} Bytes
- neuer Panel-Layer: ${report.panelsBytes} Bytes
- SHA-256 des migrierten Blocks: ${report.migratedBlockHash}

## Migriert

${report.migratedSystems.map((item) => `- ${item}`).join("\n")}

## In seo-admin.css belassen

${report.retainedSystems.map((item) => `- ${item}`).join("\n")}

## Sicherheitsgrenzen

- setzt 22.9.0 voraus
- Extraktion ausschließlich zwischen eindeutigem Panel-Start und Metric-Ende
- keine Selektoren umbenannt
- keine Deklarationen geändert
- Hash-Prüfung des exakt migrierten Blocks
- stabile Import-Reihenfolge
- vollständiger Rollback bei Test-, Audit- oder Buildfehlern
`;

const desired = new Map([
  [SOURCE, sourceAfter],
  [PANELS, panelsContent],
  [TEST, testContent],
  [PACKAGE, packageAfter],
  [REPORT_JSON, JSON.stringify(report, null, 2) + "\n"],
  [REPORT_MD, reportMarkdown]
]);

const changes = [];
for (const [file, content] of desired) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current === content) {
    log("Unverändert: " + path.relative(ROOT, file));
  } else {
    changes.push({ file, current, content });
  }
}

if (CHECK) {
  log(changes.length ? changes.length + " Änderung(en) erforderlich." : "Bereits installiert.");
  process.exit(changes.length ? 1 : 0);
}

if (!changes.length) {
  log("Keine Änderungen erforderlich.");
  process.exit(0);
}

fs.mkdirSync(BACKUP, { recursive: true });

try {
  for (const change of changes) {
    const relative = path.relative(ROOT, change.file);

    if (change.current !== null) {
      const backupFile = path.join(BACKUP, relative);
      fs.mkdirSync(path.dirname(backupFile), { recursive: true });
      fs.writeFileSync(backupFile, change.current);
    }

    fs.mkdirSync(path.dirname(change.file), { recursive: true });
    fs.writeFileSync(change.file, change.content);
    log("Geschrieben: " + relative);
  }

  log("seo-admin.css: " + report.sourceBytesBefore + " -> " + report.sourceBytesAfter + " Bytes");
  log("Admin-Panels: " + report.panelsBytes + " Bytes");

  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:css-admin-panels"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env
  });

  const regressionTests = [
    ["test:css-admin-foundation", "css-admin-foundation.test.mjs"],
    ["test:css-product-system", "css-product-system.test.mjs"],
    ["test:css-comparison-system", "css-comparison-system.test.mjs"],
    ["test:css-panel-system", "css-panel-system.test.mjs"],
    ["test:css-card-system", "css-card-system.test.mjs"],
    ["test:css-button-system", "css-button-system.test.mjs"],
    ["test:css-layout-foundation", "css-layout-foundation.test.mjs"],
    ["test:css-base-layer", "css-base-layer.test.mjs"],
    ["test:css-foundation", "css-foundation-tokens.test.mjs"],
    ["test:css-architecture", "css-architecture.test.mjs"]
  ];

  for (const [script, filename] of regressionTests) {
    if (fs.existsSync(path.join(APP, "test", filename)) && pkg.scripts?.[script]) {
      execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", script], {
        cwd: ROOT,
        stdio: "inherit",
        env: process.env
      });
    }
  }

  if (
    fs.existsSync(path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs")) &&
    pkg.scripts?.["css:architecture:audit"]
  ) {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "css:architecture:audit"], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env
    });
  }

  if (!SKIP_BUILD) {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env
    });
  }

  log("BESTANDEN.");
  log("Report: " + path.relative(ROOT, REPORT_MD));
  log("Backup: " + path.relative(ROOT, BACKUP));
} catch (error) {
  log("FEHLER: " + error.message);
  log("Rollback wird ausgeführt.");

  for (const change of [...changes].reverse()) {
    if (change.current === null) {
      if (fs.existsSync(change.file)) fs.unlinkSync(change.file);
    } else {
      fs.mkdirSync(path.dirname(change.file), { recursive: true });
      fs.writeFileSync(change.file, change.current);
    }
  }

  process.exitCode = 1;
}
