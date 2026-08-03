#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-topical-authority-roadmap-prompts-hotfix-1.0.3";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runBuild = !args.has("--no-build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 14; i += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const PAGE = path.join(ROOT, "apps", "pfotentechnik", "src", "pages", "admin", "seo", "topical-authority.astro");
const TEST = path.join(ROOT, "apps", "pfotentechnik", "test", "topical-authority-roadmap-prompts-hotfix-1.0.3.test.mjs");

if (!fs.existsSync(PAGE)) throw new Error("topical-authority.astro nicht gefunden.");
const original = fs.readFileSync(PAGE, "utf8");

for (const marker of [
  "const roadmapOpportunities =",
  "buildTopicalAuthorityRoadmapPrompts",
  "ChatGPT-Roadmap kopieren",
  "Codex-Umsetzung kopieren",
]) {
  if (!original.includes(marker)) throw new Error(`Roadmap-Prompt-Stand fehlt: ${marker}`);
}

let next = original;

// 1. Datenquelle der Roadmap-Karten zwingend auf die angereicherten Objekte setzen.
next = next.replace(
  /\{data\.opportunities\.length\s*===\s*0\s*\?/g,
  "{roadmapOpportunities.length === 0 ?",
);
next = next.replace(
  /:\s*data\.opportunities\.map\(\(opportunity\)\s*=>/g,
  ": roadmapOpportunities.map((opportunity) =>",
);

// 2. Rendering zusätzlich defensiv machen. Ein unvollständiger Eintrag darf den Build nie abbrechen.
next = next.replaceAll(
  "data-copy-prompt={opportunity.prompts.chatgpt}",
  "data-copy-prompt={opportunity.prompts?.chatgpt ?? \"\"}",
);
next = next.replaceAll(
  "data-copy-prompt={opportunity.prompts.codex}",
  "data-copy-prompt={opportunity.prompts?.codex ?? \"\"}",
);

// 3. Angereicherte Roadmap muss tatsächlich Prompt-Paare enthalten.
if (!/const roadmapOpportunities\s*=\s*data\.opportunities\.map/.test(next)) {
  throw new Error("roadmapOpportunities wird nicht aus data.opportunities aufgebaut.");
}
if (!/roadmapOpportunities\.length\s*===\s*0/.test(next)) {
  throw new Error("Roadmap-Leerzustand verwendet noch nicht roadmapOpportunities.");
}
if (!/roadmapOpportunities\.map\(\(opportunity\)\s*=>/.test(next)) {
  throw new Error("Roadmap-Karten verwenden noch nicht roadmapOpportunities.");
}
if (/data\.opportunities\.map\(\(opportunity\)\s*=>/.test(next.slice(next.indexOf("Strategische Chancen")))) {
  throw new Error("Im Roadmap-Rendering ist noch eine rohe data.opportunities.map-Schleife aktiv.");
}
if (!next.includes('opportunity.prompts?.chatgpt ?? ""') || !next.includes('opportunity.prompts?.codex ?? ""')) {
  throw new Error("Defensive Prompt-Ausgabe wurde nicht vollständig gesetzt.");
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const FILE = path.join(ROOT, "apps", "pfotentechnik", "src", "pages", "admin", "seo", "topical-authority.astro");

test("Roadmap rendert ausschließlich angereicherte Opportunities", () => {
  const source = fs.readFileSync(FILE, "utf8");
  const roadmap = source.slice(source.indexOf("Strategische Chancen"));
  assert.match(roadmap, /roadmapOpportunities\\.length\\s*===\\s*0/);
  assert.match(roadmap, /roadmapOpportunities\\.map\\(\\(opportunity\\)\\s*=>/);
  assert.doesNotMatch(roadmap, /data\\.opportunities\\.map\\(\\(opportunity\\)\\s*=>/);
});

test("Fehlende Prompt-Paare können den Build nicht mehr abbrechen", () => {
  const source = fs.readFileSync(FILE, "utf8");
  assert.match(source, /opportunity\\.prompts\\?\\.chatgpt\\s*\\?\\?\\s*""/);
  assert.match(source, /opportunity\\.prompts\\?\\.codex\\s*\\?\\?\\s*""/);
});
`;

const changed = next !== original || !fs.existsSync(TEST) || fs.readFileSync(TEST, "utf8") !== testSource;

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(`[${NAME}] Änderungen erforderlich: ${changed ? "ja" : "nein"}`);
  process.exit(0);
}

if (next !== original) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(ROOT, ".patch-backups", `${NAME}-${stamp}`, path.relative(ROOT, PAGE));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(PAGE, backup);
  fs.writeFileSync(PAGE, next, "utf8");
  console.log(`[${NAME}] Geändert: ${path.relative(ROOT, PAGE)}`);
  console.log(`[${NAME}] Backup: ${path.relative(ROOT, path.dirname(path.dirname(path.dirname(path.dirname(path.dirname(backup))))))}`);
} else {
  console.log(`[${NAME}] Seite ist bereits aktuell.`);
}

fs.mkdirSync(path.dirname(TEST), { recursive: true });
fs.writeFileSync(TEST, testSource, "utf8");
console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, TEST)}`);

execFileSync(process.execPath, [
  "--test",
  "apps/pfotentechnik/test/topical-authority-roadmap-prompts-hotfix-1.0.3.test.mjs",
  "apps/pfotentechnik/test/topical-authority-roadmap-prompts-1.0.1.test.mjs",
  "apps/pfotentechnik/test/topical-authority-center.test.mjs",
], { cwd: ROOT, stdio: "inherit" });

const runNpm = (script) => {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/d", "/s", "/c", `npm --workspace apps/pfotentechnik run ${script}`], { cwd: ROOT, stdio: "inherit" });
  } else {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", script], { cwd: ROOT, stdio: "inherit" });
  }
};

runNpm("audit:topical-authority:strict");
if (runBuild) runNpm("build");

console.log(`[${NAME}] Fertig.`);
