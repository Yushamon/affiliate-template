#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-admin-architecture-finalizer-22.10.2";
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
const TEST_DIR = path.join(APP, "test");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const PACKAGE = path.join(APP, "package.json");

const FILES = {
  entry: path.join(STYLES, "seo-admin.css"),
  foundation: path.join(STYLES, "seo-admin-foundation.css"),
  panels: path.join(STYLES, "seo-admin-panels.css"),
  controls: path.join(STYLES, "seo-admin-controls.css"),
  content: path.join(STYLES, "seo-admin-content.css"),
  operations: path.join(STYLES, "seo-admin-operations.css"),
  responsive: path.join(STYLES, "seo-admin-responsive.css")
};

const IMPORT_ORDER = [
  "seo-admin-foundation.css",
  "seo-admin-panels.css",
  "seo-admin-controls.css",
  "seo-admin-content.css",
  "seo-admin-operations.css",
  "seo-admin-responsive.css"
];

const IMPORT_LINES = IMPORT_ORDER.map((file) => `@import "./${file}";`);
const OPERATIONS_START = `.seo-finding-list { display: grid; gap: 10px; }`;
const OPERATIONS_END = `.seo-workspace-facts dd { margin: 4px 0 0; font-weight: 800; overflow-wrap: anywhere; }`;
const RESPONSIVE_START = "@media (max-width: 900px)";

const OPERATIONS_HEADER =
`/* SEO Admin operations: findings and workspace summaries.
 * Aus seo-admin.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.
 */

`;

const RESPONSIVE_HEADER =
`/* SEO Admin responsive: breakpoints and automatic system dark-mode fallback.
 * Aus seo-admin.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.
 */

`;

const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-")
);

const log = (message) => console.log("[" + NAME + "] " + message);

for (const required of ["entry", "foundation", "panels", "controls", "content"]) {
  if (!fs.existsSync(FILES[required])) {
    throw new Error("Vorausgesetzte Datei fehlt: " + path.relative(ROOT, FILES[required]));
  }
}
if (!fs.existsSync(PACKAGE)) throw new Error("package.json fehlt.");

let entryBefore = fs.readFileSync(FILES.entry, "utf8");
for (const importLine of IMPORT_LINES.slice(0, 4)) {
  if (!entryBefore.includes(importLine)) {
    throw new Error("22.9.4 wurde noch nicht erfolgreich angewendet: " + importLine);
  }
}

let entryAfter = entryBefore;
let operationsCss = fs.existsSync(FILES.operations)
  ? fs.readFileSync(FILES.operations, "utf8")
  : "";
let responsiveCss = fs.existsSync(FILES.responsive)
  ? fs.readFileSync(FILES.responsive, "utf8")
  : "";

if (!entryAfter.includes(IMPORT_LINES[4])) {
  const start = entryAfter.indexOf(OPERATIONS_START);
  const end = entryAfter.indexOf(OPERATIONS_END);
  if (start < 0 || end < start) {
    throw new Error("Operations-Block konnte nicht sicher erkannt werden.");
  }

  const blockEnd = end + OPERATIONS_END.length;
  const block = entryAfter.slice(start, blockEnd).trim();
  const prefix = entryAfter.slice(0, start).trimEnd();
  const suffix = entryAfter.slice(blockEnd).trimStart();

  for (const selector of [
    ".seo-finding-list",
    ".seo-finding",
    '.seo-finding[data-blocker="true"]',
    '.seo-finding[data-status="regression"]',
    ".seo-workspace-summary",
    ".seo-workspace-facts"
  ]) {
    if (!block.includes(selector)) {
      throw new Error("Operations-Block unvollständig: " + selector);
    }
  }
  if (block.includes("@media")) {
    throw new Error("Operations-Block enthält unerwartete Media Query.");
  }

  operationsCss = OPERATIONS_HEADER + block + "\n";
  entryAfter = prefix + "\n" + IMPORT_LINES[4] + "\n\n" + suffix;
}

