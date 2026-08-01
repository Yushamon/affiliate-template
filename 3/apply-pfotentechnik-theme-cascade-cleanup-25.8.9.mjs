#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-theme-cascade-cleanup-25.8.9";
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
  layout: path.join(APP, "src", "layouts", "ProjectLayout.astro"),
  foundationTokens: path.join(APP, "src", "styles", "foundation", "tokens.css"),
  coreTheme: path.join(CORE, "src", "styles", "theme.css"),
  audit: path.join(APP, "scripts", "design-system", "audit-theme-ownership.mjs"),
  test: path.join(APP, "test", "theme-cascade-cleanup-25.8.9.test.mjs")
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

/* -------------------------------------------------------------------------- */
/* 1. Restore a logical import order                                           */
/* -------------------------------------------------------------------------- */

let layout = read(files.layout);

const lateTokenOrder = `import "../styles/pfotentechnik-primitives.css";
import "../styles/pfotentechnik-responsive-resilience.css";
import "../styles/pfotentechnik-visual-density.css";
import "../styles/pfotentechnik.css";
import "../styles/pfotentechnik-design-system.css";
import "../styles/pfotentechnik-ui-system.css";
/*
 * The semantic token source is deliberately last.
 * Compatibility layers may define aliases, but may not win the cascade.
 */
import "../styles/pfotentechnik-design-tokens.css";`;

const cleanTokenOrder = `import "../styles/pfotentechnik-design-tokens.css";
import "../styles/pfotentechnik-primitives.css";
import "../styles/pfotentechnik-responsive-resilience.css";
import "../styles/pfotentechnik-visual-density.css";
import "../styles/pfotentechnik.css";
import "../styles/pfotentechnik-design-system.css";
import "../styles/pfotentechnik-ui-system.css";`;

if (layout.includes(lateTokenOrder)) {
  layout = layout.replace(lateTokenOrder, cleanTokenOrder);
} else if (!layout.includes(cleanTokenOrder)) {
  throw new Error("ProjectLayout enthält keine erwartete Theme-Importreihenfolge.");
}

plan(files.layout, layout);

/* -------------------------------------------------------------------------- */
/* 2. Foundation tokens become a strict compatibility alias layer             */
/* -------------------------------------------------------------------------- */

