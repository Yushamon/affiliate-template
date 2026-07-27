#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-comparison-release-closure-14.0.4";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const COMMIT = args.has("--commit");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  const text = message instanceof Error ? message.stack || message.message : String(message);
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
const reportFile = path.join(
  appRoot,
  "reports",
  "comparison-platform",
  "comparison-release-closure-link-recovery-14.0.4.md"
);
const testFile = path.join(
  appRoot,
  "test",
  "comparison-release-closure-14.0.4.test.mjs"
);

if (!fs.existsSync(comparisonDir)) {
  fail(`Vergleichsverzeichnis fehlt: ${path.relative(root, comparisonDir)}`);
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
  const before = fs.existsSync(file) ? read(file) : "";
  if (before === content) return false;

  changedFiles.add(relative(file));

  if (!CHECK_ONLY) {
    backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content, "utf8");
  }

  return true;
}

function walk(dir, extensions) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (
      [
        "node_modules",
        "dist",
        ".patch-backups",
        "reports",
        "generated"
      ].includes(entry.name)
    ) {
      return [];
    }

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, extensions);
    return extensions.has(path.extname(entry.name).toLowerCase())
      ? [full]
      : [];
  });
}

const comparisonSlugs = new Set(
  fs.readdirSync(comparisonDir)
    .filter((name) => /\.mdx?$/i.test(name))
    .map((name) => name.replace(/\.mdx?$/i, ""))
);

if (comparisonSlugs.size !== 24) {
  fail(`Erwartet werden 24 Vergleichsdateien, gefunden wurden ${comparisonSlugs.size}.`);
}

/*
 * Eindeutige Reparaturen für historisch verkürzte Vergleichspfade.
 * Diese Varianten entstanden durch eine fehlerhafte Linkmigration.
 */
const explicitMappings = new Map([
  ["/vergleiche/-fuer-katzen/", "/vergleiche/beste-futterautomaten-fuer-katzen/"],
  ["/vergleiche/-fuer-hunde/", "/vergleiche/beste-futterautomaten-fuer-hunde/"],
  ["/vergleiche/-fuer-kleine-hunde/", "/vergleiche/beste-futterautomaten-fuer-kleine-hunde/"],
  ["/vergleiche/-fuer-grosse-hunde/", "/vergleiche/futterautomat-fuer-grosse-hunde/"],
  ["/vergleiche/-fuer-welpen/", "/vergleiche/beste-futterautomaten-fuer-welpen/"],
  ["/vergleiche/-fuer-seniorenkatzen/", "/vergleiche/beste-futterautomaten-fuer-seniorenkatzen/"],
  ["/vergleiche/-fuer-zwei-katzen/", "/vergleiche/beste-futterautomaten-fuer-zwei-katzen/"],
  ["/vergleiche/-fuer-mehrtierhaushalte/", "/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/"],
  ["/vergleiche/-fuer-berufstaetige/", "/vergleiche/beste-futterautomaten-fuer-berufstaetige/"],
  ["/vergleiche/-fuer-nassfutter/", "/vergleiche/beste-futterautomaten-fuer-nassfutter/"],
  ["/vergleiche/-unter-100-euro/", "/vergleiche/beste-futterautomaten-unter-100-euro/"],
  ["/vergleiche/-mit-kamera/", "/vergleiche/beste-futterautomaten-mit-kamera/"],
  ["/vergleiche/-ohne-wlan/", "/vergleiche/beste-futterautomaten-ohne-wlan/"],
  ["/vergleiche/-mit-akku/", "/vergleiche/beste-futterautomaten-mit-akku/"],
  ["/vergleiche/-mit-app/", "/vergleiche/futterautomat-mit-app/"],
  ["/vergleiche/-mit-edelstahl-napf/", "/vergleiche/beste-futterautomaten-mit-edelstahl-napf/"],
  ["/vergleiche/-gegen-schlingen/", "/vergleiche/futterautomat-gegen-schlingen/"]
]);

