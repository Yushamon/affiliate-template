#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-admin-foundation-cleanup-22.9.0";
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
const TEST = path.join(APP, "test", "css-admin-foundation.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-admin-foundation-22.9.0.json");
const REPORT_MD = path.join(REPORT_DIR, "css-admin-foundation-22.9.0.md");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const IMPORT = '@import "./seo-admin-foundation.css";';
const START_MARKER = ":root {";
const END_BLOCK = `.seo-section-header h2 {
  margin: 5px 0 6px;
  font-size: clamp(1.35rem, 3vw, 2rem);
}`;

const HEADER =
`/* SEO Admin foundation: tokens, reset, shell, navigation and page headers.
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
const alreadyInstalled =
  sourceBefore.startsWith(IMPORT) &&
  fs.existsSync(FOUNDATION);

let sourceAfter = sourceBefore;
let foundationContent = fs.existsSync(FOUNDATION)
  ? fs.readFileSync(FOUNDATION, "utf8")
  : "";

if (!alreadyInstalled) {
  if (!sourceBefore.startsWith(START_MARKER)) {
    throw new Error("seo-admin.css beginnt nicht mit dem erwarteten :root-Block.");
  }

  const endIndex = sourceBefore.indexOf(END_BLOCK);
  if (endIndex < 0) {
    throw new Error("Sichere Endgrenze des Admin-Foundation-Bereichs nicht gefunden.");
  }

  const blockEnd = endIndex + END_BLOCK.length;
  const prefix = sourceBefore.slice(0, blockEnd).trim();
  const remainder = sourceBefore.slice(blockEnd).trimStart();

  for (const required of [
    "--seo-bg:",
    'html[data-theme="dark"]',
    ".seo-shell",
    ".seo-brand",
    ".seo-nav",
    ".seo-context-nav",
    ".seo-page-header",
    ".seo-section-header"
  ]) {
    if (!prefix.includes(required)) {
      throw new Error("Admin-Foundation unvollständig; fehlt: " + required);
    }
  }

  for (const forbidden of [
    ".seo-panel",
    ".seo-card",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    if (prefix.includes(forbidden)) {
      throw new Error("Feature-Regel liegt unerwartet innerhalb der Foundation-Grenze: " + forbidden);
    }
  }

  foundationContent = HEADER + prefix + "\n";
  sourceAfter = IMPORT + "\n\n" + remainder;
}

if (!foundationContent.startsWith(HEADER)) {
  throw new Error("Admin-Foundation besitzt nicht den erwarteten Migrationsheader.");
}

const migratedPayload = foundationContent.slice(HEADER.length).trim();
const migratedBlockHash = crypto
  .createHash("sha256")
  .update(migratedPayload)
  .digest("hex");

const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
pkg.scripts ||= {};
pkg.scripts["test:css-admin-foundation"] = "node --test test/css-admin-foundation.test.mjs";
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
const foundationFile = path.join(styles, "seo-admin-foundation.css");
const expectedHash = "${migratedBlockHash}";
const importLine = '@import "./seo-admin-foundation.css";';
const header = ${JSON.stringify(HEADER)};

test("Admin-Foundation wird zuerst importiert", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.startsWith(importLine));
  assert.ok(fs.existsSync(foundationFile));
});

test("Exakt migrierter Foundation-Block ist unverändert", () => {
  const foundation = fs.readFileSync(foundationFile, "utf8");
  assert.ok(foundation.startsWith(header));
  const payload = foundation.slice(header.length).trim();
  const actualHash = crypto.createHash("sha256").update(payload).digest("hex");
  assert.equal(actualHash, expectedHash);
});

test("Foundation enthält Tokens, Reset, Shell und Navigation", () => {
  const foundation = fs.readFileSync(foundationFile, "utf8");
  for (const required of [
    ":root {",
    "--seo-bg:",
    'html[data-theme="dark"]',
    "* { box-sizing: border-box; }",
    ".seo-shell",
    ".seo-brand",
    ".seo-nav",
    ".seo-context-nav",
    ".seo-page-header",
    ".seo-section-header"
  ]) {
    assert.ok(foundation.includes(required), "Fehlt: " + required);
  }
});

test("Feature-Systeme bleiben in seo-admin.css", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  for (const required of [
    ".seo-panel",
    ".seo-card",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(source.includes(required), "Fehlt im Hauptlayer: " + required);
  }
});

test("Feature-Systeme wurden nicht in die Foundation verschoben", () => {
  const foundation = fs.readFileSync(foundationFile, "utf8");
  for (const forbidden of [
    ".seo-panel",
    ".seo-card",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(!foundation.includes(forbidden), "Unerwartet in Foundation: " + forbidden);
  }
});

test("seo-admin.css beginnt nach dem Import mit dem Panel-System", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const remainder = source
    .replace(/^@import "\\.\\/seo-admin-foundation\\.css";\\s*/, "")
    .trimStart();
  assert.ok(remainder.startsWith(".seo-panel,"));
});

test("Dark-Mode-System-Fallback bleibt erhalten", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.includes("@media (prefers-color-scheme: dark)"));
});

test("Migration fügt kein important hinzu", () => {
  const foundation = fs.readFileSync(foundationFile, "utf8");
  assert.ok(!foundation.includes("!important"));
});
`;

const report = {
  patch: NAME,
  alreadyInstalled,
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  foundationBytes: Buffer.byteLength(foundationContent),
  migratedBlockHash,
  migratedSystems: [
    "admin tokens",
    "explicit dark theme tokens",
    "global admin reset",
    "admin shell",
    "topbar",
    "brand",
    "theme and base button shell",
    "primary navigation",
    "context navigation",
    "page header",
    "section header"
  ],
  retainedSystems: [
    "panels and cards",
    "grids and stacks",
    "metrics",
    "badges",
    "filters and toolbar",
    "tables",
    "lists and empty states",
    "status",
    "anchor cards",
    "findings",
    "workspace summary",
    "responsive feature rules",
    "system dark-mode fallback"
  ],
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Admin Foundation 22.9.0

- seo-admin.css vorher: ${report.sourceBytesBefore} Bytes
- seo-admin.css nachher: ${report.sourceBytesAfter} Bytes
- neuer Foundation-Layer: ${report.foundationBytes} Bytes
- SHA-256 des migrierten Blocks: ${report.migratedBlockHash}

## Migriert

${report.migratedSystems.map((item) => `- ${item}`).join("\n")}

## In seo-admin.css belassen

${report.retainedSystems.map((item) => `- ${item}`).join("\n")}

## Sicherheitsgrenzen

- Extraktion ausschließlich zwischen realer Dateigrenze und eindeutigem Section-Header-Endblock
- keine Selektoren umbenannt
- keine Deklarationen geändert
- keine pauschale Prüfung wiederverwendeter Klassennamen
- Hash-Prüfung des exakt migrierten Blocks
- vollständiger Rollback bei Test-, Audit- oder Buildfehlern
`;

const desired = new Map([
  [SOURCE, sourceAfter],
  [FOUNDATION, foundationContent],
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
  log("Admin-Foundation: " + report.foundationBytes + " Bytes");

  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:css-admin-foundation"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env
  });

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
