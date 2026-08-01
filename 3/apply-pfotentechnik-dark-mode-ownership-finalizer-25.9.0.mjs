#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-dark-mode-ownership-finalizer-25.9.0";
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
  tokens: path.join(APP, "src", "styles", "pfotentechnik-design-tokens.css"),
  designSystem: path.join(APP, "src", "styles", "pfotentechnik-design-system.css"),
  headerFooter: path.join(CORE, "src", "styles", "header-footer.css"),
  ownershipAudit: path.join(APP, "scripts", "design-system", "audit-theme-ownership.mjs"),
  test: path.join(APP, "test", "dark-mode-ownership-finalizer-25.9.0.test.mjs")
};

const originals = new Map();
const planned = new Map();

function relative(target) {
  return path.relative(ROOT, target).split(path.sep).join("/");
}

function read(target) {
  if (!fs.existsSync(target)) {
    throw new Error(`Datei fehlt: ${relative(target)}`);
  }

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
    throw new Error("Interner Fehler: Öffnende CSS-Klammer fehlt.");
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

function removeBlocksAtNeedle(source, needle, shouldRemove) {
  let output = source;
  let searchFrom = 0;

  while (true) {
    const start = output.indexOf(needle, searchFrom);
    if (start < 0) break;

    const opening = output.indexOf("{", start);
    if (opening < 0) {
      throw new Error(`CSS-Block ohne öffnende Klammer: ${needle}`);
    }

    const end = findMatchingBrace(output, opening);
    const block = output.slice(start, end + 1);

    if (shouldRemove(block)) {
      output = `${output.slice(0, start)}${output.slice(end + 1)}`;
      searchFrom = Math.max(0, start - 1);
    } else {
      searchFrom = end + 1;
    }
  }

  return output;
}

function removeMarkedBlock(source, marker) {
  const start = `/* ${marker}:start */`;
  const end = `/* ${marker}:end */`;

  if (!source.includes(start) && !source.includes(end)) return source;
  if (!source.includes(start) || !source.includes(end)) {
    throw new Error(`Unvollständiger Markerblock: ${marker}`);
  }

  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex) + end.length;

  return `${source.slice(0, startIndex)}${source.slice(endIndex)}`;
}

function upsertMarkedBlock(source, marker, block) {
  const start = `/* ${marker}:start */`;
  const end = `/* ${marker}:end */`;
  const rendered = `${start}\n${block.trim()}\n${end}`;

  if (source.includes(start) && source.includes(end)) {
    const startIndex = source.indexOf(start);
    const endIndex = source.indexOf(end, startIndex) + end.length;
    return `${source.slice(0, startIndex)}${rendered}${source.slice(endIndex)}`;
  }

  return `${source.trimEnd()}\n\n${rendered}\n`;
}

/* -------------------------------------------------------------------------- */
/* 1. One deterministic theme state machine                                   */
/* -------------------------------------------------------------------------- */

let tokens = read(files.tokens);

tokens = removeMarkedBlock(tokens, "pfotentechnik-semantic-foreground-roles-25.8.3");
tokens = removeMarkedBlock(tokens, "pfotentechnik-interactive-color-roles-25.8.5");

/* Remove the three historical system-dark blocks from the token file. */
tokens = removeBlocksAtNeedle(
  tokens,
  "@media (prefers-color-scheme: dark)",
  () => true
);

/* Remove historical explicit-dark rules. */
tokens = removeBlocksAtNeedle(
  tokens,
  '[data-theme="dark"]',
  (block) => block.includes("--pt-color-")
);

/* Remove comments that described the superseded implementation. */
tokens = tokens
  .replace(
    /\/\*\s*System theme activation\.[\s\S]*?operating-system preference\.\s*\*\//g,
    ""
  )
  .replace(/\n{3,}/g, "\n\n");

