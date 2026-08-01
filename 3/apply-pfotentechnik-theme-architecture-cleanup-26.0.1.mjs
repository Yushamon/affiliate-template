#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-theme-architecture-cleanup-26.0.1";
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
  foundation: path.join(APP, "src", "styles", "foundation", "tokens.css"),
  designSystem: path.join(APP, "src", "styles", "pfotentechnik-design-system.css"),
  legacyProject: path.join(APP, "src", "styles", "pfotentechnik.css"),
  coreTheme: path.join(CORE, "src", "styles", "theme.css"),
  headerFooter: path.join(CORE, "src", "styles", "header-footer.css"),
  home: path.join(CORE, "src", "components", "home", "home.css"),
  comparison: path.join(APP, "src", "pages", "vergleiche", "index.astro"),
  manufacturer: path.join(APP, "src", "pages", "hersteller", "index.astro"),
  audit: path.join(APP, "scripts", "design-system", "audit-public-theme-architecture.mjs"),
  test: path.join(APP, "test", "theme-architecture-cleanup-26.0.1.test.mjs")
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

function removeMediaBlocks(source, predicate) {
  let output = source;
  let cursor = 0;
  const header = /@media\s*\([^)]*\)\s*\{/g;

  while (true) {
    header.lastIndex = cursor;
    const match = header.exec(output);
    if (!match) break;

    const opening = output.indexOf("{", match.index);
    const end = findMatchingBrace(output, opening);
    const block = output.slice(match.index, end + 1);

    if (predicate(block)) {
      output = `${output.slice(0, match.index)}${output.slice(end + 1)}`;
      cursor = Math.max(0, match.index - 1);
    } else {
      cursor = end + 1;
    }
  }

  return output;
}

function removeDeclarations(source, properties) {
  let output = source;

  for (const property of properties) {
    const escaped = property.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    output = output.replace(
      new RegExp(`${escaped}\\s*:\\s*[^;{}]+;`, "g"),
      ""
    );
  }

  return output;
}

function setDeclaration(body, property, value) {
  const escaped = property.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const pattern = new RegExp(`${escaped}\\s*:\\s*[^;{}]+;`, "g");
  const declaration = `${property}: ${value};`;

  if (pattern.test(body)) {
    pattern.lastIndex = 0;
    return body.replace(pattern, declaration);
  }

  return `${body.trimEnd()} ${declaration}`;
}

function rewriteRules(source, selector, declarations) {
  let output = source;
  let cursor = 0;
  const escapedSelector = selector.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const rulePattern = new RegExp(
    `(^|[}\\s])(${escapedSelector.replace(/\\ /g, "\\s+")})\\s*\\{`,
    "gm"
  );

  while (true) {
    rulePattern.lastIndex = cursor;
    const match = rulePattern.exec(output);
    if (!match) break;

    const selectorStart = match.index + match[1].length;
    const opening = output.indexOf("{", selectorStart);
    if (opening < 0) break;

    const selectorText = output.slice(selectorStart, opening).trim();
    if (selectorText !== selector) {
      cursor = opening + 1;
      continue;
    }

    const end = findMatchingBrace(output, opening);
    let body = output.slice(opening + 1, end);

    for (const [property, value] of Object.entries(declarations)) {
      body = setDeclaration(body, property, value);
    }

    output = `${output.slice(0, opening + 1)}${body}${output.slice(end)}`;
    cursor = opening + body.length + 2;
  }

  return output;
}

/* -------------------------------------------------------------------------- */
/* 1. Canonical theme state machine                                            */
/* -------------------------------------------------------------------------- */

let tokens = read(files.tokens);

tokens = removeMarkedBlock(tokens, "pfotentechnik-semantic-foreground-roles-25.8.3");
tokens = removeMarkedBlock(tokens, "pfotentechnik-interactive-color-roles-25.8.5");
tokens = removeMarkedBlock(tokens, "pfotentechnik-theme-state-machine-25.9.0");

/* Remove every historical dark-mode block from the authoritative file. */
tokens = removeMediaBlocks(
  tokens,
  (block) => /prefers-color-scheme\s*:\s*dark/.test(block)
);

/* Remove historical explicit dark selectors containing project colors. */
tokens = tokens.replace(
  /\[data-theme="dark"\]\s*,\s*\.dark\s*\{[^{}]*--pt-color-[^{}]*\}/g,
  ""
);

const stateMachine = `
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
}
`;

tokens = upsertMarkedBlock(
  tokens.replace(/\n{3,}/g, "\n\n"),
  "pfotentechnik-theme-state-machine-26.0.0",
  stateMachine
);

