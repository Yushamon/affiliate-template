#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-component-adoption-recovery-11.5.1";
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const NO_COMMIT = args.has("--no-commit");

const log = (m) => console.log(`[${NAME}] ${m}`);
const fail = (m) => {
  console.error(`[${NAME}] FEHLER: ${m}`);
  process.exit(1);
};

function findRoot(start) {
  let dir = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = findRoot(process.cwd()) || findRoot(scriptDir);
if (!root) fail("Repository-Root nicht gefunden.");

const app = path.join(root, "apps", "pfotentechnik");
const appSrc = path.join(app, "src");
const coreSrc = path.join(root, "packages", "affiliate-core", "src");
const auditFile = path.join(app, "scripts", "design-system", "component-adoption-audit.mjs");
const reportDir = path.join(app, "reports", "design-system");
const reportFile = path.join(reportDir, "component-adoption-recovery-11.5.1.md");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/");
}
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
function read(file) {
  return fs.readFileSync(file, "utf8");
}
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro", ".git", ".patch-backups"].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
function backup(file) {
  if (DRY_RUN || !fs.existsSync(file)) return;
  const target = path.join(backupRoot, rel(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}
function write(file, content) {
  const old = fs.existsSync(file) ? read(file) : null;
  if (old === content) return false;
  if (!DRY_RUN) {
    if (old !== null) backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }
  return true;
}
function run(cmd, argv) {
  return spawnSync(cmd, argv, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  }).status === 0;
}

const files = [
  ...walk(appSrc),
  ...walk(coreSrc),
].filter((file) => /\.(astro|tsx?|jsx?)$/.test(file));

const changedFiles = [];
let buttonFixes = 0;
let chipFixes = 0;
let controlFixes = 0;

function ensurePrimitive(classes, matcher, primitive) {
  const list = classes.trim().split(/\s+/).filter(Boolean);
  if (!list.some((name) => matcher.test(name))) return { classes, changed: false };
  if (list.includes(primitive)) return { classes, changed: false };
  return {
    classes: [primitive, ...list].join(" "),
    changed: true,
  };
}

for (const file of files) {
  const before = read(file);
  let localButtonFixes = 0;
  let localChipFixes = 0;
  let localControlFixes = 0;

  const after = before.replace(
    /\bclass\s*=\s*(["'])([\s\S]*?)\1/g,
    (full, quote, rawClasses) => {
      // Nur wirklich statische Klassenattribute bearbeiten.
      if (/[{}$`]/.test(rawClasses)) return full;

      let classes = rawClasses;

      let result = ensurePrimitive(
        classes,
        /(?:^|[-_])(button|btn)(?:$|[-_])/i,
        "pt-button"
      );
      classes = result.classes;
      if (result.changed) localButtonFixes++;

      result = ensurePrimitive(
        classes,
        /(?:^|[-_])(chip|pill|tag)(?:$|[-_])/i,
        "pt-chip"
      );
      classes = result.classes;
      if (result.changed) localChipFixes++;

      result = ensurePrimitive(
        classes,
        /(?:^|[-_])(input|select|textarea|control|field)(?:$|[-_])/i,
        "pt-control"
      );
      classes = result.classes;
      if (result.changed) localControlFixes++;

      if (
        localButtonFixes === 0 &&
        localChipFixes === 0 &&
        localControlFixes === 0
      ) return full;

      return `class=${quote}${classes}${quote}`;
    }
  );

  if (after !== before && write(file, after)) {
    changedFiles.push(rel(file));
    buttonFixes += localButtonFixes;
    chipFixes += localChipFixes;
    controlFixes += localControlFixes;
  }
}

/* Audit robuster machen:
 * - nur echte statische class-Attribute prüfen
 * - dynamische Inhalte und Script-Strings ignorieren
 * - Fundstellen deduplizieren
 */
const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const auditDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(auditDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro", ".git"].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const files = [
  ...walk(path.join(appRoot, "src")),
  ...walk(path.join(repoRoot, "packages", "affiliate-core", "src")),
].filter((file) => /\\.(astro|tsx?|jsx?)$/.test(file));

const findings = new Set();
const classRe = /\\bclass\\s*=\\s*(["'])([\\s\\S]*?)\\1/g;

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  let match;

  while ((match = classRe.exec(source))) {
    const raw = match[2];
    if (/[{}$\`]/.test(raw)) continue;

    const classes = raw.trim().split(/\\s+/).filter(Boolean);

    const hasButtonClass = classes.some((name) =>
      /(?:^|[-_])(button|btn)(?:$|[-_])/i.test(name)
    );
    const hasChipClass = classes.some((name) =>
      /(?:^|[-_])(chip|pill|tag)(?:$|[-_])/i.test(name)
    );
    const hasControlClass = classes.some((name) =>
      /(?:^|[-_])(input|select|textarea|control|field)(?:$|[-_])/i.test(name)
    );

    const relative = path.relative(repoRoot, file);

    if (hasButtonClass && !classes.includes("pt-button")) {
      findings.add(relative + ": Button ohne pt-button");
    }
    if (hasChipClass && !classes.includes("pt-chip")) {
      findings.add(relative + ": Chip ohne pt-chip");
    }
    if (hasControlClass && !classes.includes("pt-control")) {
      findings.add(relative + ": Control ohne pt-control");
    }
  }
}

if (findings.size) {
  console.error("Nicht adoptierte statische Komponenten gefunden:");
  console.error([...findings].slice(0, 200).join("\\n"));
  process.exit(1);
}

console.log("Component-Adoption-Audit erfolgreich.");
`;

write(auditFile, auditSource);

const report = `# Component Adoption Recovery 11.5.1

## Ergebnis

- Geänderte Dateien: **${changedFiles.length}**
- Ergänzte \`pt-button\`-Klassen: **${buttonFixes}**
- Ergänzte \`pt-chip\`-Klassen: **${chipFixes}**
- Ergänzte \`pt-control\`-Klassen: **${controlFixes}**

## Geänderte Dateien

${changedFiles.length ? changedFiles.map((f) => `- \`${f}\``).join("\n") : "- Keine"}

## Korrektur

Der ursprüngliche Installer hat bestimmte mehrzeilige statische Klassenattribute nicht vollständig verarbeitet. Der Recovery-Lauf verwendet deshalb eine mehrzeilige, attributspezifische Erkennung und dedupliziert gleichzeitig die Audit-Ausgabe.
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportFile, report);
}

log(`Geänderte Dateien: ${changedFiles.length}`);
log(`Button-Fixes: ${buttonFixes}`);
log(`Chip-Fixes: ${chipFixes}`);
log(`Control-Fixes: ${controlFixes}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run erfolgreich; keine Dateien verändert.");
  process.exit(0);
}

for (const script of [
  "design-system:audit",
  "design-system:tokens:audit",
  "design-system:primitives:audit",
  "design-system:components:audit",
]) {
  if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", script])) {
    fail(`${script} fehlgeschlagen.`);
  }
}

if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("Build fehlgeschlagen.");
}

if (!NO_COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });

  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", "-A"])) fail("git add fehlgeschlagen.");
    if (!run("git", ["commit", "-m", "refactor(pfotentechnik): adopt shared ui primitives"])) {
      fail("Commit fehlgeschlagen.");
    }
    log("Offener 11.5.0-Stand und Recovery gemeinsam lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Component Adoption Recovery 11.5.1 erfolgreich abgeschlossen.");
