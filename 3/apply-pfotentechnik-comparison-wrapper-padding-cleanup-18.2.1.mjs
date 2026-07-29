#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-wrapper-padding-cleanup-18.2.1";
const ROOT = process.cwd();
const CSS_REL = "packages/affiliate-core/src/components/comparison/comparison-system.css";
const CSS_FILE = path.join(ROOT, CSS_REL);
const runChecks = !process.argv.includes("--skip-checks");

const log = (m = "") => console.log(`[${PATCH}] ${m}`);
const fail = (m) => {
  console.error(`\n[${PATCH}] FEHLER: ${m}`);
  process.exit(1);
};

function run(command, args) {
  log(`> ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd: ROOT, stdio: "inherit", env: process.env });
}

function backup(file) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(ROOT, ".patch-backups", `${PATCH}-${stamp}`);
  const target = path.join(dir, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
  return dir;
}

const targets = [
  ".comparison-detail",
  ".comparison-shell",
  ".comparison-decision-flow",
  ".comparison-shell .comparison-decision-flow",
  ".comparison-premium-section",
  ".comparison-shell .comparison-premium-section",
  ".comparison-explorer",
  ".comparison-shell .comparison-explorer",
  ".comparison-content",
  ".comparison-detail > .comparison-content",
  ".comparison-shell .comparison-content",
  ".comparison-explorer__layout",
  ".comparison-shell .comparison-explorer__layout",
  ".comparison-explorer__content",
  ".comparison-shell .comparison-explorer__content"
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removePaddingFromSelector(css, selector) {
  const pattern = new RegExp(
    `(${escapeRegExp(selector)}\\s*\\{)([\\s\\S]*?)(\\})`,
    "g"
  );

  let removed = 0;
  const next = css.replace(pattern, (full, start, body, end) => {
    const cleaned = body.replace(
      /(^|\n)([ \t]*padding(?:-block(?:-start|-end)?|-inline(?:-start|-end)?|-top|-right|-bottom|-left)?\s*:\s*[^;{}]+;?[ \t]*)/gim,
      (match, prefix) => {
        removed += 1;
        return prefix;
      }
    );
    return `${start}${cleaned}${end}`;
  });

  return { css: next, removed };
}

log("Vorprüfung");

if (!fs.existsSync(CSS_FILE)) fail(`Datei fehlt: ${CSS_REL}`);

let css = fs.readFileSync(CSS_FILE, "utf8");

if (/<<<<<<<|=======|>>>>>>>/.test(css)) {
  fail("Die CSS-Datei enthält noch Merge-Konfliktmarker.");
}

if (!css.includes("PT_COMPARISON_MOBILE_DENSITY_TABLE_FIX_18_2_0_START")) {
  fail("Der bestehende Tabellen-/View-Fix 18.2.0 wurde nicht gefunden.");
}

const original = css;
let totalRemoved = 0;

for (const selector of targets) {
  const result = removePaddingFromSelector(css, selector);
  css = result.css;
  totalRemoved += result.removed;
  if (result.removed > 0) {
    log(`${selector}: ${result.removed} Padding-Deklaration(en) entfernt`);
  }
}

if (totalRemoved === 0) {
  fail("Keine Padding-Deklarationen an den äußeren Comparison-Wrappern gefunden.");
}

const backupDir = backup(CSS_FILE);
fs.writeFileSync(CSS_FILE, css, "utf8");

log(`Geändert: ${CSS_REL}`);
log(`Insgesamt entfernt: ${totalRemoved}`);
log(`Backup: ${path.relative(ROOT, backupDir)}`);
log("Kein neuer CSS-Block wurde angehängt.");
log("FAQ-Regeln wurden nicht verändert.");

if (runChecks) {
  const checks = [
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:responsive:audit"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:visual-qa:strict"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"]],
    ["npm", ["run", "build:pfotentechnik"]]
  ];

  for (const [command, args] of checks) {
    try {
      run(command, args);
    } catch {
      fail(`Validierung fehlgeschlagen: ${command} ${args.join(" ")}`);
    }
  }
}

log("Abgeschlossen.");
