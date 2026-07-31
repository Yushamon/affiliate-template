#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-admin-operations-cleanup-22.9.6";
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
const OPERATIONS = path.join(STYLES, "seo-admin-operations.css");
const TEST = path.join(APP, "test", "css-admin-operations.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-admin-operations-22.9.6.json");
const REPORT_MD = path.join(REPORT_DIR, "css-admin-operations-22.9.6.md");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const REQUIRED_IMPORTS = [
  '@import "./seo-admin-foundation.css";',
  '@import "./seo-admin-panels.css";',
  '@import "./seo-admin-controls.css";',
  '@import "./seo-admin-content.css";'
];
const OPERATIONS_IMPORT = '@import "./seo-admin-operations.css";';
const START_MARKER = `.seo-finding-list { display: grid; gap: 10px; }`;
const END_MARKER = `.seo-workspace-facts dd { margin: 4px 0 0; font-weight: 800; overflow-wrap: anywhere; }`;

const HEADER =
`/* SEO Admin operations: findings and workspace summaries.
 * Aus seo-admin.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.
 */

`;

const log = (message) => console.log("[" + NAME + "] " + message);

for (const file of [SOURCE, PACKAGE]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

for (const layer of [
  "seo-admin-foundation.css",
  "seo-admin-panels.css",
  "seo-admin-controls.css",
  "seo-admin-content.css"
]) {
  if (!fs.existsSync(path.join(STYLES, layer))) {
    throw new Error("Vorausgesetzter Admin-Layer fehlt: " + layer);
  }
}

const sourceBefore = fs.readFileSync(SOURCE, "utf8");
for (const item of REQUIRED_IMPORTS) {
  if (!sourceBefore.includes(item)) {
    throw new Error("22.9.4 wurde noch nicht erfolgreich angewendet: " + item);
  }
}

const alreadyInstalled =
  sourceBefore.includes(OPERATIONS_IMPORT) &&
  fs.existsSync(OPERATIONS);

let sourceAfter = sourceBefore;
let operationsContent = fs.existsSync(OPERATIONS)
  ? fs.readFileSync(OPERATIONS, "utf8")
  : "";

if (!alreadyInstalled) {
  const startIndex = sourceBefore.indexOf(START_MARKER);
  const endIndex = sourceBefore.indexOf(END_MARKER);

  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
    throw new Error("Sichere Grenzen des Admin-Operations-Systems nicht gefunden.");
  }

  const blockEnd = endIndex + END_MARKER.length;
  const prefix = sourceBefore.slice(0, startIndex).trimEnd();
  const block = sourceBefore.slice(startIndex, blockEnd).trim();
  const remainder = sourceBefore.slice(blockEnd).trimStart();

  for (const required of [
    ".seo-finding-list",
    ".seo-finding",
    '.seo-finding[data-blocker="true"]',
    '.seo-finding[data-status="regression"]',
    ".seo-finding pre",
    ".seo-workspace-summary",
    ".seo-workspace-facts",
    ".seo-workspace-facts dt",
    ".seo-workspace-facts dd"
  ]) {
    if (!block.includes(required)) {
      throw new Error("Admin-Operations-System unvollständig; fehlt: " + required);
    }
  }

  for (const forbidden of [
    "@media",
    ".seo-table",
    ".seo-badge",
    ".seo-filter-grid",
    ".seo-anchor-card"
  ]) {
    if (block.includes(forbidden)) {
      throw new Error("Unerwartete Regel innerhalb der Operations-Grenze: " + forbidden);
    }
  }

  operationsContent = HEADER + block + "\n";
  sourceAfter = prefix + "\n" + OPERATIONS_IMPORT + "\n\n" + remainder;
}

if (!operationsContent.startsWith(HEADER)) {
  throw new Error("Admin-Operations-Layer besitzt nicht den erwarteten Migrationsheader.");
}

