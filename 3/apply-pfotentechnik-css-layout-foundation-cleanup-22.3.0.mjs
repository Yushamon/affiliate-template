#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-layout-foundation-cleanup-22.3.0";
const CHECK = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

function findRoot(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const STYLES = path.join(APP, "src", "styles");
const SOURCE = path.join(STYLES, "pfotentechnik-design-system.css");
const FOUNDATION_INDEX = path.join(STYLES, "foundation", "index.css");
const BASE = path.join(STYLES, "foundation", "base.css");
const LAYOUT = path.join(STYLES, "layout");
const LAYOUT_INDEX = path.join(LAYOUT, "index.css");
const CONTAINERS = path.join(LAYOUT, "containers.css");
const TEST = path.join(APP, "test", "css-layout-foundation.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-layout-foundation-22.3.0.json");
const REPORT_MD = path.join(REPORT_DIR, "css-layout-foundation-22.3.0.md");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-")
);

const log = (message) => console.log("[" + NAME + "] " + message);

for (const required of [SOURCE, FOUNDATION_INDEX, BASE, PACKAGE]) {
  if (!fs.existsSync(required)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, required));
  }
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function countMatches(text, regex) {
  return [...text.matchAll(regex)].length;
}

function replaceExactlyOnce(text, regex, replacement, label) {
  const matches = [...text.matchAll(regex)];
  if (matches.length !== 1) {
    throw new Error(
      label + ": genau 1 Treffer erwartet, gefunden: " + matches.length
    );
  }
  return text.replace(regex, replacement);
}

