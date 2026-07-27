#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-component-adoption-11.5.0";
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
const packageFile = path.join(app, "package.json");
const auditFile = path.join(app, "scripts", "design-system", "component-adoption-audit.mjs");
const reportDir = path.join(app, "reports", "design-system");
const reportMd = path.join(reportDir, "component-adoption-11.5.0.md");
const reportJson = path.join(reportDir, "component-adoption-11.5.0.json");
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
function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro", ".git", ".patch-backups"].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file, predicate) : (predicate(file) ? [file] : []);
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

const componentFiles = [
  ...walk(appSrc, (p) => /\.(astro|tsx?|jsx?)$/.test(p)),
  ...walk(coreSrc, (p) => /\.(astro|tsx?|jsx?)$/.test(p)),
];

const changedFiles = [];
const classAdditions = {};
const skippedDynamic = [];

function addClassToStaticAttribute(source, classNamePattern, primitive) {
  let additions = 0;

  const output = source.replace(
    /class=(["'])([^"'{}]*?)\1/g,
    (full, quote, classes) => {
      const list = classes.trim().split(/\s+/).filter(Boolean);
      if (!list.some((name) => classNamePattern.test(name))) return full;
      if (list.includes(primitive)) return full;
      additions++;
      return `class=${quote}${[primitive, ...list].join(" ")}${quote}`;
    }
  );

  return { output, additions };
}

const mappings = [
  {
    pattern: /(?:^|[-_])(button|btn)(?:$|[-_])/i,
    primitive: "pt-button",
    label: "Button-Basis",
  },
  {
    pattern: /(?:^|[-_])(chip|pill|tag)(?:$|[-_])/i,
    primitive: "pt-chip",
    label: "Chip-Basis",
  },
  {
    pattern: /(?:^|[-_])(input|select|textarea|control|field)(?:$|[-_])/i,
    primitive: "pt-control",
    label: "Control-Basis",
  },
];

const variantMappings = [
  {
    pattern: /(?:primary|purchase|buy|amazon|cta-primary)/i,
    primitive: "pt-button-primary",
  },
  {
    pattern: /(?:secondary|outline|ghost|cta-secondary)/i,
    primitive: "pt-button-secondary",
  },
  {
    pattern: /(?:quiet|link-button|text-button)/i,
    primitive: "pt-button-quiet",
  },
];

for (const file of componentFiles) {
  const before = read(file);
  let after = before;
  let additions = 0;

  if (/class:list\s*=|className\s*=\s*\{/.test(before)) {
    skippedDynamic.push(rel(file));
  }

  for (const mapping of mappings) {
    const result = addClassToStaticAttribute(after, mapping.pattern, mapping.primitive);
    after = result.output;
    additions += result.additions;
    if (result.additions) {
      classAdditions[mapping.primitive] =
        (classAdditions[mapping.primitive] || 0) + result.additions;
    }
  }

  for (const mapping of variantMappings) {
    const result = addClassToStaticAttribute(after, mapping.pattern, mapping.primitive);
    after = result.output;
    additions += result.additions;
    if (result.additions) {
      classAdditions[mapping.primitive] =
        (classAdditions[mapping.primitive] || 0) + result.additions;
    }
  }

  // Karten nur bei klarer statischer Benennung adoptieren.
  const surfaceResult = addClassToStaticAttribute(
    after,
    /(?:^|[-_])(card|panel|surface)(?:$|[-_])/i,
    "pt-surface"
  );
  after = surfaceResult.output;
  additions += surfaceResult.additions;
  if (surfaceResult.additions) {
    classAdditions["pt-surface"] =
      (classAdditions["pt-surface"] || 0) + surfaceResult.additions;
  }

  if (additions > 0 && write(file, after)) {
    changedFiles.push(rel(file));
  }
}

/* Audit-Skript: verhindert, dass neue statische Standardkomponenten ohne Primitive bleiben. */
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

const findings = [];
const classRe = /class=(["'])([^"'{}]*?)\\1/g;

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  let match;
  while ((match = classRe.exec(source))) {
    const classes = match[2].trim().split(/\\s+/).filter(Boolean);

    const hasButtonClass = classes.some((name) => /(?:^|[-_])(button|btn)(?:$|[-_])/i.test(name));
    const hasChipClass = classes.some((name) => /(?:^|[-_])(chip|pill|tag)(?:$|[-_])/i.test(name));
    const hasControlClass = classes.some((name) => /(?:^|[-_])(input|select|textarea|control|field)(?:$|[-_])/i.test(name));

    if (hasButtonClass && !classes.includes("pt-button")) {
      findings.push(path.relative(repoRoot, file) + ": Button ohne pt-button");
    }
    if (hasChipClass && !classes.includes("pt-chip")) {
      findings.push(path.relative(repoRoot, file) + ": Chip ohne pt-chip");
    }
    if (hasControlClass && !classes.includes("pt-control")) {
      findings.push(path.relative(repoRoot, file) + ": Control ohne pt-control");
    }
  }
}

if (findings.length) {
  console.error("Nicht adoptierte statische Komponenten gefunden:");
  console.error(findings.slice(0, 200).join("\\n"));
  process.exit(1);
}

console.log("Component-Adoption-Audit erfolgreich.");
`;

write(auditFile, auditSource);

const pkg = JSON.parse(read(packageFile));
pkg.scripts ||= {};
pkg.scripts["design-system:components:audit"] =
  "node scripts/design-system/component-adoption-audit.mjs";
write(packageFile, JSON.stringify(pkg, null, 2) + "\n");

const summary = {
  changedFiles: changedFiles.length,
  totalClassAdditions: Object.values(classAdditions).reduce((a, b) => a + b, 0),
  skippedDynamicFiles: skippedDynamic.length,
};

const report = {
  name: NAME,
  generatedAt: new Date().toISOString(),
  dryRun: DRY_RUN,
  summary,
  classAdditions,
  changedFiles,
  skippedDynamic,
};

const md = `# PfotenTechnik Component Adoption 11.5.0

## Ergebnis

- Geänderte Komponenten: **${summary.changedFiles}**
- Ergänzte Primitive-Klassen: **${summary.totalClassAdditions}**
- Dynamische Klassen bewusst nicht automatisch verändert: **${summary.skippedDynamicFiles}**

## Ergänzte Klassen

${Object.entries(classAdditions).length
  ? Object.entries(classAdditions).map(([name, count]) => `- \`${name}\`: ${count}`).join("\n")
  : "- Keine"}

## Geänderte Dateien

${changedFiles.length ? changedFiles.map((f) => `- \`${f}\``).join("\n") : "- Keine"}

## Bewusst ausgelassen

Dateien mit \`class:list\` oder dynamischen \`className\`-Ausdrücken werden nur gemeldet. Eine automatische Änderung wäre dort zu riskant.

${skippedDynamic.length
  ? skippedDynamic.slice(0, 100).map((f) => `- \`${f}\``).join("\n")
  : "- Keine"}
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportJson, JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(reportMd, md);
}

log(`Geänderte Komponenten: ${summary.changedFiles}`);
log(`Ergänzte Primitive-Klassen: ${summary.totalClassAdditions}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run abgeschlossen.");
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
    log("Änderungen lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Component Adoption 11.5.0 erfolgreich abgeschlossen.");
