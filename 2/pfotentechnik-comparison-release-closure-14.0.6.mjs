#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const NAME = "pfotentechnik-comparison-release-closure-14.0.6";
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

let yaml;
try {
  ({ default: yaml } = await import("js-yaml"));
} catch (error) {
  fail(`js-yaml konnte nicht geladen werden: ${error.message}`);
}

const appRoot = path.join(root, "apps", "pfotentechnik");
const comparisonDir = path.join(appRoot, "src", "content", "comparisons");
const productDir = path.join(appRoot, "src", "content", "products");
const manufacturerDir = path.join(appRoot, "src", "content", "manufacturers");
const reportDir = path.join(appRoot, "reports", "comparison-platform");

const files = {
  audit: path.join(appRoot, "scripts", "comparison-platform", "audit.mjs"),
  dataAudit: path.join(appRoot, "scripts", "comparison-platform", "data-audit.mjs"),
  coverageAudit: path.join(appRoot, "scripts", "comparison-platform", "coverage-audit.mjs"),
  refactorAudit: path.join(appRoot, "scripts", "comparison-platform", "refactor-audit.mjs"),
  resolver: path.join(appRoot, "scripts", "comparison-platform", "data-platform.mjs"),
  releaseAudit: path.join(appRoot, "scripts", "comparison-platform", "release-closure.mjs"),
  comparisonReport: path.join(reportDir, "comparison-audit.json"),
  report: path.join(reportDir, "comparison-release-closure-data-recovery-14.0.6.md"),
  test: path.join(appRoot, "test", "comparison-release-closure-14.0.6.test.mjs"),
  schemaAudit: path.join(appRoot, "scripts", "seo", "audit-comparison-product-schema.mjs"),
  visualAudit: path.join(appRoot, "scripts", "design-system", "visual-qa.mjs")
};

