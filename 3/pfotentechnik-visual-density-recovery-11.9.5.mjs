#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-visual-density-recovery-11.9.5";
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
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = findRoot(process.cwd()) || findRoot(scriptDir);

if (!root) fail("Repository-Root nicht gefunden.");

const app = path.join(root, "apps", "pfotentechnik");
const layoutFile = path.join(app, "src", "layouts", "ProjectLayout.astro");
const densityFile = path.join(
  app,
  "src",
  "styles",
  "pfotentechnik-visual-density.css"
);
const auditFile = path.join(
  app,
  "scripts",
  "design-system",
  "density-audit.mjs"
);
const reportDir = path.join(app, "reports", "design-system");
const reportFile = path.join(
  reportDir,
  "visual-density-recovery-11.9.5.md"
);
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  if (DRY_RUN || !fs.existsSync(file)) return;

  const target = path.join(backupRoot, relative(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const previous = fs.existsSync(file) ? read(file) : null;

  if (previous === content) return false;

  if (!DRY_RUN) {
    if (previous !== null) backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }

  return true;
}

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  }).status === 0;
}

for (const file of [layoutFile, densityFile, auditFile]) {
  if (!fs.existsSync(file)) {
    fail(`Pflichtdatei fehlt: ${relative(file)}`);
  }
}

/* Density-CSS weiterhin root-frei halten. */
const densityBefore = read(densityFile);
const densityAfter = densityBefore.replace(/:root\s*\{/g, ":where(html) {");
const densityChanged = write(densityFile, densityAfter);

if (/:root\s*\{/.test(densityAfter)) {
  fail("Im Density-Layer sind weiterhin :root-Blöcke vorhanden.");
}

/* Import ohne Regex-Fallen normalisieren. */
const layoutBefore = read(layoutFile);
const newline = layoutBefore.includes("\r\n") ? "\r\n" : "\n";
const canonicalImport =
  'import "../styles/pfotentechnik-visual-density.css";';

function isDensityImport(line) {
  const trimmed = line.trim();

  return (
    trimmed.startsWith("import ") &&
    trimmed.includes("pfotentechnik-visual-density.css")
  );
}

let lines = layoutBefore.split(/\r?\n/);
const removedImports = lines.filter(isDensityImport).length;
lines = lines.filter((line) => !isDensityImport(line));

const preferredNames = [
  "pfotentechnik-responsive-resilience.css",
  "pfotentechnik-ui-primitives.css",
  "pfotentechnik-primitives.css",
  "pfotentechnik-ui-system.css",
];

let insertIndex = -1;

for (const filename of preferredNames) {
  const index = lines.findIndex(
    (line) =>
      line.trim().startsWith("import ") &&
      line.includes(filename)
  );

  if (index >= 0) {
    insertIndex = index + 1;
    break;
  }
}

if (insertIndex < 0) {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const trimmed = lines[index].trim();

    if (
      trimmed.startsWith("import ") &&
      trimmed.includes(".css")
    ) {
      insertIndex = index + 1;
      break;
    }
  }
}

if (insertIndex < 0) {
  const firstFence = lines.findIndex((line) => line.trim() === "---");
  insertIndex = firstFence >= 0 ? firstFence + 1 : 0;
}

lines.splice(insertIndex, 0, canonicalImport);

const layoutAfter = lines.join(newline);
const layoutChanged = write(layoutFile, layoutAfter);

const finalImportCount = layoutAfter
  .split(/\r?\n/)
  .filter(isDensityImport).length;

if (finalImportCount !== 1) {
  fail(
    `Import-Normalisierung fehlgeschlagen: ${finalImportCount} Density-Imports gefunden.`
  );
}

/* Audit bewusst ohne Import-Regex erzeugen. */
const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const layoutFile = path.join(
  appRoot,
  "src",
  "layouts",
  "ProjectLayout.astro"
);
const cssFile = path.join(
  appRoot,
  "src",
  "styles",
  "pfotentechnik-visual-density.css"
);

const errors = [];

function isDensityImport(line) {
  const trimmed = line.trim();

  return (
    trimmed.startsWith("import ") &&
    trimmed.includes("pfotentechnik-visual-density.css")
  );
}

function isCssImport(line, filename) {
  const trimmed = line.trim();

  return (
    trimmed.startsWith("import ") &&
    trimmed.includes(filename)
  );
}

if (!fs.existsSync(layoutFile)) {
  errors.push("ProjectLayout fehlt.");
}

if (!fs.existsSync(cssFile)) {
  errors.push("Visual-Density-Datei fehlt.");
}

if (fs.existsSync(layoutFile)) {
  const layout = fs.readFileSync(layoutFile, "utf8");
  const lines = layout.split(/\\r?\\n/);
  const densityImports = lines.filter(isDensityImport);

  if (densityImports.length !== 1) {
    errors.push(
      "Visual Density muss exakt einmal importiert werden. Gefunden: " +
        densityImports.length
    );
  }

  const densityIndex = lines.findIndex(isDensityImport);
  const anchorIndexes = [
    "pfotentechnik-responsive-resilience.css",
    "pfotentechnik-ui-primitives.css",
    "pfotentechnik-primitives.css",
    "pfotentechnik-ui-system.css",
  ]
    .map((filename) =>
      lines.findIndex((line) => isCssImport(line, filename))
    )
    .filter((index) => index >= 0);

  if (
    densityIndex >= 0 &&
    anchorIndexes.length > 0 &&
    densityIndex < Math.min(...anchorIndexes)
  ) {
    errors.push(
      "Visual Density wird vor der grundlegenden UI-Schicht importiert."
    );
  }
}

if (fs.existsSync(cssFile)) {
  const css = fs.readFileSync(cssFile, "utf8");

  const requiredFragments = [
    "--pt-section-gap",
    "--pt-content-gap",
    "--pt-card-padding",
    ".pt-page-flow",
    ".pt-section-flow",
    ".pt-card-grid",
    ".pt-actions",
  ];

  for (const fragment of requiredFragments) {
    if (!css.includes(fragment)) {
      errors.push("Density-Baustein fehlt: " + fragment);
    }
  }

  if (css.includes("!important")) {
    errors.push(
      "Visual Density darf kein !important enthalten."
    );
  }

  if (css.includes(":root")) {
    errors.push(
      "Visual Density darf keine :root-Blöcke enthalten."
    );
  }

  const hexColorPattern = /#[0-9a-fA-F]{3,8}\\b/;
  if (hexColorPattern.test(css)) {
    errors.push(
      "Visual Density enthält harte Hex-Farben."
    );
  }
}

if (errors.length > 0) {
  console.error(errors.join("\\n"));
  process.exit(1);
}

console.log("Visual-Density-Audit erfolgreich.");
`;

const auditChanged = write(auditFile, auditSource);

const report = `# PfotenTechnik Visual Density Recovery 11.9.5

## Ursache

Der Audit aus 11.9.4 enthielt eine im generierten JavaScript überescaped
Import-RegEx. Dadurch wurde der tatsächlich vorhandene Import nicht erkannt.

## Korrektur

- Importerkennung vollständig auf zeilenbasierte String-Prüfung umgestellt
- keine komplexe Import-RegEx mehr
- vorhandene Importvarianten entfernt: **${removedImports}**
- final erkannte Density-Imports: **${finalImportCount}**
- ProjectLayout geändert: **${layoutChanged ? "ja" : "nein"}**
- Density-Datei geändert: **${densityChanged ? "ja" : "nein"}**
- Audit geändert: **${auditChanged ? "ja" : "nein"}**
- CSS-Budget-Baseline bleibt unverändert
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportFile, report);
}

