#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-visual-density-recovery-11.9.3";
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
  "visual-density-recovery-11.9.3.md"
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

if (!fs.existsSync(densityFile)) {
  fail(`Pflichtdatei fehlt: ${relative(densityFile)}. Stufe 11.9.0 zuerst ausführen.`);
}

/* Density-Layer sicherstellen */
const densityBefore = read(densityFile);
const rootCountBefore = (densityBefore.match(/:root\s*\{/g) || []).length;
const densityAfter = densityBefore.replace(/:root\s*\{/g, ":where(html) {");
const densityChanged = write(densityFile, densityAfter);

if (/:root\s*\{/.test(densityAfter)) {
  fail("Im Density-Layer sind weiterhin :root-Blöcke vorhanden.");
}

/* Audit vollständig und stabil neu schreiben */
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
  const imports =
    layout.match(/pfotentechnik-visual-density\\\\.css/g) || [];

  if (imports.length !== 1) {
    errors.push(
      "Visual Density muss exakt einmal importiert werden."
    );
  }

  const densityIndex = layout.indexOf(
    "pfotentechnik-visual-density.css"
  );
  const primitiveIndex = layout.indexOf(
    "pfotentechnik-primitives.css"
  );

  if (
    primitiveIndex >= 0 &&
    densityIndex >= 0 &&
    densityIndex < primitiveIndex
  ) {
    errors.push(
      "Visual Density wird vor den Primitives importiert."
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

  const rootBlocks = css.match(/:root\\\\s*\\\\{/g) || [];
  if (rootBlocks.length > 0) {
    errors.push(
      "Visual Density darf keine :root-Blöcke enthalten."
    );
  }

  const rawColors =
    css.match(/#[0-9a-fA-F]{3,8}\\\\b/g) || [];

  if (rawColors.length > 0) {
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

const report = `# PfotenTechnik Visual Density Recovery 11.9.3

## Ursache

Recovery 11.9.2 hat den Root-Guard außerhalb des Blocks eingefügt, in dem
\`css\` definiert wurde. Dadurch entstand ein \`ReferenceError\`.

## Korrektur

- kompletter Density-Audit stabil neu geschrieben
- keine Abhängigkeit mehr von vorhandenen Code-Ankern
- \`css\` wird ausschließlich innerhalb seines gültigen Scopes verwendet
- \`:root\`, \`!important\` und harte Hex-Farben werden geprüft
- Layout-Import und Reihenfolge werden geprüft
- erforderliche Density-Bausteine werden geprüft
- CSS-Budget-Baseline bleibt unverändert
- zuvor gefundene \`:root\`-Blöcke: **${rootCountBefore}**
- Density-Datei geändert: **${densityChanged ? "ja" : "nein"}**
- Audit-Datei geändert: **${auditChanged ? "ja" : "nein"}**
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportFile, report);
}

log(`Gefundene :root-Blöcke: ${rootCountBefore}`);
log(`Density-Datei: ${densityChanged ? "korrigiert" : "bereits korrekt"}`);
log(`Density-Audit: ${auditChanged ? "vollständig ersetzt" : "bereits aktuell"}`);
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

log("Visual Density Recovery 11.9.3 erfolgreich abgeschlossen.");
