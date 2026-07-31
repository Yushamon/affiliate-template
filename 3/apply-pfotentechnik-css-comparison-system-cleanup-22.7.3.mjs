#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-comparison-system-cleanup-22.7.3";
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
const REPORT_JSON = path.join(REPORT_DIR, "css-comparison-system-22.7.3.json");
const REPORT_MD = path.join(REPORT_DIR, "css-comparison-system-22.7.3.md");
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

function topLevelRootBlocks(css) {
  const blocks = [];
  let depth = 0;
  let quote = null;
  let escaped = false;
  let comment = false;

  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    const next = css[i + 1];

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

    if (ch === "{") {
      if (depth === 0) {
        const lineStart = css.lastIndexOf("\n", i - 1) + 1;
        const selector = css.slice(lineStart, i).trim();
        const close = findMatchingBrace(css, i);

        if (selector === ":root") {
          blocks.push({
            start: lineStart,
            open: i,
            end: close + 1,
            body: css.slice(i + 1, close)
          });
        }

        i = close;
        continue;
      }
      depth += 1;
    } else if (ch === "}") {
      depth = Math.max(0, depth - 1);
    }
  }

  return blocks;
}

function splitDeclarations(body) {
  const declarations = [];
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
        declarations.push({
          raw,
          property: colon > 0 ? raw.slice(0, colon).trim() : "",
          value: colon > 0 ? raw.slice(colon + 1).trim() : ""
        });
      }
      start = i + 1;
    }
  }

  return declarations;
}

const sourceBefore = fs.readFileSync(SOURCE, "utf8");
const importLine = '@import "./comparison-tokens.css";';
const escapedImport = importLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let sourceWorking = sourceBefore.replace(new RegExp("^" + escapedImport + "\\s*"), "");

const roots = topLevelRootBlocks(sourceWorking);
if (!roots.length) throw new Error("Keine top-level :root-Regeln gefunden.");

const occurrences = [];
const replacements = [];

roots.forEach((root, rootIndex) => {
  const declarations = splitDeclarations(root.body);
  const remaining = [];

  declarations.forEach((declaration, declarationIndex) => {
    if (CORE_TOKENS.includes(declaration.property)) {
      occurrences.push({
        property: declaration.property,
        value: declaration.value,
        rootIndex,
        declarationIndex,
        sourceOrder: root.start + declarationIndex
      });
    } else {
      remaining.push(declaration);
    }
  });

  if (remaining.length === declarations.length) return;

  replacements.push({
    start: root.start,
    end: root.end,
    replacement: remaining.length
      ? `:root {\n${remaining.map((item) => "  " + item.raw + ";").join("\n")}\n}`
      : ""
  });
});

const missing = CORE_TOKENS.filter(
  (token) => !occurrences.some((entry) => entry.property === token)
);
if (missing.length) {
  throw new Error("Core Comparison-Tokens fehlen: " + missing.join(", "));
}

const resolved = new Map();
const overridden = [];

for (const token of CORE_TOKENS) {
  const entries = occurrences
    .filter((entry) => entry.property === token)
    .sort((a, b) => a.sourceOrder - b.sourceOrder);

  const winner = entries[entries.length - 1];
  resolved.set(token, winner.value);

  if (entries.length > 1) {
    overridden.push({
      token,
      selected: winner.value,
      previous: entries.slice(0, -1).map((entry) => entry.value)
    });
  }
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
 * Werte entsprechen der zuvor wirksamen CSS-Kaskade:
 * Bei mehrfachen Deklarationen gewinnt die letzte top-level :root-Deklaration.
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
const expectedValues = ${JSON.stringify(Object.fromEntries(CORE_TOKENS.map((token) => [token, resolved.get(token)])), null, 2)};

test("Comparison Tokens werden vor dem System importiert", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  assert.ok(system.startsWith('@import "./comparison-tokens.css";'));
  assert.ok(fs.existsSync(tokensFile));
});

test("Token-Datei enthält die zuvor wirksamen Kaskadenwerte", () => {
  const tokens = fs.readFileSync(tokensFile, "utf8");
  for (const [token, value] of Object.entries(expectedValues)) {
    assert.ok(tokens.includes(token + ": " + value + ";"), token + " hat nicht den erwarteten Wert");
  }
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
  topLevelRootBlocksScanned: roots.length,
  topLevelRootBlocksChanged: replacements.length,
  overriddenTokens: overridden,
  selectedValues: Object.fromEntries(CORE_TOKENS.map((token) => [token, resolved.get(token)])),
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  tokenLayerBytes: Buffer.byteLength(tokensContent),
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Comparison System 22.7.3

- Migrierte Core-Tokens: ${report.tokenCount}
- Untersuchte top-level \`:root\`-Blöcke: ${report.topLevelRootBlocksScanned}
- Geänderte top-level \`:root\`-Blöcke: ${report.topLevelRootBlocksChanged}
- Tokens mit vorherigen Überschreibungen: ${report.overriddenTokens.length}

## Kaskadenauflösung

Bei mehrfachen top-level Deklarationen wird der Wert übernommen, der vor der
Migration durch die CSS-Kaskade wirksam war: die letzte Deklaration in
Quellreihenfolge.

Verschachtelte \`:root\`-Regeln innerhalb von \`@media\`, \`@supports\` oder
anderen At-Rules werden nicht migriert.

${report.overriddenTokens.map((entry) =>
`- \`${entry.token}\`: übernommen \`${entry.selected}\`; frühere Werte: ${entry.previous.map((value) => `\`${value}\``).join(", ")}`
).join("\n")}
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

  log("Untersuchte top-level :root-Blöcke: " + report.topLevelRootBlocksScanned);
  log("Tokens mit vorherigen Überschreibungen: " + report.overriddenTokens.length);

  for (const entry of report.overriddenTokens) {
    log("Kaskadenwert " + entry.token + ": " + entry.selected);
  }

  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:css-comparison-system"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env
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
        cwd: ROOT,
        stdio: "inherit",
        env: process.env
      });
    }
  }

  if (fs.existsSync(path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs"))) {
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
