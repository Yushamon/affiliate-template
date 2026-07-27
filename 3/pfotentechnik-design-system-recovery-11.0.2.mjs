#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-design-system-recovery-11.0.2";
const args = new Set(process.argv.slice(2));
const noBuild = args.has("--no-build");
const noCommit = args.has("--no-commit");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  console.error(`[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

function findRepoRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });
  return result.status === 0;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = findRepoRoot(process.cwd()) || findRepoRoot(scriptDir);
if (!root) fail("Repository-Root konnte nicht gefunden werden.");

const app = path.join(root, "apps", "pfotentechnik");
const stylesDir = path.join(app, "src", "styles");
const tokenPath = path.join(stylesDir, "pfotentechnik-design-tokens.css");
const layoutPath = path.join(app, "src", "layouts", "ProjectLayout.astro");
const auditPath = path.join(app, "scripts", "design-system", "audit.mjs");
const packagePath = path.join(app, "package.json");

fs.mkdirSync(stylesDir, { recursive: true });

const tokens = `/**
 * PfotenTechnik Design Tokens
 * Zentrale semantische Werte für Light Mode, Dark Mode und Komponenten.
 */
:root {
  --pt-color-brand-700: #1f5f35;
  --pt-color-brand-600: #2e7d32;
  --pt-color-brand-500: #3f8f50;
  --pt-color-brand-100: #eaf5ed;
  --pt-color-brand-050: #f4faf5;

  --pt-color-accent-600: #4f46e5;
  --pt-color-warning-500: #f59e0b;
  --pt-color-danger-600: #dc2626;
  --pt-color-success-600: #2e7d32;

  --pt-color-text: #17211b;
  --pt-color-text-muted: #5f6f65;
  --pt-color-border: #dfe7e1;
  --pt-color-border-strong: #cbd7ce;
  --pt-color-surface: #ffffff;
  --pt-color-surface-soft: #f7faf8;
  --pt-color-surface-raised: #ffffff;
  --pt-color-page: #f5f8f6;

  --pt-radius-xs: 0.375rem;
  --pt-radius-sm: 0.5rem;
  --pt-radius-md: 0.75rem;
  --pt-radius-lg: 1rem;
  --pt-radius-xl: 1.25rem;
  --pt-radius-2xl: 1.5rem;
  --pt-radius-pill: 999px;

  --pt-shadow-xs: 0 1px 2px rgb(17 35 24 / 0.06);
  --pt-shadow-sm: 0 4px 14px rgb(17 35 24 / 0.08);
  --pt-shadow-md: 0 10px 30px rgb(17 35 24 / 0.11);
  --pt-shadow-lg: 0 20px 50px rgb(17 35 24 / 0.14);
  --pt-shadow-focus: 0 0 0 3px rgb(46 125 50 / 0.22);

  --pt-space-1: 0.25rem;
  --pt-space-2: 0.5rem;
  --pt-space-3: 0.75rem;
  --pt-space-4: 1rem;
  --pt-space-5: 1.25rem;
  --pt-space-6: 1.5rem;
  --pt-space-8: 2rem;
  --pt-space-10: 2.5rem;
  --pt-space-12: 3rem;
  --pt-space-16: 4rem;

  --pt-control-min-height: 2.75rem;
  --pt-transition-fast: 160ms ease;
  --pt-transition-base: 220ms ease;
}

[data-theme="dark"],
.dark {
  --pt-color-text: #edf5ef;
  --pt-color-text-muted: #acbcb0;
  --pt-color-border: #304238;
  --pt-color-border-strong: #405448;
  --pt-color-surface: #16221a;
  --pt-color-surface-soft: #1b2a20;
  --pt-color-surface-raised: #203126;
  --pt-color-page: #101a14;
  --pt-color-brand-100: #203d29;
  --pt-color-brand-050: #172b1d;

  --pt-shadow-xs: 0 1px 2px rgb(0 0 0 / 0.2);
  --pt-shadow-sm: 0 5px 18px rgb(0 0 0 / 0.24);
  --pt-shadow-md: 0 12px 34px rgb(0 0 0 / 0.3);
  --pt-shadow-lg: 0 24px 58px rgb(0 0 0 / 0.36);
}
`;

fs.writeFileSync(tokenPath, tokens);
log("Token-Datei angelegt.");

if (!fs.existsSync(layoutPath)) {
  fail(`ProjectLayout fehlt: ${path.relative(root, layoutPath)}`);
}

let layout = fs.readFileSync(layoutPath, "utf8");
const importLine = `import "../styles/pfotentechnik-design-tokens.css";`;

if (!layout.includes("pfotentechnik-design-tokens.css")) {
  const frontmatterEnd = layout.indexOf("---", 3);
  if (frontmatterEnd === -1) {
    fail("Astro-Frontmatter in ProjectLayout.astro konnte nicht erkannt werden.");
  }

  const frontmatter = layout.slice(0, frontmatterEnd);
  const importMatches = [...frontmatter.matchAll(/^import\s+.+;?\s*$/gm)];
  if (importMatches.length) {
    const last = importMatches[importMatches.length - 1];
    const insertAt = last.index + last[0].length;
    layout =
      layout.slice(0, insertAt) +
      `\n${importLine}` +
      layout.slice(insertAt);
  } else {
    layout =
      layout.slice(0, 3) +
      `\n${importLine}` +
      layout.slice(3);
  }

  fs.writeFileSync(layoutPath, layout);
  log("Token-Import in ProjectLayout ergänzt.");
} else {
  log("Token-Import bereits vorhanden.");
}

const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const auditDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(auditDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const errors = [];

const tokenFile = path.join(appRoot, "src", "styles", "pfotentechnik-design-tokens.css");
const layoutFile = path.join(appRoot, "src", "layouts", "ProjectLayout.astro");

if (!fs.existsSync(tokenFile)) {
  errors.push("Token-Datei fehlt: " + path.relative(repoRoot, tokenFile));
}

if (!fs.existsSync(layoutFile)) {
  errors.push("ProjectLayout fehlt: " + path.relative(repoRoot, layoutFile));
} else {
  const layout = fs.readFileSync(layoutFile, "utf8");
  if (!layout.includes("pfotentechnik-design-tokens.css")) {
    errors.push("Token-Import fehlt in " + path.relative(repoRoot, layoutFile));
  }
}

for (const packageFile of [
  path.join(repoRoot, "package.json"),
  path.join(appRoot, "package.json"),
]) {
  try {
    JSON.parse(fs.readFileSync(packageFile, "utf8"));
  } catch (error) {
    errors.push(
      "Ungültiges JSON: " +
      path.relative(repoRoot, packageFile) +
      " – " +
      error.message
    );
  }
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro"].includes(entry.name)) return [];
    const item = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(item) : [item];
  });
}

for (const file of [
  ...walk(path.join(appRoot, "src")),
  ...walk(path.join(repoRoot, "packages", "affiliate-core", "src")),
].filter((file) => /\.(css|astro|js|mjs|ts|tsx|json)$/.test(file))) {
  const text = fs.readFileSync(file, "utf8");
  if (/^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(text)) {
    errors.push("Merge-Konfliktmarker: " + path.relative(repoRoot, file));
  }
}

if (errors.length) {
  console.error(errors.join("\\n"));
  process.exit(1);
}

console.log("Design-System-Audit erfolgreich.");
`;

fs.mkdirSync(path.dirname(auditPath), { recursive: true });
fs.writeFileSync(auditPath, auditSource);
log("Audit-Skript repariert.");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.scripts ||= {};
pkg.scripts["design-system:audit"] = "node scripts/design-system/audit.mjs";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");

if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:audit"], root)) {
  fail("Design-System-Audit fehlgeschlagen.");
}

if (!noBuild && !run("npm", ["run", "build:pfotentechnik"], root)) {
  fail("Build fehlgeschlagen.");
}

if (!noCommit) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });
  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", "-A"], root)) fail("git add fehlgeschlagen.");
    if (!run(
      "git",
      ["commit", "-m", "refactor(pfotentechnik): consolidate design system"],
      root
    )) {
      fail("Commit fehlgeschlagen.");
    }
    log("Konsolidierung lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Recovery erfolgreich abgeschlossen.");