log(`Entfernte Density-Imports: ${removedImports}`);
log(`Finale Density-Imports: ${finalImportCount}`);
log(`ProjectLayout: ${layoutChanged ? "normalisiert" : "bereits korrekt"}`);
log(`Density-Datei: ${densityChanged ? "korrigiert" : "bereits korrekt"}`);
log(`Density-Audit: ${auditChanged ? "stabil ersetzt" : "bereits aktuell"}`);
log(`Backups: ${relative(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run erfolgreich abgeschlossen.");
  process.exit(0);
}

for (const check of [
  "design-system:density:audit",
  "design-system:check",
]) {
  if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", check])) {
    fail(`${check} fehlgeschlagen.`);
  }
}

if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("Build fehlgeschlagen.");
}

const visualQaScript = path.join(
  app,
  "scripts",
  "design-system",
  "visual-qa.mjs"
);

if (
  fs.existsSync(visualQaScript) &&
  !run("npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:visual-qa",
  ])
) {
  fail("Visual-QA fehlgeschlagen.");
}

if (!NO_COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });

  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", "-A"])) fail("git add fehlgeschlagen.");

    if (
      !run("git", [
        "commit",
        "-m",
        "refactor(pfotentechnik): reduce visual density",
      ])
    ) {
      fail("Commit fehlgeschlagen.");
    }

    log("Offener Density-Stand und Recovery gemeinsam lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Visual Density Recovery 11.9.5 erfolgreich abgeschlossen.");
