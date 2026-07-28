#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const NAME = "pfotentechnik-comparison-release-closure-14.0.11";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");

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
    ) return current;

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
const pageDir = path.join(appRoot, "src", "content", "pages");
const reportDir = path.join(appRoot, "reports", "comparison-platform");

const dogComparison = path.join(
  comparisonDir,
  "beste-futterautomaten-fuer-hunde.md"
);
const dogFountainComparison = path.join(
  comparisonDir,
  "beste-trinkbrunnen-fuer-hunde.md"
);
const releaseAudit = path.join(
  appRoot,
  "scripts",
  "comparison-platform",
  "release-closure.mjs"
);
const reportFile = path.join(
  reportDir,
  "comparison-release-closure-14.0.11.md"
);

for (const file of [dogComparison, dogFountainComparison, releaseAudit]) {
  if (!fs.existsSync(file)) fail(`Pflichtdatei fehlt: ${path.relative(root, file)}`);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${NAME}-${timestamp}`);
const changes = [];

const rel = (file) => path.relative(root, file).split(path.sep).join("/");
const read = (file) => fs.readFileSync(file, "utf8");
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

function backup(file) {
  if (CHECK_ONLY || !fs.existsSync(file)) return;
  const target = path.join(backupRoot, rel(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content, description) {
  const previous = fs.existsSync(file) ? read(file) : "";
  if (previous === content) return false;

  changes.push({ file: rel(file), description });

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
    executable = process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
    finalArgs = ["/d", "/c", command, ...commandArgs];
  }

  log(`Prüfung: ${label}`);
  log(`Befehl: ${[executable, ...finalArgs].join(" ")}`);

  const result = spawnSync(executable, finalArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR || "1" }
  });

  if (result.error) {
    fail(`${label} konnte nicht gestartet werden: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${label} fehlgeschlagen. Exit-Code: ${result.status}`);
  }
}

function splitFrontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) fail(`Frontmatter fehlt oder ist ungültig: ${rel(file)}`);

  return {
    raw: match[1],
    body: source.slice(match[0].length),
    fullMatch: match[0]
  };
}

function parseFrontmatter(source, file) {
  const { raw } = splitFrontmatter(source, file);
  try {
    return yaml.load(raw) || {};
  } catch (error) {
    fail(`YAML weiterhin ungültig in ${rel(file)}: ${error.message}`);
  }
}

function normalizeRoute(value) {
  if (!value || typeof value !== "string") return null;
  let route = value.trim();
  if (!route.startsWith("/")) route = `/${route}`;
  if (!route.endsWith("/")) route = `${route}/`;
  return route;
}

function pageRoute(file) {
  const source = read(file);
  const data = parseFrontmatter(source, file);
  return (
    normalizeRoute(data.canonical) ||
    normalizeRoute(data.seo?.canonical) ||
    normalizeRoute(data.slug) ||
    normalizeRoute(path.basename(file).replace(/\.mdx?$/i, ""))
  );
}

function findPageRoute(candidates, matcher) {
  const files = fs.readdirSync(pageDir)
    .filter((name) => /\.mdx?$/i.test(name))
    .map((name) => path.join(pageDir, name));

  for (const candidate of candidates) {
    const exact = files.find(
      (file) => path.basename(file).toLowerCase() === candidate.toLowerCase()
    );
    if (exact) return pageRoute(exact);
  }

  for (const file of files) {
    const source = read(file);
    let data;
    try {
      data = parseFrontmatter(source, file);
    } catch {
      continue;
    }

    const haystack = [
      path.basename(file),
      data.slug,
      data.canonical,
      data.seo?.canonical,
      data.title
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (matcher(haystack)) return pageRoute(file);
  }

  return null;
}

function ensureMarkdownListLink(source, {
  label,
  route,
  beforeLabel,
  sectionHeading
}) {
  if (!route) return source;

  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingByRoute = new RegExp(`\\[[^\\]]+\\]\\(${escapedRoute}\\)`);
  if (existingByRoute.test(source)) return source;

  const line = `- [${label}](${route})`;

  if (beforeLabel) {
    const beforePattern = new RegExp(
      `^(\\s*- \\[${beforeLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]\\([^\\n]+\\))`,
      "m"
    );
    if (beforePattern.test(source)) {
      return source.replace(beforePattern, `${line}\n$1`);
    }
  }

  if (sectionHeading) {
    const headingPattern = new RegExp(
      `(^## ${sectionHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$)`,
      "m"
    );
    if (headingPattern.test(source)) {
      return source.replace(headingPattern, `$1\n\n${line}`);
    }
  }

  return `${source.trimEnd()}\n\n${line}\n`;
}

log("Schritt 1: beschädigte YAML-Abstände aus 14.0.10 reparieren");

const comparisonFiles = fs.readdirSync(comparisonDir)
  .filter((name) => /\.mdx?$/i.test(name))
  .sort()
  .map((name) => path.join(comparisonDir, name));

for (const file of comparisonFiles) {
  const source = read(file);

  const repaired = source
    .replace(/^(\s+[A-Za-z0-9_-]+:)(?=\S)/gm, "$1 ")
    .replace(/^([A-Za-z0-9_-]+:)(?=\S)/gm, "$1 ");

  write(
    file,
    repaired,
    "fehlende Leerzeichen nach YAML-Schlüsseln repariert"
  );
}

log("Schritt 2: neu vorhandenen Hundefutter-Ratgeber erkennen und verlinken");