if (!entryAfter.includes(IMPORT_LINES[5])) {
  const start = entryAfter.indexOf(RESPONSIVE_START);
  if (start < 0) {
    throw new Error("Responsive-Block konnte nicht sicher erkannt werden.");
  }

  const block = entryAfter.slice(start).trim();
  const prefix = entryAfter.slice(0, start).trimEnd();

  for (const required of [
    "@media (max-width: 900px)",
    "@media (max-width: 680px)",
    "@media (max-width: 430px)",
    "@media (prefers-color-scheme: dark)",
    ".seo-workspace-summary",
    ".seo-shell",
    ".seo-page-header",
    ".seo-actions .seo-button",
    'html:not([data-theme="light"])'
  ]) {
    if (!block.includes(required)) {
      throw new Error("Responsive-Block unvollständig: " + required);
    }
  }

  responsiveCss = RESPONSIVE_HEADER + block + "\n";
  entryAfter = prefix + "\n" + IMPORT_LINES[5] + "\n";
}

for (const line of IMPORT_LINES) {
  if (!entryAfter.includes(line)) throw new Error("Finaler Import fehlt: " + line);
}

const remainingEntry = IMPORT_LINES.reduce((text, line) => text.replace(line, ""), entryAfter).trim();
if (remainingEntry.length > 0) {
  throw new Error(
    "seo-admin.css enthält nach der Finalisierung noch unerwartete Regeln: " +
    remainingEntry.slice(0, 120)
  );
}

