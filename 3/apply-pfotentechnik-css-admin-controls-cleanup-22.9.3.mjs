#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-admin-controls-cleanup-22.9.3";
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
const FOUNDATION = path.join(STYLES, "seo-admin-foundation.css");
const PANELS = path.join(STYLES, "seo-admin-panels.css");
const CONTROLS = path.join(STYLES, "seo-admin-controls.css");
const TEST = path.join(APP, "test", "css-admin-controls.test.mjs");
const FOUNDATION_TEST = path.join(APP, "test", "css-admin-foundation.test.mjs");
const PANELS_TEST = path.join(APP, "test", "css-admin-panels.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-admin-controls-22.9.3.json");
const REPORT_MD = path.join(REPORT_DIR, "css-admin-controls-22.9.3.md");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const FOUNDATION_IMPORT = '@import "./seo-admin-foundation.css";';
const PANELS_IMPORT = '@import "./seo-admin-panels.css";';
const CONTROLS_IMPORT = '@import "./seo-admin-controls.css";';
const START_MARKER = `.seo-badges,
.seo-actions,
.seo-source-state,
.seo-tabs {`;
const END_MARKER = `  color: var(--seo-text);
}`;
const END_CONTEXT = `.seo-filter-grid select,
.seo-toolbar select,
.seo-toolbar input,
.seo-toolbar textarea {`;

const HEADER =
`/* SEO Admin controls: badges, actions, tabs, filters and form controls.
 * Aus seo-admin.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.
 */

`;

const log = (message) => console.log("[" + NAME + "] " + message);

for (const file of [SOURCE, FOUNDATION, PANELS, FOUNDATION_TEST, PANELS_TEST, PACKAGE]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

const sourceBefore = fs.readFileSync(SOURCE, "utf8");

if (!sourceBefore.startsWith(FOUNDATION_IMPORT) || !sourceBefore.includes(PANELS_IMPORT)) {
  throw new Error("22.9.2 Admin Panels wurde noch nicht erfolgreich angewendet.");
}

const alreadyInstalled = sourceBefore.includes(CONTROLS_IMPORT) && fs.existsSync(CONTROLS);

let sourceAfter = sourceBefore;
let controlsContent = fs.existsSync(CONTROLS) ? fs.readFileSync(CONTROLS, "utf8") : "";

if (!alreadyInstalled) {
  const startIndex = sourceBefore.indexOf(START_MARKER);
  const contextIndex = sourceBefore.indexOf(END_CONTEXT);

  if (startIndex < 0 || contextIndex < 0 || contextIndex < startIndex) {
    throw new Error("Sichere Grenzen des Admin-Control-Systems nicht gefunden.");
  }

  const endIndex = sourceBefore.indexOf(END_MARKER, contextIndex);
  if (endIndex < 0) {
    throw new Error("Ende des Admin-Control-Systems nicht gefunden.");
  }

  const blockEnd = endIndex + END_MARKER.length;
  const prefix = sourceBefore.slice(0, startIndex).trimEnd();
  const block = sourceBefore.slice(startIndex, blockEnd).trim();
  const remainder = sourceBefore.slice(blockEnd).trimStart();

  for (const required of [
    ".seo-badges",
    ".seo-actions",
    ".seo-source-state",
    ".seo-tabs",
    ".seo-badge",
    ".seo-filter-grid",
    ".seo-toolbar",
    ".seo-toolbar input",
    ".seo-toolbar textarea"
  ]) {
    if (!block.includes(required)) {
      throw new Error("Admin-Control-System unvollständig; fehlt: " + required);
    }
  }

  for (const forbidden of [
    ".seo-table",
    ".seo-list-item",
    ".seo-finding",
    ".seo-workspace-summary",
    "@media"
  ]) {
    if (block.includes(forbidden)) {
      throw new Error("Unerwartete Regel innerhalb der Control-Grenze: " + forbidden);
    }
  }

  controlsContent = HEADER + block + "\n";
  sourceAfter = prefix + "\n" + CONTROLS_IMPORT + "\n\n" + remainder;
}

if (!controlsContent.startsWith(HEADER)) {
  throw new Error("Admin-Control-Layer besitzt nicht den erwarteten Migrationsheader.");
}

const migratedPayload = controlsContent.slice(HEADER.length).trim();
const migratedBlockHash = crypto.createHash("sha256").update(migratedPayload).digest("hex");

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ||= {};
packageJson.scripts["test:css-admin-controls"] = "node --test test/css-admin-controls.test.mjs";
const packageAfter = JSON.stringify(packageJson, null, 2) + "\n";

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const sourceFile = path.join(styles, "seo-admin.css");
const controlsFile = path.join(styles, "seo-admin-controls.css");
const expectedHash = "${migratedBlockHash}";
const imports = [
  '@import "./seo-admin-foundation.css";',
  '@import "./seo-admin-panels.css";',
  '@import "./seo-admin-controls.css";'
];
const header = ${JSON.stringify(HEADER)};

test("Admin-Imports sind in stabiler Reihenfolge", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  let previous = -1;
  for (const item of imports) {
    const index = source.indexOf(item);
    assert.ok(index > previous, "Import fehlt oder Reihenfolge falsch: " + item);
    previous = index;
  }
});

