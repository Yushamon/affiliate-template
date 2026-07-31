#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-button-system-cleanup-22.4.0";
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
const FOUNDATION_INDEX = path.join(STYLES, "foundation", "index.css");
const LAYOUT_INDEX = path.join(STYLES, "layout", "index.css");
const COMPONENTS_DIR = path.join(STYLES, "components");
const COMPONENTS_INDEX = path.join(COMPONENTS_DIR, "index.css");
const BUTTONS = path.join(COMPONENTS_DIR, "buttons.css");
const TEST = path.join(APP, "test", "css-button-system.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-button-system-22.4.0.json");
const REPORT_MD = path.join(REPORT_DIR, "css-button-system-22.4.0.md");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const log = (m) => console.log("[" + NAME + "] " + m);

for (const file of [SOURCE, FOUNDATION_INDEX, LAYOUT_INDEX, PACKAGE]) {
  if (!fs.existsSync(file)) throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
}

const specs = [
  {
    name: "base",
    selector: ":where(.pt-button, .button-primary, .button-secondary, .cta-button, .affiliate-button)"
  },
  {
    name: "primary",
    selector: ":where(.pt-button-primary, .button-primary, .cta-button, .affiliate-button)"
  },
  {
    name: "primary-hover",
    selector: ":where(.pt-button-primary, .button-primary, .cta-button, .affiliate-button):hover"
  },
  {
    name: "secondary",
    selector: ":where(.pt-button-secondary, .button-secondary)"
  }
];