const themeStateBlock = `
:root {
  color-scheme: light;

  --pt-color-success-soft: #e2f3e5;
  --pt-color-danger-soft: #fee9e7;
  --pt-color-warning-soft: #fff4d8;
  --pt-color-on-accent: #ffffff;
  --pt-color-accent-text: #216e45;
  --pt-color-action-bg: #2f8f5b;
  --pt-color-action-bg-hover: #26784c;
  --pt-color-action-text: #ffffff;
  --pt-color-link: var(--pt-color-accent-text);
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;

    --pt-color-text: #f2f8f4;
    --pt-color-text-muted: #b6c7bc;
    --pt-color-border: #2c4637;
    --pt-color-border-strong: #3d5c49;
    --pt-color-surface: #14241b;
    --pt-color-surface-soft: #192b20;
    --pt-color-surface-raised: #1f3427;
    --pt-color-page: #0b1510;
    --pt-color-brand-100: #183d29;
    --pt-color-brand-050: #122c1e;
    --pt-color-success-soft: #183b23;
    --pt-color-danger-soft: #43201f;
    --pt-color-warning-soft: #3b2d13;
    --pt-color-on-accent: #ffffff;
    --pt-color-accent-text: #78e7aa;
    --pt-color-action-bg: #2f8f5b;
    --pt-color-action-bg-hover: #3ea86d;
    --pt-color-action-text: #ffffff;
    --pt-color-link: var(--pt-color-accent-text);

    --pt-shadow-xs: 0 1px 2px rgb(0 0 0 / 0.2);
    --pt-shadow-sm: 0 5px 18px rgb(0 0 0 / 0.24);
    --pt-shadow-md: 0 12px 34px rgb(0 0 0 / 0.3);
    --pt-shadow-lg: 0 24px 58px rgb(0 0 0 / 0.36);
  }
}

:root[data-theme="dark"],
:root.dark {
  color-scheme: dark;

  --pt-color-text: #f2f8f4;
  --pt-color-text-muted: #b6c7bc;
  --pt-color-border: #2c4637;
  --pt-color-border-strong: #3d5c49;
  --pt-color-surface: #14241b;
  --pt-color-surface-soft: #192b20;
  --pt-color-surface-raised: #1f3427;
  --pt-color-page: #0b1510;
  --pt-color-brand-100: #183d29;
  --pt-color-brand-050: #122c1e;
  --pt-color-success-soft: #183b23;
  --pt-color-danger-soft: #43201f;
  --pt-color-warning-soft: #3b2d13;
  --pt-color-on-accent: #ffffff;
  --pt-color-accent-text: #78e7aa;
  --pt-color-action-bg: #2f8f5b;
  --pt-color-action-bg-hover: #3ea86d;
  --pt-color-action-text: #ffffff;
  --pt-color-link: var(--pt-color-accent-text);

  --pt-shadow-xs: 0 1px 2px rgb(0 0 0 / 0.2);
  --pt-shadow-sm: 0 5px 18px rgb(0 0 0 / 0.24);
  --pt-shadow-md: 0 12px 34px rgb(0 0 0 / 0.3);
  --pt-shadow-lg: 0 24px 58px rgb(0 0 0 / 0.36);
}

:root[data-theme="light"],
:root.light {
  color-scheme: light;

  --pt-color-text: #132019;
  --pt-color-text-muted: #5a6d62;
  --pt-color-border: #d8e4dc;
  --pt-color-border-strong: #c3d3c8;
  --pt-color-surface: #ffffff;
  --pt-color-surface-soft: #f4f8f5;
  --pt-color-surface-raised: #ffffff;
  --pt-color-page: #f3f7f4;
  --pt-color-brand-100: #dff3e7;
  --pt-color-brand-050: #f0f8f3;
  --pt-color-success-soft: #e2f3e5;
  --pt-color-danger-soft: #fee9e7;
  --pt-color-warning-soft: #fff4d8;
  --pt-color-on-accent: #ffffff;
  --pt-color-accent-text: #216e45;
  --pt-color-action-bg: #2f8f5b;
  --pt-color-action-bg-hover: #26784c;
  --pt-color-action-text: #ffffff;
  --pt-color-link: var(--pt-color-accent-text);

  --pt-shadow-xs: 0 1px 2px rgb(17 35 24 / 0.06);
  --pt-shadow-sm: 0 4px 14px rgb(17 35 24 / 0.08);
  --pt-shadow-md: 0 10px 30px rgb(17 35 24 / 0.11);
  --pt-shadow-lg: 0 20px 50px rgb(17 35 24 / 0.14);
}
`;

tokens = upsertMarkedBlock(
  tokens,
  "pfotentechnik-theme-state-machine-25.9.0",
  themeStateBlock
);

plan(files.tokens, tokens);

/* -------------------------------------------------------------------------- */
/* 2. Delete the second dark palette and its hard-coded dark overrides        */
/* -------------------------------------------------------------------------- */

let designSystem = read(files.designSystem);

const beforeDesignSystem = designSystem;
designSystem = removeBlocksAtNeedle(
  designSystem,
  "@media (prefers-color-scheme: dark)",
  (block) =>
    block.includes("--pt-theme-canvas:") ||
    block.includes("--pt-theme-text:")
);