test("Exakt migrierter Control-Block ist unverändert", () => {
  const controls = fs.readFileSync(controlsFile, "utf8");
  assert.ok(controls.startsWith(header));
  const payload = controls.slice(header.length).trim();
  const actual = crypto.createHash("sha256").update(payload).digest("hex");
  assert.equal(actual, expectedHash);
});

test("Control-Layer enthält Badges, Actions, Tabs und Formulare", () => {
  const controls = fs.readFileSync(controlsFile, "utf8");
  for (const required of [
    ".seo-badges",
    ".seo-actions",
    ".seo-source-state",
    ".seo-tabs",
    ".seo-badge",
    ".seo-filter-grid",
    ".seo-toolbar",
    ".seo-toolbar input",
    ".seo-toolbar textarea"
  ]) {
    assert.ok(controls.includes(required), "Fehlt: " + required);
  }
});

test("Content-Systeme bleiben in seo-admin.css", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  for (const required of [
    ".seo-table",
    ".seo-list-item",
    ".seo-empty",
    ".seo-status",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(source.includes(required), "Fehlt im Hauptlayer: " + required);
  }
});

test("Content-Systeme wurden nicht in Controls verschoben", () => {
  const controls = fs.readFileSync(controlsFile, "utf8");
  for (const forbidden of [
    ".seo-table",
    ".seo-list-item",
    ".seo-empty",
    ".seo-status",
    ".seo-finding",
    ".seo-workspace-summary",
    "@media"
  ]) {
    assert.ok(!controls.includes(forbidden), "Unerwartet in Controls: " + forbidden);
  }
});

test("seo-admin.css beginnt nach Imports mit Tabellen-System", () => {
  let source = fs.readFileSync(sourceFile, "utf8");
  for (const item of imports) {
    source = source.replace(item, "");
  }
  assert.ok(source.trimStart().startsWith(".seo-table-wrap"));
});

test("Responsive Regeln bleiben im Hauptlayer", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.includes("@media (max-width: 900px)"));
  assert.ok(source.includes("@media (max-width: 680px)"));
  assert.ok(source.includes("@media (prefers-color-scheme: dark)"));
});

