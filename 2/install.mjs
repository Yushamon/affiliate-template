#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-content-ui-polish-4.3.0";
const here = path.dirname(fileURLToPath(import.meta.url));
const payloadRoot = path.join(here, "payload");
const args = process.argv.slice(2);
const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const hasFlag = (name) => args.includes(name);
const repo = path.resolve(valueAfter("--repo") || process.cwd());
const projectLayout = path.join(repo, "apps/pfotentechnik/src/layouts/ProjectLayout.astro");
const homeSection = path.join(repo, "packages/affiliate-core/src/components/home/HomeSection.astro");
const comparisonDir = path.join(repo, "apps/pfotentechnik/src/content/comparisons");
const cssRelative = "apps/pfotentechnik/src/styles/pfotentechnik-content-ui-polish.css";
const cssFile = path.join(repo, cssRelative);
const payloadCss = path.join(payloadRoot, cssRelative);
const cssImport = 'import "../styles/pfotentechnik-content-ui-polish.css";';
const statePointer = path.join(repo, ".patch-backups", `${PATCH_ID}-latest.json`);

const exists = async (file) => {
  try { await fs.access(file); return true; } catch { return false; }
};
const preserveEol = (source, next) => source.includes("\r\n")
  ? next.replace(/\r?\n/g, "\r\n")
  : next.replace(/\r\n/g, "\n");