if (beforeDesignSystem === designSystem) {
  throw new Error(
    "Die konkurrierende Dark-Mode-Palette wurde nicht gefunden. " +
    "Der Repository-Stand muss neu geprüft werden."
  );
}

designSystem = designSystem.replace(/\n{3,}/g, "\n\n");
plan(files.designSystem, designSystem);

/* -------------------------------------------------------------------------- */
/* 3. Header uses the authoritative foreground directly; footer stays inverse */
/* -------------------------------------------------------------------------- */

let headerFooter = read(files.headerFooter);

headerFooter = headerFooter
  .replaceAll("var(--border)", "var(--pt-color-border)")
  .replaceAll("var(--surface)", "var(--pt-color-surface)")
  .replaceAll("var(--text)", "var(--pt-color-text)")
  .replaceAll("var(--muted)", "var(--pt-color-text-muted)")
  .replaceAll("var(--primary-dark)", "var(--pt-color-accent-text)");

headerFooter = headerFooter.replace(
  `.site-header-v2 .brand-lockup,
.site-header-v2 .brand-name {
  color: var(--pt-color-text);
}`,
  `.site-header-v2 .brand-lockup,
.site-header-v2 .brand-name {
  color: var(--pt-color-text);
}`
);

plan(files.headerFooter, headerFooter);

/* -------------------------------------------------------------------------- */
/* 4. Expand ownership audit to the real public stylesheet graph              */
/* -------------------------------------------------------------------------- */

const ownershipAudit = `#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const authoritative = path.join(
  app,
  "src/styles/pfotentechnik-design-tokens.css"
);
const aliasOwner = path.join(app, "src/styles/foundation/tokens.css");

const publicRoots = [
  path.join(app, "src"),
  path.join(root, "packages/affiliate-core/src")
];

const extensions = new Set([".css", ".astro"]);

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return extensions.has(path.extname(entry.name)) ? [target] : [];
  });

const files = publicRoots.flatMap(walk);
const errors = [];

const authoritativeColorTokens = [
  "--pt-color-text",
  "--pt-color-text-muted",
  "--pt-color-border",
  "--pt-color-border-strong",
  "--pt-color-surface",
  "--pt-color-surface-soft",
  "--pt-color-surface-raised",
  "--pt-color-page",
  "--pt-color-accent-text",
  "--pt-color-action-bg",
  "--pt-color-action-bg-hover",
  "--pt-color-action-text"
];

const legacyThemeTokens = [
  "--pt-theme-canvas",
  "--pt-theme-canvas-elevated",
  "--pt-theme-surface",
  "--pt-theme-surface-2",
  "--pt-theme-surface-3",
  "--pt-theme-overlay",
  "--pt-theme-text",
  "--pt-theme-text-soft",
  "--pt-theme-text-muted",
  "--pt-theme-text-inverse",
  "--pt-theme-border",
  "--pt-theme-border-strong",
  "--pt-theme-divider",
  "--pt-theme-accent",
  "--pt-theme-accent-hover",
  "--pt-theme-accent-soft",
  "--pt-theme-accent-text"
];

const escape = (value) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

for (const target of files) {
  const source = fs.readFileSync(target, "utf8");

  for (const token of authoritativeColorTokens) {
    const definition = new RegExp(\`\${escape(token)}\\\\s*:\`, "g");
    if (target !== authoritative && definition.test(source)) {
      errors.push(
        \`\${path.relative(root, target)} definiert \${token} außerhalb der autoritativen Token-Datei.\`
      );
    }
  }

  for (const token of legacyThemeTokens) {
    const definition = new RegExp(\`\${escape(token)}\\\\s*:\`, "g");
    if (target !== aliasOwner && definition.test(source)) {
      errors.push(
        \`\${path.relative(root, target)} besitzt weiterhin die konkurrierende Theme-Definition \${token}.\`
      );
    }
  }

  if (
    /@media\\s*\\(prefers-color-scheme:\\s*dark\\)[\\s\\S]*?--pt-theme-(?:canvas|text|surface)\\s*:/.test(
      source
    )
  ) {
    errors.push(
      \`\${path.relative(root, target)} enthält eine zweite Dark-Mode-Palette.\`
    );
  }
}

const tokenSource = fs.readFileSync(authoritative, "utf8");

if (
  (tokenSource.match(/@media\\s*\\(prefers-color-scheme:\\s*dark\\)/g) ?? []).length !== 1
) {
  errors.push("Die autoritative Token-Datei muss genau einen System-Dark-Mode-Block besitzen.");
}

for (const token of authoritativeColorTokens) {
  if (!new RegExp(\`\${escape(token)}\\\\s*:\`).test(tokenSource)) {
    errors.push(\`Autoritative Definition fehlt: \${token}\`);
  }
}

if (errors.length > 0) {
  console.error("Theme-Ownership-Audit fehlgeschlagen:");
  for (const error of errors) console.error(\`- \${error}\`);
  process.exit(1);
}

console.log("Theme-Ownership-Audit erfolgreich.");
console.log("Palette: apps/pfotentechnik/src/styles/pfotentechnik-design-tokens.css");
console.log("Legacy-Aliase: apps/pfotentechnik/src/styles/foundation/tokens.css");
console.log(\`Geprüfte öffentliche Quelldateien: \${files.length}\`);
`;

