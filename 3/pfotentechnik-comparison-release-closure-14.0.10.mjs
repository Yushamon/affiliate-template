#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-comparison-release-closure-14.0.10";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const COMMIT = args.has("--commit");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  const text = message instanceof Error
    ? message.stack || message.message
    : String(message);
  console.error(`[${NAME}] FEHLER: ${text}`);
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

if (!root) {
  fail("Repository-Root nicht gefunden. Starte den Installer im affiliate-template-Repository.");
}

const appRoot = path.join(root, "apps", "pfotentechnik");
const comparisonDir = path.join(appRoot, "src", "content", "comparisons");
const reportsDir = path.join(appRoot, "reports", "comparison-platform");

const files = {
  methodPage: path.join(appRoot, "src", "content", "pages", "so-bewerten-wir.md"),
  dogComparison: path.join(
    comparisonDir,
    "beste-futterautomaten-fuer-hunde.md"
  ),
  dogFountainComparison: path.join(
    comparisonDir,
    "beste-trinkbrunnen-fuer-hunde.md"
  ),
  schemaAudit: path.join(
    appRoot,
    "scripts",
    "seo",
    "audit-comparison-product-schema.mjs"
  ),
  visualAudit: path.join(
    appRoot,
    "scripts",
    "design-system",
    "visual-qa.mjs"
  ),
  releaseAudit: path.join(
    appRoot,
    "scripts",
    "comparison-platform",
    "release-closure.mjs"
  ),
  test: path.join(
    appRoot,
    "test",
    "comparison-release-closure-14.0.10.test.mjs"
  ),
  report: path.join(
    reportsDir,
    "comparison-release-closure-link-targets-14.0.10.md"
  )
};

for (const [key, file] of Object.entries(files)) {
  if (["test", "report"].includes(key)) continue;
  if (!fs.existsSync(file)) {
    fail(`Pflichtdatei fehlt (${key}): ${path.relative(root, file)}`);
  }
}

const comparisonFiles = fs
  .readdirSync(comparisonDir)
  .filter((name) => /\.mdx?$/i.test(name))
  .sort()
  .map((name) => path.join(comparisonDir, name));

