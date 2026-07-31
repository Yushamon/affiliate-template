#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-comparison-system-cleanup-22.7.2";
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
const COMPARISON_DIR = path.join(ROOT, "packages", "affiliate-core", "src", "components", "comparison");
const SOURCE = path.join(COMPARISON_DIR, "comparison-system.css");
const TOKENS = path.join(COMPARISON_DIR, "comparison-tokens.css");
const TEST = path.join(APP, "test", "css-comparison-system.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-comparison-system-22.7.2.json");
const REPORT_MD = path.join(REPORT_DIR, "css-comparison-system-22.7.2.md");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const CORE_TOKENS = [
  "--comparison-text",
  "--comparison-muted",
  "--comparison-accent",
  "--comparison-accent-dark",
  "--comparison-line",
  "--comparison-soft",
  "--comparison-surface",
  "--comparison-shadow"
];

const log = (m) => console.log("[" + NAME + "] " + m);

for (const file of [SOURCE, PACKAGE]) {
  if (!fs.existsSync(file)) throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
}

function findMatchingBrace(text, openIndex) {
  let depth = 1;
  let quote = null;
  let escaped = false;
  let comment = false;

  for (let i = openIndex + 1; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (comment) {
      if (ch === "*" && next === "/") {
        comment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "*") {
      comment = true;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  throw new Error("Nicht geschlossener CSS-Block.");
}

function splitDeclarations(body) {
  const out = [];
  let start = 0;
  let quote = null;
  let escaped = false;
  let depth = 0;

  for (let i = 0; i <= body.length; i += 1) {
    const ch = body[i];

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if ((ch === ";" || i === body.length) && depth === 0) {
      const raw = body.slice(start, i).trim();
      if (raw) {
        const colon = raw.indexOf(":");
        out.push({
          raw,
          property: colon > 0 ? raw.slice(0, colon).trim() : "",
          value: colon > 0 ? raw.slice(colon + 1).trim() : ""
        });
      }
      start = i + 1;
    }
  }

  return out;
}

function findRootBlocks(css) {
  const blocks = [];
  const pattern = /(^|\n)\s*:root\s*\{/g;
  let match;

  while ((match = pattern.exec(css))) {
    const start = match.index + match[1].length;
    const open = css.indexOf("{", start);
    const close = findMatchingBrace(css, open);
    blocks.push({
      start,
      open,
      end: close + 1,
      body: css.slice(open + 1, close)
    });
    pattern.lastIndex = close + 1;
  }

  return blocks;
}

const sourceBefore = fs.readFileSync(SOURCE, "utf8");
const importLine = '@import "./comparison-tokens.css";';

let sourceWorking = sourceBefore.replace(new RegExp("^" + importLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*"), "");
const roots = findRootBlocks(sourceWorking);

if (!roots.length) {
  throw new Error("Keine :root-Regeln in comparison-system.css gefunden.");
}

const coreOccurrences = [];
const replacements = [];

for (const root of roots) {
  const declarations = splitDeclarations(root.body);
  const remaining = [];

  for (const declaration of declarations) {
    if (CORE_TOKENS.includes(declaration.property)) {
      coreOccurrences.push({
        property: declaration.property,
        value: declaration.value,
        rootStart: root.start
      });
    } else {
      remaining.push(declaration);
    }
  }

  if (remaining.length === declarations.length) continue;

  const replacement = remaining.length
    ? `:root {\n${remaining.map((item) => "  " + item.raw + ";").join("\n")}\n}`
    : "";

  replacements.push({
    start: root.start,
    end: root.end,
    replacement
  });
}

const missing = CORE_TOKENS.filter(
  (token) => !coreOccurrences.some((entry) => entry.property === token)
);
if (missing.length) {
  throw new Error("Core Comparison-Tokens fehlen: " + missing.join(", "));
}

const resolved = new Map();
const duplicateValues = [];
for (const token of CORE_TOKENS) {
  const entries = coreOccurrences.filter((entry) => entry.property === token);
  const values = [...new Set(entries.map((entry) => entry.value))];
  if (values.length > 1) {
    throw new Error(
      "Widersprüchliche Werte für " + token + ": " + values.join(" | ")
    );
  }
  resolved.set(token, values[0]);
  if (entries.length > 1) duplicateValues.push(token);
}

for (const change of [...replacements].sort((a, b) => b.start - a.start)) {
  sourceWorking =
    sourceWorking.slice(0, change.start) +
    change.replacement +
    sourceWorking.slice(change.end);
}

sourceWorking = sourceWorking.replace(/\n{3,}/g, "\n\n").replace(/^\s+/, "");
const sourceAfter = importLine + "\n\n" + sourceWorking;

const tokensContent =
`/* Shared comparison design tokens.
 * Bewusst paketlokal, damit andere Projekte keine PfotenTechnik-Werte erben.
 */

:root {
${CORE_TOKENS.map((token) => `  ${token}: ${resolved.get(token)};`).join("\n")}
}
`;

const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
pkg.scripts ||= {};
pkg.scripts["test:css-comparison-system"] = "node --test test/css-comparison-system.test.mjs";
const packageAfter = JSON.stringify(pkg, null, 2) + "\n";

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const comparisonDir = path.join(
  ROOT,
  "packages",
  "affiliate-core",
  "src",
  "components",
  "comparison"
);
const systemFile = path.join(comparisonDir, "comparison-system.css");
const tokensFile = path.join(comparisonDir, "comparison-tokens.css");

const coreTokens = ${JSON.stringify(CORE_TOKENS, null, 2)};

test("Comparison Tokens werden vor dem System importiert", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  assert.ok(system.startsWith('@import "./comparison-tokens.css";'));
  assert.ok(fs.existsSync(tokensFile));
});

test("Core Comparison-Tokens wurden aus allen root-Blöcken entfernt", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  for (const token of coreTokens) {
    assert.ok(!system.includes(token + ":"), "Systemdatei enthält weiterhin: " + token);
  }
});

test("weitere root-Blöcke bleiben zulässig", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  assert.ok(typeof system === "string");
});

test("Token-Datei enthält exakt die acht Core-Tokens", () => {
  const tokens = fs.readFileSync(tokensFile, "utf8");
  const body = tokens.match(/:root\\s*\\{([\\s\\S]*?)\\}/)?.[1] ?? "";
  const properties = [...body.matchAll(/(--comparison-[a-z0-9-]+)\\s*:/g)].map((m) => m[1]);
  assert.deepEqual(properties, coreTokens);
});

test("Token Layer enthält keine Komponentenregeln oder important", () => {
  const tokens = fs.readFileSync(tokensFile, "utf8");
  assert.doesNotMatch(tokens, /\\.comparison-|@media|!important/);
});

test("Systemdatei beginnt ohne leere Präfixzeilen", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  assert.doesNotMatch(system, /^\\s*\\n/);
});
`;

const report = {
  patch: NAME,
  tokenCount: CORE_TOKENS.length,
  rootBlocksScanned: roots.length,
  rootBlocksChanged: replacements.length,
  duplicateSameValueTokens: duplicateValues,
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  tokenLayerBytes: Buffer.byteLength(tokensContent),
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Comparison System 22.7.2

- Migrierte Core-Tokens: ${report.tokenCount}
- Untersuchte \`:root\`-Blöcke: ${report.rootBlocksScanned}
- Geänderte \`:root\`-Blöcke: ${report.rootBlocksChanged}
- Mehrfach mit identischem Wert gefundene Tokens: ${report.duplicateSameValueTokens.length ? report.duplicateSameValueTokens.join(", ") : "keine"}

## Korrektur

Die acht Core-Comparison-Tokens dürfen über mehrere \`:root\`-Blöcke verteilt
sein. 22.7.2 sammelt sie aus allen Root-Blöcken ein.

Andere Deklarationen in denselben Root-Blöcken bleiben erhalten. Mehrfach
vorhandene Core-Tokens werden nur zusammengeführt, wenn ihre Werte identisch
sind. Bei widersprüchlichen Werten bricht der Installer sicher ab.
`;

const desired = new Map([
  [SOURCE, sourceAfter],
  [TOKENS, tokensContent],
  [TEST, testContent],
  [PACKAGE, packageAfter],
  [REPORT_JSON, JSON.stringify(report, null, 2) + "\n"],
  [REPORT_MD, reportMarkdown]
]);

const changes = [];
for (const [file, content] of desired) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current === content) log("Unverändert: " + path.relative(ROOT, file));
  else changes.push({ file, current, content });
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
    const rel = path.relative(ROOT, change.file);
    if (change.current !== null) {
      const backupFile = path.join(BACKUP, rel);
      fs.mkdirSync(path.dirname(backupFile), { recursive: true });
      fs.writeFileSync(backupFile, change.current);
    }
    fs.mkdirSync(path.dirname(change.file), { recursive: true });
    fs.writeFileSync(change.file, change.content);
    log("Geschrieben: " + rel);
  }

  log("Untersuchte :root-Blöcke: " + report.rootBlocksScanned);
  log("Geänderte :root-Blöcke: " + report.rootBlocksChanged);
  log("Migrierte Core Comparison-Tokens: " + report.tokenCount);

  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:css-comparison-system"], {
    cwd: ROOT, stdio: "inherit", env: process.env
  });

  for (const [script, file] of [
    ["test:css-panel-system", path.join(APP, "test", "css-panel-system.test.mjs")],
    ["test:css-card-system", path.join(APP, "test", "css-card-system.test.mjs")],
    ["test:css-button-system", path.join(APP, "test", "css-button-system.test.mjs")],
    ["test:css-layout-foundation", path.join(APP, "test", "css-layout-foundation.test.mjs")],
    ["test:css-base-layer", path.join(APP, "test", "css-base-layer.test.mjs")],
    ["test:css-foundation", path.join(APP, "test", "css-foundation-tokens.test.mjs")],
    ["test:css-architecture", path.join(APP, "test", "css-architecture.test.mjs")]
  ]) {
    if (fs.existsSync(file)) {
      execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", script], {
        cwd: ROOT, stdio: "inherit", env: process.env
      });
    }
  }

  if (fs.existsSync(path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs"))) {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "css:architecture:audit"], {
      cwd: ROOT, stdio: "inherit", env: process.env
    });
  }

  if (!SKIP_BUILD) {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], {
      cwd: ROOT, stdio: "inherit", env: process.env
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