plan(files.tokens, tokens);

/* -------------------------------------------------------------------------- */
/* 2. Alias layers contain no palette                                          */
/* -------------------------------------------------------------------------- */

const foundation = `/*
 * Legacy compatibility aliases only.
 * Concrete colors live in ../pfotentechnik-design-tokens.css.
 */
:root {
  color-scheme: light dark;

  --pt-theme-canvas: var(--pt-color-page);
  --pt-theme-canvas-elevated: var(--pt-color-surface-soft);
  --pt-theme-surface: var(--pt-color-surface);
  --pt-theme-surface-2: var(--pt-color-surface-soft);
  --pt-theme-surface-3: var(--pt-color-surface-raised);
  --pt-theme-overlay: color-mix(in srgb, var(--pt-color-surface) 94%, transparent);

  --pt-theme-text: var(--pt-color-text);
  --pt-theme-text-soft: var(--pt-color-text-muted);
  --pt-theme-text-muted: var(--pt-color-text-muted);
  --pt-theme-text-inverse: var(--pt-color-text-inverse);

  --pt-theme-border: var(--pt-color-border);
  --pt-theme-border-strong: var(--pt-color-border-strong);
  --pt-theme-divider: color-mix(in srgb, var(--pt-color-border) 78%, transparent);

  --pt-theme-accent: var(--pt-color-action-bg);
  --pt-theme-accent-hover: var(--pt-color-action-bg-hover);
  --pt-theme-accent-soft: var(--pt-color-brand-100);
  --pt-theme-accent-text: var(--pt-color-accent-text);

  --pt-theme-info: var(--pt-color-accent-600);
  --pt-theme-info-soft: color-mix(in srgb, var(--pt-color-accent-600) 12%, var(--pt-color-surface));
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

  --pt-editorial-dark-bg: var(--pt-color-brand-surface);
  --pt-editorial-dark-bg-deep: var(--pt-color-brand-surface-strong);
  --pt-editorial-dark-border: color-mix(in srgb, var(--pt-color-on-brand-surface-accent) 24%, transparent);
  --pt-editorial-dark-heading: var(--pt-color-on-brand-surface);
  --pt-editorial-dark-copy: var(--pt-color-on-brand-surface-muted);
  --pt-editorial-dark-muted: var(--pt-color-on-brand-surface-muted);
  --pt-editorial-dark-accent: var(--pt-color-on-brand-surface-accent);

  --pt-faq-bg: var(--pt-color-surface);
  --pt-faq-soft: var(--pt-color-surface-soft);
  --pt-faq-line: var(--pt-color-border);
  --pt-faq-heading: var(--pt-color-text);
  --pt-faq-copy: var(--pt-color-text-muted);
}
`;

