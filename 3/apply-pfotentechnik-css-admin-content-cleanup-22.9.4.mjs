#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-admin-content-cleanup-22.9.4";
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
const CONTENT = path.join(STYLES, "seo-admin-content.css");
const TEST = path.join(APP, "test", "css-admin-content.test.mjs");
const FOUNDATION_TEST = path.join(APP, "test", "css-admin-foundation.test.mjs");
const PANELS_TEST = path.join(APP, "test", "css-admin-panels.test.mjs");
const CONTROLS_TEST = path.join(APP, "test", "css-admin-controls.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-admin-content-22.9.4.json");
const REPORT_MD = path.join(REPORT_DIR, "css-admin-content-22.9.4.md");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const IMPORTS = [
  '@import "./seo-admin-foundation.css";',
  '@import "./seo-admin-panels.css";',
  '@import "./seo-admin-controls.css";'
];
const CONTENT_IMPORT = '@import "./seo-admin-content.css";';

const START_MARKER = `.seo-table-wrap { overflow-x: auto; }`;
const END_MARKER = `.seo-anchor-card span { color: var(--seo-accent-strong); font-weight: 850; }`;

const HEADER =
`/* SEO Admin content: tables, lists, empty states, status and anchor cards.
 * Aus seo-admin.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.
 */

`;

const log = (message) => console.log("[" + NAME + "] " + message);

for (const file of [
  SOURCE,
  FOUNDATION,
  PANELS,
  CONTROLS,
  FOUNDATION_TEST,
  PANELS_TEST,
  CONTROLS_TEST,
  PACKAGE
]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

const sourceBefore = fs.readFileSync(SOURCE, "utf8");
for (const item of IMPORTS) {
  if (!sourceBefore.includes(item)) {
    throw new Error("22.9.3 wurde noch nicht erfolgreich angewendet: " + item);
  }
}

const alreadyInstalled = sourceBefore.includes(CONTENT_IMPORT) && fs.existsSync(CONTENT);

let sourceAfter = sourceBefore;
let contentLayer = fs.existsSync(CONTENT) ? fs.readFileSync(CONTENT, "utf8") : "";

if (!alreadyInstalled) {
  const startIndex = sourceBefore.indexOf(START_MARKER);
  const endIndex = sourceBefore.indexOf(END_MARKER);

  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
    throw new Error("Sichere Grenzen des Admin-Content-Systems nicht gefunden.");
  }

  const blockEnd = endIndex + END_MARKER.length;
  const prefix = sourceBefore.slice(0, startIndex).trimEnd();
  const block = sourceBefore.slice(startIndex, blockEnd).trim();
  const remainder = sourceBefore.slice(blockEnd).trimStart();

  for (const required of [
    ".seo-table-wrap",
    ".seo-table",
    ".seo-list",
    ".seo-list-item",
    ".seo-empty",
    ".seo-status",
    ".seo-anchor-card"
  ]) {
    if (!block.includes(required)) {
      throw new Error("Admin-Content-System unvollständig; fehlt: " + required);
    }
  }

  for (const forbidden of [
    ".seo-finding",
    ".seo-workspace-summary",
    "@media",
    ".seo-badge",
    ".seo-filter-grid"
  ]) {
    if (block.includes(forbidden)) {
      throw new Error("Unerwartete Regel innerhalb der Content-Grenze: " + forbidden);
    }
  }

  contentLayer = HEADER + block + "\n";
  sourceAfter = prefix + "\n" + CONTENT_IMPORT + "\n\n" + remainder;
}

if (!contentLayer.startsWith(HEADER)) {
  throw new Error("Admin-Content-Layer besitzt nicht den erwarteten Migrationsheader.");
}

const payload = contentLayer.slice(HEADER.length).trim();
const migratedBlockHash = crypto.createHash("sha256").update(payload).digest("hex");

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ||= {};
packageJson.scripts["test:css-admin-content"] = "node --test test/css-admin-content.test.mjs";
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
const contentFile = path.join(styles, "seo-admin-content.css");
const expectedHash = "${migratedBlockHash}";
const imports = [
  '@import "./seo-admin-foundation.css";',
  '@import "./seo-admin-panels.css";',
  '@import "./seo-admin-controls.css";',
  '@import "./seo-admin-content.css";'
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

test("Exakt migrierter Content-Block ist unverändert", () => {
  const content = fs.readFileSync(contentFile, "utf8");
  assert.ok(content.startsWith(header));
  const payload = content.slice(header.length).trim();
  const actual = crypto.createHash("sha256").update(payload).digest("hex");
  assert.equal(actual, expectedHash);
});

test("Content-Layer enthält Tabellen, Listen und Status", () => {
  const content = fs.readFileSync(contentFile, "utf8");
  for (const required of [
    ".seo-table-wrap",
    ".seo-table",
    ".seo-list",
    ".seo-list-item",
    ".seo-empty",
    ".seo-status",
    ".seo-anchor-card"
  ]) {
    assert.ok(content.includes(required), "Fehlt: " + required);
  }
});

test("Finding- und Workspace-Systeme bleiben in seo-admin.css", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  for (const required of [
    ".seo-finding-list",
    ".seo-finding",
    ".seo-workspace-summary",
    ".seo-workspace-facts"
  ]) {
    assert.ok(source.includes(required), "Fehlt im Hauptlayer: " + required);
  }
});

