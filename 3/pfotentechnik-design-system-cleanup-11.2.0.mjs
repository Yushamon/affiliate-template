#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-design-system-cleanup-11.2.0";
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const NO_COMMIT = args.has("--no-commit");
const AGGRESSIVE = args.has("--aggressive");

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
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const reportDir = path.join(app, "reports", "design-system");
const reportJson = path.join(reportDir, "cleanup-11.2.0.json");
const reportMd = path.join(reportDir, "cleanup-11.2.0.md");

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
    if (entry.isDirectory()) return walk(file, predicate);
    return predicate(file) ? [file] : [];
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
function remove(file) {
  if (!fs.existsSync(file)) return false;
  if (!DRY_RUN) {
    backup(file);
    fs.rmSync(file, { force: true });
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

const sourceFiles = [
  ...walk(appSrc, (p) => /\.(astro|tsx?|jsx?|mjs|cjs|css|json|md)$/.test(p)),
  ...walk(coreSrc, (p) => /\.(astro|tsx?|jsx?|mjs|cjs|css|json|md)$/.test(p)),
];

for (const file of sourceFiles) {
  const text = read(file);
  if (/^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(text)) {
    fail(`Merge-Konfliktmarker gefunden: ${rel(file)}`);
  }
}

const textFiles = sourceFiles.filter((p) => !/\.(png|jpe?g|webp|gif|svg)$/.test(p));
const corpus = textFiles.map((p) => read(p)).join("\n");

function referenceTokens(file) {
  const base = path.basename(file);
  const stem = base.replace(/\.[^.]+$/, "");
  const relativeFromApp = rel(file).replace(/^apps\/pfotentechnik\/src\//, "");
  const relativeFromCore = rel(file).replace(/^packages\/affiliate-core\/src\//, "");
  return [...new Set([
    base,
    stem,
    relativeFromApp,
    relativeFromCore,
    relativeFromApp.replace(/\.[^.]+$/, ""),
    relativeFromCore.replace(/\.[^.]+$/, ""),
  ].filter(Boolean))];
}

function isReferenced(file) {
  const self = read(file);
  const tokens = referenceTokens(file);
  const corpusWithoutSelf = corpus.replace(self, "");
  return tokens.some((token) => token.length >= 5 && corpusWithoutSelf.includes(token));
}

const explicitLegacyPattern = /(?:^|[-_.])(legacy|deprecated|obsolete|unused|archive|backup|old)(?:[-_.]|$)/i;
const generatedVariantPattern = /(?:hotfix|fix(?:es)?-\d|polish-\d|variant-\d|v\d+(?:\.\d+)*|\d+\.\d+(?:\.\d+)?)/i;
const protectedNames = new Set([
  "ProjectLayout.astro",
  "AffiliateLayout.astro",
  "pfotentechnik.css",
  "pfotentechnik-design-system.css",
  "pfotentechnik-design-tokens.css",
  "pfotentechnik-ui-system.css",
  "pfotentechnik-product-mobile-premium.css",
]);

const cssFiles = sourceFiles.filter((p) => p.endsWith(".css"));
const componentFiles = sourceFiles.filter((p) => /\.(astro|tsx?|jsx?)$/.test(p));

const removedFiles = [];
const retainedCandidates = [];
const changedFiles = [];
const duplicateBlocksRemoved = {};
const duplicateUtilitySelectors = {};

/* Exakt identische Utility-Blöcke innerhalb derselben Datei entfernen.
 * Nur einfache Einzelklassen ohne Pseudo-Selektoren und ohne Kombinatoren.
 */
function dedupeUtilityBlocks(css) {
  const re = /(^|})\s*(\.[a-zA-Z_][\w-]*)\s*\{([^{}]*)\}/gm;
  const seen = new Set();
  let removed = 0;
  const output = css.replace(re, (full, boundary, selector, body) => {
    const normalizedBody = body.trim().replace(/\s+/g, " ");
    const key = `${selector}{${normalizedBody}}`;
    if (seen.has(key)) {
      removed++;
      return boundary;
    }
    seen.add(key);
    return full;
  });
  return { output, removed };
}

for (const file of cssFiles) {
  const before = read(file);
  const { output, removed } = dedupeUtilityBlocks(before);
  if (removed > 0) {
    duplicateBlocksRemoved[rel(file)] = removed;
    if (write(file, output)) changedFiles.push(rel(file));
  }
}

/* Dateibereinigung */
for (const file of [...cssFiles, ...componentFiles]) {
  if (protectedNames.has(path.basename(file))) continue;
  const referenced = isReferenced(file);
  const name = path.basename(file);

  if (!referenced && explicitLegacyPattern.test(name)) {
    if (remove(file)) removedFiles.push(rel(file));
    continue;
  }

  if (!referenced && generatedVariantPattern.test(name)) {
    if (AGGRESSIVE) {
      if (remove(file)) removedFiles.push(rel(file));
    } else {
      retainedCandidates.push({
        file: rel(file),
        reason: "Unreferenzierte Versions-/Hotfix-Datei; ohne --aggressive beibehalten",
      });
    }
  }
}

/* Nach verbliebenen Utility-Selektoren suchen, die in mehreren Dateien vorkommen. */
const selectorMap = new Map();
const simpleUtilityRe = /(^|})\s*(\.[a-zA-Z_][\w-]*)\s*\{([^{}]*)\}/gm;
for (const file of cssFiles.filter((f) => fs.existsSync(f))) {
  const css = read(file).replace(/\/\*[\s\S]*?\*\//g, "");
  let match;
  while ((match = simpleUtilityRe.exec(css))) {
    const selector = match[2];
    const body = match[3].trim().replace(/\s+/g, " ");
    const hash = crypto.createHash("sha1").update(body).digest("hex").slice(0, 12);
    const key = `${selector}::${hash}`;
    const entries = selectorMap.get(key) || [];
    entries.push(rel(file));
    selectorMap.set(key, entries);
  }
}
for (const [key, files] of selectorMap) {
  const unique = [...new Set(files)];
  if (unique.length > 1) {
    const selector = key.split("::")[0];
    duplicateUtilitySelectors[selector] ||= [];
    duplicateUtilitySelectors[selector].push(unique);
  }
}

/* Leere Verzeichnisse unter Komponenten/Styles entfernen */
function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = path.join(dir, entry.name);
    removeEmptyDirs(child);
    if (fs.existsSync(child) && fs.readdirSync(child).length === 0 && !DRY_RUN) {
      fs.rmdirSync(child);
    }
  }
}
removeEmptyDirs(path.join(appSrc, "components"));
removeEmptyDirs(path.join(appSrc, "styles"));
removeEmptyDirs(path.join(coreSrc, "components"));

const summary = {
  removedFiles: removedFiles.length,
  changedFiles: changedFiles.length,
  exactDuplicateUtilityBlocksRemoved: Object.values(duplicateBlocksRemoved).reduce((a, b) => a + b, 0),
  retainedCandidates: retainedCandidates.length,
  duplicateUtilitySelectorsRemaining: Object.keys(duplicateUtilitySelectors).length,
};

const json = {
  name: NAME,
  generatedAt: new Date().toISOString(),
  aggressive: AGGRESSIVE,
  dryRun: DRY_RUN,
  summary,
  removedFiles,
  changedFiles,
  duplicateBlocksRemoved,
  retainedCandidates,
  duplicateUtilitySelectors,
};

const md = `# PfotenTechnik Design-System Cleanup 11.2.0

## Ergebnis

- Entfernte veraltete/unreferenzierte Dateien: **${summary.removedFiles}**
- Geänderte CSS-Dateien: **${summary.changedFiles}**
- Entfernte exakt doppelte Utility-Blöcke: **${summary.exactDuplicateUtilityBlocksRemoved}**
- Bewusst beibehaltene Kandidaten: **${summary.retainedCandidates}**
- Verbleibende dateiübergreifende Utility-Dopplungen: **${summary.duplicateUtilitySelectorsRemaining}**

## Entfernte Dateien

${removedFiles.length ? removedFiles.map((f) => `- \`${f}\``).join("\n") : "- Keine"}