const coreTheme = `/*
 * Affiliate Core aliases only. Projects own concrete colors.
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

plan(files.foundation, foundation);
plan(files.coreTheme, coreTheme);

/* -------------------------------------------------------------------------- */
/* 3. Design-system stylesheet loses every competing theme definition          */
/* -------------------------------------------------------------------------- */

let designSystem = read(files.designSystem);

const legacyThemeProperties = [
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
  "--pt-theme-accent-text",
  "--pt-theme-info",
  "--pt-theme-info-soft",
  "--pt-theme-warning",
  "--pt-theme-warning-soft",
  "--pt-theme-danger",
  "--pt-theme-danger-soft",
  "--pt-theme-success",
  "--pt-theme-success-soft",
  "--pt-theme-shadow-xs",
  "--pt-theme-shadow-sm",
  "--pt-theme-shadow-md",
  "--pt-theme-shadow-menu"
];

designSystem = removeMediaBlocks(
  designSystem,
  (block) =>
    /prefers-color-scheme\s*:\s*dark/.test(block) &&
    legacyThemeProperties.some((property) => block.includes(`${property}:`))
);

designSystem = removeDeclarations(designSystem, legacyThemeProperties);

/* Migrate the shared public shell directly to semantic roles. */
designSystem = rewriteRules(designSystem, ".site-header-v2", {
  "border-bottom-color": "var(--pt-color-border)",
  "background": "color-mix(in srgb, var(--pt-color-surface) 92%, transparent)"
});
designSystem = rewriteRules(designSystem, ".brand-lockup", {
  "color": "var(--pt-color-text)"
});
designSystem = rewriteRules(designSystem, ".brand-name", {
  "color": "var(--pt-color-text)"
});
designSystem = rewriteRules(designSystem, ".main-nav-v2", {
  "background": "var(--pt-color-surface)"
});
designSystem = rewriteRules(designSystem, ".main-nav-v2 a", {
  "color": "var(--pt-color-text-muted)"
});
designSystem = rewriteRules(designSystem, ".main-nav-v2 a:hover", {
  "color": "var(--pt-color-text)"
});
designSystem = rewriteRules(designSystem, ".nav-toggle-button", {
  "border-color": "var(--pt-color-border-strong)",
  "background": "var(--pt-color-surface)",
  "color": "var(--pt-color-text)"
});
designSystem = rewriteRules(designSystem, ".footer-v2", {
  "background": "var(--pt-color-brand-surface)",
  "color": "var(--pt-color-on-brand-surface)"
});
designSystem = rewriteRules(designSystem, ".footer-brand-name", {
  "color": "var(--pt-color-on-brand-surface)"
});
designSystem = rewriteRules(designSystem, ".footer-column-v2 h2", {
  "color": "var(--pt-color-on-brand-surface-accent)"
});

designSystem = designSystem
  .replace(/:root\s*\{\s*\}/g, "")
  .replace(/@media\s*\([^{}]+\)\s*\{\s*\}/g, "")
  .replace(/\n{3,}/g, "\n\n");

plan(files.designSystem, designSystem);

/* -------------------------------------------------------------------------- */
/* 4. Remove light-only shell colors from the legacy project stylesheet        */
/* -------------------------------------------------------------------------- */

let legacyProject = read(files.legacyProject);

legacyProject = rewriteRules(legacyProject, "body", {
  "background": "var(--pt-color-page)",
  "color": "var(--pt-color-text)"
});
legacyProject = rewriteRules(legacyProject, ".site-header-v2", {
  "border-bottom-color": "var(--pt-color-border)",
  "background": "color-mix(in srgb, var(--pt-color-surface) 92%, transparent)"
});
legacyProject = rewriteRules(legacyProject, ".logo-v2", {
  "color": "var(--pt-color-text)"
});
legacyProject = rewriteRules(legacyProject, ".nav-toggle-button", {
  "border-color": "var(--pt-color-border-strong)",
  "background": "var(--pt-color-surface)",
  "color": "var(--pt-color-text)"
});
legacyProject = rewriteRules(legacyProject, ".main-nav-v2", {
  "border-color": "var(--pt-color-border)",
  "background": "var(--pt-color-surface)"
});
legacyProject = rewriteRules(legacyProject, ".main-nav-v2 a", {
  "color": "var(--pt-color-text-muted)"
});
legacyProject = rewriteRules(legacyProject, ".main-nav-v2 a:hover", {
  "color": "var(--pt-color-accent-text)"
});

for (const selector of [
  ".pt-intents",
  ".pt-category-card",
  ".pt-guide-card",
  ".pt-product-card",
  ".article"
]) {
  legacyProject = rewriteRules(legacyProject, selector, {
    "border-color": "var(--pt-color-border)",
    "background": "var(--pt-color-surface)",
    "color": "var(--pt-color-text)"
  });
}

legacyProject = rewriteRules(legacyProject, ".footer-v2", {
  "background": "var(--pt-color-brand-surface)",
  "color": "var(--pt-color-on-brand-surface)"
});
legacyProject = rewriteRules(legacyProject, ".footer-column-v2 h2", {
  "color": "var(--pt-color-on-brand-surface-accent)"
});

plan(files.legacyProject, legacyProject);

/* -------------------------------------------------------------------------- */
/* 5. Header/footer and page-family contracts                                  */
/* -------------------------------------------------------------------------- */

let headerFooter = read(files.headerFooter)
  .replaceAll("var(--border)", "var(--pt-color-border)")
  .replaceAll("var(--surface)", "var(--pt-color-surface)")
  .replaceAll("var(--text)", "var(--pt-color-text)")
  .replaceAll("var(--muted)", "var(--pt-color-text-muted)")
  .replaceAll("var(--primary-dark)", "var(--pt-color-accent-text)");

plan(files.headerFooter, headerFooter);

let manufacturer = read(files.manufacturer)
  .replaceAll("color: #198a46 !important;", "color: var(--pt-color-accent-text) !important;");

plan(files.manufacturer, manufacturer);

/* Home and comparison already use semantic roles. They are read so the patch
 * fails early when their architecture regresses. */
const home = read(files.home);
const comparison = read(files.comparison);

if (!/--home3-text:\s*var\(--pt-color-text\)/.test(home)) {
  throw new Error("Homepage ist nicht an den autoritativen Texttoken angebunden.");
}
if (!/--comparison-text:\s*var\(--pt-color-text\)/.test(comparison)) {
  throw new Error("Vergleichsübersicht ist nicht an den autoritativen Texttoken angebunden.");
}

/* -------------------------------------------------------------------------- */
/* 6. Public theme architecture audit                                          */
/* -------------------------------------------------------------------------- */

const audit = `#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const authoritative = path.join(app, "src/styles/pfotentechnik-design-tokens.css");
const aliasOwners = new Set([
  path.join(app, "src/styles/foundation/tokens.css"),
  path.join(root, "packages/affiliate-core/src/styles/theme.css")
]);

