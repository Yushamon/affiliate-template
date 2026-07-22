#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const file = fs.existsSync(path.join(cwd, "apps/pfotentechnik/scripts/gsc/sync.mjs"))
  ? path.join(cwd, "apps/pfotentechnik/scripts/gsc/sync.mjs")
  : path.join(cwd, "scripts/gsc/sync.mjs");

if (!fs.existsSync(file)) {
  console.error("sync.mjs wurde nicht gefunden.");
  process.exit(1);
}

const original = fs.readFileSync(file, "utf8");
const broken = `const recs = pages.flatMap(recommendations).sort((a,b) => ({high:0,medium:1,low:2}[a.priority] - ({high:0,medium:1,low:2}[b.priority])).slice(0,50);`;
const fixed = `const priorityRank = { high: 0, medium: 1, low: 2 };

const recs = pages
  .flatMap(recommendations)
  .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
  .slice(0, 50);`;

if (!original.includes(broken)) {
  console.error("Die erwartete fehlerhafte Zeile wurde nicht gefunden. Datei wurde nicht verändert.");
  process.exit(1);
}

fs.copyFileSync(file, file + ".bak-1.1.1");
fs.writeFileSync(file, original.replace(broken, fixed), "utf8");

console.log("Hotfix 1.1.1 installiert:");
console.log(path.relative(cwd, file));
console.log("");
console.log("Jetzt ausführen:");
console.log("npm run gsc:sync");