for (const [key, file] of Object.entries(files)) {
  if (["comparisonReport", "report", "test"].includes(key)) continue;
  if (!fs.existsSync(file)) {
    fail(`Pflichtdatei fehlt (${key}): ${path.relative(root, file)}`);
  }
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${NAME}-${timestamp}`);
const changedFiles = new Set();
const changes = [];

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
  if (description) changes.push({
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

function run(command, commandArgs, label, { allowFailure = false } = {}) {
  log(`Prüfung: ${label}`);

  const execution = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });

  if (execution.status !== 0 && !allowFailure) {
    fail(`${label} fehlgeschlagen.`);
  }

  return execution.status === 0;
}

function splitFrontmatter(source, file) {
  const match = source.match(
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/
  );

  if (!match) {
    fail(`Ungültiges Frontmatter: ${relative(file)}`);
  }

  return {
    data: yaml.load(match[1]) || {},
    body: match[2]
  };
}

function dumpFrontmatter(data, body) {
  const frontmatter = yaml.dump(data, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false
  }).trimEnd();

  return `---\n${frontmatter}\n---\n\n${body.replace(/^\s+/, "").trimEnd()}\n`;
}

function loadEntries(dir) {
  return fs.readdirSync(dir)
    .filter((name) => /\.mdx?$/i.test(name))
    .sort()
    .map((name) => {
      const file = path.join(dir, name);
      const source = read(file);
      const parsed = splitFrontmatter(source, file);

      return {
        file,
        name,
        source,
        body: parsed.body,
        data: parsed.data,
        slug: parsed.data.slug || name.replace(/\.mdx?$/i, ""),
        relFromApp: path.relative(appRoot, file).split(path.sep).join("/"),
        relFromRoot: relative(file)
      };
    });
}

const normalize = (value) =>
  String(value ?? "")
    .toLocaleLowerCase("de-DE")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]/g, "");

function levenshtein(a, b) {
  const left = String(a);
  const right = String(b);
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let col = 0; col < cols; col += 1) matrix[0][col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function findEntryForIssue(entries, issue) {
  const candidates = [
    issue.file,
    issue.path,
    issue.rel
  ].filter(Boolean).map((value) => String(value).replaceAll("\\", "/"));

  for (const entry of entries) {
    const paths = new Set([
      entry.name,
      entry.relFromApp,
      entry.relFromRoot,
      path.basename(entry.file)
    ]);

    if (candidates.some((candidate) =>
      paths.has(candidate) ||
      candidate.endsWith(`/${entry.name}`)
    )) {
      return entry;
    }
  }

  return null;
}

/*
 * Der vorherige Strict-Lauf hat bereits comparison-audit.json erzeugt.
 * Wir erzeugen ihn vorsichtshalber noch einmal ohne --strict, damit die
 * Reparatur immer exakt auf dem aktuellen lokalen Stand arbeitet.
 */
log("Schritt: aktuellen Comparison-Report erzeugen");
run(
  "node",
  [relative(files.audit)],
  "Comparison-Platform-Audit (Diagnose)"
);

if (!fs.existsSync(files.comparisonReport)) {
  fail(`Auditbericht wurde nicht erzeugt: ${relative(files.comparisonReport)}`);
}

const auditReport = JSON.parse(read(files.comparisonReport));
const blockingIssues = auditReport.issues.filter(
  (issue) => issue.level === "error"
);

const supportedCodes = new Set([
  "COMPARISON_VISIBLE_ROWS_TOO_FEW",
  "MANUFACTURER_REFERENCE_BROKEN"
]);

const unsupported = blockingIssues.filter(
  (issue) => !supportedCodes.has(issue.code)
);

if (unsupported.length) {
  fail(
    "Der lokale Audit enthält zusätzliche, nicht automatisch reparierbare Fehler:\n" +
    unsupported.map((issue) =>
      `- ${issue.code} in ${issue.file}: ${issue.message}`
    ).join("\n")
  );
}

const comparisonEntries = loadEntries(comparisonDir);
const productEntries = loadEntries(productDir);
const manufacturerEntries = loadEntries(manufacturerDir);

if (comparisonEntries.length !== 24) {
  fail(`Erwartet werden 24 Vergleiche, gefunden wurden ${comparisonEntries.length}.`);
}

const productBySlug = new Map(
  productEntries.map((entry) => [entry.slug, entry])
);

const manufacturerIdentity = manufacturerEntries.map((entry) => {
  const identities = new Set([
    entry.slug,
    entry.data.slug,
    entry.data.key,
    entry.data.name,
    entry.data.title
  ].filter(Boolean).map(normalize));

  return {
    entry,
    identities
  };
});

/* -------------------------------------------------------------------------- */
/* 1. Herstellerreferenz konservativ reparieren                                */
/* -------------------------------------------------------------------------- */

const manufacturerIssues = blockingIssues.filter(
  (issue) => issue.code === "MANUFACTURER_REFERENCE_BROKEN"
);

for (const issue of manufacturerIssues) {
  const product = findEntryForIssue(productEntries, issue);

  if (!product) {
    fail(
      `Produktdatei für Herstellerfehler nicht gefunden: ` +
      `${issue.file} · ${issue.message}`
    );
  }

  const manufacturer = product.data.manufacturer || {};
  const targets = new Set([
    manufacturer.slug,
    manufacturer.key,
    manufacturer.name,
    issue.manufacturerSlug
  ].filter(Boolean).map(normalize));

  const exactMatches = manufacturerIdentity.filter(({ identities }) =>
    [...targets].some((target) => identities.has(target))
  );

  let resolved;

  if (exactMatches.length === 1) {
    resolved = exactMatches[0].entry;
  } else if (exactMatches.length > 1) {
    fail(
      `${product.slug}: Herstellerreferenz ist mehrdeutig. ` +
      `Treffer: ${exactMatches.map((item) => item.entry.slug).join(", ")}`
    );
  } else {
    const fuzzy = manufacturerIdentity
      .map(({ entry, identities }) => {
        const distances = [...targets].flatMap((target) =>
          [...identities].map((identity) => levenshtein(target, identity))
        );
        return {
          entry,
          distance: Math.min(...distances)
        };
      })
      .sort((a, b) =>
        a.distance - b.distance ||
        a.entry.slug.localeCompare(b.entry.slug)
      );

    const best = fuzzy[0];
    const second = fuzzy[1];
    const longestTarget = Math.max(
      1,
      ...[...targets].map((target) => target.length)
    );
    const limit = Math.max(1, Math.min(3, Math.floor(longestTarget * 0.2)));

    if (
      best &&
      best.distance <= limit &&
      (!second || second.distance > best.distance)
    ) {
      resolved = best.entry;
    }
  }

  if (!resolved) {
    fail(
      `${product.slug}: Kein eindeutiger vorhandener Hersteller für ` +
      `${manufacturer.slug || manufacturer.name || "unbekannt"} gefunden.`
    );
  }

  const next = structuredClone(product.data);
  next.manufacturer = {
    ...(next.manufacturer || {}),
    key: resolved.data.key || resolved.slug,
    slug: resolved.slug,
    name:
      next.manufacturer?.name ||
      resolved.data.name ||
      resolved.data.title
  };

  write(
    product.file,
    dumpFrontmatter(next, product.body),
    `Herstellerreferenz auf ${resolved.slug} normalisiert`
  );

  product.data = next;
  log(
    `${product.slug}: Hersteller ${manufacturer.slug || "?"} → ${resolved.slug}`
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Vergleiche mit weniger als drei vollständigen Zeilen ergänzen             */
/* -------------------------------------------------------------------------- */

const { resolveComparisonValue } = await import(
  `${pathToFileURL(files.resolver).href}?v=${Date.now()}`
);

const rowCandidates = [
  {
    key: "profil",
    label: "Redaktionelle Einordnung",
    format: "text",
    fallback: "–"
  },
  {
    key: "hersteller",
    label: "Hersteller",
    source: "manufacturer.name",
    format: "text",
    fallback: "–"
  },
  {
    key: "bewertung",
    label: "Redaktioneller Score",
    source: "score",
    format: "number",
    fallback: "–"
  },
  {
    key: "tier",
    label: "Geeignet für",
    format: "list",
    fallback: "–"
  },
  {
    key: "futterart",
    label: "Futterart",
    format: "list",
    fallback: "–"
  },
  {
    key: "kapazitaet",
    label: "Kapazität",
    format: "text",
    fallback: "–"
  }
];

function fullyResolvedCriteria(data) {
  const productItems = (data.items || []).filter(
    (item) => item.type === "product" && productBySlug.has(item.slug)
  );

  return (data.criteria || []).filter((criterion) =>
    productItems.length >= 2 &&
    productItems.every((item) => {
      const product = productBySlug.get(item.slug)?.data;
      const value = resolveComparisonValue({
        product,
        item,
        criterion
      });
      return Boolean(value) && value !== "–";
    })
  );
}

const coverageIssues = blockingIssues.filter(
  (issue) => issue.code === "COMPARISON_VISIBLE_ROWS_TOO_FEW"
);

for (const issue of coverageIssues) {
  const comparison = findEntryForIssue(comparisonEntries, issue);

  if (!comparison) {
    fail(
      `Vergleichsdatei für Zeilenabdeckungsfehler nicht gefunden: ` +
      `${issue.file} · ${issue.message}`
    );
  }

  const next = structuredClone(comparison.data);
  next.criteria = Array.isArray(next.criteria) ? next.criteria : [];

  let complete = fullyResolvedCriteria(next);
  const added = [];

  for (const candidate of rowCandidates) {
    if (complete.length >= 3) break;

    const alreadyPresent = next.criteria.some(
      (criterion) =>
        normalize(criterion.key) === normalize(candidate.key) ||
        normalize(criterion.label) === normalize(candidate.label)
    );

    if (alreadyPresent) continue;

    const productItems = (next.items || []).filter(
      (item) => item.type === "product" && productBySlug.has(item.slug)
    );

    const resolvesForAll =
      productItems.length >= 2 &&
      productItems.every((item) => {
        const value = resolveComparisonValue({
          product: productBySlug.get(item.slug)?.data,
          item,
          criterion: candidate
        });
        return Boolean(value) && value !== "–";
      });

    if (!resolvesForAll) continue;

    next.criteria.push(candidate);
    added.push(candidate.label);
    complete = fullyResolvedCriteria(next);
  }

  if (complete.length < 3) {
    fail(
      `${comparison.slug}: Nach zentraler Ergänzung sind nur ` +
      `${complete.length} vollständig belegte Kriterien vorhanden.`
    );
  }

  write(
    comparison.file,
    dumpFrontmatter(next, comparison.body),
    `vollständige Kriterien ergänzt: ${added.join(", ")}`
  );

  comparison.data = next;
  log(
    `${comparison.slug}: ${complete.length} vollständige Kriterien, ` +
    `ergänzt: ${added.join(", ") || "keine"}`
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Regressionstest erzeugen                                                  */
/* -------------------------------------------------------------------------- */

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const reportFile = path.join(
  appRoot,
  "reports",
  "comparison-platform",
  "comparison-audit.json"
);

test("comparison audit has no release-blocking errors", async () => {
  const execution = spawnSync(
    process.execPath,
    ["apps/pfotentechnik/scripts/comparison-platform/audit.mjs"],
    {
      cwd: repoRoot,
      encoding: "utf8"
    }
  );

  assert.equal(execution.status, 0, execution.stderr || execution.stdout);

  const report = JSON.parse(await fs.readFile(reportFile, "utf8"));
  assert.equal(report.summary.comparisons, 24);
  assert.equal(report.summary.errors, 0);
  assert.ok(report.summary.qualityScore >= 90);
});

test("all comparisons expose at least three complete public criteria", async () => {
  const execution = spawnSync(
    process.execPath,
    ["apps/pfotentechnik/scripts/comparison-platform/data-audit.mjs"],
    {
      cwd: repoRoot,
      encoding: "utf8"
    }
  );

  assert.equal(execution.status, 0, execution.stderr || execution.stdout);

  const report = JSON.parse(
    await fs.readFile(
      path.join(
        appRoot,
        "reports",
        "comparison-platform",
        "comparison-data-platform.json"
      ),
      "utf8"
    )
  );

  assert.equal(report.summary.comparisons, 24);
  assert.ok(report.comparisons.every((item) => item.visibleRows >= 3));
  assert.equal(report.summary.renderedCoverage, 100);
});
`;

write(
  files.test,
  testSource,
  "Regressionstest für Herstellerintegrität und vollständige Vergleichszeilen"
);

if (CHECK_ONLY) {
  log("Check erfolgreich. Es wurde nichts verändert.");
  log(`${changedFiles.size} Datei(en) würden geändert oder neu angelegt.`);
  for (const change of changes) {
    log(`- ${change.file}: ${change.description}`);
  }
  process.exit(0);
}

ensureDir(path.dirname(files.report));
fs.writeFileSync(
  files.report,
  [
    "# Comparison Release Closure Data Recovery 14.0.6",
    "",
    `Erstellt: ${new Date().toISOString()}`,
    "",
    `- Ausgangsfehler: ${blockingIssues.length}`,
    `- Herstellerfehler: ${manufacturerIssues.length}`,
    `- Vergleiche mit zu wenigen vollständigen Zeilen: ${coverageIssues.length}`,
    `- geänderte Dateien: ${changedFiles.size}`,
    "",
    "## Änderungen",
    "",
    ...(
      changes.length
        ? changes.map((change) =>
            `- \`${change.file}\`: ${change.description}`
          )
        : ["- Keine Inhaltsänderungen erforderlich."]
    ),
    "",
    "Die ergänzten Kriterien stammen ausschließlich aus bereits vorhandenen Produktdaten.",
    "Es wurden keine technischen Produkteigenschaften erfunden.",
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
  "Data-Recovery-Regressionstest"
);

for (const version of ["14.0.4", "14.0.3"]) {
  const testFile = path.join(
    appRoot,
    "test",
    `comparison-release-closure-${version}.test.mjs`
  );

  if (!fs.existsSync(testFile)) continue;

  run(
    "node",
    ["--test", relative(testFile)],
    `Regressionstest ${path.basename(testFile)}`
  );
}

run(
  "node",
  [relative(files.refactorAudit)],
  "Comparison-Refactor-Audit"
);
run(
  "node",
  [relative(files.audit), "--strict"],
  "Comparison-Platform-Audit"
);
run(
  "node",
  [relative(files.dataAudit), "--strict"],
  "Comparison-Data-Audit"
);
run(
  "node",
  [relative(files.coverageAudit), "--strict", "--threshold=95"],
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
        "fix(pfotentechnik): resolve comparison release data blockers"
      ],
      "lokaler Commit"
    );
  }
}

log("Comparison Release Closure 14.0.6 erfolgreich abgeschlossen.");
