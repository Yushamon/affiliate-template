#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-card-primitive-adoption-23.1.0";
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
const PACKAGE = path.join(APP, "package.json");
const SCRIPT = path.join(APP, "scripts", "design-system", "css-card-primitive-adoption.mjs");
const TEST = path.join(APP, "test", "css-card-primitive-adoption.test.mjs");
const REPORT_JSON = path.join(APP, "reports", "design-system", "css-card-primitive-adoption-23.1.0.json");
const REPORT_MD = path.join(APP, "reports", "design-system", "css-card-primitive-adoption-23.1.0.md");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const cleanupScript = "#!/usr/bin/env node\nimport fs from \"node:fs\";\nimport path from \"node:path\";\n\nconst WRITE = process.argv.includes(\"--write\");\n\nfunction findRoot(start) {\n  let dir = path.resolve(start);\n  for (let i = 0; i < 12; i += 1) {\n    if (fs.existsSync(path.join(dir, \"apps\", \"pfotentechnik\", \"package.json\"))) return dir;\n    const parent = path.dirname(dir);\n    if (parent === dir) break;\n    dir = parent;\n  }\n  throw new Error(\"Repository-Wurzel nicht gefunden.\");\n}\n\nconst ROOT = findRoot(process.cwd());\nconst APP = path.join(ROOT, \"apps\", \"pfotentechnik\");\nconst CARD_PRIMITIVES = path.join(APP, \"src\", \"styles\", \"components\", \"cards.css\");\nconst COMPONENT_INDEX = path.join(APP, \"src\", \"styles\", \"components\", \"index.css\");\nconst REPORT_DIR = path.join(APP, \"reports\", \"design-system\");\nconst REPORT_JSON = path.join(REPORT_DIR, \"css-card-primitive-adoption-23.1.0.json\");\nconst REPORT_MD = path.join(REPORT_DIR, \"css-card-primitive-adoption-23.1.0.md\");\n\nconst CARD_CLASSES = new Set([\n  \".pt-category-card\",\n  \".pt-value-card\",\n  \".pt-product-card\",\n  \".product-card\",\n  \".comparison-card\",\n  \".guide-card\",\n  \".result-card\",\n  \".premium-block\",\n  \".faq-item\"\n]);\n\nconst INTERACTIVE_CLASSES = new Set([\n  \".pt-category-card\",\n  \".pt-value-card\",\n  \".pt-product-card\",\n  \".product-card\",\n  \".comparison-card\",\n  \".guide-card\"\n]);\n\nconst BASE_DECLARATIONS = new Map([\n  [\"border-color\", \"var(--pt-line)\"],\n  [\"border-radius\", \"var(--pt-radius-lg)\"],\n  [\"background\", \"var(--pt-surface)\"],\n  [\"box-shadow\", \"var(--pt-shadow-sm)\"]\n]);\n\nconst MOTION_DECLARATIONS = new Map([\n  [\"transition\", \"border-color 160ms ease,box-shadow 160ms ease,transform 160ms ease\"]\n]);\n\nconst HOVER_DECLARATIONS = new Map([\n  [\"border-color\", \"rgba(31,164,99,0.28)\"],\n  [\"box-shadow\", \"var(--pt-shadow-md)\"],\n  [\"transform\", \"translateY(-2px)\"]\n]);\n\nconst SEARCH_ROOTS = [\n  path.join(APP, \"src\"),\n  path.join(ROOT, \"packages\", \"affiliate-core\", \"src\")\n];\n\nconst IGNORE_DIRS = new Set([\n  \"node_modules\",\n  \"dist\",\n  \".astro\",\n  \".git\",\n  \".patch-backups\",\n  \"reports\"\n]);\n\nfunction normalizeValue(value) {\n  return value\n    .replace(/\\/\\*[\\s\\S]*?\\*\\//g, \"\")\n    .replace(/\\s+/g, \" \")\n    .replace(/\\s*([,:;()])\\s*/g, \"$1\")\n    .trim();\n}\n\nfunction walk(dir, output = []) {\n  if (!fs.existsSync(dir)) return output;\n  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {\n    if (IGNORE_DIRS.has(entry.name)) continue;\n    const full = path.join(dir, entry.name);\n    if (entry.isDirectory()) walk(full, output);\n    else if (entry.isFile() && (full.endsWith(\".css\") || full.endsWith(\".astro\"))) output.push(full);\n  }\n  return output;\n}\n\nfunction extractStyleRanges(source, filename) {\n  if (filename.endsWith(\".css\")) return [{ start: 0, end: source.length }];\n  const ranges = [];\n  const pattern = /<style(?:\\s[^>]*)?>([\\s\\S]*?)<\\/style>/g;\n  let match;\n  while ((match = pattern.exec(source))) {\n    const start = match.index + match[0].indexOf(match[1]);\n    ranges.push({ start, end: start + match[1].length });\n  }\n  return ranges;\n}\n\nfunction splitSelectorList(selector) {\n  const items = [];\n  let start = 0;\n  let depth = 0;\n  for (let i = 0; i <= selector.length; i += 1) {\n    const ch = selector[i];\n    if (ch === \"(\") depth += 1;\n    else if (ch === \")\") depth = Math.max(0, depth - 1);\n    else if ((ch === \",\" || i === selector.length) && depth === 0) {\n      const item = selector.slice(start, i).trim();\n      if (item) items.push(item);\n      start = i + 1;\n    }\n  }\n  return items;\n}\n\nfunction expandWhere(selector) {\n  const match = selector.match(/^:where\\(([\\s\\S]+)\\)(:hover)?$/);\n  if (!match) return [selector.trim()];\n  const suffix = match[2] || \"\";\n  return splitSelectorList(match[1]).map((item) => item.trim() + suffix);\n}\n\nfunction classifySelector(selector) {\n  const expanded = splitSelectorList(selector).flatMap(expandWhere);\n  if (!expanded.length) return null;\n\n  const parsed = [];\n  for (const item of expanded) {\n    const hover = item.endsWith(\":hover\");\n    const base = hover ? item.slice(0, -6).trim() : item.trim();\n\n    if (!/^\\.([a-zA-Z0-9_-]+)$/.test(base)) return null;\n    if (!CARD_CLASSES.has(base)) return null;\n    if (hover && !INTERACTIVE_CLASSES.has(base)) return null;\n\n    parsed.push({ base, hover });\n  }\n\n  const hoverStates = new Set(parsed.map((item) => item.hover));\n  if (hoverStates.size !== 1) return null;\n\n  const isHover = parsed[0].hover;\n  const allInteractive = parsed.every((item) => INTERACTIVE_CLASSES.has(item.base));\n\n  if (isHover) return \"hover\";\n  if (allInteractive) return \"base-or-motion\";\n  return \"base\";\n}\n\nfunction splitDeclarations(body) {\n  const items = [];\n  let start = 0;\n  let quote = null;\n  let escaped = false;\n  let parenDepth = 0;\n  let comment = false;\n\n  for (let i = 0; i <= body.length; i += 1) {\n    const ch = body[i];\n    const next = body[i + 1];\n\n    if (comment) {\n      if (ch === \"*\" && next === \"/\") {\n        comment = false;\n        i += 1;\n      }\n      continue;\n    }\n    if (quote) {\n      if (escaped) escaped = false;\n      else if (ch === \"\\\\\") escaped = true;\n      else if (ch === quote) quote = null;\n      continue;\n    }\n    if (ch === \"/\" && next === \"*\") {\n      comment = true;\n      i += 1;\n      continue;\n    }\n    if (ch === '\"' || ch === \"'\") {\n      quote = ch;\n      continue;\n    }\n    if (ch === \"(\") parenDepth += 1;\n    else if (ch === \")\") parenDepth = Math.max(0, parenDepth - 1);\n    else if ((ch === \";\" || i === body.length) && parenDepth === 0) {\n      const raw = body.slice(start, i);\n      const trimmed = raw.trim();\n      if (trimmed) {\n        const colon = trimmed.indexOf(\":\");\n        items.push({\n          raw,\n          property: colon > 0 ? trimmed.slice(0, colon).trim().toLowerCase() : \"\",\n          value: colon > 0 ? trimmed.slice(colon + 1).trim() : \"\",\n          start,\n          end: i + (ch === \";\" ? 1 : 0)\n        });\n      }\n      start = i + 1;\n    }\n  }\n  return items;\n}\n\nfunction targetMapFor(classification, property) {\n  if (classification === \"hover\") return HOVER_DECLARATIONS;\n  if (classification === \"base\") return BASE_DECLARATIONS;\n  if (classification === \"base-or-motion\") {\n    if (property === \"transition\") return MOTION_DECLARATIONS;\n    return BASE_DECLARATIONS;\n  }\n  return null;\n}\n\nfunction cleanCss(css, filename) {\n  const edits = [];\n  const findings = [];\n  const stack = [];\n  let quote = null;\n  let escaped = false;\n  let comment = false;\n  let tokenStart = 0;\n\n  for (let i = 0; i < css.length; i += 1) {\n    const ch = css[i];\n    const next = css[i + 1];\n\n    if (comment) {\n      if (ch === \"*\" && next === \"/\") {\n        comment = false;\n        i += 1;\n      }\n      continue;\n    }\n    if (quote) {\n      if (escaped) escaped = false;\n      else if (ch === \"\\\\\") escaped = true;\n      else if (ch === quote) quote = null;\n      continue;\n    }\n    if (ch === \"/\" && next === \"*\") {\n      comment = true;\n      i += 1;\n      continue;\n    }\n    if (ch === '\"' || ch === \"'\") {\n      quote = ch;\n      continue;\n    }\n\n    if (ch === \"{\") {\n      const prelude = css.slice(tokenStart, i).trim();\n      stack.push({ prelude, bodyStart: i + 1 });\n      tokenStart = i + 1;\n      continue;\n    }\n\n    if (ch === \"}\") {\n      const block = stack.pop();\n      if (!block) {\n        tokenStart = i + 1;\n        continue;\n      }\n\n      if (!block.prelude.startsWith(\"@\")) {\n        const classification = classifySelector(block.prelude);\n        if (classification) {\n          const body = css.slice(block.bodyStart, i);\n          for (const declaration of splitDeclarations(body)) {\n            const targets = targetMapFor(classification, declaration.property);\n            if (!targets || !targets.has(declaration.property)) continue;\n\n            const expected = targets.get(declaration.property);\n            if (normalizeValue(declaration.value) !== expected) continue;\n\n            edits.push({\n              start: block.bodyStart + declaration.start,\n              end: block.bodyStart + declaration.end\n            });\n            findings.push({\n              file: path.relative(ROOT, filename),\n              selector: block.prelude,\n              property: declaration.property,\n              value: declaration.value\n            });\n          }\n        }\n      }\n\n      tokenStart = i + 1;\n      continue;\n    }\n\n    if (ch === \";\" && stack.length === 0) tokenStart = i + 1;\n  }\n\n  let cleaned = css;\n  for (const edit of edits.sort((a, b) => b.start - a.start)) {\n    cleaned = cleaned.slice(0, edit.start) + cleaned.slice(edit.end);\n  }\n\n  cleaned = cleaned.replace(/[ \\t]+\\n/g, \"\\n\");\n  return { cleaned, findings };\n}\n\nif (!fs.existsSync(CARD_PRIMITIVES)) {\n  throw new Error(\"Shared Card-Primitives fehlen: \" + path.relative(ROOT, CARD_PRIMITIVES));\n}\nif (!fs.existsSync(COMPONENT_INDEX)) {\n  throw new Error(\"Component-Entrypoint fehlt: \" + path.relative(ROOT, COMPONENT_INDEX));\n}\n\nconst primitiveCss = fs.readFileSync(CARD_PRIMITIVES, \"utf8\");\nconst componentIndex = fs.readFileSync(COMPONENT_INDEX, \"utf8\");\n\nfor (const required of [\n  \"border-color: var(--pt-line)\",\n  \"border-radius: var(--pt-radius-lg)\",\n  \"background: var(--pt-surface)\",\n  \"box-shadow: var(--pt-shadow-sm)\",\n  \"transition: border-color 160ms ease\",\n  \"transform: translateY(-2px)\"\n]) {\n  if (!primitiveCss.includes(required)) {\n    throw new Error(\"Card-Primitive unvollständig: \" + required);\n  }\n}\nif (!componentIndex.includes('@import \"./cards.css\";')) {\n  throw new Error(\"cards.css wird nicht über components/index.css geladen.\");\n}\n\nconst files = [...new Set(SEARCH_ROOTS.flatMap((dir) => walk(dir)))].sort();\nconst reports = [];\nlet declarationsRemoved = 0;\nlet bytesSaved = 0;\n\nfor (const file of files) {\n  if (path.resolve(file) === path.resolve(CARD_PRIMITIVES)) continue;\n\n  const source = fs.readFileSync(file, \"utf8\");\n  const ranges = extractStyleRanges(source, file);\n  if (!ranges.length) continue;\n\n  let next = source;\n  const findings = [];\n\n  for (const range of [...ranges].sort((a, b) => b.start - a.start)) {\n    const fragment = next.slice(range.start, range.end);\n    const result = cleanCss(fragment, file);\n    if (!result.findings.length) continue;\n\n    next = next.slice(0, range.start) + result.cleaned + next.slice(range.end);\n    findings.push(...result.findings);\n  }\n\n  if (!findings.length) continue;\n\n  reports.push({\n    file: path.relative(ROOT, file),\n    declarationsRemoved: findings.length,\n    bytesBefore: Buffer.byteLength(source),\n    bytesAfter: Buffer.byteLength(next),\n    findings\n  });\n\n  declarationsRemoved += findings.length;\n  bytesSaved += Buffer.byteLength(source) - Buffer.byteLength(next);\n\n  if (WRITE) fs.writeFileSync(file, next);\n}\n\nconst report = {\n  version: \"23.1.0\",\n  mode: WRITE ? \"write\" : \"dry-run\",\n  filesScanned: files.length,\n  filesChanged: reports.length,\n  declarationsRemoved,\n  bytesSaved,\n  sharedPrimitive: path.relative(ROOT, CARD_PRIMITIVES),\n  files: reports,\n  generatedAt: new Date().toISOString()\n};\n\nfs.mkdirSync(REPORT_DIR, { recursive: true });\nfs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + \"\\n\");\n\nconst markdown = `# Card Primitive Adoption 23.1.0\n\n- Modus: ${report.mode}\n- geprüfte CSS-/Astro-Dateien: ${report.filesScanned}\n- betroffene Dateien: ${report.filesChanged}\n- entfernte bereits zentral abgedeckte Deklarationen: ${report.declarationsRemoved}\n- eingesparte Bytes: ${report.bytesSaved}\n\n## Sicherheitsgrenze\n\nEntfernt werden nur Deklarationen, die durch\n\\`${report.sharedPrimitive}\\` bereits mit demselben Wert abgedeckt sind.\n\nZulässig sind ausschließlich einfache Selektoren aus der bekannten\nCard-Familie. Descendant-, Modifier-, Attribute-, Theme- und Media-Regeln\nwerden nicht verändert.\n\n## Dateien\n\n${report.files.length\n  ? report.files.map((item) =>\n      `- \\`${item.file}\\`: ${item.declarationsRemoved} Deklarationen, ${item.bytesBefore - item.bytesAfter} Bytes`\n    ).join(\"\\n\")\n  : \"Keine sicheren Adoption-Kandidaten gefunden.\"}\n`;\n\nfs.writeFileSync(REPORT_MD, markdown);\nconsole.log(\"[css-card-primitive-adoption] Report:\", path.relative(ROOT, REPORT_MD));\nconsole.log(\"[css-card-primitive-adoption] Dateien:\", report.filesChanged);\nconsole.log(\"[css-card-primitive-adoption] Deklarationen:\", report.declarationsRemoved);\nconsole.log(\"[css-card-primitive-adoption] Bytes:\", report.bytesSaved);\n";
const testContent = "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\n\nconst ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"../../..\");\nconst app = path.join(ROOT, \"apps\", \"pfotentechnik\");\nconst script = path.join(app, \"scripts\", \"design-system\", \"css-card-primitive-adoption.mjs\");\nconst cards = path.join(app, \"src\", \"styles\", \"components\", \"cards.css\");\nconst index = path.join(app, \"src\", \"styles\", \"components\", \"index.css\");\n\ntest(\"Card-Adoption-Werkzeug und Primitive sind installiert\", () => {\n  assert.ok(fs.existsSync(script));\n  assert.ok(fs.existsSync(cards));\n  assert.ok(fs.existsSync(index));\n});\n\ntest(\"Card-Primitives werden zentral geladen\", () => {\n  const componentIndex = fs.readFileSync(index, \"utf8\");\n  assert.ok(componentIndex.includes('@import \"./cards.css\";'));\n});\n\ntest(\"Card-Primitives enthalten Basis, Bewegung und Hover\", () => {\n  const css = fs.readFileSync(cards, \"utf8\");\n  for (const marker of [\n    \".product-card\",\n    \".comparison-card\",\n    \".guide-card\",\n    \".premium-block\",\n    \".faq-item\",\n    \"border-radius: var(--pt-radius-lg)\",\n    \"box-shadow: var(--pt-shadow-sm)\",\n    \"transition: border-color 160ms ease\",\n    \"transform: translateY(-2px)\"\n  ]) {\n    assert.ok(css.includes(marker), \"Fehlt: \" + marker);\n  }\n});\n";

