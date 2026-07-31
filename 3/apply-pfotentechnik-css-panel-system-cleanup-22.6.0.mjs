#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-panel-system-cleanup-22.6.0";
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
const SOURCE = path.join(STYLES, "pfotentechnik-design-system.css");
const COMPONENTS = path.join(STYLES, "components");
const COMPONENTS_INDEX = path.join(COMPONENTS, "index.css");
const CARDS = path.join(COMPONENTS, "cards.css");
const PANELS = path.join(COMPONENTS, "panels.css");
const TEST = path.join(APP, "test", "css-panel-system.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-panel-system-22.6.0.json");
const REPORT_MD = path.join(REPORT_DIR, "css-panel-system-22.6.0.md");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const log = (m) => console.log("[" + NAME + "] " + m);

for (const file of [SOURCE, COMPONENTS_INDEX, CARDS, PACKAGE]) {
  if (!fs.existsSync(file)) throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
}

const selectors = [
  ":where(.premium-block, .quick-answer, .short-answer, .key-takeaway, .summary-box, .info-box, .callout, .highlight-box) :where(h2, h3, h4, strong)",
  ":where(.premium-block, .quick-answer, .short-answer, .key-takeaway, .summary-box, .info-box, .callout, .highlight-box) :where(p, li)",
  ":where(.info, .callout-info, .premium-block--info)",
  ":where(.warning, .callout-warning, .premium-block--warning)",
  ":where(.danger, .callout-danger, .premium-block--danger)",
  ":where(.success, .callout-success, .premium-block--success)"
];

function normalizeSelector(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*,\s*/g, ", ")
    .trim();
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

function extractTopLevelRules(css) {
  const rules = [];
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
      const start = css.lastIndexOf("\n", i - 1) + 1;
      const selector = css.slice(start, i).trim();
      if (selector.startsWith("@")) {
        const close = findMatchingBrace(css, i);
        i = close;
        continue;
      }
      const close = findMatchingBrace(css, i);
      rules.push({ selector, start, end: close + 1, body: css.slice(i + 1, close) });
      i = close;
    }
  }
  return rules;
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

function cleanBody(body) {
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
  return { text: kept.map((x) => "  " + x + ";").join("\n"), removed };
}

const sourceBefore = fs.readFileSync(SOURCE, "utf8");
const indexBefore = fs.readFileSync(COMPONENTS_INDEX, "utf8");
const alreadyInstalled = fs.existsSync(PANELS) && indexBefore.includes('@import "./panels.css";');

let sourceAfter = sourceBefore;
let panelsContent;
let migratedRules = 0;
let duplicateDeclarationsRemoved = 0;

if (alreadyInstalled) {
  panelsContent = fs.readFileSync(PANELS, "utf8");
} else {
  const rules = extractTopLevelRules(sourceBefore);
  const extracted = selectors.map((selector) => {
    const matches = rules.filter((rule) => normalizeSelector(rule.selector) === selector);
    if (matches.length !== 1) {
      throw new Error("Panel-Regel nicht eindeutig: " + selector + " (Treffer: " + matches.length + ")");
    }
    const cleaned = cleanBody(matches[0].body);
    duplicateDeclarationsRemoved += cleaned.removed;
    return {
      ...matches[0],
      css: selector + " {\n" + cleaned.text + "\n}"
    };
  });

  for (const rule of [...extracted].sort((a, b) => b.start - a.start)) {
    sourceAfter = sourceAfter.slice(0, rule.start) + sourceAfter.slice(rule.end);
  }
  sourceAfter = sourceAfter.replace(/\n{3,}/g, "\n\n");
  migratedRules = extracted.length;

  panelsContent =
`/* PfotenTechnik editorial panel primitives.
 * Typografie und semantische Zustandsvarianten.
 */

${extracted.map((rule) => rule.css).join("\n\n")}
`;
}

const indexAfter = indexBefore.includes('@import "./panels.css";')
  ? indexBefore
  : indexBefore.replace(
      '@import "./cards.css";',
      '@import "./cards.css";\n@import "./panels.css";'
    );

if (!indexAfter.includes('@import "./cards.css";')) {
  throw new Error("22.5.0 Card-System ist nicht vollständig installiert.");
}