const payload = operationsContent.slice(HEADER.length).trim();
const migratedBlockHash = crypto.createHash("sha256").update(payload).digest("hex");

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ||= {};
packageJson.scripts["test:css-admin-operations"] = "node --test test/css-admin-operations.test.mjs";
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
const operationsFile = path.join(styles, "seo-admin-operations.css");
const expectedHash = "${migratedBlockHash}";
const imports = [
  '@import "./seo-admin-foundation.css";',
  '@import "./seo-admin-panels.css";',
  '@import "./seo-admin-controls.css";',
  '@import "./seo-admin-content.css";',
  '@import "./seo-admin-operations.css";'
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

test("Exakt migrierter Operations-Block ist unverändert", () => {
  const operations = fs.readFileSync(operationsFile, "utf8");
  assert.ok(operations.startsWith(header));
  const payload = operations.slice(header.length).trim();
  const actual = crypto.createHash("sha256").update(payload).digest("hex");
  assert.equal(actual, expectedHash);
});

test("Operations-Layer enthält Findings und Workspace-Systeme", () => {
  const operations = fs.readFileSync(operationsFile, "utf8");
  for (const required of [
    ".seo-finding-list",
    ".seo-finding",
    '.seo-finding[data-blocker="true"]',
    '.seo-finding[data-status="regression"]',
    ".seo-finding pre",
    ".seo-workspace-summary",
    ".seo-workspace-facts",
    ".seo-workspace-facts dt",
    ".seo-workspace-facts dd"
  ]) {
    assert.ok(operations.includes(required), "Fehlt: " + required);
  }
});

test("Responsive Regeln bleiben in seo-admin.css", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  for (const required of [
    "@media (max-width: 900px)",
    "@media (max-width: 680px)",
    "@media (max-width: 430px)",
    "@media (prefers-color-scheme: dark)",
    ".seo-workspace-summary { grid-template-columns: 1fr; }"
  ]) {
    assert.ok(source.includes(required), "Fehlt im Hauptlayer: " + required);
  }
});

test("Statische Operations-Basisregeln wurden aus seo-admin.css entfernt", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  for (const forbidden of [
    ".seo-finding-list { display: grid; gap: 10px; }",
    ".seo-finding {\\n  padding: 16px;",
    ".seo-workspace-summary {\\n  display: grid;",
    ".seo-workspace-facts {\\n  display: grid;"
  ]) {
    assert.ok(!source.includes(forbidden), "Statische Basisregel noch im Hauptlayer: " + forbidden);
  }
});

test("seo-admin.css enthält nach Imports nur Responsive-Regeln", () => {
  let source = fs.readFileSync(sourceFile, "utf8");
  for (const item of imports) source = source.replace(item, "");
  const remainder = source.trimStart();
  assert.ok(remainder.startsWith("@media (max-width: 900px)"));
});

test("Operations-Layer enthält keine Media Queries", () => {
  const operations = fs.readFileSync(operationsFile, "utf8");
  assert.ok(!operations.includes("@media"));
});

test("Migration fügt kein important hinzu", () => {
  const operations = fs.readFileSync(operationsFile, "utf8");
  assert.ok(!operations.includes("!important"));
});
`;

const report = {
  patch: NAME,
  replaces: "22.9.5",
  fixedIssue:
    "Der Test unterschied die statische Workspace-Basisregel nicht von der absichtlich im Hauptlayer verbleibenden responsiven Workspace-Regel.",
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  operationsBytes: Buffer.byteLength(operationsContent),
  migratedBlockHash,
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Admin Operations 22.9.6

22.9.6 ersetzt 22.9.5.

## Behobener Fehler

Der 22.9.5-Test suchte pauschal nach \`.seo-workspace-summary {\` in
\`seo-admin.css\`. Dort muss jedoch weiterhin diese responsive Regel liegen:

\`\`\`css
.seo-workspace-summary { grid-template-columns: 1fr; }
\`\`\`

22.9.6 prüft deshalb gezielt, dass nur die statische Basisregel mit
\`display: grid\` ausgelagert wurde. Die responsive Override-Regel muss erhalten
bleiben.

## Metriken

- seo-admin.css vorher: ${report.sourceBytesBefore} Bytes
- seo-admin.css nachher: ${report.sourceBytesAfter} Bytes
- Operations-Layer: ${report.operationsBytes} Bytes
- SHA-256 des migrierten Blocks: ${report.migratedBlockHash}
`;

const desired = new Map([
  [SOURCE, sourceAfter],
  [OPERATIONS, operationsContent],
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
  log("Admin-Operations: " + report.operationsBytes + " Bytes");

  for (const script of [
    "test:css-admin-operations",
    "test:css-admin-content",
    "test:css-admin-controls",
    "test:css-admin-panels",
    "test:css-admin-foundation"
  ]) {
    if (packageJson.scripts?.[script]) {
      execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", script], {
        cwd: ROOT,
        stdio: "inherit",
        env: process.env
      });
    }
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