for (const [broken, target] of explicitMappings) {
  const slug = target
    .replace(/^\/vergleiche\//, "")
    .replace(/\/$/, "");

  if (!comparisonSlugs.has(slug)) {
    fail(`Explizites Linkziel fehlt: ${broken} → ${target}`);
  }
}

function resolveMalformedPath(pathname) {
  const normalized = pathname.endsWith("/")
    ? pathname
    : `${pathname}/`;

  const explicit = explicitMappings.get(normalized);
  if (explicit) return explicit;

  const match = normalized.match(/^\/vergleiche\/-([a-z0-9-]+)\/$/i);
  if (!match) return pathname;

  const tail = match[1];
  const candidates = [...comparisonSlugs]
    .filter((slug) => slug.endsWith(`-${tail}`))
    .sort();

  if (candidates.length === 1) {
    return `/vergleiche/${candidates[0]}/`;
  }

  if (candidates.length === 0) {
    fail(`Kein Ziel für fehlerhaften Vergleichspfad gefunden: ${pathname}`);
  }

  fail(
    `Mehrdeutiger fehlerhafter Vergleichspfad: ${pathname}\n` +
    `Kandidaten: ${candidates.join(", ")}`
  );
}

function rewriteMalformedLinks(source) {
  return source.replace(
    /\/vergleiche\/-[a-z0-9-]+\/?/gi,
    (pathname) => resolveMalformedPath(pathname)
  );
}

const extensions = new Set([
  ".md",
  ".mdx",
  ".astro",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json"
]);

const scanRoots = [
  path.join(appRoot, "src"),
  path.join(root, "packages", "affiliate-core", "src")
];

const replacements = [];

log("Schritt: fehlerhafte Vergleichslinks suchen");

for (const scanRoot of scanRoots) {
  for (const file of walk(scanRoot, extensions)) {
    const source = read(file);
    const matches = [
      ...source.matchAll(/\/vergleiche\/-[a-z0-9-]+\/?/gi)
    ].map((match) => match[0]);

    if (!matches.length) continue;

    const updated = rewriteMalformedLinks(source);
    if (updated === source) continue;

    replacements.push({
      file: relative(file),
      links: [...new Set(matches)]
    });
    write(file, updated);
  }
}

const unresolved = [];

for (const scanRoot of scanRoots) {
  for (const file of walk(scanRoot, extensions)) {
    const source = read(file);
    const matches = [
      ...source.matchAll(/\/vergleiche\/-[a-z0-9-]+\/?/gi)
    ].map((match) => match[0]);

    for (const link of matches) {
      unresolved.push({
        file: relative(file),
        link
      });
    }
  }
}

if (unresolved.length) {
  fail(
    "Nicht reparierte Vergleichspfade:\n" +
    unresolved.map((item) => `- ${item.file}: ${item.link}`).join("\n")
  );
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const extensions = new Set([".md", ".mdx", ".astro", ".ts", ".tsx", ".js", ".mjs", ".json"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const output = [];

  for (const entry of entries) {
    if (["node_modules", "dist", ".patch-backups", "reports", "generated"].includes(entry.name)) {
      continue;
    }

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full));
    else if (extensions.has(path.extname(entry.name).toLowerCase())) output.push(full);
  }

  return output;
}

test("no malformed comparison links remain in public source", async () => {
  const roots = [
    path.join(appRoot, "src"),
    path.join(repoRoot, "packages", "affiliate-core", "src")
  ];

  for (const root of roots) {
    for (const file of await walk(root)) {
      const source = await fs.readFile(file, "utf8");
      assert.doesNotMatch(
        source,
        /\\/vergleiche\\/-[a-z0-9-]+\\/?/i,
        path.relative(repoRoot, file)
      );
    }
  }
});

test("recovered feeder comparison links point to existing comparison files", async () => {
  const comparisonDir = path.join(appRoot, "src", "content", "comparisons");
  const names = new Set(
    (await fs.readdir(comparisonDir))
      .filter((name) => /\\.mdx?$/.test(name))
      .map((name) => name.replace(/\\.mdx?$/, ""))
  );

  for (const slug of [
    "beste-futterautomaten-fuer-katzen",
    "beste-futterautomaten-fuer-hunde",
    "beste-futterautomaten-fuer-nassfutter"
  ]) {
    assert.ok(names.has(slug), slug);
  }
});
`;

write(testFile, testSource);

const report = `# Comparison Release Closure Link Recovery 14.0.4

## Ergebnis

- gefundene Dateien mit fehlerhaften Vergleichslinks: ${replacements.length}
- verbleibende fehlerhafte Vergleichslinks: ${unresolved.length}
- Vergleichsdateien: ${comparisonSlugs.size}

## Reparaturen

${replacements.length
  ? replacements
      .map((item) =>
        `- \`${item.file}\`: ${item.links.map((link) => `\`${link}\``).join(", ")}`
      )
      .join("\n")
  : "- Keine weiteren Linkreparaturen erforderlich."}
`;

if (CHECK_ONLY) {
  log("Check erfolgreich. Es wurde nichts verändert.");
  if (replacements.length) {
    log(`${replacements.length} Datei(en) würden repariert:`);
    for (const item of replacements) {
      log(`- ${item.file}: ${item.links.join(", ")}`);
    }
  } else {
    log("Keine fehlerhaften Vergleichslinks mehr gefunden.");
  }
  process.exit(0);
}

ensureDir(path.dirname(reportFile));
fs.writeFileSync(reportFile, report, "utf8");
changedFiles.add(relative(reportFile));

log(`Backups: ${relative(backupRoot)}`);
log(`Report: ${relative(reportFile)}`);

function run(command, commandArgs, label) {
  log(`Prüfung: ${label}`);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    fail(`${label} fehlgeschlagen.`);
  }
}

run(
  "node",
  ["--test", relative(testFile)],
  "Link-Recovery-Regressionstest"
);

const previousClosureTest = path.join(
  appRoot,
  "test",
  "comparison-release-closure-14.0.3.test.mjs"
);

if (fs.existsSync(previousClosureTest)) {
  run(
    "node",
    ["--test", relative(previousClosureTest)],
    "Comparison-Closure-Gesamttest"
  );
}

const scripts = {
  refactor: path.join(appRoot, "scripts", "comparison-platform", "refactor-audit.mjs"),
  audit: path.join(appRoot, "scripts", "comparison-platform", "audit.mjs"),
  data: path.join(appRoot, "scripts", "comparison-platform", "data-audit.mjs"),
  coverage: path.join(appRoot, "scripts", "comparison-platform", "coverage-audit.mjs"),
  release: path.join(appRoot, "scripts", "comparison-platform", "release-closure.mjs"),
  schema: path.join(appRoot, "scripts", "seo", "audit-comparison-product-schema.mjs"),
  visual: path.join(appRoot, "scripts", "design-system", "visual-qa.mjs")
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
      "fix(pfotentechnik): recover malformed comparison links"
    ],
    "lokaler Commit"
  );
}

log("Comparison Release Closure 14.0.4 erfolgreich abgeschlossen.");