if (comparisonFiles.length !== 24) {
  fail(
    `Erwartet werden 24 Vergleichsdateien, gefunden wurden ${comparisonFiles.length}.`
  );
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${timestamp}`
);
const changes = [];
const changedFiles = new Set();

const relative = (file) =>
  path.relative(root, file).split(path.sep).join("/");

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
const read = (file) => fs.readFileSync(file, "utf8");

function backup(file) {
  if (CHECK_ONLY || !fs.existsSync(file)) return;

  const target = path.join(backupRoot, relative(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content, description) {
  const previous = fs.existsSync(file) ? read(file) : "";
  if (previous === content) return false;

  changedFiles.add(relative(file));
  changes.push({
    file: relative(file),
    description
  });

  if (!CHECK_ONLY) {
    backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content, "utf8");
  }

  return true;
}

function run(command, commandArgs, label) {
  let executable = command;
  let finalArgs = commandArgs;

  if (
    process.platform === "win32" &&
    ["npm", "npx", "pnpm", "yarn"].includes(command)
  ) {
    executable =
      process.env.ComSpec ||
      "C:\\Windows\\System32\\cmd.exe";
    finalArgs = ["/d", "/c", command, ...commandArgs];
  }

  log(`Prüfung: ${label}`);
  log(`Befehl: ${[executable, ...finalArgs].join(" ")}`);

  const execution = spawnSync(executable, finalArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      FORCE_COLOR: process.env.FORCE_COLOR || "1"
    }
  });

  if (execution.error) {
    fail(
      `${label} konnte nicht gestartet werden.\n` +
      `Code: ${execution.error.code || "unbekannt"}\n` +
      `Nachricht: ${execution.error.message}`
    );
  }

  if (execution.status !== 0) {
    fail(`${label} fehlgeschlagen. Exit-Code: ${execution.status}`);
  }
}

function preserveNewline(source, content) {
  return source.includes("\r\n")
    ? content.replace(/\r?\n/g, "\r\n")
    : content.replace(/\r\n/g, "\n");
}

/*
 * /redaktion/ existiert nicht. Die inhaltlich richtige bestehende Zielseite
 * für Redaktion, Methodik und Bewertungsgrundsätze ist /so-bewerten-wir/.
 */
log("Schritt: Redaktionslinks auf die vorhandene Methodikseite umstellen");

for (const file of comparisonFiles) {
  const source = read(file);
  const occurrences = source.match(/\/redaktion\//g)?.length || 0;
  if (!occurrences) continue;

  const updated = source.replaceAll(
    "/redaktion/",
    "/so-bewerten-wir/"
  );

  write(
    file,
    updated,
    `${occurrences} Redaktionslink(s) auf /so-bewerten-wir/ umgestellt`
  );
}

/*
 * Diese beiden Themen sind echte Content-Lücken. Es werden bewusst keine
 * ungefähren Redirects und keine dünnen Platzhalterseiten erzeugt.
 */
log("Schritt: nicht vorhandene Content-Gap-Links aus Vergleichen entfernen");

{
  const source = read(files.dogComparison);
  const lines = source.split(/\r?\n/);
  const filtered = lines.filter(
    (line) =>
      !line.includes("/trockenfutter-oder-nassfutter-hund/")
  );
  const updated = preserveNewline(source, filtered.join("\n"));

  write(
    files.dogComparison,
    updated,
    "Link auf noch nicht vorhandenen Ratgeber Trockenfutter oder Nassfutter entfernt"
  );
}

{
  const source = read(files.dogFountainComparison);
  const exactPattern =
    /Vertiefend helfen \[Trinkbrunnen für Hunde und Katzen\]\(\/trinkbrunnen\/\), \[Trinkbrunnen richtig reinigen\]\(\/trinkbrunnen-richtig-reinigen\/\) und \[Wie viel Wasser braucht ein Hund\?\]\(\/wasserbedarf-hund\/\)\./;

  let updated = source.replace(
    exactPattern,
    "Vertiefend hilft unser Überblick [Trinkbrunnen für Hunde und Katzen](/trinkbrunnen/)."
  );

  /*
   * Fallback für lokale Textvarianten: fehlende Links werden entfernt,
   * nicht auf nur ungefähr passende Inhalte umgebogen.
   */
  updated = updated
    .replace(
      /\s*,?\s*\[Trinkbrunnen richtig reinigen\]\(\/trinkbrunnen-richtig-reinigen\/\)/g,
      ""
    )
    .replace(
      /\s*(?:und|,)\s*\[Wie viel Wasser braucht ein Hund\?\]\(\/wasserbedarf-hund\/\)/g,
      ""
    )
    .replace(/\s+\./g, ".");

  write(
    files.dogFountainComparison,
    updated,
    "Links auf die noch nicht vorhandenen Ratgeber Reinigung und Wasserbedarf entfernt"
  );
}

const forbiddenTargets = [
  "/redaktion/",
  "/trockenfutter-oder-nassfutter-hund/",
  "/trinkbrunnen-richtig-reinigen/",
  "/wasserbedarf-hund/"
];

const remaining = [];

for (const file of comparisonFiles) {
  const source = read(file);

  for (const target of forbiddenTargets) {
    if (source.includes(target)) {
      remaining.push(`${relative(file)}: ${target}`);
    }
  }
}

if (remaining.length) {
  fail(
    "Nicht reparierte interne Vergleichslinks:\n" +
    remaining.map((item) => `- ${item}`).join("\n")
  );
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const comparisonDir = path.join(
  appRoot,
  "src",
  "content",
  "comparisons"
);

const forbidden = [
  "/redaktion/",
  "/trockenfutter-oder-nassfutter-hund/",
  "/trinkbrunnen-richtig-reinigen/",
  "/wasserbedarf-hund/"
];

test("comparison links only use existing editorial targets", async () => {
  const files = (await fs.readdir(comparisonDir))
    .filter((name) => /\\.mdx?$/.test(name))
    .sort();

  assert.equal(files.length, 24);

  for (const name of files) {
    const source = await fs.readFile(
      path.join(comparisonDir, name),
      "utf8"
    );

    for (const target of forbidden) {
      assert.equal(
        source.includes(target),
        false,
        \`\${name}: \${target}\`
      );
    }
  }
});

test("the replacement editorial-methodology route exists", async () => {
  await fs.access(
    path.join(
      appRoot,
      "src",
      "content",
      "pages",
      "so-bewerten-wir.md"
    )
  );
});
`;

write(
  files.test,
  testSource,
  "Regressionstest für die letzten internen Linkziele erzeugt"
);

if (CHECK_ONLY) {
  log("Check erfolgreich. Es wurde nichts verändert.");
  log(`${changedFiles.size} Datei(en) würden geändert oder erzeugt.`);

  for (const change of changes) {
    log(`- ${change.file}: ${change.description}`);
  }

  process.exit(0);
}

ensureDir(path.dirname(files.report));
fs.writeFileSync(
  files.report,
  [
    "# Comparison Release Closure Link Targets 14.0.10",
    "",
    `Erstellt: ${new Date().toISOString()}`,
    "",
    "## Strategie",
    "",
    "- `/redaktion/` wurde auf die bestehende Seite `/so-bewerten-wir/` umgestellt.",
    "- Echte Content-Lücken wurden nicht mit ungefähren Redirects oder dünnen Platzhalterseiten kaschiert.",
    "- Die drei noch nicht vorhandenen Ratgeberlinks wurden aus den betroffenen Vergleichstexten entfernt.",
    "",
    "## Änderungen",
    "",
    ...changes.map(
      (change) =>
        `- \`${change.file}\`: ${change.description}`
    ),
    ""
  ].join("\n"),
  "utf8"
);
changedFiles.add(relative(files.report));

log(`Backups: ${relative(backupRoot)}`);
log(`Report: ${relative(files.report)}`);

run(
  "node",
  ["--test", relative(files.test)],
  "Linkziel-Regressionstest"
);
run(
  "npm",
  ["run", "build:pfotentechnik"],
  "PfotenTechnik-Build"
);
run(
  "node",
  [relative(files.schemaAudit)],
  "Comparison-Schema-Audit"
);
run(
  "node",
  [relative(files.visualAudit), "--strict"],
  "Statisches Visual-QA"
);
run(
  "node",
  [relative(files.releaseAudit), "--strict"],
  "24-Seiten-Release-Audit"
);

const releaseJson = path.join(
  reportsDir,
  "comparison-release-closure.json"
);

if (!fs.existsSync(releaseJson)) {
  fail(`Release-Report fehlt: ${relative(releaseJson)}`);
}

const release = JSON.parse(read(releaseJson));

if (!release.technicalPassed) {
  const blockers = (release.routes || [])
    .filter((route) => !route.passed)
    .flatMap((route) =>
      (route.errors || []).map(
        (error) => `${route.route}: ${error}`
      )
    );

  fail(
    "Technischer Release-Status ist weiterhin nicht bestanden:\n" +
    blockers.map((item) => `- ${item}`).join("\n")
  );
}

if (COMMIT) {
  const pathsToStage = [
    "apps/pfotentechnik/src/content/comparisons",
    relative(files.test),
    relative(files.report)
  ];

  run(
    "git",
    ["add", ...pathsToStage],
    "Projektdateien stagen"
  );
  run(
    "git",
    [
      "commit",
      "-m",
      "fix(pfotentechnik): close comparison internal links"
    ],
    "lokaler Commit"
  );
}

log("Comparison Release Closure 14.0.10 technisch erfolgreich abgeschlossen.");
log("Technischer Status: BESTANDEN.");
log("Visuelle 375/414-Light/Dark-Abnahme bleibt separat ausstehend.");
