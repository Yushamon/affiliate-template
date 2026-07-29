#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-mobile-full-bleed-19.2.0";
const ROOT = process.cwd();
const CSS_REL = "packages/affiliate-core/src/components/comparison/comparison-system.css";
const CSS_FILE = path.join(ROOT, CSS_REL);
const runChecks = !process.argv.includes("--skip-checks");

const log = (m = "") => console.log(`[${PATCH}] ${m}`);
const fail = (m) => { console.error(`\n[${PATCH}] FEHLER: ${m}`); process.exit(1); };

function run(cmd, args) {
  log(`> ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: process.env });
}

function backup(file) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(ROOT, ".patch-backups", `${PATCH}-${stamp}`);
  const target = path.join(dir, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
  return dir;
}

if (!fs.existsSync(CSS_FILE)) fail(`Datei fehlt: ${CSS_REL}`);

let css = fs.readFileSync(CSS_FILE, "utf8");
if (/<<<<<<<|=======|>>>>>>>/.test(css)) fail("Merge-Konfliktmarker gefunden.");

const oldBase = `.comparison-detail,
.comparison-shell {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: clamp(3rem, 6vw, 5.5rem);
}

.comparison-detail {

}`;

const newBase = `.comparison-detail,
.comparison-shell {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: clamp(3rem, 6vw, 5.5rem);
}

.comparison-detail {
  --comparison-readable-width: 76rem;
  --comparison-page-gutter: var(--pt-page-gutter, 1rem);
}

.comparison-detail > .comparison-content,
.comparison-detail > #faq {
  width: min(calc(100% - (2 * var(--comparison-page-gutter))), var(--comparison-readable-width));
  margin-inline: auto;
}`;

if (!css.includes(oldBase)) fail("Basisdefinition .comparison-detail nicht gefunden.");
css = css.replace(oldBase, newBase);

const anchor = `@media (max-width: 760px) {

  .comparison-shell .recommendation-card > .comparison-price-signal {`;

const replacement = `@media (max-width: 760px) {
  .comparison-detail {
    width: 100vw;
    max-width: none;
    margin-inline: calc(50% - 50vw);
  }

  .comparison-detail > :not(.comparison-content):not(#faq) {
    width: 100%;
    max-width: none;
    margin-inline: 0;
  }

  .comparison-detail > .comparison-content,
  .comparison-detail > #faq {
    width: calc(100% - (2 * var(--comparison-page-gutter)));
    max-width: var(--comparison-readable-width);
    margin-inline: auto;
  }

  .comparison-shell,
  .comparison-shell > *,
  .comparison-shell .comparison-decision-flow,
  .comparison-shell .comparison-decision-flow > *,
  .comparison-shell .comparison-cover,
  .comparison-shell .comparison-editorial-recommendation,
  .comparison-shell .comparison-premium-section,
  .comparison-shell .comparison-lab {
    width: 100%;
    max-width: none;
    margin-inline: 0;
  }

  .comparison-shell,
  .comparison-shell .comparison-cover,
  .comparison-shell .comparison-editorial-recommendation,
  .comparison-shell .comparison-premium-section,
  .comparison-shell .comparison-lab {
    padding-inline: 0;
  }

  .comparison-shell .recommendation-card > .comparison-price-signal {`;

if (!css.includes(anchor)) fail("Mobiler Vergleichsblock nicht gefunden.");
css = css.replace(anchor, replacement);

const backupDir = backup(CSS_FILE);
fs.writeFileSync(CSS_FILE, css, "utf8");

log(`Geändert: ${CSS_REL}`);
log("Alles außer Textbereich und FAQ ist mobil full-bleed.");
log("Kein neuer Block am Dateiende.");
log(`Backup: ${path.relative(ROOT, backupDir)}`);

if (runChecks) {
  const checks = [
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:responsive:audit"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"]],
    ["npm", ["run", "build:pfotentechnik"]]
  ];
  for (const [cmd, args] of checks) {
    try { run(cmd, args); }
    catch { fail(`Validierung fehlgeschlagen: ${cmd} ${args.join(" ")}`); }
  }
}

log("Abgeschlossen.");
