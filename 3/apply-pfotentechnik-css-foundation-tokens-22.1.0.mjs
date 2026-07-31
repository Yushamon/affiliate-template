#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-foundation-tokens-22.1.0";
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
const SOURCE = path.join(APP, "src", "styles", "pfotentechnik-design-system.css");
const FOUNDATION_DIR = path.join(APP, "src", "styles", "foundation");
const TOKENS = path.join(FOUNDATION_DIR, "tokens.css");
const INDEX = path.join(FOUNDATION_DIR, "index.css");
const TEST = path.join(APP, "test", "css-foundation-tokens.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-")
);

const log = (message) => console.log("[" + NAME + "] " + message);

if (!fs.existsSync(SOURCE)) {
  throw new Error("Quelldatei fehlt: " + path.relative(ROOT, SOURCE));
}

function findTopLevelBlocks(css) {
  const blocks = [];
  let depth = 0;
  let statementStart = 0;
  let inComment = false;
  let quote = null;
  let escaped = false;

  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    const next = css[i + 1];

    if (inComment) {
      if (ch === "*" && next === "/") {
        inComment = false;
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
      inComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === "{" && depth === 0) {
      const selectorStart = statementStart;
      const selector = css.slice(selectorStart, i).trim();
      let end = i + 1;
      let innerDepth = 1;
      let innerComment = false;
      let innerQuote = null;
      let innerEscaped = false;

      for (; end < css.length; end += 1) {
        const c = css[end];
        const n = css[end + 1];

        if (innerComment) {
          if (c === "*" && n === "/") {
            innerComment = false;
            end += 1;
          }
          continue;
        }
        if (innerQuote) {
          if (innerEscaped) innerEscaped = false;
          else if (c === "\\") innerEscaped = true;
          else if (c === innerQuote) innerQuote = null;
          continue;
        }
        if (c === "/" && n === "*") {
          innerComment = true;
          end += 1;
          continue;
        }
        if (c === '"' || c === "'") {
          innerQuote = c;
          continue;
        }
        if (c === "{") innerDepth += 1;
        else if (c === "}") {
          innerDepth -= 1;
          if (innerDepth === 0) break;
        }
      }

      if (innerDepth !== 0) throw new Error("Nicht geschlossener CSS-Block.");
      blocks.push({
        selector,
        start: selectorStart,
        open: i,
        end: end + 1,
        text: css.slice(selectorStart, end + 1)
      });
      i = end;
      statementStart = end + 1;
      continue;
    }

    if (ch === ";" && depth === 0) statementStart = i + 1;
  }

  return blocks;
}

function normalizeSelector(selector) {
  return selector
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

function transform(source) {
  if (source.includes('@import "./foundation/index.css";')) {
    if (!fs.existsSync(TOKENS)) {
      throw new Error("Foundation-Import vorhanden, tokens.css fehlt jedoch.");
    }
    return { source, tokens: fs.readFileSync(TOKENS, "utf8"), count: null, already: true };
  }

  const blocks = findTopLevelBlocks(source);
  const roots = blocks.filter((block) => normalizeSelector(block.selector) === ":root");

  if (roots.length === 0) {
    throw new Error("Keine top-level :root-Blöcke gefunden; sichere Extraktion abgebrochen.");
  }

  const extracted = roots
    .map((block) => block.text.trim())
    .join("\n\n")
    .trim() + "\n";

  let remainder = source;
  for (const block of [...roots].sort((a, b) => b.start - a.start)) {
    remainder =
      remainder.slice(0, block.start) +
      "\n" +
      remainder.slice(block.end);
  }

  remainder = remainder.replace(/^\s+/, "");
  const importLine = '@import "./foundation/index.css";\n\n';
  return {
    source: importLine + remainder,
    tokens:
      "/* PfotenTechnik foundation tokens.\n" +
      " * Extrahiert aus pfotentechnik-design-system.css durch 22.1.0.\n" +
      " * Keine visuellen Änderungen: Reihenfolge der :root-Blöcke bleibt erhalten.\n" +
      " */\n\n" +
      extracted,
    count: roots.length,
    already: false
  };
}

function updatePackage(content) {
  const pkg = JSON.parse(content);
  pkg.scripts ||= {};
  pkg.scripts["test:css-foundation"] =
    "node --test test/css-foundation-tokens.test.mjs";
  return JSON.stringify(pkg, null, 2) + "\n";
}

const sourceCurrent = fs.readFileSync(SOURCE, "utf8");
const transformed = transform(sourceCurrent);

const indexContent =
  "/* Stable entry point for PfotenTechnik foundation styles. */\n" +
  '@import "./tokens.css";\n';

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceFile = path.join(APP, "src", "styles", "pfotentechnik-design-system.css");
const indexFile = path.join(APP, "src", "styles", "foundation", "index.css");
const tokensFile = path.join(APP, "src", "styles", "foundation", "tokens.css");

function countTopLevelRootBlocks(css) {
  let count = 0;
  let depth = 0;
  let start = 0;
  let quote = null;
  let comment = false;
  let escaped = false;

  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    const next = css[i + 1];
    if (comment) {
      if (ch === "*" && next === "/") { comment = false; i += 1; }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "*") { comment = true; i += 1; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "{") {
      if (depth === 0) {
        const selector = css.slice(start, i).replace(/\\/\\*[\\s\\S]*?\\*\\//g, "").trim();
        if (selector === ":root") count += 1;
      }
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth < 0) throw new Error("Ungültige CSS-Klammerung.");
      if (depth === 0) start = i + 1;
    } else if (ch === ";" && depth === 0) {
      start = i + 1;
    }
  }
  assert.equal(depth, 0, "CSS-Klammerung ist nicht ausgeglichen.");
  return count;
}

test("Foundation-Entry und Tokens sind installiert", () => {
  assert.ok(fs.existsSync(indexFile));
  assert.ok(fs.existsSync(tokensFile));
  const source = fs.readFileSync(sourceFile, "utf8");
  const index = fs.readFileSync(indexFile, "utf8");
  assert.match(source, /^@import "\\.\\/foundation\\/index\\.css";/);
  assert.match(index, /@import "\\.\\/tokens\\.css";/);
});

test("Design-System enthält keine top-level :root-Blöcke mehr", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.equal(countTopLevelRootBlocks(source), 0);
});

test("Tokens enthalten mindestens einen top-level :root-Block", () => {
  const tokens = fs.readFileSync(tokensFile, "utf8");
  assert.ok(countTopLevelRootBlocks(tokens) >= 1);
});
`;

const desired = new Map([
  [SOURCE, transformed.source],
  [INDEX, indexContent],
  [TOKENS, transformed.tokens],
  [TEST, testContent],
  [PACKAGE, updatePackage(fs.readFileSync(PACKAGE, "utf8"))]
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

  if (transformed.count !== null) {
    log("Extrahierte top-level :root-Blöcke: " + transformed.count);
  }

  execFileSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "test:css-foundation"],
    { cwd: ROOT, stdio: "inherit", env: process.env }
  );

  if (fs.existsSync(path.join(APP, "test", "css-architecture.test.mjs"))) {
    execFileSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", "test:css-architecture"],
      { cwd: ROOT, stdio: "inherit", env: process.env }
    );
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
