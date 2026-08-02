#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-text-surface-token-cleanup-26.0.2";
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

const roots = [
  path.join(APP, "src"),
  path.join(CORE, "src")
];

const files = {
  audit: path.join(APP, "scripts", "design-system", "audit-text-surface-token-usage.mjs"),
  test: path.join(APP, "test", "text-surface-token-cleanup-26.0.2.test.mjs")
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

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return /\.(css|astro)$/.test(entry.name) ? [target] : [];
  });
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

const publicFiles = roots.flatMap(walk);

/*
 * A surface token in a text foreground property is a role violation.
 * The confirmed production failure was:
 *
 *   .home3-card-content h3 { color: var(--pt-color-page); }
 *
 * That made the card title identical to the dark page background.
 */
const foregroundProperties =
  "(?:color|-webkit-text-fill-color|text-decoration-color|caret-color|fill|stroke)";
const surfaceTokens =
  "(?:--pt-color-page|--pt-color-surface(?:-soft|-raised)?|--pt-theme-canvas|--pt-theme-surface(?:-2|-3)?)";

const misusePattern = new RegExp(
  `(${foregroundProperties}\\s*:\\s*var\\(\\s*)(${surfaceTokens})(\\s*\\))`,
  "g"
);

const replacements = new Map([
  ["--pt-color-page", "--pt-color-text"],
  ["--pt-color-surface", "--pt-color-text"],
  ["--pt-color-surface-soft", "--pt-color-text"],
  ["--pt-color-surface-raised", "--pt-color-text"],
  ["--pt-theme-canvas", "--pt-theme-text"],
  ["--pt-theme-surface", "--pt-theme-text"],
  ["--pt-theme-surface-2", "--pt-theme-text"],
  ["--pt-theme-surface-3", "--pt-theme-text"]
]);

const changedOccurrences = [];

for (const target of publicFiles) {
  const source = read(target);

  const migrated = source.replace(
    misusePattern,
    (match, prefix, token, suffix, offset) => {
      const replacement = replacements.get(token);
      if (!replacement) return match;

      changedOccurrences.push({
        file: relative(target),
        token,
        replacement,
        offset
      });

      return `${prefix}${replacement}${suffix}`;
    }
  );

  plan(target, migrated);
}

if (changedOccurrences.length === 0) {
  throw new Error(
    "Keine Textfarbe mit einem Flächen-Token gefunden. " +
    "Der Repository-Stand entspricht nicht dem im Browser bestätigten Stand."
  );
}

const auditSource = `#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

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

const files = roots.flatMap(walk);
const foregroundProperties =
  "(?:color|-webkit-text-fill-color|text-decoration-color|caret-color|fill|stroke)";
const surfaceTokens =
  "(?:--pt-color-page|--pt-color-surface(?:-soft|-raised)?|--pt-theme-canvas|--pt-theme-surface(?:-2|-3)?)";

const misuse = new RegExp(
  \`\${foregroundProperties}\\\\s*:\\\\s*var\\\\(\\\\s*\${surfaceTokens}\\\\s*\\\\)\`,
  "g"
);

const errors = [];

for (const target of files) {
  const source = fs.readFileSync(target, "utf8");
  const matches = source.match(misuse) ?? [];

  for (const match of matches) {
    errors.push(\`\${path.relative(root, target)}: \${match}\`);
  }
}

if (errors.length > 0) {
  console.error("Text-Surface-Token-Audit fehlgeschlagen:");
  for (const error of errors) console.error(\`- \${error}\`);
  process.exit(1);
}

console.log("Text-Surface-Token-Audit erfolgreich.");
console.log(\`Öffentliche Quelldateien geprüft: \${files.length}\`);
`;

plan(files.audit, auditSource);

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");

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

const files = roots.flatMap(walk);
const joined = files.map((file) => fs.readFileSync(file, "utf8")).join("\\n");

test("surface tokens are never used as text foregrounds", () => {
  assert.doesNotMatch(
    joined,
    /(?:color|-webkit-text-fill-color|text-decoration-color|caret-color|fill|stroke)\\s*:\\s*var\\(\\s*(?:--pt-color-page|--pt-color-surface(?:-soft|-raised)?|--pt-theme-canvas|--pt-theme-surface(?:-2|-3)?)\\s*\\)/
  );
});

test("homepage card titles retain the semantic text contract", () => {
  const home = fs.readFileSync(
    path.join(root, "packages/affiliate-core/src/components/home/home.css"),
    "utf8"
  );

  assert.match(
    home,
    /\\.home3-card-content h3[\\s\\S]*?color:\\s*var\\(--home3-text\\)/
  );
  assert.doesNotMatch(
    joined,
    /\\.home3-card-content h3\\s*\\{[^}]*color:\\s*var\\(--pt-color-page\\)/
  );
});

test("no new important declarations are introduced", () => {
  const audit = fs.readFileSync(
    path.join(app, "scripts/design-system/audit-text-surface-token-usage.mjs"),
    "utf8"
  );
  assert.doesNotMatch(audit, /!important/);
});
`;

plan(files.test, testSource);

const changed = [...planned.keys()];

console.log(`[${NAME}] Gefundene Rollenverstöße: ${changedOccurrences.length}`);
for (const finding of changedOccurrences) {
  console.log(
    `  ${finding.file}: ${finding.token} -> ${finding.replacement}`
  );
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