const roots = [
  path.join(app, "src"),
  path.join(root, "packages/affiliate-core/src")
];

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return /\\.(css|astro)$/.test(entry.name) ? [target] : [];
  });

const sources = roots.flatMap(walk);
const errors = [];

const ownedColors = [
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

const legacyTheme = [
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

const escape = (value) => value.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, "\\\\$&");

for (const target of sources) {
  const source = fs.readFileSync(target, "utf8");

  for (const token of ownedColors) {
    if (
      target !== authoritative &&
      new RegExp(\`\${escape(token)}\\\\s*:\`).test(source)
    ) {
      errors.push(
        \`\${path.relative(root, target)} definiert den autoritativen Token \${token} erneut.\`
      );
    }
  }

  for (const token of legacyTheme) {
    if (
      !aliasOwners.has(target) &&
      new RegExp(\`\${escape(token)}\\\\s*:\`).test(source)
    ) {
      errors.push(
        \`\${path.relative(root, target)} definiert den Legacy-Theme-Token \${token} außerhalb der Alias-Schicht.\`
      );
    }
  }

  if (
    target !== authoritative &&
    /@media\\s*\\(\\s*prefers-color-scheme\\s*:\\s*dark\\s*\\)[\\s\\S]*?--pt-(?:theme|color)-(?:text|surface|page|canvas)\\s*:/.test(source)
  ) {
    errors.push(
      \`\${path.relative(root, target)} enthält eine konkurrierende Dark-Mode-Palette.\`
    );
  }
}

const tokenSource = fs.readFileSync(authoritative, "utf8");
const darkBlocks =
  tokenSource.match(/@media\\s*\\(\\s*prefers-color-scheme\\s*:\\s*dark\\s*\\)/g) ?? [];

if (darkBlocks.length !== 1) {
  errors.push(
    \`Die autoritative Token-Datei besitzt \${darkBlocks.length} statt genau eines System-Dark-Mode-Blocks.\`
  );
}

const contracts = [
  {
    file: path.join(root, "packages/affiliate-core/src/styles/header-footer.css"),
    checks: [
      ["Header-Marke", /\\.site-header-v2 \\.brand-name[\\s\\S]*?var\\(--pt-color-text\\)/],
      ["Footer-Marke", /\\.footer-v2[\\s\\S]*?var\\(--pt-color-on-brand-surface/]
    ]
  },
  {
    file: path.join(root, "packages/affiliate-core/src/components/home/home.css"),
    checks: [
      ["Homepage-Titel", /--home3-text:\\s*var\\(--pt-color-text\\)/],
      ["Homepage-Tile-Titel", /\\.home3-card-content h3[\\s\\S]*?var\\(--home3-text\\)/]
    ]
  },
  {
    file: path.join(app, "src/pages/vergleiche/index.astro"),
    checks: [
      ["Vergleichstitel", /--comparison-text:\\s*var\\(--pt-color-text\\)/],
      ["Vergleichskarten", /\\.comparison-card h3[\\s\\S]*?var\\(--comparison-text\\)/]
    ]
  },
  {
    file: path.join(app, "src/pages/hersteller/index.astro"),
    checks: [
      ["Hersteller-Score", /var\\(--pt-color-accent-text\\) !important/]
    ]
  }
];

for (const contract of contracts) {
  const source = fs.readFileSync(contract.file, "utf8");
  for (const [label, pattern] of contract.checks) {
    if (!pattern.test(source)) {
      errors.push(\`\${label} verwendet nicht den erwarteten Theme-Vertrag.\`);
    }
  }
}

if (errors.length > 0) {
  console.error("Public-Theme-Architecture-Audit fehlgeschlagen:");
  for (const error of errors) console.error(\`- \${error}\`);
  process.exit(1);
}

console.log("Public-Theme-Architecture-Audit erfolgreich.");
console.log(\`Öffentliche Quelldateien geprüft: \${sources.length}\`);
console.log("Autoritative Palette: pfotentechnik-design-tokens.css");
console.log("Alias-Schichten: foundation/tokens.css, affiliate-core/theme.css");
`;

plan(files.audit, audit);

/* -------------------------------------------------------------------------- */
/* 7. Regression tests                                                        */
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
const foundation = read(path.join(app, "src/styles/foundation/tokens.css"));
const designSystem = read(path.join(app, "src/styles/pfotentechnik-design-system.css"));
const legacyProject = read(path.join(app, "src/styles/pfotentechnik.css"));
const coreTheme = read(path.join(root, "packages/affiliate-core/src/styles/theme.css"));
const headerFooter = read(path.join(root, "packages/affiliate-core/src/styles/header-footer.css"));
const home = read(path.join(root, "packages/affiliate-core/src/components/home/home.css"));
const comparison = read(path.join(app, "src/pages/vergleiche/index.astro"));

test("one authoritative system dark-mode block exists", () => {
  assert.equal(
    (tokens.match(/@media\\s*\\(\\s*prefers-color-scheme\\s*:\\s*dark\\s*\\)/g) ?? []).length,
    1
  );
  assert.match(tokens, /:root\\[data-theme="dark"\\]/);
  assert.match(tokens, /:root\\[data-theme="light"\\]/);
});

test("alias layers contain no fixed palette", () => {
  assert.doesNotMatch(foundation, /#[0-9a-f]{3,8}\\b/i);
  assert.doesNotMatch(coreTheme, /#[0-9a-f]{3,8}\\b/i);
  assert.match(foundation, /--pt-theme-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(coreTheme, /--text:\\s*var\\(--pt-color-text\\)/);
});

test("design-system no longer defines theme variables", () => {
  assert.doesNotMatch(designSystem, /--pt-theme-(?:text|surface|canvas|accent)[a-z0-9-]*\\s*:/);
  const darkBlocks = [];
  const mediaHeader = /@media\\s*\\(\\s*prefers-color-scheme\\s*:\\s*dark\\s*\\)\\s*\\{/g;
  let match;

  while ((match = mediaHeader.exec(designSystem))) {
    let depth = 0;
    let end = match.index;

    for (let index = designSystem.indexOf("{", match.index); index < designSystem.length; index += 1) {
      if (designSystem[index] === "{") depth += 1;
      if (designSystem[index] === "}") {
        depth -= 1;
        if (depth === 0) {
          end = index + 1;
          break;
        }
      }
    }

    darkBlocks.push(designSystem.slice(match.index, end));
    mediaHeader.lastIndex = end;
  }

  assert.equal(
    darkBlocks.filter((block) => /--pt-theme-[a-z0-9-]+\\s*:/.test(block)).length,
    0
  );
});

test("shared shell is semantic in both public global stylesheets", () => {
  for (const source of [designSystem, legacyProject]) {
    assert.match(source, /\\.site-header-v2[\\s\\S]*?var\\(--pt-color-surface\\)/);
    assert.match(source, /\\.main-nav-v2 a[\\s\\S]*?var\\(--pt-color-text-muted\\)/);
  }
  assert.match(
    headerFooter,
    /\\.site-header-v2 \\.brand-name[\\s\\S]*?var\\(--pt-color-text\\)/
  );
  assert.match(headerFooter, /var\\(--pt-color-on-brand-surface/);
});

test("selector migration does not mutate pseudo-elements or state variants", () => {
  assert.doesNotMatch(
    designSystem,
    /\\.nav-toggle-button::(?:before|after)[^{]*\\{[^}]*background:\\s*var\\(--pt-color-surface\\)/
  );
  assert.doesNotMatch(
    designSystem,
    /\\.brand-name::after[^{]*\\{[^}]*color:\\s*var\\(--pt-color-text\\)/
  );
  assert.doesNotMatch(
    designSystem,
    /\\.main-nav-v2 a:hover[^{]*\\{[^}]*background:\\s*var\\(--pt-color-surface\\)/
  );
});

test("homepage and comparison titles use the authoritative foreground", () => {
  assert.match(home, /--home3-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(home, /\\.home3-card-content h3[\\s\\S]*?var\\(--home3-text\\)/);
  assert.match(comparison, /--comparison-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(comparison, /\\.comparison-card h3[\\s\\S]*?var\\(--comparison-text\\)/);
});

test("cleanup introduces no important declarations into architecture files", () => {
  assert.doesNotMatch(tokens, /!important/);
  assert.doesNotMatch(foundation, /!important/);
  assert.doesNotMatch(coreTheme, /!important/);
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
