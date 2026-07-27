#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-component-simplification-recovery-12.0.2";
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const NO_COMMIT = args.has("--no-commit");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  console.error(`[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

function findRoot(start) {
  let current = path.resolve(start);

  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const root =
  findRoot(process.cwd()) ||
  findRoot(path.dirname(fileURLToPath(import.meta.url)));

if (!root) fail("Repository-Root nicht gefunden.");

const headerFile = path.join(
  root,
  "packages/affiliate-core/src/components/Header.astro"
);
const reportFile = path.join(
  root,
  "apps/pfotentechnik/reports/design-system/component-simplification-recovery-12.0.2.md"
);

if (!fs.existsSync(headerFile)) {
  fail(`Header fehlt: ${path.relative(root, headerFile)}`);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const rel = (file) => path.relative(root, file).split(path.sep).join("/");
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
const read = (file) => fs.readFileSync(file, "utf8");

function backup(file) {
  if (DRY_RUN || !fs.existsSync(file)) return;

  const target = path.join(backupRoot, rel(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const before = read(file);
  if (before === content) return false;

  if (!DRY_RUN) {
    backup(file);
    fs.writeFileSync(file, content);
  }

  return true;
}

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  }).status === 0;
}

let header = read(headerFile);

const buttonPattern = /<button\b[\s\S]*?data-nav-toggle[\s\S]*?>/m;
const match = header.match(buttonPattern);

if (!match) {
  fail("Navigationstoggle mit data-nav-toggle wurde nicht gefunden.");
}

const openingTag = match[0];
let fixedTag = openingTag;

const classMatch = openingTag.match(/\bclass=(["'])(.*?)\1/s);

if (classMatch) {
  const quote = classMatch[1];
  const classNames = classMatch[2]
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  const normalized = [
    "pt-button",
    ...classNames.filter((name) => name !== "pt-button")
  ];

  if (!normalized.includes("nav-toggle-button")) {
    normalized.push("nav-toggle-button");
  }

  fixedTag = openingTag.replace(
    classMatch[0],
    `class=${quote}${normalized.join(" ")}${quote}`
  );
} else {
  fixedTag = openingTag.replace(
    /^<button\b/,
    '<button class="pt-button nav-toggle-button"'
  );
}

header = header.replace(openingTag, fixedTag);

const finalButton = header.match(buttonPattern)?.[0] ?? "";

if (!/\bclass=(["'])[^"']*\bpt-button\b[^"']*\1/s.test(finalButton)) {
  fail("pt-button konnte am Navigationstoggle nicht sicher gesetzt werden.");
}

if (!/\bclass=(["'])[^"']*\bnav-toggle-button\b[^"']*\1/s.test(finalButton)) {
  fail("nav-toggle-button fehlt nach der Korrektur.");
}

const changed = write(headerFile, header);

const report = `# Component Simplification Recovery 12.0.2

## Ursache

Der Navigationstoggle in \`Header.astro\` wurde beim Umbau zwar semantisch
beibehalten, wurde im lokalen Zwischenstand aber vom Component-Adoption-Audit
nicht mehr als \`pt-button\` erkannt.

## Korrektur

- vorhandenes \`class\`-Attribut robust normalisiert
- \`pt-button\` garantiert als erste Klasse gesetzt
- \`nav-toggle-button\` garantiert erhalten
- keine Layout-, Token- oder CSS-Budget-Änderung
- offener Stand aus 12.0.0 und 12.0.1 bleibt erhalten

Datei geändert: ${changed ? "ja" : "bereits korrekt"}
`;

if (!DRY_RUN) {
  ensureDir(path.dirname(reportFile));
  fs.writeFileSync(reportFile, report);
}

log(`Header-Adoption: ${changed ? "korrigiert" : "bereits korrekt"}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run erfolgreich.");
  process.exit(0);
}

for (const check of [
  "design-system:components:audit",
  "design-system:tokens:audit",
  "design-system:density:audit",
  "design-system:check"
]) {
  if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", check])) {
    fail(`${check} fehlgeschlagen.`);
  }
}

if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("Build fehlgeschlagen.");
}

const visualQaScript = path.join(
  root,
  "apps/pfotentechnik/scripts/design-system/visual-qa.mjs"
);

if (
  fs.existsSync(visualQaScript) &&
  !run("npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:visual-qa"
  ])
) {
  fail("Visual-QA fehlgeschlagen.");
}

if (!NO_COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8"
  });

  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", "-A"])) {
      fail("git add fehlgeschlagen.");
    }

    if (!run("git", [
      "commit",
      "-m",
      "refactor(pfotentechnik): simplify comparison components"
    ])) {
      fail("Commit fehlgeschlagen.");
    }

    log("12.0.0–12.0.2 gemeinsam lokal committed.");
  } else {
    log("Keine offenen Änderungen.");
  }
}

log("Component Simplification Recovery 12.0.2 erfolgreich abgeschlossen.");