plan(files.ownershipAudit, ownershipAudit);

/* -------------------------------------------------------------------------- */
/* 5. Regression tests                                                        */
/* -------------------------------------------------------------------------- */

const test = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const read = (target) => fs.readFileSync(target, "utf8");

const tokens = read(path.join(app, "src/styles/pfotentechnik-design-tokens.css"));
const designSystem = read(path.join(app, "src/styles/pfotentechnik-design-system.css"));
const headerFooter = read(path.join(root, "packages/affiliate-core/src/styles/header-footer.css"));
const home = read(path.join(root, "packages/affiliate-core/src/components/home/home.css"));
const comparison = read(path.join(app, "src/pages/vergleiche/index.astro"));

const contrast = (foreground, background) => {
  const toRgb = (hex) => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ];

  const luminance = (hex) => {
    const channels = toRgb(hex).map((value) => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };

  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

test("there is one deterministic system dark-mode block", () => {
  assert.equal(
    (tokens.match(/@media\\s*\\(prefers-color-scheme:\\s*dark\\)/g) ?? []).length,
    1
  );
  assert.match(tokens, /:root\\[data-theme="dark"\\]/);
  assert.match(tokens, /:root\\[data-theme="light"\\]/);
  assert.doesNotMatch(tokens, /:root:not\\(\\[data-theme="light"\\]\\)/);
});

test("dark foreground contrast is readable", () => {
  assert.ok(contrast("#f2f8f4", "#0b1510") >= 7);
  assert.ok(contrast("#b6c7bc", "#0b1510") >= 4.5);
  assert.ok(contrast("#78e7aa", "#0b1510") >= 4.5);
});

test("the legacy design system no longer owns a dark palette", () => {
  assert.doesNotMatch(
    designSystem,
    /@media\\s*\\(prefers-color-scheme:\\s*dark\\)[\\s\\S]*?--pt-theme-canvas\\s*:/
  );
  assert.doesNotMatch(designSystem, /--pt-theme-canvas\\s*:/);
  assert.doesNotMatch(designSystem, /--pt-theme-text\\s*:/);
});

test("header and footer use explicit semantic foreground roles", () => {
  assert.match(
    headerFooter,
    /\\.site-header-v2 \\.brand-name[\\s\\S]*?color:\\s*var\\(--pt-color-text\\)/
  );
  assert.match(
    headerFooter,
    /\\.footer-v2[\\s\\S]*?var\\(--pt-color-on-brand-surface/
  );
  assert.doesNotMatch(
    headerFooter,
    /\\.site-header-v2 \\.brand-name[\\s\\S]*?color:\\s*var\\(--text\\)/
  );
});

test("homepage and comparison headings consume the authoritative text token", () => {
  assert.match(home, /--home3-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(
    home,
    /\\.home3-card-content h3[\\s\\S]*?color:\\s*var\\(--home3-text\\)/
  );
  assert.match(
    comparison,
    /--comparison-text:\\s*var\\(--pt-color-text\\)/
  );
  assert.match(
    comparison,
    /\\.comparison-card h3[\\s\\S]*?color:\\s*var\\(--comparison-text\\)/
  );
});

test("the finalizer introduces no important declarations", () => {
  assert.doesNotMatch(tokens, /!important/);
  assert.doesNotMatch(headerFooter, /!important/);
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

  run(process.execPath, [relative(files.ownershipAudit)]);
  run(process.execPath, ["--test", relative(files.test)]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:tokens:audit"]);
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