function addStyleImport(source) {
  if (source.includes(cssImport)) return source;
  const normalized = source.replace(/\r\n/g, "\n");
  const first = normalized.indexOf("---\n");
  const second = normalized.indexOf("\n---", first + 4);
  if (first !== 0 || second < 0) throw new Error("ProjectLayout.astro: Frontmatter fehlt.");
  const lines = normalized.slice(4, second).split("\n");
  const anchors = ["pfotentechnik-cta-system.css", "pfotentechnik-product-mobile-premium.css", "pfotentechnik-theme-fixes.css"];
  let insertAt = -1;
  for (const anchor of anchors) {
    insertAt = lines.findIndex((line) => line.includes(anchor));
    if (insertAt >= 0) break;
  }
  if (insertAt < 0) {
    const matches = lines.map((line, index) => ({ line, index })).filter(({ line }) => /^\s*import\s+["'][^"']*styles\/[^"']+\.css["'];?\s*$/.test(line));
    if (!matches.length) throw new Error("ProjectLayout.astro: Stylesheet-Anker fehlt.");
    insertAt = matches.at(-1).index;
  }
  lines.splice(insertAt + 1, 0, cssImport);
  return preserveEol(source, `---\n${lines.join("\n")}\n${normalized.slice(second + 1)}`);
}

function upgradeHomepageScore(source) {
  if (source.includes('value={item.rating}') && source.includes('variant="ring-compact"')) return source;
  const pattern = /(<EditorialScore[\s\S]*?value=\{item\.rating\}[\s\S]*?variant=")compact(")/;
  if (!pattern.test(source)) throw new Error("HomeSection.astro: Score-Anker fehlt.");
  return source.replace(pattern, "$1ring-compact$2");
}

function removeDuplicateSection(source) {
  const normalized = source.replace(/\r\n/g, "\n");
  const pattern = /^##\s+(?:Unsere\s+)?Empfehlungen\s+nach\s+Aufgabe\s*\n[\s\S]*?(?=^##\s+|\s*$)/gmi;
  const next = normalized.replace(pattern, "").replace(/\n{3,}/g, "\n\n");
  return preserveEol(source, next);
}

function quoteForCmd(value) {
  const text = String(value);
  return /[\s"&|<>^]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function run(command, commandArgs) {
  let executable = command;
  let finalArgs = commandArgs;
  if (process.platform === "win32" && /\.cmd$/i.test(command)) {
    executable = process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
    finalArgs = ["/d", "/s", "/c", [command, ...commandArgs].map(quoteForCmd).join(" ")];
  }
  const result = spawnSync(executable, finalArgs, { cwd: repo, stdio: "inherit", shell: false, env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Befehl fehlgeschlagen (${result.status}): ${command} ${commandArgs.join(" ")}`);
}
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

async function listComparisons() {
  const entries = await fs.readdir(comparisonDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map((entry) => path.join(comparisonDir, entry.name)).sort();
}
async function validateRepo() {
  const required = [path.join(repo, "package.json"), projectLayout, homeSection, comparisonDir, payloadCss, path.join(repo, "packages/affiliate-core/src/components/FAQ.astro"), path.join(repo, "packages/affiliate-core/src/components/ui/Accordion.astro")];
  for (const file of required) if (!(await exists(file))) throw new Error(`Erforderliche Datei fehlt: ${file}`);
  const home = await fs.readFile(homeSection, "utf8");
  if (!home.includes("HomeProductCard") || !home.includes("EditorialScore") || !home.includes("item.rating")) throw new Error("HomeSection.astro: Produktkarten-Architektur fehlt.");
}
async function backupFile(file, backupDir) {
  const existed = await exists(file);
  const backup = path.join(backupDir, path.relative(repo, file).replaceAll(/[\\/]/g, "__"));
  if (existed) await fs.copyFile(file, backup);
  return { file, backup, existed };
}
async function createBackup(comparisons) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(repo, ".patch-backups", `${PATCH_ID}-${stamp}`);
  await fs.mkdir(backupDir, { recursive: true });
  const files = [];
  for (const file of [projectLayout, homeSection, cssFile, ...comparisons]) files.push(await backupFile(file, backupDir));
  const state = { patchId: PATCH_ID, installedAt: new Date().toISOString(), backupDir, files };
  await fs.mkdir(path.dirname(statePointer), { recursive: true });
  await fs.writeFile(statePointer, JSON.stringify(state, null, 2), "utf8");
  return state;
}
async function restore(state) {
  for (const entry of state.files) {
    if (entry.existed) await fs.copyFile(entry.backup, entry.file);
    else await fs.rm(entry.file, { force: true });
  }
}

async function main() {
  await validateRepo();
  if (!hasFlag("--skip-baseline")) {
    console.log(`\n[${PATCH_ID}] Baseline-Build wird geprüft ...`);
    run(npmCommand, ["run", "build:pfotentechnik"]);
  }
  const comparisons = await listComparisons();
  const state = await createBackup(comparisons);
  try {
    const [layoutSource, homeSource] = await Promise.all([fs.readFile(projectLayout, "utf8"), fs.readFile(homeSection, "utf8")]);
    await fs.mkdir(path.dirname(cssFile), { recursive: true });
    await Promise.all([
      fs.copyFile(payloadCss, cssFile),
      fs.writeFile(projectLayout, addStyleImport(layoutSource), "utf8"),
      fs.writeFile(homeSection, upgradeHomepageScore(homeSource), "utf8")
    ]);
    let removed = 0;
    const changed = [];
    for (const file of comparisons) {
      const source = await fs.readFile(file, "utf8");
      const next = removeDuplicateSection(source);
      if (next !== source) {
        await fs.writeFile(file, next, "utf8");
        removed += 1;
        changed.push(path.basename(file));
      }
    }
    console.log(`\n[${PATCH_ID}] Content- und UI-Audit ...`);
    run(process.execPath, [path.join(here, "audit.mjs"), "--repo", repo]);
    console.log(`\n[${PATCH_ID}] Astro-Build nach Installation ...`);
    run(npmCommand, ["run", "build:pfotentechnik"]);
    console.log(`\n[${PATCH_ID}] Installation abgeschlossen.`);
    console.log("- Startseiten-Empfehlungen verwenden die Ringnote");
    console.log("- FAQ-Einträge sind geschlossen deutlich kompakter");
    console.log("- Produkt-FAQ folgt demselben Rhythmus");
    console.log(`- Doppelte Empfehlungskapitel entfernt: ${removed}`);
    if (changed.length) console.log(`  ${changed.join(", ")}`);
    console.log("- Vergleichsseiten erhalten mobilen Abstand zur Sticky Bar");
  } catch (error) {
    await restore(state);
    await fs.rm(statePointer, { force: true });
    console.error(`\n[${PATCH_ID}] Installation fehlgeschlagen. Änderungen wurden zurückgesetzt.`);
    throw error;
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