const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
pkg.scripts ||= {};
pkg.scripts["test:css-panel-system"] = "node --test test/css-panel-system.test.mjs";
const packageAfter = JSON.stringify(pkg, null, 2) + "\n";

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = path.join(APP, "src", "styles");
const legacyFile = path.join(styles, "pfotentechnik-design-system.css");
const indexFile = path.join(styles, "components", "index.css");
const cardsFile = path.join(styles, "components", "cards.css");
const panelsFile = path.join(styles, "components", "panels.css");

const selectors = ${JSON.stringify(selectors, null, 2)};

test("Panels werden nach Cards eingebunden", () => {
  const index = fs.readFileSync(indexFile, "utf8");
  assert.match(index, /@import "\\.\\/cards\\.css";[\\s\\S]*@import "\\.\\/panels\\.css";/);
  assert.ok(fs.existsSync(cardsFile));
  assert.ok(fs.existsSync(panelsFile));
});

test("gemeinsame Panelregeln wurden aus Legacy entfernt", () => {
  const legacy = fs.readFileSync(legacyFile, "utf8");
  for (const selector of selectors) {
    assert.ok(!legacy.includes(selector + " {"), "Legacy enthält weiterhin: " + selector);
  }
});

test("gemeinsame Panelregeln liegen im Komponenten-Layer", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  for (const selector of selectors) {
    assert.ok(panels.includes(selector + " {"), "Panel Layer fehlt: " + selector);
  }
});

test("alle semantischen Panelvarianten bleiben erhalten", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  for (const alias of [
    ".callout-info",
    ".callout-warning",
    ".callout-danger",
    ".callout-success",
    ".premium-block--info",
    ".premium-block--warning",
    ".premium-block--danger",
    ".premium-block--success"
  ]) {
    assert.ok(panels.includes(alias), "Panel-Alias fehlt: " + alias);
  }
});

test("Panel-Typografie bleibt auf Panel-Kontexte begrenzt", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.doesNotMatch(panels, /(^|\\n)\\s*:where\\(h[1-6]|(^|\\n)\\s*p\\s*\\{/);
});

test("Panel Layer enthält keine Layout- oder Komponentenunterelemente", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.doesNotMatch(panels, /@media|\\.container|__|\\.product-price|\\.comparison-winner/);
});

test("Panel Layer führt kein important ein", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.doesNotMatch(panels, /!important/);
});
`;

const report = {
  patch: NAME,
  migratedRules,
  duplicateDeclarationsRemoved,
  semanticVariants: ["info", "warning", "danger", "success"],
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  panelLayerBytes: Buffer.byteLength(panelsContent),
  sourceReduction: Buffer.byteLength(sourceBefore) - Buffer.byteLength(sourceAfter),
  alreadyInstalled,
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Panel System 22.6.0

- Migrierte Regeln: ${report.migratedRules}
- Doppelte Deklarationen entfernt: ${report.duplicateDeclarationsRemoved}
- Semantische Varianten: ${report.semanticVariants.join(", ")}
- Legacy-Datei vorher: ${report.sourceBytesBefore} Bytes
- Legacy-Datei nachher: ${report.sourceBytesAfter} Bytes
- Panel Layer: ${report.panelLayerBytes} Bytes
- Aus Legacy entfernt: ${report.sourceReduction} Bytes

## Umfang

Migriert werden ausschließlich gemeinsame redaktionelle Panelregeln:

- Überschriften und hervorgehobener Text
- Fließtext und Listen
- Info
- Warnung
- Gefahr
- Erfolg

TOC-, FAQ-, Produkt-, Vergleichs- und Admin-spezifische Regeln bleiben
unverändert.
`;

const desired = new Map([
  [SOURCE, sourceAfter],
  [COMPONENTS_INDEX, indexAfter],
  [PANELS, panelsContent],
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

  log("Migrierte Panel-Regeln: " + report.migratedRules);
  log("Doppelte Deklarationen entfernt: " + report.duplicateDeclarationsRemoved);
  log("Legacy-Datei: " + report.sourceBytesBefore + " -> " + report.sourceBytesAfter + " Bytes");

  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:css-panel-system"], {
    cwd: ROOT, stdio: "inherit", env: process.env
  });

  for (const [script, file] of [
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
