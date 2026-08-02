#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-header-style-ownership-cleanup-26.0.4";
const CHECK_ONLY = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

function findRoot(start) {
  let current = path.resolve(start);

  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const CORE = path.join(ROOT, "packages", "affiliate-core");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const files = {
  header: path.join(CORE, "src", "components", "Header.astro"),
  headerFooter: path.join(CORE, "src", "styles", "header-footer.css"),
  audit: path.join(APP, "scripts", "design-system", "audit-header-style-ownership.mjs"),
  test: path.join(APP, "test", "header-style-ownership-cleanup-26.0.4.test.mjs")
};

const originals = new Map();
const planned = new Map();

function relative(target) {
  return path.relative(ROOT, target).split(path.sep).join("/");
}

function read(target) {
  if (!fs.existsSync(target)) throw new Error(`Datei fehlt: ${relative(target)}`);
  const content = fs.readFileSync(target, "utf8");
  if (!originals.has(target)) originals.set(target, content);
  return content;
}

function plan(target, content) {
  const current = fs.existsSync(target) ? read(target) : "";
  if (current !== content) planned.set(target, content);
}

function backup(target) {
  if (!fs.existsSync(target)) return;

  const destination = path.join(BACKUP, relative(target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

function run(command, args) {
  console.log(`[${NAME}] Prüfe: ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env
  });
}

function findMatchingBrace(source, openingIndex) {
  if (source[openingIndex] !== "{") {
    throw new Error("Öffnende CSS-Klammer fehlt.");
  }

  let depth = 0;
  let quote = null;
  let inComment = false;

  for (let index = openingIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inComment) {
      if (char === "*" && next === "/") {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === "/" && next === "*") {
      inComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error("Schließende CSS-Klammer nicht gefunden.");
}

function removeRuleBlocks(source, selectors) {
  let output = source;

  for (const selector of selectors) {
    let cursor = 0;

    while (true) {
      const index = output.indexOf(selector, cursor);
      if (index < 0) break;

      const previous = index > 0 ? output[index - 1] : "";
      if (previous && !/[\s;}]/.test(previous)) {
        cursor = index + selector.length;
        continue;
      }

      const opening = output.indexOf("{", index + selector.length);
      if (opening < 0) break;

      const selectorText = output.slice(index, opening).trim();
      if (selectorText !== selector) {
        cursor = opening + 1;
        continue;
      }

      const end = findMatchingBrace(output, opening);
      output = `${output.slice(0, index)}${output.slice(end + 1)}`;
      cursor = Math.max(0, index - 1);
    }
  }

  return output;
}

function removeMediaBlocksContaining(source, selectors) {
  let output = source;
  let cursor = 0;
  const media = /@media\s*\([^)]*\)\s*\{/g;

  while (true) {
    media.lastIndex = cursor;
    const match = media.exec(output);
    if (!match) break;

    const opening = output.indexOf("{", match.index);
    const end = findMatchingBrace(output, opening);
    const block = output.slice(match.index, end + 1);

    if (selectors.some((selector) => block.includes(selector))) {
      const cleanedBody = removeRuleBlocks(
        block,
        selectors
      );

      const open = cleanedBody.indexOf("{");
      const inner = cleanedBody.slice(open + 1, -1).trim();

      if (!inner) {
        output = `${output.slice(0, match.index)}${output.slice(end + 1)}`;
        cursor = Math.max(0, match.index - 1);
      } else {
        output = `${output.slice(0, match.index)}${cleanedBody}${output.slice(end + 1)}`;
        cursor = match.index + cleanedBody.length;
      }
    } else {
      cursor = end + 1;
    }
  }

  return output;
}

let header = read(files.header);
let stylesheet = read(files.headerFooter);

const headerSelectors = [
  ".site-header-v2",
  ".header-container-v2",
  ".logo-v2",
  ".logo-v2 span",
  ".main-nav-v2",
  ".main-nav-v2 a",
  ".main-nav-v2 a:hover",
  ".main-nav-v2[data-open]",
  ".nav-toggle-button",
  ".site-header-v2 .brand-lockup,\n.site-header-v2 .brand-name"
];

stylesheet = removeMediaBlocksContaining(stylesheet, [
  ".header-container-v2",
  ".nav-toggle-button",
  ".main-nav-v2",
  ".main-nav-v2[data-open]"
]);

stylesheet = removeRuleBlocks(stylesheet, headerSelectors);

stylesheet = stylesheet
  .replace("/* Header V2 */", "/* Header styles live in components/Header.astro. */")
  .replace(/\n{3,}/g, "\n\n")
  .trimStart();

if (
  /(^|[\s}])(?:\.site-header-v2|\.header-container-v2|\.main-nav-v2|\.nav-toggle-button|\.logo-v2)(?:[\s.{:#[])/m.test(
    stylesheet
  )
) {
  throw new Error(
    "header-footer.css enthält nach der Bereinigung weiterhin Header-Selektoren."
  );
}

if (!stylesheet.includes(".footer-v2")) {
  throw new Error("Footer-Regeln wurden versehentlich entfernt.");
}

if (!header.includes(".site-header-v2 .header-container-v2")) {
  throw new Error("Header.astro besitzt keinen eigenen Container-Vertrag.");
}

if (!header.includes("@media (min-width: 48rem)")) {
  throw new Error("Header.astro besitzt keinen Desktop-Breakpoint.");
}

plan(files.headerFooter, stylesheet);

const audit = `#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const headerPath = path.join(
  root,
  "packages/affiliate-core/src/components/Header.astro"
);
const sharedPath = path.join(
  root,
  "packages/affiliate-core/src/styles/header-footer.css"
);

const header = fs.readFileSync(headerPath, "utf8");
const shared = fs.readFileSync(sharedPath, "utf8");
const errors = [];

const forbiddenSharedSelectors = [
  ".site-header-v2",
  ".header-container-v2",
  ".main-nav-v2",
  ".nav-toggle-button",
  ".logo-v2"
];

for (const selector of forbiddenSharedSelectors) {
  const escaped = selector.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  if (new RegExp(\`(^|[\\\\s}])\${escaped}(?=[\\\\s.{:#[])\`, "m").test(shared)) {
    errors.push(
      \`header-footer.css besitzt weiterhin den Header-Selektor \${selector}.\`
    );
  }
}

const requiredHeaderContracts = [
  [
    "eigener Container",
    /\\.site-header-v2 \\.header-container-v2\\s*\\{[\\s\\S]*?padding-inline:/
  ],
  [
    "Desktop-Burger verborgen",
    /@media\\s*\\(min-width:\\s*48rem\\)[\\s\\S]*?\\.site-header-v2 \\.nav-toggle-button\\s*\\{[\\s\\S]*?display:\\s*none/
  ],
  [
    "Mobile-Burger sichtbar",
    /@media\\s*\\(max-width:\\s*47\\.99rem\\)[\\s\\S]*?\\.site-header-v2 \\.nav-toggle-button\\s*\\{[\\s\\S]*?display:\\s*grid/
  ],
  [
    "mobiles Außenpadding",
    /@media\\s*\\(max-width:\\s*47\\.99rem\\)[\\s\\S]*?padding-inline:\\s*1rem/
  ]
];

for (const [label, pattern] of requiredHeaderContracts) {
  if (!pattern.test(header)) errors.push(\`Header.astro fehlt: \${label}.\`);
}

if (!/\\.footer-v2\\s*\\{/.test(shared)) {
  errors.push("header-footer.css enthält keinen Footer mehr.");
}

if (errors.length > 0) {
  console.error("Header-Style-Ownership-Audit fehlgeschlagen:");
  for (const error of errors) console.error(\`- \${error}\`);
  process.exit(1);
}

console.log("Header-Style-Ownership-Audit erfolgreich.");
console.log("Header-Eigentümer: packages/affiliate-core/src/components/Header.astro");
console.log("Shared Stylesheet enthält nur Footer-Regeln.");
`;

plan(files.audit, audit);

const test = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");

const header = fs.readFileSync(
  path.join(root, "packages/affiliate-core/src/components/Header.astro"),
  "utf8"
);
const shared = fs.readFileSync(
  path.join(root, "packages/affiliate-core/src/styles/header-footer.css"),
  "utf8"
);

test("Header.astro is the only responsive header owner", () => {
  assert.match(header, /\\.site-header-v2 \\.header-container-v2/);
  assert.match(header, /@media\\s*\\(min-width:\\s*48rem\\)/);
  assert.match(header, /@media\\s*\\(max-width:\\s*47\\.99rem\\)/);

  assert.doesNotMatch(
    shared,
    /(^|[\\s}])(?:\\.site-header-v2|\\.header-container-v2|\\.main-nav-v2|\\.nav-toggle-button|\\.logo-v2)(?=[\\s.{:#[])/m
  );
});

test("shared stylesheet still owns the footer", () => {
  assert.match(shared, /\\.footer-v2\\s*\\{/);
  assert.match(shared, /\\.footer-main-v2\\s*\\{/);
  assert.match(shared, /\\.footer-bottom-v2\\s*\\{/);
});

test("desktop and mobile contracts remain explicit", () => {
  assert.match(
    header,
    /@media\\s*\\(min-width:\\s*48rem\\)[\\s\\S]*?\\.site-header-v2 \\.nav-toggle-button\\s*\\{[\\s\\S]*?display:\\s*none/
  );
  assert.match(
    header,
    /@media\\s*\\(max-width:\\s*47\\.99rem\\)[\\s\\S]*?\\.site-header-v2 \\.nav-toggle-button\\s*\\{[\\s\\S]*?display:\\s*grid/
  );
  assert.match(header, /padding-inline:\\s*1rem/);
});

test("cleanup adds no important rules", () => {
  assert.doesNotMatch(header, /!important/);
  assert.doesNotMatch(shared, /!important/);
});
`;

plan(files.test, test);

const changed = [...planned.keys()];

if (changed.length === 0) {
  console.log(`[${NAME}] Bereits vollständig angewendet.`);
  process.exit(0);
}

console.log(`[${NAME}] Geplante Änderungen:`);
for (const target of changed) console.log(`  schreiben: ${relative(target)}`);

if (CHECK_ONLY) {
  console.log(`[${NAME}] Vorprüfung erfolgreich. Keine Datei wurde verändert.`);
  process.exit(0);
}

for (const target of changed) backup(target);

try {
  for (const [target, content] of planned) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    console.log(`[${NAME}] Geschrieben: ${relative(target)}`);
  }

  run(process.execPath, [relative(files.audit)]);
  run(process.execPath, ["--test", relative(files.test)]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:components:audit"]);

  if (!SKIP_BUILD) {
    run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);
  }

  console.log(`[${NAME}] Fertig.`);
} catch (error) {
  console.error(`[${NAME}] Validierung fehlgeschlagen. Änderungen werden zurückgerollt.`);

  for (const target of changed) {
    const backupFile = path.join(BACKUP, relative(target));

    if (fs.existsSync(backupFile)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(backupFile, target);
    } else if (!originals.has(target) && fs.existsSync(target)) {
      fs.rmSync(target);
    }
  }

  throw error;
}
