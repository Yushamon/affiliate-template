#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-comparison-system-cleanup-22.7.0";
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
const PANEL_TEST = path.join(APP, "test", "css-panel-system.test.mjs");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-comparison-system-22.7.0.json");
const REPORT_MD = path.join(REPORT_DIR, "css-comparison-system-22.7.0.md");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const log = (m) => console.log("[" + NAME + "] " + m);

for (const file of [SOURCE, PACKAGE, PANEL_TEST]) {
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
      const item = body.slice(start, i).trim();
      if (item) out.push(item);
      start = i + 1;
    }
  }
  return out;
}

function cleanDeclarations(body) {
  const declarations = splitDeclarations(body);
  const last = new Map();
  declarations.forEach((item, index) => {
    const colon = item.indexOf(":");
    if (colon > 0) last.set(item.slice(0, colon).trim().toLowerCase(), index);
  });
  let removed = 0;
  const kept = declarations.filter((item, index) => {
    const colon = item.indexOf(":");
    if (colon <= 0) return true;
    const property = item.slice(0, colon).trim().toLowerCase();
    const keep = last.get(property) === index;
    if (!keep) removed += 1;
    return keep;
  });
  return { declarations: kept, removed };
}

const sourceBefore = fs.readFileSync(SOURCE, "utf8");
const importLine = '@import "./comparison-tokens.css";';
const alreadyInstalled = fs.existsSync(TOKENS) && sourceBefore.includes(importLine);

let sourceAfter = sourceBefore;
let tokensContent;
let duplicateDeclarationsRemoved = 0;
let tokenCount = 0;

if (alreadyInstalled) {
  tokensContent = fs.readFileSync(TOKENS, "utf8");
  tokenCount = (tokensContent.match(/--comparison-[a-z0-9-]+\s*:/g) || []).length;
} else {
  const rootMatch = /(^|\n)\s*:root\s*\{/.exec(sourceBefore);
  if (!rootMatch) throw new Error("Globale Comparison-Tokenregel :root wurde nicht gefunden.");

  const selectorStart = rootMatch.index + rootMatch[1].length;
  const open = sourceBefore.indexOf("{", selectorStart);
  const close = findMatchingBrace(sourceBefore, open);
  const body = sourceBefore.slice(open + 1, close);
  const cleaned = cleanDeclarations(body);
  duplicateDeclarationsRemoved = cleaned.removed;

  const invalid = cleaned.declarations.filter((item) => !item.trim().startsWith("--comparison-"));
  if (invalid.length) {
    throw new Error(":root enthält nicht ausschließlich Comparison-Tokens: " + invalid.join(", "));
  }

  tokenCount = cleaned.declarations.length;
  if (tokenCount < 5) throw new Error("Zu wenige Comparison-Tokens gefunden: " + tokenCount);

  tokensContent =
`/* Shared comparison design tokens.
 * Bewusst paketlokal, damit andere Projekte keine PfotenTechnik-Werte erben.
 */

:root {
${cleaned.declarations.map((item) => "  " + item + ";").join("\n")}
}
`;

  sourceAfter =
    sourceBefore.slice(0, selectorStart) +
    sourceBefore.slice(close + 1);

  sourceAfter = sourceAfter.replace(/^\s+/, "");
  sourceAfter = importLine + "\n\n" + sourceAfter;
  sourceAfter = sourceAfter.replace(/\n{3,}/g, "\n\n");
}

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

test("Comparison Tokens werden vor dem System importiert", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  assert.ok(system.startsWith('@import "./comparison-tokens.css";'));
  assert.ok(fs.existsSync(tokensFile));
});

test("comparison-system.css enthält keine globale Token-Deklaration mehr", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  assert.doesNotMatch(system, /(^|\\n)\\s*:root\\s*\\{/);
  assert.doesNotMatch(system, /--comparison-(?:text|muted|accent|line|soft|surface|shadow)\\s*:/);
});

test("Token-Datei enthält ausschließlich Comparison Custom Properties", () => {
  const tokens = fs.readFileSync(tokensFile, "utf8");
  const rootBody = tokens.match(/:root\\s*\\{([\\s\\S]*?)\\}/)?.[1] ?? "";
  assert.ok(rootBody);
  const declarations = rootBody
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
  assert.ok(declarations.length >= 5);
  for (const declaration of declarations) {
    assert.match(declaration, /^--comparison-[a-z0-9-]+\\s*:/);
  }
});

test("zentrale Comparison Tokens bleiben vollständig erhalten", () => {
  const tokens = fs.readFileSync(tokensFile, "utf8");
  for (const token of [
    "--comparison-text",
    "--comparison-muted",
    "--comparison-accent",
    "--comparison-accent-dark",
    "--comparison-line",
    "--comparison-soft",
    "--comparison-surface",
    "--comparison-shadow"
  ]) {
    assert.ok(tokens.includes(token + ":"), "Token fehlt: " + token);
  }
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
  tokenCount,
  duplicateDeclarationsRemoved,
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  tokenLayerBytes: Buffer.byteLength(tokensContent),
  sourceReduction: Buffer.byteLength(sourceBefore) - Buffer.byteLength(sourceAfter),
  alreadyInstalled,
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Comparison System 22.7.0

- Migrierte Comparison-Tokens: ${report.tokenCount}
- Doppelte Token-Deklarationen entfernt: ${report.duplicateDeclarationsRemoved}
- Systemdatei vorher: ${report.sourceBytesBefore} Bytes
- Systemdatei nachher: ${report.sourceBytesAfter} Bytes
- Token Layer: ${report.tokenLayerBytes} Bytes
- Aus Systemdatei entfernt: ${report.sourceReduction} Bytes

## Umfang

Die paketlokalen \`--comparison-*\`-Variablen werden aus
\`comparison-system.css\` nach \`comparison-tokens.css\` verschoben.

Die Token-Datei wird an erster Stelle importiert. Selektoren, Breakpoints,
Tabellen, Sticky-CTA, Hero, Empfehlungen und Dark-Mode-Regeln bleiben in ihrer
bestehenden Reihenfolge.

## Cleanup

- führende Leerzeilen entfernt
- doppelte Token-Deklarationen entfernt
- Token Layer auf Custom Properties begrenzt
- kein neues \`!important\`
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

  log("Migrierte Comparison-Tokens: " + report.tokenCount);
  log("Doppelte Token-Deklarationen entfernt: " + report.duplicateDeclarationsRemoved);
  log("Systemdatei: " + report.sourceBytesBefore + " -> " + report.sourceBytesAfter + " Bytes");

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
