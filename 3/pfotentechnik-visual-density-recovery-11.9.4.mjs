#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-visual-density-recovery-11.9.4";
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
  "visual-density-recovery-11.9.4.md"
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

/* ProjectLayout-Import vollständig normalisieren. */
const layoutBefore = read(layoutFile);
const linesBefore = layoutBefore.split(/\r?\n/);
const densityImportPattern =
  /^\s*import\s+["'][^"']*pfotentechnik-visual-density\.css["'];?\s*$/;

const removedImports = linesBefore.filter((line) =>
  densityImportPattern.test(line)
).length;

let lines = linesBefore.filter((line) => !densityImportPattern.test(line));

const canonicalImport =
  'import "../styles/pfotentechnik-visual-density.css";';

const preferredAnchors = [
  /pfotentechnik-responsive-resilience\.css/,
  /pfotentechnik-ui-primitives\.css/,
  /pfotentechnik-primitives\.css/,
  /pfotentechnik-ui-system\.css/,
];

let insertIndex = -1;

for (const anchor of preferredAnchors) {
  const index = lines.findIndex((line) => anchor.test(line));
  if (index >= 0) {
    insertIndex = index + 1;
    break;
  }
}

if (insertIndex < 0) {
  let lastStyleImport = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (
      /^\s*import\s+["'][^"']+\.css["'];?\s*$/.test(lines[index])
    ) {
      lastStyleImport = index;
    }
  }

  if (lastStyleImport >= 0) {
    insertIndex = lastStyleImport + 1;
  }
}

if (insertIndex < 0) {
  const frontmatterStart = lines.findIndex((line) => line.trim() === "---");

  if (frontmatterStart >= 0) {
    insertIndex = frontmatterStart + 1;
  } else {
    insertIndex = 0;
  }
}

lines.splice(insertIndex, 0, canonicalImport);

const newline = layoutBefore.includes("\r\n") ? "\r\n" : "\n";
const layoutAfter = lines.join(newline);
const layoutChanged = write(layoutFile, layoutAfter);

const canonicalCount = (
  layoutAfter.match(
    /import\s+["'][^"']*pfotentechnik-visual-density\.css["'];?/g
  ) || []
).length;

if (canonicalCount !== 1) {
  fail(
    `Import-Normalisierung fehlgeschlagen: ${canonicalCount} Density-Imports gefunden.`
  );
}

/* Audit so anpassen, dass nur echte Importstatements gezählt werden. */
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

if (!fs.existsSync(layoutFile)) {
  errors.push("ProjectLayout fehlt.");
}

if (!fs.existsSync(cssFile)) {
  errors.push("Visual-Density-Datei fehlt.");
}

if (fs.existsSync(layoutFile)) {
  const layout = fs.readFileSync(layoutFile, "utf8");
  const importMatches =
    layout.match(
      /^\\\\s*import\\\\s+["'][^"']*pfotentechnik-visual-density\\\\.css["'];?\\\\s*$/gm
    ) || [];

  if (importMatches.length !== 1) {
    errors.push(
      "Visual Density muss exakt einmal importiert werden."
    );
  }

  const densityIndex = layout.search(
    /^\\\\s*import\\\\s+["'][^"']*pfotentechnik-visual-density\\\\.css["'];?\\\\s*$/m
  );

  const anchorCandidates = [
    layout.indexOf("pfotentechnik-responsive-resilience.css"),
    layout.indexOf("pfotentechnik-ui-primitives.css"),
    layout.indexOf("pfotentechnik-primitives.css"),
    layout.indexOf("pfotentechnik-ui-system.css"),
  ].filter((index) => index >= 0);

  if (
    densityIndex >= 0 &&
    anchorCandidates.length > 0 &&
    densityIndex < Math.min(...anchorCandidates)
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

  if (/!important\\\\b/.test(css)) {
    errors.push(
      "Visual Density darf kein !important enthalten."
    );
  }

  if (/:root\\\\s*\\\\{/.test(css)) {
    errors.push(
      "Visual Density darf keine :root-Blöcke enthalten."
    );
  }

  if (/#[0-9a-fA-F]{3,8}\\\\b/.test(css)) {
    errors.push(
      "Visual Density enthält harte Hex-Farben."
    );
  }
}

if (errors.length > 0) {
  console.error(errors.join("\\\\n"));
  process.exit(1);
}

console.log("Visual-Density-Audit erfolgreich.");
`;

const auditChanged = write(auditFile, auditSource);

const report = `# PfotenTechnik Visual Density Recovery 11.9.4

## Ursache

Der Density-Audit aus 11.9.3 zählte den Dateinamen als einfachen Texttreffer.
Der tatsächliche Importzustand im \`ProjectLayout\` war nicht normalisiert.

## Korrektur

- vorhandene Density-Importzeilen entfernt: **${removedImports}**
- exakt einen kanonischen Import eingesetzt
- Import nach der passendsten vorhandenen UI-/Responsive-Schicht platziert
- Audit zählt nur noch vollständige CSS-Importstatements
- Density-Datei geändert: **${densityChanged ? "ja" : "nein"}**
- ProjectLayout geändert: **${layoutChanged ? "ja" : "nein"}**
- Audit geändert: **${auditChanged ? "ja" : "nein"}**
- CSS-Budget-Baseline bleibt unverändert
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportFile, report);
}

log(`Entfernte Density-Imports: ${removedImports}`);
log(`ProjectLayout: ${layoutChanged ? "normalisiert" : "bereits korrekt"}`);
log(`Density-Datei: ${densityChanged ? "korrigiert" : "bereits korrekt"}`);
log(`Density-Audit: ${auditChanged ? "aktualisiert" : "bereits aktuell"}`);
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

log("Visual Density Recovery 11.9.4 erfolgreich abgeschlossen.");