function selectorCount(css) {
  return (css.match(/\{/g) || []).length;
}
function importantCount(css) {
  return (css.match(/!important/g) || []).length;
}
function mediaCount(css) {
  return (css.match(/@media\b/g) || []).length;
}
function sha(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

const ownership = {
  version: "22.10.2",
  entrypoint: "seo-admin.css",
  importOrder: IMPORT_ORDER,
  layers: {
    foundation: {
      file: "seo-admin-foundation.css",
      owns: [".seo-shell", ".seo-page-header", ".seo-eyebrow"]
    },
    panels: {
      file: "seo-admin-panels.css",
      owns: [".seo-panel", ".seo-card", ".seo-grid", ".seo-metric"]
    },
    controls: {
      file: "seo-admin-controls.css",
      owns: [".seo-badge", ".seo-actions", ".seo-tabs", ".seo-filter-grid", ".seo-toolbar"]
    },
    content: {
      file: "seo-admin-content.css",
      owns: [".seo-table", ".seo-list", ".seo-empty", ".seo-status", ".seo-anchor-card"]
    },
    operations: {
      file: "seo-admin-operations.css",
      owns: [".seo-finding", ".seo-finding-list", ".seo-workspace-summary", ".seo-workspace-facts"]
    },
    responsive: {
      file: "seo-admin-responsive.css",
      owns: ["@media (max-width: 900px)", "@media (max-width: 680px)", "@media (max-width: 430px)", "@media (prefers-color-scheme: dark)"]
    }
  }
};

const layerContents = {
  foundation: fs.readFileSync(FILES.foundation, "utf8"),
  panels: fs.readFileSync(FILES.panels, "utf8"),
  controls: fs.readFileSync(FILES.controls, "utf8"),
  content: fs.readFileSync(FILES.content, "utf8"),
  operations: operationsCss,
  responsive: responsiveCss
};

for (const [name, layer] of Object.entries(ownership.layers)) {
  for (const marker of layer.owns) {
    if (!layerContents[name].includes(marker)) {
      throw new Error(`Ownership-Marker fehlt bereits vor Testgenerierung: ${name} -> ${marker}`);
    }
  }
}

const metrics = Object.fromEntries(
  Object.entries(layerContents).map(([name, css]) => [
    name,
    {
      file: ownership.layers[name].file,
      bytes: Buffer.byteLength(css),
      ruleBlocks: selectorCount(css),
      mediaQueries: mediaCount(css),
      importantDeclarations: importantCount(css),
      sha256: sha(css)
    }
  ])
);

const architectureTest = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const reportDir = path.join(ROOT, "apps", "pfotentechnik", "reports", "design-system");
const manifest = JSON.parse(fs.readFileSync(path.join(reportDir, "admin-css-ownership.json"), "utf8"));
const entry = fs.readFileSync(path.join(styles, manifest.entrypoint), "utf8");

const contents = Object.fromEntries(
  Object.entries(manifest.layers).map(([name, layer]) => [
    name,
    fs.readFileSync(path.join(styles, layer.file), "utf8")
  ])
);

test("Admin CSS Entrypoint enthält ausschließlich geordnete Imports", () => {
  let previous = -1;
  for (const file of manifest.importOrder) {
    const line = '@import "./' + file + '";';
    const index = entry.indexOf(line);
    assert.ok(index > previous, "Import fehlt oder Reihenfolge falsch: " + file);
    previous = index;
  }

  let remainder = entry;
  for (const file of manifest.importOrder) {
    remainder = remainder.replace('@import "./' + file + '";', "");
  }
  assert.equal(remainder.trim(), "");
});

test("Jeder deklarierte Layer existiert", () => {
  for (const layer of Object.values(manifest.layers)) {
    assert.ok(fs.existsSync(path.join(styles, layer.file)), "Fehlt: " + layer.file);
  }
});

test("Ownership-Marker befinden sich im deklarierten Layer", () => {
  for (const [name, layer] of Object.entries(manifest.layers)) {
    for (const marker of layer.owns) {
      assert.ok(contents[name].includes(marker), name + " besitzt Marker nicht: " + marker);
    }
  }
});

test("Statische Ownership-Marker leaken nicht in andere statische Layer", () => {
  for (const [owner, layer] of Object.entries(manifest.layers)) {
    if (owner === "responsive") continue;
    for (const marker of layer.owns) {
      for (const [candidate, css] of Object.entries(contents)) {
        if (candidate === owner || candidate === "responsive") continue;
        assert.ok(!css.includes(marker), marker + " leakt von " + owner + " nach " + candidate);
      }
    }
  }
});

test("Nur Responsive-Layer enthält Media Queries", () => {
  for (const [name, css] of Object.entries(contents)) {
    if (name === "responsive") {
      assert.ok(css.includes("@media"));
    } else {
      assert.ok(!css.includes("@media"), "Media Query außerhalb Responsive: " + name);
    }
  }
});

test("Responsive-Layer enthält Dark-Mode-Fallback", () => {
  const css = contents.responsive;
  assert.ok(css.includes("@media (prefers-color-scheme: dark)"));
  assert.ok(css.includes('html:not([data-theme="light"])'));
  assert.ok(css.includes("color-scheme: dark"));
});

test("Operations-Basis und responsive Overrides sind getrennt", () => {
  assert.ok(contents.operations.includes(".seo-workspace-summary"));
  assert.ok(contents.operations.includes("display: grid"));
  assert.ok(contents.responsive.includes(".seo-workspace-summary"));
  assert.ok(contents.responsive.includes("grid-template-columns: 1fr"));
});

test("Kein Admin-Layer importiert einen anderen Admin-Layer", () => {
  for (const [name, css] of Object.entries(contents)) {
    assert.ok(!css.includes('@import "./seo-admin-'), "Zyklisches Layering in " + name);
  }
});
`;

function focusedTest(layerName, requiredMarkers, forbiddenMarkers = []) {
  return `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const file = path.join(styles, ${JSON.stringify(ownership.layers[layerName].file)});

test(${JSON.stringify(layerName + " layer besitzt seine Kernmarker")}, () => {
  const css = fs.readFileSync(file, "utf8");
  for (const marker of ${JSON.stringify(requiredMarkers)}) {
    assert.ok(css.includes(marker), "Fehlt: " + marker);
  }
});

test(${JSON.stringify(layerName + " layer enthält keine fremden Kernsysteme")}, () => {
  const css = fs.readFileSync(file, "utf8");
  for (const marker of ${JSON.stringify(forbiddenMarkers)}) {
    assert.ok(!css.includes(marker), "Unerwartet enthalten: " + marker);
  }
});
`;
}

const tests = {
  "css-admin-architecture.test.mjs": architectureTest,
  "css-admin-foundation.test.mjs": focusedTest(
    "foundation",
    [".seo-shell", ".seo-page-header", ".seo-eyebrow"],
    [".seo-panel", ".seo-table", ".seo-finding", "@media"]
  ),
  "css-admin-panels.test.mjs": focusedTest(
    "panels",
    [".seo-panel", ".seo-card", ".seo-grid", ".seo-metric"],
    [".seo-filter-grid", ".seo-table", ".seo-finding", "@media"]
  ),
  "css-admin-controls.test.mjs": focusedTest(
    "controls",
    [".seo-badge", ".seo-actions", ".seo-tabs", ".seo-filter-grid"],
    [".seo-table", ".seo-finding-list", "@media"]
  ),
  "css-admin-content.test.mjs": focusedTest(
    "content",
    [".seo-table", ".seo-list", ".seo-empty", ".seo-status", ".seo-anchor-card"],
    [".seo-finding-list", ".seo-workspace-summary", "@media"]
  ),
  "css-admin-operations.test.mjs": focusedTest(
    "operations",
    [".seo-finding-list", ".seo-finding", ".seo-workspace-summary", ".seo-workspace-facts"],
    [".seo-table", ".seo-filter-grid", "@media"]
  ),
  "css-admin-responsive.test.mjs": focusedTest(
    "responsive",
    ["@media (max-width: 900px)", "@media (max-width: 680px)", "@media (max-width: 430px)", "@media (prefers-color-scheme: dark)"],
    ['@import "./seo-admin-']
  )
};

const report = {
  patch: NAME,
  replaces: "22.10.0",
  fixedIssue: "Ungültige Foundation-Ownership-Marker wurden durch den im aktuellen Bestand vorhandenen Marker .seo-eyebrow ersetzt.",
  status: "finalized",
  entrypointBytesBefore: Buffer.byteLength(entryBefore),
  entrypointBytesAfter: Buffer.byteLength(entryAfter),
  importOrder: IMPORT_ORDER,
  metrics,
  generatedAt: new Date().toISOString()
};

const reportMd = `# SEO Admin CSS Architecture 22.10.2

## Korrektur gegenüber 22.10.0

Der statisch eingetragene Marker \`.seo-title\` existiert im aktuellen
Foundation-Layer nicht. 22.10.2 verwendet stattdessen den tatsächlich
vorhandenen Marker \`.seo-eyebrow\`.

Zusätzlich validiert der Installer alle Ownership-Marker bereits vor dem
Schreiben der Dateien. Ein falsches Manifest kann dadurch künftig nicht erst
im nachgelagerten Test auffallen.

## Ergebnis

- Status: finalisiert
- Entrypoint vor Finalisierung: ${report.entrypointBytesBefore} Bytes
- Entrypoint nach Finalisierung: ${report.entrypointBytesAfter} Bytes
- Layer: ${IMPORT_ORDER.length}
- Entrypoint enthält nur Imports: ja

## Import-Reihenfolge

${IMPORT_ORDER.map((file, index) => `${index + 1}. \`${file}\``).join("\n")}