const foundation = `/*
 * PfotenTechnik compatibility aliases.
 *
 * Authoritative colors, spacing, radii and shadows live exclusively in:
 * ../pfotentechnik-design-tokens.css
 *
 * This file exists only for legacy components that still consume the older
 * --pt-theme-*, --pt-ink-*, --pt-green-* or generic aliases.
 */

:root {
  color-scheme: light dark;

  --pt-theme-canvas: var(--pt-color-page);
  --pt-theme-canvas-elevated: var(--pt-color-surface-soft);
  --pt-theme-surface: var(--pt-color-surface);
  --pt-theme-surface-2: var(--pt-color-surface-soft);
  --pt-theme-surface-3: var(--pt-color-surface-raised);
  --pt-theme-overlay: color-mix(
    in srgb,
    var(--pt-color-surface) 94%,
    transparent
  );

  --pt-theme-text: var(--pt-color-text);
  --pt-theme-text-soft: var(--pt-color-text-muted);
  --pt-theme-text-muted: var(--pt-color-text-muted);
  --pt-theme-text-inverse: var(--pt-color-text-inverse);

  --pt-theme-border: var(--pt-color-border);
  --pt-theme-border-strong: var(--pt-color-border-strong);
  --pt-theme-divider: color-mix(
    in srgb,
    var(--pt-color-border) 78%,
    transparent
  );

  --pt-theme-accent: var(--pt-color-action-bg);
  --pt-theme-accent-hover: var(--pt-color-action-bg-hover);
  --pt-theme-accent-soft: var(--pt-color-brand-100);
  --pt-theme-accent-text: var(--pt-color-accent-text);

  --pt-theme-info: var(--pt-color-accent-600);
  --pt-theme-info-soft: color-mix(
    in srgb,
    var(--pt-color-accent-600) 12%,
    var(--pt-color-surface)
  );
  --pt-theme-warning: var(--pt-color-warning-500);
  --pt-theme-warning-soft: var(--pt-color-warning-soft);
  --pt-theme-danger: var(--pt-color-danger-600);
  --pt-theme-danger-soft: var(--pt-color-danger-soft);
  --pt-theme-success: var(--pt-color-success-600);
  --pt-theme-success-soft: var(--pt-color-success-soft);

  --pt-theme-shadow-xs: var(--pt-shadow-xs);
  --pt-theme-shadow-sm: var(--pt-shadow-sm);
  --pt-theme-shadow-md: var(--pt-shadow-md);
  --pt-theme-shadow-menu: var(--pt-shadow-lg);

  --pt-canvas: var(--pt-theme-canvas);
  --pt-surface: var(--pt-theme-surface);
  --pt-line: var(--pt-theme-border);
  --pt-line-strong: var(--pt-theme-border-strong);

  --pt-ink-950: var(--pt-theme-text);
  --pt-ink-900: var(--pt-theme-text);
  --pt-ink-700: var(--pt-theme-text-soft);
  --pt-ink-500: var(--pt-theme-text-muted);

  --pt-green-700: var(--pt-theme-accent-text);
  --pt-green-600: var(--pt-theme-accent);
  --pt-green-100: var(--pt-theme-accent-soft);

  --pt-warning: var(--pt-theme-warning);
  --pt-danger: var(--pt-theme-danger);

  --pt-content: var(--pt-content-wide);
  --pt-reading: var(--pt-content-narrow);

  --primary: var(--pt-theme-accent);
  --primary-dark: var(--pt-theme-accent-text);
  --primary-soft: var(--pt-theme-accent-soft);
  --secondary: var(--pt-theme-accent);

  --text: var(--pt-theme-text);
  --muted: var(--pt-theme-text-muted);
  --bg: var(--pt-theme-canvas);
  --bg-soft: var(--pt-theme-surface-2);
  --surface: var(--pt-theme-surface);
  --surface-soft: var(--pt-theme-surface-2);
  --card: var(--pt-theme-surface);

  --border: var(--pt-theme-border);
  --border-strong: var(--pt-theme-border-strong);
  --shadow-soft: var(--pt-theme-shadow-sm);
  --shadow-strong: var(--pt-theme-shadow-md);
}

/*
 * Editorial and FAQ aliases remain semantic as well. No mode-specific values
 * are declared here.
 */
:root {
  --pt-editorial-dark-bg: var(--pt-color-brand-surface);
  --pt-editorial-dark-bg-deep: var(--pt-color-brand-surface-strong);
  --pt-editorial-dark-border: color-mix(
    in srgb,
    var(--pt-color-on-brand-surface-accent) 24%,
    transparent
  );
  --pt-editorial-dark-heading: var(--pt-color-on-brand-surface);
  --pt-editorial-dark-copy: var(--pt-color-on-brand-surface-muted);
  --pt-editorial-dark-muted: var(--pt-color-on-brand-surface-muted);
  --pt-editorial-dark-accent: var(--pt-color-on-brand-surface-accent);

  --pt-faq-bg: var(--pt-color-surface);
  --pt-faq-soft: var(--pt-color-surface-soft);
  --pt-faq-line: var(--pt-color-border);
  --pt-faq-heading: var(--pt-color-text);
  --pt-faq-copy: var(--pt-color-text-muted);

  --pt-polish-radius-card: var(--pt-radius-xl);
  --pt-polish-radius-soft: var(--pt-radius-lg);
  --pt-polish-space-section: var(--pt-section-space);
  --pt-polish-space-card: clamp(var(--pt-space-5), 4vw, var(--pt-space-8));
  --pt-polish-icon-size: 2.625rem;
  --pt-polish-line: var(--pt-color-border);
  --pt-polish-shadow: var(--pt-shadow-md);
}
`;

plan(files.foundationTokens, foundation);

/* -------------------------------------------------------------------------- */
/* 3. Core theme is aliases only, too                                         */
/* -------------------------------------------------------------------------- */

const coreTheme = `/*
 * Affiliate Core compatibility aliases.
 *
 * Projects own the concrete palette. The core consumes semantic project tokens
 * and does not define a second light or dark theme.
 */
:root {
  --primary: var(--pt-color-action-bg);
  --primary-dark: var(--pt-color-accent-text);
  --primary-text: var(--pt-color-accent-text);
  --primary-soft: var(--pt-color-brand-100);

  --accent: var(--pt-color-warning-500);
  --accent-soft: var(--pt-color-warning-soft);

  --text: var(--pt-color-text);
  --muted: var(--pt-color-text-muted);
  --text-inverse: var(--pt-color-text-inverse);
  --text-inverse-muted: var(--pt-color-text-inverse-muted);

  --border: var(--pt-color-border);
  --border-strong: var(--pt-color-border-strong);

  --page: var(--pt-color-page);
  --surface: var(--pt-color-surface);
  --surface-soft: var(--pt-color-surface-soft);
  --surface-raised: var(--pt-color-surface-raised);

  --shadow-soft: var(--pt-shadow-sm);
  --shadow-strong: var(--pt-shadow-lg);
}
`;

plan(files.coreTheme, coreTheme);

/* -------------------------------------------------------------------------- */
/* 4. Ownership audit                                                         */
/* -------------------------------------------------------------------------- */