test("Finding- und Workspace-Systeme wurden nicht in Content verschoben", () => {
  const content = fs.readFileSync(contentFile, "utf8");
  for (const forbidden of [
    ".seo-finding",
    ".seo-workspace-summary",
    ".seo-workspace-facts",
    "@media"
  ]) {
    assert.ok(!content.includes(forbidden), "Unerwartet in Content: " + forbidden);
  }
});

test("seo-admin.css beginnt nach Imports mit Finding-System", () => {
  let source = fs.readFileSync(sourceFile, "utf8");
  for (const item of imports) source = source.replace(item, "");
  assert.ok(source.trimStart().startsWith(".seo-finding-list"));
});

test("Responsive Regeln bleiben im Hauptlayer", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.includes("@media (max-width: 900px)"));
  assert.ok(source.includes("@media (max-width: 680px)"));
  assert.ok(source.includes("@media (prefers-color-scheme: dark)"));
});

test("Migration fügt kein important hinzu", () => {
  const content = fs.readFileSync(contentFile, "utf8");
  assert.ok(!content.includes("!important"));
});
`;

function updateOwnershipTest(fileContent, layerName) {
  let content = fileContent;

  content = content.replace(
    /const combined = source \+ "\\n" \+ controls;/g,
    `const contentFile = path.join(styles, "seo-admin-content.css");
  const contentLayer = fs.existsSync(contentFile) ? fs.readFileSync(contentFile, "utf8") : "";
  const combined = source + "\\n" + controls + "\\n" + contentLayer;`
  );

  content = content.replace(
    /test\("Content-Systeme bleiben in seo-admin\.css",[\s\S]*?\n\}\);\n/,
`test("Content-Systeme bleiben außerhalb des Control-Layers", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const contentFile = path.join(styles, "seo-admin-content.css");
  const contentLayer = fs.existsSync(contentFile) ? fs.readFileSync(contentFile, "utf8") : "";
  const combined = source + "\\n" + contentLayer;
  for (const required of [
    ".seo-table",
    ".seo-list-item",
    ".seo-empty",
    ".seo-status",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(combined.includes(required), "Fehlt außerhalb Controls: " + required);
  }
});
`);

  content = content.replace(
    /test\("seo-admin\.css beginnt nach Imports mit Tabellen-System",[\s\S]*?\n\}\);\n/,
`test("Content-Layer folgt auf Foundation, Panels und Controls", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const contentImport = '@import "./seo-admin-content.css";';
  assert.ok(source.includes(contentImport));
  assert.ok(source.indexOf(contentImport) > source.indexOf('@import "./seo-admin-controls.css";'));
});
`);

  return content;
}

const foundationBefore = fs.readFileSync(FOUNDATION_TEST, "utf8");
const panelsBefore = fs.readFileSync(PANELS_TEST, "utf8");
const controlsBefore = fs.readFileSync(CONTROLS_TEST, "utf8");

const foundationAfter = updateOwnershipTest(foundationBefore, "foundation");
const panelsAfter = updateOwnershipTest(panelsBefore, "panels");
const controlsAfter = updateOwnershipTest(controlsBefore, "controls");

if (foundationAfter === foundationBefore) {
  throw new Error("Foundation-Test konnte nicht auf 22.9.4 aktualisiert werden.");
}
if (panelsAfter === panelsBefore) {
  throw new Error("Panel-Test konnte nicht auf 22.9.4 aktualisiert werden.");
}
if (controlsAfter === controlsBefore) {
  throw new Error("Control-Test konnte nicht auf 22.9.4 aktualisiert werden.");
}

const report = {
  patch: NAME,
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  contentBytes: Buffer.byteLength(contentLayer),
  migratedBlockHash,
  migratedSystems: [
    "table wrapper and tables",
    "lists and list items",
    "empty states",
    "status messages",
    "anchor cards"
  ],
  retainedSystems: [
    "findings",
    "workspace summary",
    "workspace facts",
    "responsive rules",
    "system dark-mode fallback"
  ],
  updatedRegressionTests: [
    "css-admin-foundation.test.mjs",
    "css-admin-panels.test.mjs",
    "css-admin-controls.test.mjs"
  ],
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Admin Content 22.9.4

- seo-admin.css vorher: ${report.sourceBytesBefore} Bytes
- seo-admin.css nachher: ${report.sourceBytesAfter} Bytes
- neuer Content-Layer: ${report.contentBytes} Bytes
- SHA-256 des migrierten Blocks: ${report.migratedBlockHash}

## Migriert

${report.migratedSystems.map((item) => `- ${item}`).join("\n")}

## Im Hauptlayer belassen

${report.retainedSystems.map((item) => `- ${item}`).join("\n")}

## Regressionen

Ältere Admin-Layer-Tests werden auf die neue Ownership aktualisiert. Sie prüfen
weiterhin, dass Content-Systeme außerhalb ihrer jeweiligen Layer vorhanden sind,
erwarten sie aber nicht mehr zwingend in \`seo-admin.css\`.
`;

const desired = new Map([
  [SOURCE, sourceAfter],
  [CONTENT, contentLayer],
  [TEST, testContent],
  [FOUNDATION_TEST, foundationAfter],
  [PANELS_TEST, panelsAfter],
  [CONTROLS_TEST, controlsAfter],
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
  log("Admin-Content: " + report.contentBytes + " Bytes");

  for (const script of [
    "test:css-admin-content",
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

  const regressions = [
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

  for (const [script, filename] of regressions) {
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
