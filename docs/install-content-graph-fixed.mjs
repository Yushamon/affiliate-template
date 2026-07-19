#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const appPkgPath = path.join(root, "apps/pfotentechnik/package.json");
const rootPkgPath = path.join(root, "package.json");

for (const file of [appPkgPath, rootPkgPath]) {
  if (!fs.existsSync(file)) {
    console.error(`Abbruch: Datei nicht gefunden: ${file}`);
    process.exit(1);
  }
}

const backups = [];
for (const file of [appPkgPath, rootPkgPath]) {
  const backup = `${file}.content-graph-preinstall.bak`;
  fs.copyFileSync(file, backup);
  backups.push([file, backup]);
}

function seed(pkgPath, scripts) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.scripts ??= {};
  Object.assign(pkg.scripts, scripts);
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

seed(appPkgPath, {
  "audit:seo:strict": "node scripts/seo-intelligence.mjs --strict"
});
seed(rootPkgPath, {
  "audit:seo:strict": "npm --workspace apps/pfotentechnik run audit:seo:strict"
});

const result = spawnSync(
  process.execPath,
  [path.join(path.dirname(new URL(import.meta.url).pathname), "original-install-content-graph.mjs")],
  { cwd: root, stdio: "inherit" }
);

if (result.status !== 0) {
  for (const [file, backup] of backups) {
    fs.copyFileSync(backup, file);
  }
  console.error("Content Graph Installation fehlgeschlagen; package.json wurde zurückgesetzt.");
  process.exit(result.status ?? 1);
}

for (const [, backup] of backups) {
  fs.unlinkSync(backup);
}

console.log("Content Graph 1.0 installiert.");