## Bewusst beibehaltene Kandidaten

${retainedCandidates.length
  ? retainedCandidates.map((x) => `- \`${x.file}\` – ${x.reason}`).join("\n")
  : "- Keine"}

## Verbleibende Dopplungen

Diese werden nicht automatisch verschoben, weil ihre Lade- und Kaskadenreihenfolge komponentenspezifisch sein kann.

${Object.keys(duplicateUtilitySelectors).length
  ? Object.entries(duplicateUtilitySelectors)
      .slice(0, 100)
      .map(([selector, groups]) => `- \`${selector}\`: ${groups.flat().map((f) => `\`${f}\``).join(", ")}`)
      .join("\n")
  : "- Keine"}
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportJson, JSON.stringify(json, null, 2) + "\n");
  fs.writeFileSync(reportMd, md);
}

log(`Entfernte Dateien: ${summary.removedFiles}`);
log(`Entfernte doppelte Utility-Blöcke: ${summary.exactDuplicateUtilityBlocksRemoved}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run abgeschlossen.");
  process.exit(0);
}

if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:audit"])) {
  fail("Design-System-Audit fehlgeschlagen.");
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
    if (!run("git", ["commit", "-m", "refactor(pfotentechnik): remove obsolete ui assets"])) {
      fail("Commit fehlgeschlagen.");
    }
    log("Änderungen lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Cleanup 11.2.0 erfolgreich abgeschlossen.");