const log = (message) => console.log("[" + NAME + "] " + message);

if (!fs.existsSync(PACKAGE)) throw new Error("package.json fehlt.");

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ||= {};
packageJson.scripts["css:cards:adopt"] =
  "node scripts/design-system/css-card-primitive-adoption.mjs";
packageJson.scripts["css:cards:adopt:write"] =
  "node scripts/design-system/css-card-primitive-adoption.mjs --write";
packageJson.scripts["test:css-card-primitive-adoption"] =
  "node --test test/css-card-primitive-adoption.test.mjs";
const packageAfter = JSON.stringify(packageJson, null, 2) + "\n";

const desired = new Map([
  [SCRIPT, cleanupScript],
  [TEST, testContent],
  [PACKAGE, packageAfter]
]);

const changes = [];
for (const [file, content] of desired) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current !== content) changes.push({ file, current, content });
}

fs.mkdirSync(BACKUP, { recursive: true });

function backupFile(file) {
  const relative = path.relative(ROOT, file);
  const target = path.join(BACKUP, relative);
  if (fs.existsSync(target)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

try {
  for (const change of changes) {
    if (change.current !== null) backupFile(change.file);
    fs.mkdirSync(path.dirname(change.file), { recursive: true });
    fs.writeFileSync(change.file, change.content);
    log("Geschrieben: " + path.relative(ROOT, change.file));
  }

  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:css-card-primitive-adoption"], {
    cwd: ROOT, stdio: "inherit", env: process.env
  });

  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "css:cards:adopt"], {
    cwd: ROOT, stdio: "inherit", env: process.env
  });

  const dryRun = JSON.parse(fs.readFileSync(REPORT_JSON, "utf8"));

  for (const item of dryRun.files) {
    backupFile(path.join(ROOT, item.file));
  }

  if (dryRun.filesChanged > 0) {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "css:cards:adopt:write"], {
      cwd: ROOT, stdio: "inherit", env: process.env
    });
  }

  const regressionScripts = [
    "test:css-card-system",
    "test:css-panel-system",
    "test:css-button-system",
    "test:css-admin-architecture",
    "test:css-product-system",
    "test:css-comparison-system",
    "test:css-architecture"
  ];

  for (const script of regressionScripts) {
    if (packageJson.scripts?.[script]) {
      execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", script], {
        cwd: ROOT, stdio: "inherit", env: process.env
      });
    }
  }

  if (packageJson.scripts?.["css:architecture:audit"]) {
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
  log("Entfernte Deklarationen: " + dryRun.declarationsRemoved);
  log("Eingesparte Bytes: " + dryRun.bytesSaved);
  log("Report: " + path.relative(ROOT, REPORT_MD));
  log("Backup: " + path.relative(ROOT, BACKUP));
} catch (error) {
  log("FEHLER: " + error.message);
  log("Rollback wird ausgeführt.");

  if (fs.existsSync(BACKUP)) {
    const restore = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) restore(full);
        else {
          const relative = path.relative(BACKUP, full);
          const target = path.join(ROOT, relative);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.copyFileSync(full, target);
        }
      }
    };
    restore(BACKUP);
  }

  for (const change of changes) {
    if (change.current === null && fs.existsSync(change.file)) fs.unlinkSync(change.file);
  }

  process.exitCode = 1;
}
