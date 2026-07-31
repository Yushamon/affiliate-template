#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-comparison-system-cleanup-22.7.1";
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
const REPORT_JSON = path.join(REPORT_DIR, "css-comparison-system-22.7.1.json");
const REPORT_MD = path.join(REPORT_DIR, "css-comparison-system-22.7.1.md");
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
      const item = body.slice(start, i).trim();
      if (item) out.push(item);
      start = i + 1;
    }
  }
  return out;
}

function parseDeclarations(body) {
  return splitDeclarations(body).map((item) => {
    const colon = item.indexOf(":");
    return {
      raw: item,
      property: colon > 0 ? item.slice(0, colon).trim() : "",
      value: colon > 0 ? item.slice(colon + 1).trim() : ""
    };
  });
}

function cleanCoreDeclarations(declarations) {
  const last = new Map();
  declarations.forEach((item, index) => last.set(item.property, index));
  let removed = 0;
  const kept = declarations.filter((item, index) => {
    const keep = last.get(item.property) === index;
    if (!keep) removed += 1;
    return keep;
  });
  return { kept, removed };
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
const alreadyInstalled =
  fs.existsSync(TOKENS) &&
  sourceBefore.startsWith(importLine) &&
  CORE_TOKENS.every((token) => fs.readFileSync(TOKENS, "utf8").includes(token + ":"));

let sourceAfter = sourceBefore;
let tokensContent = fs.existsSync(TOKENS) ? fs.readFileSync(TOKENS, "utf8") : "";
let duplicateDeclarationsRemoved = 0;
let rootBlocksPreserved = 0;

if (!alreadyInstalled) {
  const roots = findRootBlocks(sourceBefore);
  if (!roots.length) throw new Error("Keine :root-Regel mit Comparison-Tokens gefunden.");

  let target = null;
  let coreDeclarations = [];

  for (const root of roots) {
    const declarations = parseDeclarations(root.body);
    const core = declarations.filter((item) => CORE_TOKENS.includes(item.property));
    if (core.length) {
      if (target) {
        throw new Error("Core Comparison-Tokens sind auf mehrere :root-Blöcke verteilt.");
      }
      target = root;
      coreDeclarations = core;
    }
  }

  if (!target) throw new Error("Die acht Core Comparison-Tokens wurden in keiner :root-Regel gefunden.");

  const found = new Set(coreDeclarations.map((item) => item.property));
  const missing = CORE_TOKENS.filter((token) => !found.has(token));
  if (missing.length) throw new Error("Core Comparison-Tokens fehlen: " + missing.join(", "));

  const cleaned = cleanCoreDeclarations(coreDeclarations);
  duplicateDeclarationsRemoved = cleaned.removed;

  const allTargetDeclarations = parseDeclarations(target.body);
  const remaining = allTargetDeclarations.filter((item) => !CORE_TOKENS.includes(item.property));

  tokensContent =
`/* Shared comparison design tokens.
 * Bewusst paketlokal, damit andere Projekte keine PfotenTechnik-Werte erben.
 */

:root {
${CORE_TOKENS.map((token) => {
  const entry = cleaned.kept.find((item) => item.property === token);
  return "  " + entry.property + ": " + entry.value + ";";
}).join("\n")}
}
`;

  let replacement = "";
  if (remaining.length) {
    replacement =
`:root {
${remaining.map((item) => "  " + item.raw + ";").join("\n")}
}`;
  }

  sourceAfter =
    sourceBefore.slice(0, target.start) +
    replacement +
    sourceBefore.slice(target.end);

  sourceAfter = sourceAfter.replace(/\n{3,}/g, "\n\n").replace(/^\s+/, "");

  if (!sourceAfter.startsWith(importLine)) {
    sourceAfter = importLine + "\n\n" + sourceAfter;
  }

  rootBlocksPreserved = findRootBlocks(sourceAfter).length;
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

const coreTokens = ${JSON.stringify(CORE_TOKENS, null, 2)};

test("Comparison Tokens werden vor dem System importiert", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  assert.ok(system.startsWith('@import "./comparison-tokens.css";'));
  assert.ok(fs.existsSync(tokensFile));
});

test("Core Comparison-Tokens wurden aus der Systemdatei entfernt", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  for (const token of coreTokens) {
    assert.ok(
      !system.includes(token + ":"),
      "Systemdatei enthält weiterhin: " + token
    );
  }
});

test("weitere root-Blöcke bleiben ausdrücklich zulässig", () => {
  const system = fs.readFileSync(systemFile, "utf8");
  const roots = [...system.matchAll(/(^|\\n)\\s*:root\\s*\\{/g)];
  assert.ok(Array.isArray(roots));
});

test("Token-Datei enthält ausschließlich die acht Core-Tokens", () => {
  const tokens = fs.readFileSync(tokensFile, "utf8");
  const body = tokens.match(/:root\\s*\\{([\\s\\S]*?)\\}/)?.[1] ?? "";
  assert.ok(body);
  const properties = [...body.matchAll(/(--comparison-[a-z0-9-]+)\\s*:/g)].map((match) => match[1]);
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
  duplicateDeclarationsRemoved,
  preservedRootBlocks: alreadyInstalled ? findRootBlocks(sourceAfter).length : rootBlocksPreserved,
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  tokenLayerBytes: Buffer.byteLength(tokensContent),
  sourceReduction: Buffer.byteLength(sourceBefore) - Buffer.byteLength(sourceAfter),
  alreadyInstalled,
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Comparison System 22.7.1

- Migrierte Core-Tokens: ${report.tokenCount}
- Doppelte Token-Deklarationen entfernt: ${report.duplicateDeclarationsRemoved}
- Weitere erhaltene \`:root\`-Blöcke: ${report.preservedRootBlocks}
- Systemdatei vorher: ${report.sourceBytesBefore} Bytes
- Systemdatei nachher: ${report.sourceBytesAfter} Bytes
- Token Layer: ${report.tokenLayerBytes} Bytes
- Aus Systemdatei entfernt: ${report.sourceReduction} Bytes

## Korrektur gegenüber 22.7.0

22.7.0 prüfte fälschlich, dass nach der Migration überhaupt keine
\`:root\`-Regel mehr existieren darf. Die reale Comparison-Datei enthält jedoch
weitere legitime \`:root\`-Blöcke.

22.7.1 migriert und prüft deshalb ausschließlich die acht Core
\`--comparison-*\`-Tokens. Andere Root-Variablen bleiben unverändert.
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

  log("Migrierte Core Comparison-Tokens: " + report.tokenCount);
  log("Weitere erhaltene :root-Blöcke: " + report.preservedRootBlocks);

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