## Layer-Metriken

| Layer | Bytes | Regelblöcke | Media Queries | !important |
|---|---:|---:|---:|---:|
${Object.entries(metrics).map(([name, item]) =>
  `| ${name} | ${item.bytes} | ${item.ruleBlocks} | ${item.mediaQueries} | ${item.importantDeclarations} |`
).join("\n")}
`;

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ||= {};
for (const name of [
  "architecture",
  "foundation",
  "panels",
  "controls",
  "content",
  "operations",
  "responsive"
]) {
  packageJson.scripts[`test:css-admin-${name}`] = `node --test test/css-admin-${name}.test.mjs`;
}
const packageAfter = JSON.stringify(packageJson, null, 2) + "\n";

const desired = new Map([
  [FILES.entry, entryAfter],
  [FILES.operations, operationsCss],
  [FILES.responsive, responsiveCss],
  [PACKAGE, packageAfter],
  [path.join(REPORT_DIR, "admin-css-ownership.json"), JSON.stringify(ownership, null, 2) + "\n"],
  [path.join(REPORT_DIR, "admin-css-architecture.json"), JSON.stringify(report, null, 2) + "\n"],
  [path.join(REPORT_DIR, "admin-css-architecture.md"), reportMd]
]);

for (const [filename, content] of Object.entries(tests)) {
  desired.set(path.join(TEST_DIR, filename), content);
}

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
  log(changes.length ? changes.length + " Änderung(en) erforderlich." : "Bereits finalisiert.");
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

  for (const script of [
    "test:css-admin-architecture",
    "test:css-admin-foundation",
    "test:css-admin-panels",
    "test:css-admin-controls",
    "test:css-admin-content",
    "test:css-admin-operations",
    "test:css-admin-responsive"
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
    if (fs.existsSync(path.join(TEST_DIR, filename)) && packageJson.scripts?.[script]) {
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
  log("Architekturbericht: " + path.relative(ROOT, path.join(REPORT_DIR, "admin-css-architecture.md")));
  log("Ownership-Manifest: " + path.relative(ROOT, path.join(REPORT_DIR, "admin-css-ownership.json")));
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