function removeEmptyMediaQueries(css) {
  let removed = 0;
  let next = css;
  const pattern = /@media\s*([^{]+)\{\s*\}/g;
  while (pattern.test(next)) {
    next = next.replace(pattern, "");
    removed += 1;
    pattern.lastIndex = 0;
  }
  return { css: next.replace(/\n{3,}/g, "\n\n"), removed };
}

const sourceBefore = fs.readFileSync(SOURCE, "utf8");
const baseContent = fs.readFileSync(BASE, "utf8");

if (!/(?:^|\n)\s*html\s*\{/.test(baseContent) || !/(?:^|\n)\s*body\s*\{/.test(baseContent)) {
  throw new Error("22.2.1 Base Layer ist nicht vollständig installiert.");
}

const desktopContainerPattern =
  /\.container\s*,\s*\.header-container-v2\s*,\s*\.footer-inner-v2\s*\{\s*width:\s*min\(100%\s*-\s*40px,\s*var\(--pt-content\)\)\s*;\s*max-width:\s*var\(--pt-content\)\s*;\s*margin-inline:\s*auto\s*;\s*\}/g;

const mobileContainerPattern =
  /\.container\s*\{\s*width:\s*min\(100%\s*-\s*24px,\s*var\(--pt-content\)\)\s*;\s*\}/g;

const desktopMatches = countMatches(sourceBefore, desktopContainerPattern);
const mobileMatches = countMatches(sourceBefore, mobileContainerPattern);

let sourceAfter = sourceBefore;
let alreadyInstalled = fs.existsSync(CONTAINERS) &&
  fs.readFileSync(FOUNDATION_INDEX, "utf8").includes('@import "../layout/index.css";');

if (!alreadyInstalled) {
  if (desktopMatches !== 1) {
    throw new Error(
      "Sichere Desktop-Containerregel nicht eindeutig gefunden. Erwartet: 1, gefunden: " +
      desktopMatches
    );
  }
  if (mobileMatches !== 1) {
    throw new Error(
      "Sichere mobile Containerregel nicht eindeutig gefunden. Erwartet: 1, gefunden: " +
      mobileMatches
    );
  }

  sourceAfter = replaceExactlyOnce(
    sourceAfter,
    desktopContainerPattern,
    "",
    "Desktop-Containerregel"
  );
  sourceAfter = replaceExactlyOnce(
    sourceAfter,
    mobileContainerPattern,
    "",
    "Mobile Containerregel"
  );
}

const emptyCleanup = removeEmptyMediaQueries(sourceAfter);
sourceAfter = emptyCleanup.css;

const containersContent = `/* PfotenTechnik container primitives.
 * Layout-only: keine Typografie, Farben oder Komponentenstile.
 */

:where(.container, .header-container-v2, .footer-inner-v2) {
  width: min(100% - 40px, var(--pt-content));
  max-width: var(--pt-content);
  margin-inline: auto;
}

@media (max-width: 430px) {
  .container {
    width: min(100% - 24px, var(--pt-content));
  }
}
`;

const layoutIndexContent = `/* PfotenTechnik layout entrypoint. */
@import "./containers.css";
`;

function updateFoundationIndex(content) {
  if (content.includes('@import "../layout/index.css";')) return content;
  const baseImport = '@import "./base.css";';
  if (!content.includes(baseImport)) {
    throw new Error("foundation/index.css enthält keinen base.css-Import.");
  }
  return content.replace(
    baseImport,
    baseImport + '\n@import "../layout/index.css";'
  );
}

function updatePackage(content) {
  const pkg = JSON.parse(content);
  pkg.scripts ||= {};
  pkg.scripts["test:css-layout-foundation"] =
    "node --test test/css-layout-foundation.test.mjs";
  return JSON.stringify(pkg, null, 2) + "\n";
}

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = path.join(APP, "src", "styles");
const sourceFile = path.join(styles, "pfotentechnik-design-system.css");
const foundationIndex = path.join(styles, "foundation", "index.css");
const layoutIndex = path.join(styles, "layout", "index.css");
const containersFile = path.join(styles, "layout", "containers.css");

test("Layout Layer wird nach Base eingebunden", () => {
  const foundation = fs.readFileSync(foundationIndex, "utf8");
  assert.match(
    foundation,
    /@import "\\.\\/base\\.css";[\\s\\S]*@import "\\.\\.\\/layout\\/index\\.css";/
  );
  assert.ok(fs.existsSync(layoutIndex));
  assert.ok(fs.existsSync(containersFile));
});

test("Container-Basis liegt ausschließlich im Layout Layer", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const containers = fs.readFileSync(containersFile, "utf8");

  assert.doesNotMatch(
    source,
    /\\.container\\s*,\\s*\\.header-container-v2\\s*,\\s*\\.footer-inner-v2\\s*\\{/
  );
  assert.match(
    containers,
    /:where\\(\\.container, \\.header-container-v2, \\.footer-inner-v2\\)\\s*\\{/
  );
});

test("Mobile Containerbreite bleibt bei maximal 430px erhalten", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const containers = fs.readFileSync(containersFile, "utf8");

  assert.doesNotMatch(
    source,
    /\\.container\\s*\\{\\s*width:\\s*min\\(100%\\s*-\\s*24px,\\s*var\\(--pt-content\\)\\)/
  );
  assert.match(
    containers,
    /@media\\s*\\(max-width:\\s*430px\\)[\\s\\S]*\\.container\\s*\\{[\\s\\S]*width:\\s*min\\(100%\\s*-\\s*24px,\\s*var\\(--pt-content\\)\\)/
  );
});

test("Layout Layer enthält keine Komponenten- oder Theme-Eigenschaften", () => {
  const containers = fs.readFileSync(containersFile, "utf8");
  assert.doesNotMatch(containers, /\\b(?:color|background|border|box-shadow|font-family)\\s*:/);
  assert.doesNotMatch(containers, /!important/);
});

test("keine leeren Media Queries bleiben im Legacy-CSS", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.doesNotMatch(source, /@media\\s*[^{]+\\{\\s*\\}/);
});
`;

const foundationAfter = updateFoundationIndex(
  fs.readFileSync(FOUNDATION_INDEX, "utf8")
);

const report = {
  patch: NAME,
  migratedRules: alreadyInstalled ? 0 : 2,
  migratedSelectors: [
    ".container",
    ".header-container-v2",
    ".footer-inner-v2"
  ],
  emptyMediaQueriesRemoved: emptyCleanup.removed,
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  layoutBytes: Buffer.byteLength(containersContent) + Buffer.byteLength(layoutIndexContent),
  sourceReduction: Buffer.byteLength(sourceBefore) - Buffer.byteLength(sourceAfter),
  alreadyInstalled,
  generatedAt: new Date().toISOString()
};

const reportMarkdown = `# CSS Layout Foundation 22.3.0

- Migrierte Regeln: ${report.migratedRules}
- Migrierte Selektoren: ${report.migratedSelectors.join(", ")}
- Leere Media Queries entfernt: ${report.emptyMediaQueriesRemoved}
- Legacy-Datei vorher: ${report.sourceBytesBefore} Bytes
- Legacy-Datei nachher: ${report.sourceBytesAfter} Bytes
- Layout Layer: ${report.layoutBytes} Bytes
- Aus Legacy entfernt: ${report.sourceReduction} Bytes

## Umfang

Dieser Patch migriert bewusst nur die eindeutig identifizierbare gemeinsame
Container-Basis und deren mobile 430-px-Abweichung. Header- und Footer-spezifische
Layoutregeln bleiben an ihrer bisherigen Kaskadenposition.

## Cleanup

- gemeinsame Containerbasis über \`:where(...)\` mit niedriger Spezifität
- mobile Containerabweichung an unveränderter Breakpoint-Schwelle
- leere Media Queries entfernt
- keine \`!important\`
- keine Komponenten-, Farb- oder Typografieregeln im Layout Layer
`;

const desired = new Map([
  [SOURCE, sourceAfter],
  [FOUNDATION_INDEX, foundationAfter],
  [LAYOUT_INDEX, layoutIndexContent],
  [CONTAINERS, containersContent],
  [TEST, testContent],
  [PACKAGE, updatePackage(fs.readFileSync(PACKAGE, "utf8"))],
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
      const target = path.join(BACKUP, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, change.current);
    }
    fs.mkdirSync(path.dirname(change.file), { recursive: true });
    fs.writeFileSync(change.file, change.content);
    log("Geschrieben: " + relative);
  }

  log("Migrierte Regeln: " + report.migratedRules);
  log("Leere Media Queries entfernt: " + report.emptyMediaQueriesRemoved);
  log("Legacy-Datei: " + report.sourceBytesBefore + " -> " + report.sourceBytesAfter + " Bytes");

  execFileSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "test:css-layout-foundation"],
    { cwd: ROOT, stdio: "inherit", env: process.env }
  );

  for (const [script, testPath] of [
    ["test:css-base-layer", path.join(APP, "test", "css-base-layer.test.mjs")],
    ["test:css-foundation", path.join(APP, "test", "css-foundation-tokens.test.mjs")],
    ["test:css-architecture", path.join(APP, "test", "css-architecture.test.mjs")]
  ]) {
    if (fs.existsSync(testPath)) {
      execFileSync(
        "npm",
        ["--workspace", "apps/pfotentechnik", "run", script],
        { cwd: ROOT, stdio: "inherit", env: process.env }
      );
    }
  }

  if (fs.existsSync(path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs"))) {
    execFileSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", "css:architecture:audit"],
      { cwd: ROOT, stdio: "inherit", env: process.env }
    );
  }

  if (!SKIP_BUILD) {
    execFileSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", "build"],
      { cwd: ROOT, stdio: "inherit", env: process.env }
    );
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
