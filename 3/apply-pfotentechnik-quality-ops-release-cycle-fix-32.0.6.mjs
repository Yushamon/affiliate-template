#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-quality-ops-release-cycle-fix-32.0.6";

function findRepoRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

const root = findRepoRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const sourcesFile = path.join(app, "scripts", "quality-ops", "sources.mjs");
const pageFile = path.join(app, "src", "content", "pages", "haustierkameras.md");
const testFile = path.join(app, "test", "quality-ops-release-cycle-fix-32.0.6.test.mjs");

for (const file of [sourcesFile, pageFile]) {
  if (!fs.existsSync(file)) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, file)}`);
  }
}

function backup(file) {
  const bak = `${file}.${PATCH}.bak`;
  if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
}

function run(command, args, cwd = root) {
  console.log(`\n[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) {
    throw new Error(`[${PATCH}] Prüfung fehlgeschlagen: ${command} ${args.join(" ")}`);
  }
}

/*
 * Root cause:
 * quality-ops runs INSIDE seo:release:check, but sources.mjs also imports the
 * previous .seo-release/preflight-latest.json as an operational finding source.
 * The current preflight report is written only after quality-ops finishes.
 * Therefore a previous failed preflight can recursively block the next run.
 *
 * Keep the source in the registry for visibility/history, but exclude it from
 * operational findings. The parent release gate must never be its own input.
 */
let sources = fs.readFileSync(sourcesFile, "utf8");
const guard = '  if (source.id === "release-preflight") return false;\n';

if (!sources.includes(guard)) {
  const marker = '  const code = normalized(record.code || record.type || key);\n\n';
  if (!sources.includes(marker)) {
    throw new Error(`[${PATCH}] Marker in quality-ops/sources.mjs nicht gefunden.`);
  }
  backup(sourcesFile);
  sources = sources.replace(
    marker,
    marker +
      '  // Der Release-Preflight führt quality-ops selbst aus. Sein vorheriger Report\n' +
      '  // darf daher nicht als operativer Befund zurück in dasselbe Gate laufen.\n' +
      guard
  );
  fs.writeFileSync(sourcesFile, sources, "utf8");
}

/*
 * Fix the confirmed H1 warning on /haustierkameras/.
 * The page layout already renders the frontmatter title as the page H1.
 * Remove only the first Markdown H1 in the body when it repeats that title.
 */
let page = fs.readFileSync(pageFile, "utf8");
const fmMatch = page.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

if (!fmMatch) {
  throw new Error(`[${PATCH}] haustierkameras.md hat kein gültiges Frontmatter.`);
}

const titleMatch = fmMatch[1].match(/^title:\s*(?:"([^"]+)"|'([^']+)'|(.+))$/m);
const title = (titleMatch?.[1] || titleMatch?.[2] || titleMatch?.[3] || "").trim();

if (title) {
  const bodyStart = fmMatch[0].length;
  const body = page.slice(bodyStart);
  const h1Match = body.match(/^(\s*)#\s+(.+?)\s*\r?\n/m);

  if (h1Match && h1Match[2].trim() === title) {
    backup(pageFile);
    const before = body.slice(0, h1Match.index);
    const after = body.slice(h1Match.index + h1Match[0].length);
    page = page.slice(0, bodyStart) + before + after.replace(/^\r?\n/, "");
    fs.writeFileSync(pageFile, page, "utf8");
    console.log(`[${PATCH}] Doppelte Markdown-H1 aus haustierkameras.md entfernt.`);
  } else {
    console.log(`[${PATCH}] Keine identische Markdown-H1 in haustierkameras.md gefunden; keine Content-Mutation.`);
  }
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");

test("Release-Preflight kann Quality Operations nicht rekursiv blockieren", () => {
  const source = fs.readFileSync(path.join(app, "scripts", "quality-ops", "sources.mjs"), "utf8");
  assert.match(source, /source\\.id === "release-preflight"\\) return false/);
});

test("Haustierkameras enthält im Markdown-Body keine zweite identische H1", () => {
  const file = fs.readFileSync(path.join(app, "src", "content", "pages", "haustierkameras.md"), "utf8");
  const fm = file.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---(?:\\r?\\n|$)/);
  assert.ok(fm);
  const titleMatch = fm[1].match(/^title:\\s*(?:"([^"]+)"|'([^']+)'|(.+))$/m);
  const title = (titleMatch?.[1] || titleMatch?.[2] || titleMatch?.[3] || "").trim();
  const body = file.slice(fm[0].length);
  const duplicate = [...body.matchAll(/^#\\s+(.+?)\\s*$/gm)]
    .some((match) => match[1].trim() === title);
  assert.equal(duplicate, false);
});
`;

fs.writeFileSync(testFile, testSource, "utf8");

run(process.execPath, ["--check", sourcesFile]);
run(process.execPath, ["--check", testFile]);
run(process.execPath, ["--test", testFile]);

/*
 * First validate Quality Operations in isolation. This is the exact gate that
 * failed. It should no longer ingest the stale parent-preflight error.
 */
run("npm", ["--workspace", "apps/pfotentechnik", "run", "quality-ops:check"]);

console.log(`\n[${PATCH}] Quality-Operations-Zirkelschluss behoben.`);
console.log(`[${PATCH}] Doppelte H1 auf /haustierkameras/ bereinigt, sofern sie im lokalen Stand identisch vorhanden war.`);
console.log(`[${PATCH}] Jetzt vollständigen Release-Check starten: npm run seo:release:check`);
