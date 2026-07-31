#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-base-layer-cleanup-22.2.0";
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
const FOUNDATION = path.join(STYLES, "foundation");
const INDEX = path.join(FOUNDATION, "index.css");
const BASE = path.join(FOUNDATION, "base.css");
const TEST = path.join(APP, "test", "css-base-layer.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-base-layer-22.2.0.json");
const REPORT_MD = path.join(REPORT_DIR, "css-base-layer-22.2.0.md");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-")
);

const log = (message) => console.log("[" + NAME + "] " + message);

for (const required of [SOURCE, INDEX, PACKAGE]) {
  if (!fs.existsSync(required)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, required));
  }
}

function skipTrivia(css, start) {
  let i = start;
  while (i < css.length) {
    if (/\s/.test(css[i])) {
      i += 1;
      continue;
    }
    if (css[i] === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      if (end < 0) throw new Error("Nicht geschlossener CSS-Kommentar.");
      i = end + 2;
      continue;
    }
    break;
  }
  return i;
}

function readStatement(css, start) {
  let i = skipTrivia(css, start);
  const actualStart = i;
  let quote = null;
  let escaped = false;
  let comment = false;

  for (; i < css.length; i += 1) {
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

    if (ch === ";") {
      return {
        type: "at-statement",
        start: actualStart,
        end: i + 1,
        header: css.slice(actualStart, i + 1).trim(),
        text: css.slice(actualStart, i + 1)
      };
    }

    if (ch === "{") {
      const header = css.slice(actualStart, i).trim();
      let depth = 1;
      let j = i + 1;
      let innerQuote = null;
      let innerEscaped = false;
      let innerComment = false;

      for (; j < css.length; j += 1) {
        const c = css[j];
        const n = css[j + 1];

        if (innerComment) {
          if (c === "*" && n === "/") {
            innerComment = false;
            j += 1;
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
          j += 1;
          continue;
        }
        if (c === '"' || c === "'") {
          innerQuote = c;
          continue;
        }
        if (c === "{") depth += 1;
        else if (c === "}") {
          depth -= 1;
          if (depth === 0) {
            return {
              type: header.startsWith("@") ? "at-block" : "rule",
              start: actualStart,
              open: i,
              end: j + 1,
              header,
              body: css.slice(i + 1, j),
              text: css.slice(actualStart, j + 1)
            };
          }
        }
      }
      throw new Error("Nicht geschlossener CSS-Block: " + header);
    }
  }

  return null;
}

function normalizeSelector(value) {
  return value.replace(/\/\*[\s\S]*?\*\//g, "").trim();
}

function splitDeclarations(body) {
  const items = [];
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
      if (raw) items.push(raw);
      start = i + 1;
    }
  }
  return items;
}

function cleanupBlock(block) {
  const declarations = splitDeclarations(block.body);
  const lastIndex = new Map();
  declarations.forEach((declaration, index) => {
    const colon = declaration.indexOf(":");
    if (colon > 0) {
      const property = declaration.slice(0, colon).trim().toLowerCase();
      lastIndex.set(property, index);
    }
  });

  let removed = 0;
  const kept = declarations.filter((declaration, index) => {
    const colon = declaration.indexOf(":");
    if (colon <= 0) return true;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    const keep = lastIndex.get(property) === index;
    if (!keep) removed += 1;
    return keep;
  });

  const formattedBody = kept.map((item) => "  " + item + ";").join("\n");
  return {
    text: normalizeSelector(block.header) + " {\n" + formattedBody + "\n}",
    removed
  };
}

