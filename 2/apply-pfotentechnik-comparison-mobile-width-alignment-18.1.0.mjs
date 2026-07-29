#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-comparison-mobile-width-alignment-18.1.0";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const CSS = path.join(ROOT, "packages", "affiliate-core", "src", "components", "comparison", "comparison-system.css");
const BACKUP_ROOT = path.join(ROOT, ".patch-backups", `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`);

const START = "/* PT_COMPARISON_MOBILE_WIDTH_ALIGNMENT_18_1_0_START */";
const END = "/* PT_COMPARISON_MOBILE_WIDTH_ALIGNMENT_18_1_0_END */";
const BLOCK = `${START}
@media (max-width: 47.99rem) {
  .comparison-shell[data-comparison-cover-version] {
    --comparison-content-width: 100%;
  }

  .comparison-shell[data-comparison-cover-version] > .comparison-cover,
  .comparison-shell[data-comparison-cover-version] > .comparison-editorial-recommendation,
  .comparison-shell[data-comparison-cover-version] .comparison-decision-flow > .comparison-premium-section,
  .comparison-shell[data-comparison-cover-version] .comparison-decision-flow > .comparison-explorer {
    box-sizing: border-box;
    width: 100%;
    max-width: none;
    margin-inline: 0;
  }

  .comparison-shell[data-comparison-cover-version] :is(
    .comparison-alternatives,
    .recommendation-grid,
    .comparison-explorer,
    .comparison-explorer__results,
    .comparison-mobile-products,
    .comparison-mobile-product,
    .recommendation-card,
    .comparison-winner-card,
    .comparison-verdict
  ) {
    max-width: none;
  }

  .comparison-shell[data-comparison-cover-version] :is(
    .comparison-alternatives,
    .recommendation-grid,
    .comparison-explorer__results,
    .comparison-mobile-products
  ) {
    width: 100%;
    margin-inline: 0;
  }
}
${END}`;

const log = (m = "") => console.log(`[${NAME}] ${m}`.trimEnd());
const fail = (m) => { console.error(`\n[${NAME}] FEHLER: ${m}`); process.exit(1); };
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, "/");
const normalize = (v) => String(v).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

function run(command, args) {
  log(`Ausführen: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "0" },
    shell: process.platform === "win32"
  });
  if (result.error) fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  if (result.status !== 0) fail(`Befehl fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`);
}

log("Vorprüfung");
for (const file of [path.join(ROOT, "package.json"), path.join(APP, "package.json"), CSS]) {
  if (!fs.existsSync(file)) fail(`Erwartete Datei fehlt: ${rel(file)}`);
}

let source = normalize(fs.readFileSync(CSS, "utf8"));
for (const anchor of [".comparison-shell", "--comparison-content-width", ".recommendation-grid", ".comparison-mobile-product"]) {
  if (!source.includes(anchor)) fail(`Unbekannte Comparison-CSS-Architektur; Anker fehlt: ${anchor}`);
}

const markerPattern = /\/\* PT_COMPARISON_MOBILE_WIDTH_ALIGNMENT_18_1_0_START \*\/[\s\S]*?\/\* PT_COMPARISON_MOBILE_WIDTH_ALIGNMENT_18_1_0_END \*\//g;
const updated = `${source.replace(markerPattern, "").trimEnd()}\n\n${BLOCK}\n`;

if (updated === source) {
  log(`Unverändert: ${rel(CSS)} (Fix bereits vorhanden)`);
} else {
  const backup = path.join(BACKUP_ROOT, rel(CSS));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(CSS, backup);
  fs.writeFileSync(CSS, updated, "utf8");
  log(`Geändert: ${rel(CSS)}`);
  log(`Backup: ${rel(backup)}`);
}

const finalSource = normalize(fs.readFileSync(CSS, "utf8"));
if ((finalSource.match(/PT_COMPARISON_MOBILE_WIDTH_ALIGNMENT_18_1_0_START/g) ?? []).length !== 1) {
  fail("Der Fix ist nicht genau einmal vorhanden.");
}
if (!finalSource.includes("--comparison-content-width: 100%")) {
  fail("Der doppelte mobile Innen-Gutter wurde nicht entfernt.");
}

run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:responsive:audit"]);
run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:visual-qa:strict"]);
run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"]);
run("npm", ["run", "build:pfotentechnik"]);
run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:release-build-output:strict"]);

log("");
log("ABGESCHLOSSEN.");
log("Mobile Vergleichsinhalte nutzen jetzt denselben äußeren Seitencontainer wie die FAQ.");
log("Der doppelte interne Gutter der ComparisonShell wurde entfernt.");
log("Hero, Empfehlungen, Produktkarten, Explorer und Methodik sind einheitlich breit.");
log("Desktop, Sticky-CTA, Dark Mode und Inhaltslogik wurden nicht verändert.");
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");
