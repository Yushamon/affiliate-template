#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const WRITE = process.argv.includes("--write");

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
const CARD_PRIMITIVES = path.join(APP, "src", "styles", "components", "cards.css");
const COMPONENT_INDEX = path.join(APP, "src", "styles", "components", "index.css");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-card-primitive-adoption-23.1.0.json");
const REPORT_MD = path.join(REPORT_DIR, "css-card-primitive-adoption-23.1.0.md");

const CARD_CLASSES = new Set([
  ".pt-category-card",
  ".pt-value-card",
  ".pt-product-card",
  ".product-card",
  ".comparison-card",
  ".guide-card",
  ".result-card",
  ".premium-block",
  ".faq-item"
]);

const INTERACTIVE_CLASSES = new Set([
  ".pt-category-card",
  ".pt-value-card",
  ".pt-product-card",
  ".product-card",
  ".comparison-card",
  ".guide-card"
]);

const BASE_DECLARATIONS = new Map([
  ["border-color", "var(--pt-line)"],
  ["border-radius", "var(--pt-radius-lg)"],
  ["background", "var(--pt-surface)"],
  ["box-shadow", "var(--pt-shadow-sm)"]
]);

const MOTION_DECLARATIONS = new Map([
  ["transition", "border-color 160ms ease,box-shadow 160ms ease,transform 160ms ease"]
]);

const HOVER_DECLARATIONS = new Map([
  ["border-color", "rgba(31,164,99,0.28)"],
  ["box-shadow", "var(--pt-shadow-md)"],
  ["transform", "translateY(-2px)"]
]);

const SEARCH_ROOTS = [
  path.join(APP, "src"),
  path.join(ROOT, "packages", "affiliate-core", "src")
];

const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  ".astro",
  ".git",
  ".patch-backups",
  "reports"
]);

function normalizeValue(value) {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([,:;()])\s*/g, "$1")
    .trim();
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else if (entry.isFile() && (full.endsWith(".css") || full.endsWith(".astro"))) output.push(full);
  }
  return output;
}

function extractStyleRanges(source, filename) {
  if (filename.endsWith(".css")) return [{ start: 0, end: source.length }];
  const ranges = [];
  const pattern = /<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g;
  let match;
  while ((match = pattern.exec(source))) {
    const start = match.index + match[0].indexOf(match[1]);
    ranges.push({ start, end: start + match[1].length });
  }
  return ranges;
}

function splitSelectorList(selector) {
  const items = [];
  let start = 0;
  let depth = 0;
  for (let i = 0; i <= selector.length; i += 1) {
    const ch = selector[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if ((ch === "," || i === selector.length) && depth === 0) {
      const item = selector.slice(start, i).trim();
      if (item) items.push(item);
      start = i + 1;
    }
  }
  return items;
}

function expandWhere(selector) {
  const match = selector.match(/^:where\(([\s\S]+)\)(:hover)?$/);
  if (!match) return [selector.trim()];
  const suffix = match[2] || "";
  return splitSelectorList(match[1]).map((item) => item.trim() + suffix);
}

function classifySelector(selector) {
  const expanded = splitSelectorList(selector).flatMap(expandWhere);
  if (!expanded.length) return null;

  const parsed = [];
  for (const item of expanded) {
    const hover = item.endsWith(":hover");
    const base = hover ? item.slice(0, -6).trim() : item.trim();

    if (!/^\.([a-zA-Z0-9_-]+)$/.test(base)) return null;
    if (!CARD_CLASSES.has(base)) return null;
    if (hover && !INTERACTIVE_CLASSES.has(base)) return null;

    parsed.push({ base, hover });
  }

  const hoverStates = new Set(parsed.map((item) => item.hover));
  if (hoverStates.size !== 1) return null;

  const isHover = parsed[0].hover;
  const allInteractive = parsed.every((item) => INTERACTIVE_CLASSES.has(item.base));

  if (isHover) return "hover";
  if (allInteractive) return "base-or-motion";
  return "base";
}

function splitDeclarations(body) {
  const items = [];
  let start = 0;
  let quote = null;
  let escaped = false;
  let parenDepth = 0;
  let comment = false;

  for (let i = 0; i <= body.length; i += 1) {
    const ch = body[i];
    const next = body[i + 1];

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
    if (ch === "(") parenDepth += 1;
    else if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if ((ch === ";" || i === body.length) && parenDepth === 0) {
      const raw = body.slice(start, i);
      const trimmed = raw.trim();
      if (trimmed) {
        const colon = trimmed.indexOf(":");
        items.push({
          raw,
          property: colon > 0 ? trimmed.slice(0, colon).trim().toLowerCase() : "",
          value: colon > 0 ? trimmed.slice(colon + 1).trim() : "",
          start,
          end: i + (ch === ";" ? 1 : 0)
        });
      }
      start = i + 1;
    }
  }
  return items;
}

function targetMapFor(classification, property) {
  if (classification === "hover") return HOVER_DECLARATIONS;
  if (classification === "base") return BASE_DECLARATIONS;
  if (classification === "base-or-motion") {
    if (property === "transition") return MOTION_DECLARATIONS;
    return BASE_DECLARATIONS;
  }
  return null;
}

function cleanCss(css, filename) {
  const edits = [];
  const findings = [];
  const stack = [];
  let quote = null;
  let escaped = false;
  let comment = false;
  let tokenStart = 0;

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
      const prelude = css.slice(tokenStart, i).trim();
      stack.push({ prelude, bodyStart: i + 1 });
      tokenStart = i + 1;
      continue;
    }

    if (ch === "}") {
      const block = stack.pop();
      if (!block) {
        tokenStart = i + 1;
        continue;
      }

      if (!block.prelude.startsWith("@")) {
        const classification = classifySelector(block.prelude);
        if (classification) {
          const body = css.slice(block.bodyStart, i);
          for (const declaration of splitDeclarations(body)) {
            const targets = targetMapFor(classification, declaration.property);
            if (!targets || !targets.has(declaration.property)) continue;

            const expected = targets.get(declaration.property);
            if (normalizeValue(declaration.value) !== expected) continue;

            edits.push({
              start: block.bodyStart + declaration.start,
              end: block.bodyStart + declaration.end
            });
            findings.push({
              file: path.relative(ROOT, filename),
              selector: block.prelude,
              property: declaration.property,
              value: declaration.value
            });
          }
        }
      }

      tokenStart = i + 1;
      continue;
    }

    if (ch === ";" && stack.length === 0) tokenStart = i + 1;
  }

  let cleaned = css;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    cleaned = cleaned.slice(0, edit.start) + cleaned.slice(edit.end);
  }

  cleaned = cleaned.replace(/[ \t]+\n/g, "\n");
  return { cleaned, findings };
}