function transform(source) {
  const foundationImport = '@import "./foundation/index.css";';
  if (!source.includes(foundationImport)) {
    throw new Error("22.1.0 Foundation-Import fehlt. Zuerst 22.1.0 installieren.");
  }

  const allowed = new Set(["html", "body", "::selection"]);
  const importEnd = source.indexOf(foundationImport) + foundationImport.length;
  let cursor = importEnd;
  const migrated = [];
  const ranges = [];
  let duplicatesRemoved = 0;

  while (true) {
    const statement = readStatement(source, cursor);
    if (!statement) break;

    if (statement.type === "at-statement" && statement.header.startsWith("@import")) {
      cursor = statement.end;
      continue;
    }

    if (statement.type !== "rule") break;
    const selector = normalizeSelector(statement.header);
    if (!allowed.has(selector)) break;

    const cleaned = cleanupBlock(statement);
    migrated.push({ selector, text: cleaned.text });
    duplicatesRemoved += cleaned.removed;
    ranges.push([statement.start, statement.end]);
    cursor = statement.end;
  }

  if (migrated.length === 0) {
    if (fs.existsSync(BASE) && !source.match(/(?:^|\n)\s*(html|body|::selection)\s*\{/)) {
      return {
        source,
        base: fs.readFileSync(BASE, "utf8"),
        migratedSelectors: [],
        duplicatesRemoved: 0,
        already: true
      };
    }
    throw new Error(
      "Kein sicherer zusammenhängender Base-Präfix gefunden. Automatische Migration abgebrochen."
    );
  }

  if (!migrated.some((item) => item.selector === "body")) {
    throw new Error("Body-Regel fehlt im sicheren Base-Präfix; Migration abgebrochen.");
  }

  let remainder = source;
  for (const [start, end] of [...ranges].sort((a, b) => b[0] - a[0])) {
    remainder = remainder.slice(0, start) + "\n" + remainder.slice(end);
  }
  remainder = remainder.replace(/\n{3,}/g, "\n\n");

  const base =
    "/* PfotenTechnik global base layer.\n" +
    " * Enthält ausschließlich früh geladene, globale Dokument-Basisregeln.\n" +
    " */\n\n" +
    migrated.map((item) => item.text).join("\n\n") +
    "\n";

  return {
    source: remainder,
    base,
    migratedSelectors: migrated.map((item) => item.selector),
    duplicatesRemoved,
    already: false
  };
}

function updateIndex(content) {
  if (content.includes('@import "./base.css";')) return content;
  const tokenImport = '@import "./tokens.css";';
  if (!content.includes(tokenImport)) {
    throw new Error("foundation/index.css enthält keinen tokens.css-Import.");
  }
  return content.replace(tokenImport, tokenImport + '\n@import "./base.css";');
}

function updatePackage(content) {
  const pkg = JSON.parse(content);
  pkg.scripts ||= {};
  pkg.scripts["test:css-base-layer"] =
    "node --test test/css-base-layer.test.mjs";
  return JSON.stringify(pkg, null, 2) + "\n";
}

const sourceBefore = fs.readFileSync(SOURCE, "utf8");
const result = transform(sourceBefore);
const indexBefore = fs.readFileSync(INDEX, "utf8");
const indexAfter = updateIndex(indexBefore);

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceFile = path.join(APP, "src", "styles", "pfotentechnik-design-system.css");
const indexFile = path.join(APP, "src", "styles", "foundation", "index.css");
const baseFile = path.join(APP, "src", "styles", "foundation", "base.css");

test("Base Layer ist über den Foundation-Entry eingebunden", () => {
  assert.ok(fs.existsSync(baseFile));
  const index = fs.readFileSync(indexFile, "utf8");
  assert.match(index, /@import "\\.\\/tokens\\.css";[\\s\\S]*@import "\\.\\/base\\.css";/);
});

test("globale Präfix-Regeln wurden aus dem Legacy-Design-System entfernt", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const withoutComments = source.replace(/\\/\\*[\\s\\S]*?\\*\\//g, "");
  assert.doesNotMatch(withoutComments, /(?:^|\\n)\\s*html\\s*\\{/);
  assert.doesNotMatch(withoutComments, /(?:^|\\n)\\s*body\\s*\\{/);
  assert.doesNotMatch(withoutComments, /(?:^|\\n)\\s*::selection\\s*\\{/);
});

test("Base Layer enthält Dokument-Basisregeln", () => {
  const base = fs.readFileSync(baseFile, "utf8");
  assert.match(base, /(?:^|\\n)html\\s*\\{/);
  assert.match(base, /(?:^|\\n)body\\s*\\{/);
});
`;

const report = {
  patch: NAME,
  source: path.relative(ROOT, SOURCE),
  base: path.relative(ROOT, BASE),
  migratedSelectors: result.migratedSelectors,
  duplicateDeclarationsRemoved: result.duplicatesRemoved,
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(result.source),
  baseBytes: Buffer.byteLength(result.base),
  netSourceReduction:
    Buffer.byteLength(sourceBefore) -
    Buffer.byteLength(result.source) -
    Buffer.byteLength(result.base),
  generatedAt: new Date().toISOString()
};

const reportMarkdown = `# CSS Base Layer 22.2.0

- Migrierte Selektoren: ${report.migratedSelectors.join(", ") || "bereits migriert"}
- Doppelte Deklarationen entfernt: ${report.duplicateDeclarationsRemoved}
- Legacy-Datei vorher: ${report.sourceBytesBefore} Bytes
- Legacy-Datei nachher: ${report.sourceBytesAfter} Bytes
- base.css: ${report.baseBytes} Bytes
- Netto-Cleanup: ${report.netSourceReduction} Bytes

## Sicherheitsprinzip

Es wurden ausschließlich unmittelbar nach dem Foundation-Import stehende globale
Basisregeln migriert. Später definierte oder verschachtelte Regeln wurden nicht
verschoben, damit sich die Kaskadenreihenfolge nicht verändert.
`;

const desired = new Map([
  [SOURCE, result.source],
  [INDEX, indexAfter],
  [BASE, result.base],
  [TEST, testContent],
  [PACKAGE, updatePackage(fs.readFileSync(PACKAGE, "utf8"))],
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

  log("Migriert: " + (report.migratedSelectors.join(", ") || "bereits vorhanden"));
  log("Doppelte Deklarationen entfernt: " + report.duplicateDeclarationsRemoved);
  log("Legacy-Datei: " + report.sourceBytesBefore + " -> " + report.sourceBytesAfter + " Bytes");
  log("Base Layer: " + report.baseBytes + " Bytes");

  execFileSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "test:css-base-layer"],
    { cwd: ROOT, stdio: "inherit", env: process.env }
  );

  if (fs.existsSync(path.join(APP, "test", "css-foundation-tokens.test.mjs"))) {
    execFileSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", "test:css-foundation"],
      { cwd: ROOT, stdio: "inherit", env: process.env }
    );
  }

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