const nutritionRoute = findPageRoute(
  [
    "trockenfutter-nassfutter-hund.md",
    "trockenfutter-oder-nassfutter-hund.md",
    "trockenfutter-vs-nassfutter-hund.md"
  ],
  (text) =>
    text.includes("trockenfutter") &&
    text.includes("nassfutter") &&
    text.includes("hund")
);

if (!nutritionRoute) {
  fail(
    "Die neue Seite zu Trockenfutter/Nassfutter/Hund wurde nicht gefunden. " +
    "Erwartet wird eine passende MD-Datei unter apps/pfotentechnik/src/content/pages."
  );
}

{
  let source = read(dogComparison);

  source = source
    .replace(
      /\[Trockenfutter oder Nassfutter für Hunde\?\]\(\/trockenfutter-oder-nassfutter-hund\/\)/g,
      `[Trockenfutter oder Nassfutter für Hunde?](${nutritionRoute})`
    )
    .replace(
      /\[Trockenfutter oder Nassfutter für Hunde\?\]\(\/trockenfutter-nassfutter-hund\/\)/g,
      `[Trockenfutter oder Nassfutter für Hunde?](${nutritionRoute})`
    );

  source = ensureMarkdownListLink(source, {
    label: "Trockenfutter oder Nassfutter für Hunde?",
    route: nutritionRoute,
    beforeLabel: "Smarte Futterautomaten",
    sectionHeading: "Weiterführende Kaufberatung"
  });

  write(
    dogComparison,
    source,
    `Ratgeberlink auf ${nutritionRoute} wiederhergestellt`
  );
}

log("Schritt 3: optionale Hundetrink-Ratgeber nur bei real vorhandener Seite wiederherstellen");

const cleaningRoute = findPageRoute(
  [
    "trinkbrunnen-richtig-reinigen.md",
    "katzentrinkbrunnen-richtig-reinigen.md"
  ],
  (text) =>
    text.includes("trinkbrunnen") &&
    text.includes("reinigen")
);

const waterNeedRoute = findPageRoute(
  [
    "wasserbedarf-hund.md",
    "wie-viel-wasser-braucht-ein-hund.md",
    "hund-trinkt-zu-wenig.md"
  ],
  (text) =>
    text.includes("hund") &&
    (
      text.includes("wasserbedarf") ||
      text.includes("wie-viel-wasser") ||
      text.includes("trinkt-zu-wenig")
    )
);

{
  let source = read(dogFountainComparison);

  const overview =
    "[Trinkbrunnen für Hunde und Katzen](/trinkbrunnen/)";

  const additions = [];
  if (cleaningRoute) {
    additions.push(`[Trinkbrunnen richtig reinigen](${cleaningRoute})`);
  }
  if (waterNeedRoute) {
    additions.push(`[Wie viel Wasser braucht ein Hund?](${waterNeedRoute})`);
  }

  const replacement =
    additions.length > 0
      ? `Vertiefend helfen ${overview}, ${additions.join(" und ")}.`
      : `Vertiefend hilft unser Überblick ${overview}.`;

  source = source.replace(
    /^Vertiefend (?:hilft|helfen)[^\n]*$/m,
    replacement
  );

  write(
    dogFountainComparison,
    source,
    "Vertiefungslinks anhand tatsächlich vorhandener Seiten aufgebaut"
  );
}

log("Schritt 4: alle Vergleichs-Frontmatter vollständig parsen");

for (const file of comparisonFiles) {
  parseFrontmatter(read(file), file);
}

if (CHECK_ONLY) {
  log(`Check erfolgreich. ${changes.length} Datei(en) würden geändert.`);
  for (const change of changes) {
    log(`- ${change.file}: ${change.description}`);
  }
  log(`Erkannter Hundefutter-Ratgeber: ${nutritionRoute}`);
  log(`Erkannter Reinigungsratgeber: ${cleaningRoute || "nicht vorhanden"}`);
  log(`Erkannter Wasserbedarfsratgeber: ${waterNeedRoute || "nicht vorhanden"}`);
  process.exit(0);
}

ensureDir(reportDir);
fs.writeFileSync(
  reportFile,
  [
    "# Comparison Release Closure 14.0.11",
    "",
    `Erstellt: ${new Date().toISOString()}`,
    "",
    "## Erkannte Seiten",
    "",
    `- Hundefutter-Ratgeber: \`${nutritionRoute}\``,
    `- Trinkbrunnen-Reinigung: \`${cleaningRoute || "nicht vorhanden"}\``,
    `- Wasserbedarf Hund: \`${waterNeedRoute || "nicht vorhanden"}\``,
    "",
    "## Änderungen",
    "",
    ...changes.map(
      (change) => `- \`${change.file}\`: ${change.description}`
    ),
    ""
  ].join("\n"),
  "utf8"
);

log(`Backups: ${rel(backupRoot)}`);
log(`Report: ${rel(reportFile)}`);

run(
  "npm",
  ["run", "build:pfotentechnik"],
  "PfotenTechnik-Build"
);

run(
  "node",
  [rel(releaseAudit), "--strict"],
  "24-Seiten-Release-Audit"
);

const releaseJson = path.join(
  reportDir,
  "comparison-release-closure.json"
);

if (!fs.existsSync(releaseJson)) {
  fail(`Release-Report fehlt: ${rel(releaseJson)}`);
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
    "Technischer Release-Status weiterhin nicht bestanden:\n" +
    blockers.map((item) => `- ${item}`).join("\n")
  );
}

log("Fix 14.0.11 erfolgreich abgeschlossen.");
log("Technischer Status: BESTANDEN.");
log(`Hundefutter-Ratgeber verlinkt: ${nutritionRoute}`);