const audit = `#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const authoritative = path.join(
  app,
  "src/styles/pfotentechnik-design-tokens.css"
);

const inspected = [
  path.join(app, "src/styles/foundation/tokens.css"),
  path.join(root, "packages/affiliate-core/src/styles/theme.css")
];

const forbiddenOwnedTokens = [
  "--pt-color-text",
  "--pt-color-text-muted",
  "--pt-color-border",
  "--pt-color-border-strong",
  "--pt-color-surface",
  "--pt-color-surface-soft",
  "--pt-color-surface-raised",
  "--pt-color-page",
  "--pt-color-brand-700",
  "--pt-color-brand-600",
  "--pt-color-brand-500",
  "--pt-color-accent-text",
  "--pt-color-action-bg",
  "--pt-color-action-bg-hover",
  "--pt-color-action-text"
];

const errors = [];

for (const target of inspected) {
  const source = fs.readFileSync(target, "utf8");

  for (const token of forbiddenOwnedTokens) {
    const definition = new RegExp(
      \`\${token.replace(/[.*+?^\\\${}()|[\\]\\\\]/g, "\\\\$&")}\\\\s*:\`
    );

    if (definition.test(source)) {
      errors.push(
        \`\${path.relative(root, target)} definiert den autoritativen Token \${token} erneut.\`
      );
    }
  }

  const rawColors = source.match(/#[0-9a-f]{3,8}\\b|rgba?\\([^)]*\\)/gi) ?? [];
  if (rawColors.length > 0) {
    errors.push(
      \`\${path.relative(root, target)} enthält feste Farbwerte: \${[
        ...new Set(rawColors)
      ].join(", ")}\`
    );
  }
}

const tokenSource = fs.readFileSync(authoritative, "utf8");
for (const token of forbiddenOwnedTokens) {
  if (!new RegExp(
    \`\${token.replace(/[.*+?^\\\${}()|[\\]\\\\]/g, "\\\\$&")}\\\\s*:\`
  ).test(tokenSource)) {
    errors.push(\`Autoritative Definition fehlt: \${token}\`);
  }
}

if (errors.length > 0) {
  console.error("Theme-Ownership-Audit fehlgeschlagen:");
  for (const error of errors) console.error(\`- \${error}\`);
  process.exit(1);
}

console.log("Theme-Ownership-Audit erfolgreich.");
console.log("Autoritative Palette: apps/pfotentechnik/src/styles/pfotentechnik-design-tokens.css");
console.log("Geprüfte Alias-Schichten: 2");
`;

plan(files.audit, audit);

/* -------------------------------------------------------------------------- */
/* 5. Regression test                                                         */
/* -------------------------------------------------------------------------- */

const test = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const read = (target) => fs.readFileSync(target, "utf8");

const layout = read(path.join(app, "src/layouts/ProjectLayout.astro"));
const foundation = read(path.join(app, "src/styles/foundation/tokens.css"));
const core = read(path.join(root, "packages/affiliate-core/src/styles/theme.css"));

test("tokens load before consumers because ownership no longer depends on cascade order", () => {
  const tokenIndex = layout.indexOf(
    'import "../styles/pfotentechnik-design-tokens.css";'
  );
  const designSystemIndex = layout.indexOf(
    'import "../styles/pfotentechnik-design-system.css";'
  );

  assert.ok(tokenIndex >= 0);
  assert.ok(designSystemIndex > tokenIndex);
  assert.doesNotMatch(layout, /semantic token source is deliberately last/);
});

test("foundation contains aliases but no owned palette values", () => {
  assert.match(foundation, /--pt-theme-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(foundation, /--pt-ink-950:\\s*var\\(--pt-theme-text\\)/);
  assert.match(foundation, /--pt-green-600:\\s*var\\(--pt-theme-accent\\)/);
  assert.doesNotMatch(foundation, /#[0-9a-f]{3,8}\\b/i);
  assert.doesNotMatch(foundation, /rgba?\\(/i);
  assert.doesNotMatch(foundation, /--pt-color-text\\s*:/);
});

test("affiliate core defines aliases only", () => {
  assert.match(core, /--text:\\s*var\\(--pt-color-text\\)/);
  assert.match(core, /--surface:\\s*var\\(--pt-color-surface\\)/);
  assert.match(core, /--primary:\\s*var\\(--pt-color-action-bg\\)/);
  assert.doesNotMatch(core, /#[0-9a-f]{3,8}\\b/i);
  assert.doesNotMatch(core, /rgba?\\(/i);
});

test("no important declarations are introduced", () => {
  assert.doesNotMatch(foundation, /!important/);
  assert.doesNotMatch(core, /!important/);
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