if (!fs.existsSync(CARD_PRIMITIVES)) {
  throw new Error("Shared Card-Primitives fehlen: " + path.relative(ROOT, CARD_PRIMITIVES));
}
if (!fs.existsSync(COMPONENT_INDEX)) {
  throw new Error("Component-Entrypoint fehlt: " + path.relative(ROOT, COMPONENT_INDEX));
}

const primitiveCss = fs.readFileSync(CARD_PRIMITIVES, "utf8");
const componentIndex = fs.readFileSync(COMPONENT_INDEX, "utf8");

for (const required of [
  "border-color: var(--pt-line)",
  "border-radius: var(--pt-radius-lg)",
  "background: var(--pt-surface)",
  "box-shadow: var(--pt-shadow-sm)",
  "transition: border-color 160ms ease",
  "transform: translateY(-2px)"
]) {
  if (!primitiveCss.includes(required)) {
    throw new Error("Card-Primitive unvollständig: " + required);
  }
}
if (!componentIndex.includes('@import "./cards.css";')) {
  throw new Error("cards.css wird nicht über components/index.css geladen.");
}

const files = [...new Set(SEARCH_ROOTS.flatMap((dir) => walk(dir)))].sort();
const reports = [];
let declarationsRemoved = 0;
let bytesSaved = 0;

for (const file of files) {
  if (path.resolve(file) === path.resolve(CARD_PRIMITIVES)) continue;

  const source = fs.readFileSync(file, "utf8");
  const ranges = extractStyleRanges(source, file);
  if (!ranges.length) continue;

  let next = source;
  const findings = [];

  for (const range of [...ranges].sort((a, b) => b.start - a.start)) {
    const fragment = next.slice(range.start, range.end);
    const result = cleanCss(fragment, file);
    if (!result.findings.length) continue;

    next = next.slice(0, range.start) + result.cleaned + next.slice(range.end);
    findings.push(...result.findings);
  }

  if (!findings.length) continue;

  reports.push({
    file: path.relative(ROOT, file),
    declarationsRemoved: findings.length,
    bytesBefore: Buffer.byteLength(source),
    bytesAfter: Buffer.byteLength(next),
    findings
  });

  declarationsRemoved += findings.length;
  bytesSaved += Buffer.byteLength(source) - Buffer.byteLength(next);

  if (WRITE) fs.writeFileSync(file, next);
}

const report = {
  version: "23.1.0",
  mode: WRITE ? "write" : "dry-run",
  filesScanned: files.length,
  filesChanged: reports.length,
  declarationsRemoved,
  bytesSaved,
  sharedPrimitive: path.relative(ROOT, CARD_PRIMITIVES),
  files: reports,
  generatedAt: new Date().toISOString()
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");

const markdown = `# Card Primitive Adoption 23.1.0

- Modus: ${report.mode}
- geprüfte CSS-/Astro-Dateien: ${report.filesScanned}
- betroffene Dateien: ${report.filesChanged}
- entfernte bereits zentral abgedeckte Deklarationen: ${report.declarationsRemoved}
- eingesparte Bytes: ${report.bytesSaved}

## Sicherheitsgrenze

Entfernt werden nur Deklarationen, die durch
\`${report.sharedPrimitive}\` bereits mit demselben Wert abgedeckt sind.

Zulässig sind ausschließlich einfache Selektoren aus der bekannten
Card-Familie. Descendant-, Modifier-, Attribute-, Theme- und Media-Regeln
werden nicht verändert.

## Dateien

${report.files.length
  ? report.files.map((item) =>
      `- \`${item.file}\`: ${item.declarationsRemoved} Deklarationen, ${item.bytesBefore - item.bytesAfter} Bytes`
    ).join("\n")
  : "Keine sicheren Adoption-Kandidaten gefunden."}
`;

fs.writeFileSync(REPORT_MD, markdown);
console.log("[css-card-primitive-adoption] Report:", path.relative(ROOT, REPORT_MD));
console.log("[css-card-primitive-adoption] Dateien:", report.filesChanged);
console.log("[css-card-primitive-adoption] Deklarationen:", report.declarationsRemoved);
console.log("[css-card-primitive-adoption] Bytes:", report.bytesSaved);
