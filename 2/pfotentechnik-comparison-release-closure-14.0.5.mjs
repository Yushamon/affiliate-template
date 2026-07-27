#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-comparison-release-closure-14.0.5";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
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
const auditFile = path.join(
  appRoot,
  "scripts",
  "comparison-platform",
  "audit.mjs"
);
const reportFile = path.join(
  appRoot,
  "reports",
  "comparison-platform",
  "comparison-release-closure-audit-recovery-14.0.5.md"
);

if (!fs.existsSync(auditFile)) {
  fail(`Comparison-Audit fehlt: ${path.relative(root, auditFile)}`);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${timestamp}`
);
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

function write(file, content) {
  const previous = fs.existsSync(file) ? read(file) : "";
  if (previous === content) return false;

  changedFiles.add(relative(file));

  if (!CHECK_ONLY) {
    backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content, "utf8");
  }

  return true;
}

function countMatches(source, regex) {
  return [...source.matchAll(regex)].length;
}

function normalizeAuditDeclarations(source) {
  const functionStart = source.indexOf("function auditComparison(");
  const functionEnd = source.indexOf(
    "\nfunction auditProductCoverage",
    functionStart
  );

  if (functionStart === -1 || functionEnd === -1) {
    fail("auditComparison-Funktionsblock konnte nicht eindeutig bestimmt werden.");
  }

  const before = source.slice(0, functionStart);
  const block = source.slice(functionStart, functionEnd);
  const after = source.slice(functionEnd);
  const newline = block.includes("\r\n") ? "\r\n" : "\n";
  const lines = block.split(/\r?\n/);

  const winnerPattern =
    /^\s*const\s+winner\s*=\s*d\.recommendation\?\.winnerSlug\s*;\s*$/;
  const alternativePattern =
    /^\s*const\s+alternative\s*=\s*d\.recommendation\?\.alternativeSlug\s*;\s*$/;

  let winnerSeen = 0;
  let alternativeSeen = 0;
  let removedWinner = 0;
  let removedAlternative = 0;

  const normalizedLines = lines.filter((line) => {
    if (winnerPattern.test(line)) {
      winnerSeen += 1;
      if (winnerSeen > 1) {
        removedWinner += 1;
        return false;
      }
    }

    if (alternativePattern.test(line)) {
      alternativeSeen += 1;
      if (alternativeSeen > 1) {
        removedAlternative += 1;
        return false;
      }
    }

    return true;
  });

  if (winnerSeen < 1) {
    fail("winner-Deklaration in auditComparison fehlt.");
  }

  if (alternativeSeen < 1) {
    fail("alternative-Deklaration in auditComparison fehlt.");
  }

  let normalized = normalizedLines.join(newline);

  /*
   * Mehrere fehlgeschlagene Läufe können zwischen den entfernten
   * Deklarationen zusätzliche Leerzeilen hinterlassen.
   */
  normalized = normalized.replace(
    new RegExp(`${newline}{3,}`, "g"),
    `${newline}${newline}`
  );

  const winnerCount = countMatches(
    normalized,
    /^\s*const\s+winner\s*=\s*d\.recommendation\?\.winnerSlug\s*;\s*$/gm
  );
  const alternativeCount = countMatches(
    normalized,
    /^\s*const\s+alternative\s*=\s*d\.recommendation\?\.alternativeSlug\s*;\s*$/gm
  );

  if (winnerCount !== 1 || alternativeCount !== 1) {
    fail(
      `Deklarationsnormalisierung fehlgeschlagen: ` +
      `winner=${winnerCount}, alternative=${alternativeCount}.`
    );
  }

  if (!normalized.includes("const fullyResolvedRows")) {
    fail("Die zuvor installierte Zeilenabdeckungsprüfung fehlt.");
  }

  if (!normalized.includes("const isEligible = (slug) =>")) {
    fail("Die zuvor installierte Empfehlungsfähigkeitsprüfung fehlt.");
  }

  if (
    !normalized.includes('"WINNER_INELIGIBLE"') ||
    !normalized.includes('"ALTERNATIVE_INELIGIBLE"')
  ) {
    fail("Die zuvor installierten Empfehlungsintegritätsprüfungen fehlen.");
  }

  return {
    source: before + normalized + after,
    removedWinner,
    removedAlternative,
    winnerSeen,
    alternativeSeen
  };
}

log("Schritt: doppelten Audit-Deklarationsblock analysieren");

const originalAudit = read(auditFile);
const result = normalizeAuditDeclarations(originalAudit);

log(
  `Gefunden: winner=${result.winnerSeen}, ` +
  `alternative=${result.alternativeSeen}`
);
log(
  `Zu entfernen: winner=${result.removedWinner}, ` +
  `alternative=${result.removedAlternative}`
);

if (
  result.removedWinner === 0 &&
  result.removedAlternative === 0
) {
  log("Keine doppelten winner-/alternative-Deklarationen mehr vorhanden.");
} else {
  write(auditFile, result.source);
}

if (CHECK_ONLY) {
  log("Check erfolgreich. Es wurde nichts verändert.");
  process.exit(0);
}

ensureDir(path.dirname(reportFile));
fs.writeFileSync(
  reportFile,
  [
    "# Comparison Release Closure Audit Recovery 14.0.5",
    "",
    `Erstellt: ${new Date().toISOString()}`,
    "",
    `- winner-Deklarationen vor Bereinigung: ${result.winnerSeen}`,
    `- alternative-Deklarationen vor Bereinigung: ${result.alternativeSeen}`,
    `- entfernte winner-Deklarationen: ${result.removedWinner}`,
    `- entfernte alternative-Deklarationen: ${result.removedAlternative}`,
    "",
    "Die erste gültige Deklaration im auditComparison-Block wurde beibehalten.",
    "Weitere identische Deklarationen aus dem partiellen 14.0.3-Lauf wurden entfernt.",
    ""
  ].join("\n"),
  "utf8"
);
changedFiles.add(relative(reportFile));

log(`Backups: ${relative(backupRoot)}`);
log(`Report: ${relative(reportFile)}`);

function run(command, commandArgs, label) {
  log(`Prüfung: ${label}`);

  const execution = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });

  if (execution.status !== 0) {
    fail(`${label} fehlgeschlagen.`);
  }
}

run(
  "node",
  ["--check", relative(auditFile)],
  "Syntaxprüfung Comparison-Platform-Audit"
);

const optionalTests = [
  path.join(
    appRoot,
    "test",
    "comparison-release-closure-14.0.4.test.mjs"
  ),
  path.join(
    appRoot,
    "test",
    "comparison-release-closure-14.0.3.test.mjs"
  )
];

for (const testFile of optionalTests) {
  if (!fs.existsSync(testFile)) continue;

  run(
    "node",
    ["--test", relative(testFile)],
    `Regressionstest ${path.basename(testFile)}`
  );
}

const scripts = {
  refactor: path.join(
    appRoot,
    "scripts",
    "comparison-platform",
    "refactor-audit.mjs"
  ),
  audit: auditFile,
  data: path.join(
    appRoot,
    "scripts",
    "comparison-platform",
    "data-audit.mjs"
  ),
  coverage: path.join(
    appRoot,
    "scripts",
    "comparison-platform",
    "coverage-audit.mjs"
  ),
  release: path.join(
    appRoot,
    "scripts",
    "comparison-platform",
    "release-closure.mjs"
  ),
  schema: path.join(
    appRoot,
    "scripts",
    "seo",
    "audit-comparison-product-schema.mjs"
  ),
  visual: path.join(
    appRoot,
    "scripts",
    "design-system",
    "visual-qa.mjs"
  )
};

for (const [label, file] of Object.entries(scripts)) {
  if (!fs.existsSync(file)) {
    fail(`Benötigtes Prüfskript fehlt (${label}): ${relative(file)}`);
  }
}

run(
  "node",
  [relative(scripts.refactor)],
  "Comparison-Refactor-Audit"
);
run(
  "node",
  [relative(scripts.audit), "--strict"],
  "Comparison-Platform-Audit"
);
run(
  "node",
  [relative(scripts.data), "--strict"],
  "Comparison-Data-Audit"
);
run(
  "node",
  [relative(scripts.coverage), "--strict", "--threshold=95"],
  "Comparison-Coverage-Audit"
);

if (!NO_BUILD) {
  run(
    "npm",
    ["run", "build:pfotentechnik"],
    "PfotenTechnik-Build"
  );
  run(
    "node",
    [relative(scripts.schema)],
    "Comparison-Schema-Audit"
  );
  run(
    "node",
    [relative(scripts.visual), "--strict"],
    "Statisches Visual-QA"
  );
  run(
    "node",
    [relative(scripts.release), "--strict"],
    "24-Seiten-Release-Audit"
  );
} else {
  log("Build und Dist-Audits wurden mit --no-build übersprungen.");
}

if (COMMIT) {
  const filesToAdd = [...changedFiles].sort();

  if (filesToAdd.length) {
    run(
      "git",
      ["add", ...filesToAdd],
      "git add"
    );
    run(
      "git",
      [
        "commit",
        "-m",
        "fix(pfotentechnik): recover comparison audit syntax"
      ],
      "lokaler Commit"
    );
  } else {
    log("Keine neuen Dateien für einen Commit.");
  }
}

log("Comparison Release Closure 14.0.5 erfolgreich abgeschlossen.");
