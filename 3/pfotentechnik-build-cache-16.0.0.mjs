#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-build-cache-16.0.0";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const SKIP_BUILD = args.has("--skip-build");

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

const root = findRoot(process.cwd()) || findRoot(path.dirname(fileURLToPath(import.meta.url)));
if (!root) fail("Repository-Root nicht gefunden. Im affiliate-template-Repository starten.");

const appRoot = path.join(root, "apps", "pfotentechnik");
const configFile = path.join(appRoot, "astro.config.mjs");
const packageFile = path.join(appRoot, "package.json");
const gitignoreFile = path.join(root, ".gitignore");
const fastBuildFile = path.join(appRoot, "scripts", "build-fast.mjs");
const reportDir = path.join(appRoot, "reports", "build-performance");
const reportFile = path.join(reportDir, "build-cache-16.0.0.md");

for (const file of [configFile, packageFile]) {
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
  if (process.platform === "win32" && ["npm", "npx", "pnpm", "yarn"].includes(command)) {
    executable = process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
    finalArgs = ["/d", "/c", command, ...commandArgs];
  }
  log(`Prüfung: ${label}`);
  log(`Befehl: ${[executable, ...finalArgs].join(" ")}`);
  const started = Date.now();
  const result = spawnSync(executable, finalArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: { ...process.env }
  });
  const durationMs = Date.now() - started;
  if (result.error) fail(`${label} konnte nicht gestartet werden: ${result.error.message}`);
  if (result.status !== 0) fail(`${label} fehlgeschlagen. Exit-Code: ${result.status}`);
  log(`${label} abgeschlossen in ${(durationMs / 1000).toFixed(2)} s`);
  return durationMs;
}

function patchAstroConfig(source) {
  let output = source;
  const fastFlag = 'const fastBuild = process.env.PFOTENTECHNIK_FAST_BUILD === "1";';
  if (!output.includes(fastFlag)) {
    const anchor = 'const siteUrl = "https://pfotentechnik.de";';
    if (!output.includes(anchor)) fail("Astro-Konfigurationsanker `siteUrl` nicht gefunden.");
    output = output.replace(anchor, `${anchor}\n${fastFlag}`);
  }
  if (!/cacheDir\s*:/.test(output)) {
    const anchor = '  outDir: "./dist",';
    if (!output.includes(anchor)) fail("Astro-Konfigurationsanker `outDir` nicht gefunden.");
    output = output.replace(anchor, `${anchor}\n  // Persistenter astro:assets-Cache außerhalb von node_modules.\n  cacheDir: "./.astro-cache",`);
  }
  if (!output.includes("integrations: fastBuild ? [] : [")) {
    const anchor = "  integrations: [";
    if (!output.includes(anchor)) fail("Astro-Konfigurationsanker `integrations` nicht gefunden.");
    output = output.replace(anchor, "  // Schneller lokaler Produktions-Build ohne Sitemap-Serialisierung.\n  integrations: fastBuild ? [] : [");
  }
  return output;
}

function patchPackageJson(source) {
  let parsed;
  try { parsed = JSON.parse(source); }
  catch (error) { fail(`package.json ist ungültig: ${error.message}`); }
  parsed.scripts ||= {};
  parsed.scripts["build:fast"] = "node scripts/build-fast.mjs";
  parsed.scripts["build:cache:reset"] = "node scripts/build-fast.mjs --clear-cache";
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

function patchGitignore(source) {
  const entry = "apps/pfotentechnik/.astro-cache/";
  const normalized = source.replace(/\r\n/g, "\n");
  if (normalized.split("\n").includes(entry)) return normalized;
  return `${normalized.trimEnd()}\n\n# Persistenter Astro-Bildcache für schnellere lokale Builds\n${entry}\n`;
}

const fastBuildSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = path.join(appRoot, ".astro-cache");

if (process.argv.includes("--clear-cache")) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log(\`[build:cache] Cache gelöscht: \${cacheDir}\`);
  process.exit(0);
}

const executable = process.platform === "win32"
  ? process.env.ComSpec || "C:\\\\Windows\\\\System32\\\\cmd.exe"
  : "npm";
const args = process.platform === "win32"
  ? ["/d", "/c", "npm", "run", "build"]
  : ["run", "build"];

const started = Date.now();
const result = spawnSync(executable, args, {
  cwd: appRoot,
  stdio: "inherit",
  shell: false,
  env: { ...process.env, PFOTENTECHNIK_FAST_BUILD: "1" }
});
const duration = ((Date.now() - started) / 1000).toFixed(2);

if (result.error) {
  console.error(\`[build:fast] Start fehlgeschlagen: \${result.error.message}\`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(\`[build:fast] Build fehlgeschlagen nach \${duration} s.\`);
  process.exit(result.status ?? 1);
}
console.log(\`[build:fast] Erfolgreich in \${duration} s.\`);
console.log("[build:fast] Astro-Asset-Cache bleibt für Folgebuilds erhalten.");
`;

log("Schritt 1: persistenten Astro-Asset-Cache konfigurieren");
write(configFile, patchAstroConfig(read(configFile)), "cacheDir und Fast-Build-Modus ergänzt");

log("Schritt 2: plattformübergreifenden Fast-Build-Runner anlegen");
write(fastBuildFile, fastBuildSource, "Fast-Build-Runner angelegt");

log("Schritt 3: npm-Skripte ergänzen");
write(packageFile, patchPackageJson(read(packageFile)), "build:fast und build:cache:reset ergänzt");

log("Schritt 4: Cache aus Git ausschließen");
write(gitignoreFile, patchGitignore(fs.existsSync(gitignoreFile) ? read(gitignoreFile) : ""), "Astro-Cache in .gitignore ergänzt");

if (CHECK_ONLY) {
  log(`Check erfolgreich. ${changes.length} Datei(en) würden geändert.`);
  for (const change of changes) log(`- ${change.file}: ${change.description}`);
  process.exit(0);
}

ensureDir(reportDir);
fs.writeFileSync(reportFile, [
  "# Build Cache 16.0.0",
  "",
  `Erstellt: ${new Date().toISOString()}`,
  "",
  "Astros Bildoptimierung bleibt aktiv. Der Asset-Cache wird dauerhaft außerhalb von node_modules gespeichert.",
  "",
  "## Befehle",
  "",
  "- `npm --workspace apps/pfotentechnik run build:fast`",
  "- `npm --workspace apps/pfotentechnik run build:cache:reset`",
  "- `npm run build:pfotentechnik` bleibt der vollständige Release-Build inklusive Sitemap.",
  "",
  "## Änderungen",
  "",
  ...changes.map((change) => `- \`${change.file}\`: ${change.description}`),
  ""
].join("\n"), "utf8");

log(`Backups: ${rel(backupRoot)}`);
log(`Report: ${rel(reportFile)}`);
run("node", ["--check", rel(fastBuildFile)], "Syntaxprüfung Fast-Build-Runner");
run("node", ["--check", rel(configFile)], "Syntaxprüfung Astro-Konfiguration");

let duration = null;
if (!SKIP_BUILD) {
  duration = run("npm", ["--workspace", "apps/pfotentechnik", "run", "build:fast"], "Fast-Build");
}

log("Patch erfolgreich abgeschlossen.");
log("Der normale Release-Build bleibt unverändert verfügbar.");
if (duration !== null) log(`Gemessener Fast-Build: ${(duration / 1000).toFixed(2)} s`);
log("Der größte Effekt zeigt sich ab dem zweiten Build mit warmem Cache.");
