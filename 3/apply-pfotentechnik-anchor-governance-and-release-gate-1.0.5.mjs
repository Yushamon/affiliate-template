#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-anchor-governance-and-release-gate-1.0.5";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PAGES = path.join(APP, "src", "pages");
const REPORT = path.join(APP, "reports", "seo-release", "build-output-latest.json");
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const changed = [];
const skipped = [];

const log = (message = "") => console.log(`[${NAME}] ${message}`.trimEnd());
const fail = (message) => {
  console.error(`\n[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};
const rel = (file) => path.relative(ROOT, file).replace(/\\/g, "/");

function read(file) {
  if (!fs.existsSync(file)) fail(`Erwartete Datei fehlt: ${rel(file)}`);
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  const target = path.join(BACKUP_ROOT, rel(file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function run(command, args, options = {}) {
  log(`Ausführen: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      ...(options.env ?? {})
    }
  });

  if (result.error) {
    fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  }

  if (result.status !== 0 && !options.allowFailure) {
    fail(`Befehl fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`);
  }

  return result;
}

function walk(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else output.push(file);
  }
  return output;
}

function countMatches(value, pattern) {
  return (value.match(pattern) ?? []).length;
}

log("Vorprüfung");

for (const file of [
  path.join(ROOT, "package.json"),
  path.join(APP, "package.json"),
  path.join(APP, "src", "layouts", "ProjectLayout.astro"),
  path.join(ROOT, "packages", "affiliate-core", "src", "layouts", "AffiliateLayout.astro")
]) {
  if (!fs.existsSync(file)) {
    fail(`Repository-Struktur unvollständig: ${rel(file)}`);
  }
}

const affiliateLayout = read(
  path.join(ROOT, "packages", "affiliate-core", "src", "layouts", "AffiliateLayout.astro")
);
const projectLayout = read(
  path.join(APP, "src", "layouts", "ProjectLayout.astro")
);

if (!affiliateLayout.includes('<main class:list={["container"')) {
  fail("AffiliateLayout besitzt nicht den erwarteten zentralen <main>-Wrapper.");
}
if (!projectLayout.includes("<AffiliateLayout") || !projectLayout.includes("<slot />")) {
  fail("ProjectLayout entspricht nicht der erwarteten Wrapper-Architektur.");
}

const astroFiles = walk(PAGES).filter((file) => file.endsWith(".astro"));
const candidates = [];

for (const file of astroFiles) {
  const source = read(file);

  const usesProjectLayout =
    source.includes("ProjectLayout") &&
    /<ProjectLayout(?:\s|>)/.test(source);

  if (!usesProjectLayout) continue;

  const openingMainCount = countMatches(source, /<main(?:\s|>)/g);
  const closingMainCount = countMatches(source, /<\/main\s*>/g);

  if (openingMainCount === 0 && closingMainCount === 0) continue;

  candidates.push({
    file,
    source,
    openingMainCount,
    closingMainCount
  });
}

if (candidates.length === 0) {
  log("Keine inneren <main>-Wrapper innerhalb von ProjectLayout gefunden.");
} else {
  log(`Gefundene betroffene Seitentemplates: ${candidates.length}`);
  for (const candidate of candidates) {
    log(
      `- ${rel(candidate.file)} ` +
      `(open=${candidate.openingMainCount}, close=${candidate.closingMainCount})`
    );
  }
}

for (const candidate of candidates) {
  const { file, source, openingMainCount, closingMainCount } = candidate;

  if (openingMainCount !== 1 || closingMainCount !== 1) {
    fail(
      `${rel(file)} enthält eine unerwartete Main-Struktur ` +
      `(open=${openingMainCount}, close=${closingMainCount}). ` +
      "Die Datei wurde nicht automatisch verändert."
    );
  }

  const openingPattern = /<main(\s[^>]*)?>/;
  const closingPattern = /<\/main\s*>/;

  const opening = source.match(openingPattern)?.[0];
  if (!opening) {
    fail(`Öffnender <main>-Wrapper nicht gefunden: ${rel(file)}`);
  }

  const attributes = opening
    .replace(/^<main/, "")
    .replace(/>$/, "");

  let updated = source.replace(openingPattern, `<div${attributes}>`);
  updated = updated.replace(closingPattern, "</div>");

  if (updated === source) {
    fail(`Keine sichere Änderung möglich: ${rel(file)}`);
  }

  if (countMatches(updated, /<main(?:\s|>)/g) !== 0 ||
      countMatches(updated, /<\/main\s*>/g) !== 0) {
    fail(`Main-Wrapper wurde nicht vollständig entfernt: ${rel(file)}`);
  }

  backup(file);
  fs.writeFileSync(file, updated, "utf8");
  changed.push(rel(file));
}

for (const file of astroFiles) {
  const source = read(file);
  if (
    source.includes("ProjectLayout") &&
    /<ProjectLayout(?:\s|>)/.test(source) &&
    (/<main(?:\s|>)/.test(source) || /<\/main\s*>/.test(source))
  ) {
    fail(`Nachprüfung fehlgeschlagen: inneres <main> verbleibt in ${rel(file)}`);
  }
}

if (changed.length === 0) {
  skipped.push("Alle betroffenen Seitentemplates waren bereits bereinigt.");
}

log("Vollständiger Produktionsbuild");
run("npm", ["run", "build:pfotentechnik"], {
  env: { PFOTENTECHNIK_FAST_BUILD: "0" }
});

const sitemap = path.join(APP, "dist", "sitemap-index.xml");
if (!fs.existsSync(sitemap)) {
  fail("Vollständiger Build erzeugte keine dist/sitemap-index.xml.");
}

const auditResult = run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:release-build-output:strict"],
  { allowFailure: true }
);

if (auditResult.status !== 0) {
  if (fs.existsSync(REPORT)) {
    try {
      const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
      const errors = (report.findings ?? []).filter(
        (finding) => finding.severity === "error"
      );

      console.error(`\n[${NAME}] Verbleibende echte Fehler: ${errors.length}`);
      for (const finding of errors.slice(0, 60)) {
        console.error(
          `- ${finding.code}: ${finding.route ?? finding.url ?? finding.file ?? ""}` +
          `${finding.reason ? ` — ${finding.reason}` : ""}` +
          `${Number.isInteger(finding.open)
            ? ` (open=${finding.open}, close=${finding.close})`
            : ""}`
        );
      }
    } catch (error) {
      console.error(`[${NAME}] Report konnte nicht gelesen werden: ${error.message}`);
    }
  }

  fail(`Build-Output-Audit fehlgeschlagen. Report: ${rel(REPORT)}`);
}

run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:internal-link-targets:strict"]
);

run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "seo:release:check"],
  { env: { PFOTENTECHNIK_FAST_BUILD: "0" } }
);

log("");
log("ABGESCHLOSSEN.");
log(`Geänderte Seitentemplates: ${changed.length}`);
for (const file of changed) log(`- ${file}`);
for (const item of skipped) log(`- Übersprungen: ${item}`);
if (changed.length) log(`Backups: ${rel(BACKUP_ROOT)}`);
log("Der zentrale <main>-Wrapper im AffiliateLayout blieb unverändert.");
log("Innere Wrapper wurden ausschließlich von <main> zu <div> geändert.");
log("Klassen, Attribute, Inhalte, Canonicals, URLs und sichtbares Design blieben erhalten.");
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");