function normalizeSelector(value) {
  return value.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim();
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
  let depth = 0;
  let start = 0;
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

    if (ch === "{" && depth === 0) {
      const selectorStart = css.lastIndexOf("\n", i - 1) + 1;
      const selector = css.slice(selectorStart, i).trim();
      const close = findMatchingBrace(css, i);
      rules.push({
        selector,
        start: selectorStart,
        end: close + 1,
        body: css.slice(i + 1, close)
      });
      i = close;
      start = close + 1;
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
const foundationBefore = fs.readFileSync(FOUNDATION_INDEX, "utf8");
const alreadyInstalled =
  fs.existsSync(BUTTONS) &&
  foundationBefore.includes('@import "../components/index.css";');

let sourceAfter = sourceBefore;
let buttonsContent;
let removedDuplicates = 0;
let migratedRules = 0;

if (alreadyInstalled) {
  buttonsContent = fs.readFileSync(BUTTONS, "utf8");
} else {
  if (!foundationBefore.includes('@import "../layout/index.css";')) {
    throw new Error("22.3.0 Layout Layer ist nicht installiert.");
  }

  const topRules = extractTopLevelRules(sourceBefore);
  const extracted = specs.map((spec) => {
    const matches = topRules.filter(
      (rule) => normalizeSelector(rule.selector) === normalizeSelector(spec.selector)
    );
    if (matches.length !== 1) {
      throw new Error(spec.name + ": genau 1 Regel erwartet, gefunden: " + matches.length);
    }
    const cleaned = cleanBody(matches[0].body);
    removedDuplicates += cleaned.removed;
    return {
      ...matches[0],
      css: normalizeSelector(matches[0].selector) + " {\n" + cleaned.text + "\n}"
    };
  });

  for (const rule of [...extracted].sort((a, b) => b.start - a.start)) {
    sourceAfter = sourceAfter.slice(0, rule.start) + sourceAfter.slice(rule.end);
  }
  sourceAfter = sourceAfter.replace(/\n{3,}/g, "\n\n");
  migratedRules = extracted.length;

  buttonsContent =
`/* PfotenTechnik shared button primitives.
 * Bestehende Klassennamen bleiben als kompatible Aliase erhalten.
 */

${extracted.map((rule) => rule.css).join("\n\n")}
`;
}

const componentsIndexContent =
`/* PfotenTechnik shared component entrypoint. */
@import "./buttons.css";
`;

const foundationAfter = foundationBefore.includes('@import "../components/index.css";')
  ? foundationBefore
  : foundationBefore.replace(
      '@import "../layout/index.css";',
      '@import "../layout/index.css";\n@import "../components/index.css";'
    );

const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
pkg.scripts ||= {};
pkg.scripts["test:css-button-system"] = "node --test test/css-button-system.test.mjs";
const packageAfter = JSON.stringify(pkg, null, 2) + "\n";

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = path.join(APP, "src", "styles");
const legacyFile = path.join(styles, "pfotentechnik-design-system.css");
const foundationIndex = path.join(styles, "foundation", "index.css");
const componentIndex = path.join(styles, "components", "index.css");
const buttonsFile = path.join(styles, "components", "buttons.css");

const exactSnippets = [
  ":where(.pt-button, .button-primary, .button-secondary, .cta-button, .affiliate-button)",
  ":where(.pt-button-primary, .button-primary, .cta-button, .affiliate-button)",
  ":where(.pt-button-primary, .button-primary, .cta-button, .affiliate-button):hover",
  ":where(.pt-button-secondary, .button-secondary)"
];

test("Komponenten-Layer wird nach Layout eingebunden", () => {
  const foundation = fs.readFileSync(foundationIndex, "utf8");
  assert.match(
    foundation,
    /@import "\\.\\.\\/layout\\/index\\.css";[\\s\\S]*@import "\\.\\.\\/components\\/index\\.css";/
  );
  assert.ok(fs.existsSync(componentIndex));
  assert.ok(fs.existsSync(buttonsFile));
});

test("gemeinsame Buttonregeln wurden aus Legacy entfernt", () => {
  const legacy = fs.readFileSync(legacyFile, "utf8");
  for (const snippet of exactSnippets) {
    assert.ok(!legacy.includes(snippet + " {"), "Legacy enthält weiterhin: " + snippet);
  }
});

test("gemeinsame Buttonregeln liegen im Komponenten-Layer", () => {
  const buttons = fs.readFileSync(buttonsFile, "utf8");
  for (const snippet of exactSnippets) {
    assert.ok(buttons.includes(snippet + " {"), "Button Layer fehlt: " + snippet);
  }
});

test("alle bisherigen Alias-Klassen bleiben erhalten", () => {
  const buttons = fs.readFileSync(buttonsFile, "utf8");
  for (const alias of [
    ".pt-button",
    ".pt-button-primary",
    ".pt-button-secondary",
    ".button-primary",
    ".button-secondary",
    ".cta-button",
    ".affiliate-button"
  ]) {
    assert.ok(buttons.includes(alias), "Alias fehlt: " + alias);
  }
});

test("Button-Layer enthält keine kontextspezifischen Komponenten", () => {
  const buttons = fs.readFileSync(buttonsFile, "utf8");
  assert.doesNotMatch(buttons, /\\.nav-toggle-button|\\.site-header-v2|\\.sticky|\\.comparison|\\.product-card/);
});

test("Button-Layer führt kein important ein", () => {
  const buttons = fs.readFileSync(buttonsFile, "utf8");
  assert.doesNotMatch(buttons, /!important/);
});
`;

const report = {
  patch: NAME,
  migratedRules,
  duplicateDeclarationsRemoved: removedDuplicates,
  aliasesPreserved: [
    ".pt-button",
    ".pt-button-primary",
    ".pt-button-secondary",
    ".button-primary",
    ".button-secondary",
    ".cta-button",
    ".affiliate-button"
  ],
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  buttonLayerBytes: Buffer.byteLength(buttonsContent),
  sourceReduction: Buffer.byteLength(sourceBefore) - Buffer.byteLength(sourceAfter),
  alreadyInstalled,
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Button System 22.4.0

- Migrierte Regeln: ${report.migratedRules}
- Doppelte Deklarationen entfernt: ${report.duplicateDeclarationsRemoved}
- Legacy-Datei vorher: ${report.sourceBytesBefore} Bytes
- Legacy-Datei nachher: ${report.sourceBytesAfter} Bytes
- Button Layer: ${report.buttonLayerBytes} Bytes
- Aus Legacy entfernt: ${report.sourceReduction} Bytes

## Umfang

Migriert werden nur die vier bestehenden gemeinsamen Button-Primitives.
Header-Menübutton, Sticky-CTA, Comparison- und Product-spezifische Regeln bleiben
unverändert.

## Kompatibilität

Alle bisherigen Alias-Klassen bleiben bestehen. Astro-Komponenten werden nicht
angepasst.
`;

const desired = new Map([
  [SOURCE, sourceAfter],
  [FOUNDATION_INDEX, foundationAfter],
  [COMPONENTS_INDEX, componentsIndexContent],
  [BUTTONS, buttonsContent],
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

  log("Migrierte Button-Regeln: " + report.migratedRules);
  log("Doppelte Deklarationen entfernt: " + report.duplicateDeclarationsRemoved);
  log("Legacy-Datei: " + report.sourceBytesBefore + " -> " + report.sourceBytesAfter + " Bytes");

  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:css-button-system"], {
    cwd: ROOT, stdio: "inherit", env: process.env
  });

  for (const [script, file] of [
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