test("Migration fügt kein important hinzu", () => {
  const controls = fs.readFileSync(controlsFile, "utf8");
  assert.ok(!controls.includes("!important"));
});
`;

function modernizeFoundationTest(content) {
  let updated = content;

  updated = updated.replace(
    /test\("Weitere Feature-Systeme bleiben im Hauptlayer",[\s\S]*?\n\}\);\n/,
`test("Weitere Feature-Systeme bleiben außerhalb der Foundation", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const controlsFile = path.join(styles, "seo-admin-controls.css");
  const controls = fs.existsSync(controlsFile) ? fs.readFileSync(controlsFile, "utf8") : "";
  const combined = source + "\\n" + controls;
  for (const required of [
    ".seo-badge",
    ".seo-filter-grid",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(combined.includes(required), "Fehlt außerhalb Foundation: " + required);
  }
});
`);

  return updated;
}

function modernizePanelsTest(content) {
  let updated = content;

  updated = updated.replace(
    /test\("Nachfolgende Feature-Systeme bleiben in seo-admin\.css",[\s\S]*?\n\}\);\n/,
`test("Nachfolgende Feature-Systeme bleiben außerhalb des Panel-Layers", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const controlsFile = path.join(styles, "seo-admin-controls.css");
  const controls = fs.existsSync(controlsFile) ? fs.readFileSync(controlsFile, "utf8") : "";
  const combined = source + "\\n" + controls;
  for (const required of [
    ".seo-badge",
    ".seo-filter-grid",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(combined.includes(required), "Fehlt außerhalb Panels: " + required);
  }
});
`);

  updated = updated.replace(
    /test\("seo-admin\.css beginnt nach Imports mit Badge-System",[\s\S]*?\n\}\);\n/,
`test("Control-Layer folgt auf Foundation und Panels", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const controlsImport = '@import "./seo-admin-controls.css";';
  assert.ok(source.includes(controlsImport));
  assert.ok(source.indexOf(controlsImport) > source.indexOf(panelsImport));
});
`);

  return updated;
}

const foundationTestBefore = fs.readFileSync(FOUNDATION_TEST, "utf8");
const panelsTestBefore = fs.readFileSync(PANELS_TEST, "utf8");
const foundationTestAfter = modernizeFoundationTest(foundationTestBefore);
const panelsTestAfter = modernizePanelsTest(panelsTestBefore);

if (foundationTestAfter === foundationTestBefore) {
  throw new Error("Foundation-Regressionstest konnte nicht auf 22.9.3 aktualisiert werden.");
}
if (panelsTestAfter === panelsTestBefore) {
  throw new Error("Panel-Regressionstest konnte nicht auf 22.9.3 aktualisiert werden.");
}

const report = {
  patch: NAME,
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  controlsBytes: Buffer.byteLength(controlsContent),
  migratedBlockHash,
  migratedSystems: [
    "badge groups",
    "actions",
    "source state",
    "tabs",
    "severity badges",
    "filter grid",
    "toolbar",
    "labels",
    "select, input and textarea controls"
  ],
  retainedSystems: [
    "tables",
    "lists",
    "empty states",
    "status",
    "anchor cards",
    "findings",
    "workspace summary",
    "responsive rules",
    "system dark-mode fallback"
  ],
  updatedRegressionTests: [
    "css-admin-foundation.test.mjs",
    "css-admin-panels.test.mjs"
  ],
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Admin Controls 22.9.3

- seo-admin.css vorher: ${report.sourceBytesBefore} Bytes
- seo-admin.css nachher: ${report.sourceBytesAfter} Bytes
- neuer Control-Layer: ${report.controlsBytes} Bytes
- SHA-256 des migrierten Blocks: ${report.migratedBlockHash}

## Migriert

${report.migratedSystems.map((item) => `- ${item}`).join("\n")}

## Im Hauptlayer belassen

${report.retainedSystems.map((item) => `- ${item}`).join("\n")}

## Regressionen

Die Tests aus 22.9.0 und 22.9.2 werden bewusst auf die neue Layer-Struktur
aktualisiert. Sie prüfen weiterhin die Ownership, erwarten migrierte Controls
aber nicht mehr fälschlich in \`seo-admin.css\`.
`;

const desired = new Map([
  [SOURCE, sourceAfter],
  [CONTROLS, controlsContent],
  [TEST, testContent],
  [FOUNDATION_TEST, foundationTestAfter],
  [PANELS_TEST, panelsTestAfter],
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
  log("Admin-Controls: " + report.controlsBytes + " Bytes");

  for (const script of [
    "test:css-admin-controls",
    "test:css-admin-panels",
    "test:css-admin-foundation"
  ]) {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", script], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env
    });
  }

  const regressionTests = [
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
    if (fs.existsSync(path.join(APP, "test", filename)) && packageJson.scripts?.[script]) {
      execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", script], {
        cwd: ROOT,
        stdio: "inherit",
        env: process.env
      });
    }
  }

  if (
    fs.existsSync(path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs")) &&
    packageJson.scripts?.["css:architecture:audit"]
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
