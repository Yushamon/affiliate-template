#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const appDir = fs.existsSync(path.join(cwd, "apps/pfotentechnik")) ? path.join(cwd, "apps/pfotentechnik") : cwd;
const patchDir = path.dirname(new URL(import.meta.url).pathname);
const filesDir = path.join(patchDir, "files");

function install(relative) {
  const source = path.join(filesDir, relative);
  const target = path.join(appDir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) fs.copyFileSync(target, target + ".bak-seo-periods-3.0.0");
  fs.copyFileSync(source, target);
  console.log("installiert:", path.relative(cwd, target));
}

install("scripts/gsc/sync-ranges.mjs");
install("src/pages/admin/seo/cockpit.astro");

const appPackage = path.join(appDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(appPackage, "utf8"));
pkg.scripts ||= {};
pkg.scripts["gsc:sync:ranges"] = "node scripts/gsc/sync-ranges.mjs";
pkg.scripts["seo:cockpit"] = "npm run gsc:sync:ranges";
fs.writeFileSync(appPackage, JSON.stringify(pkg, null, 2) + "\n");

const rootPackage = path.join(cwd, "package.json");
if (rootPackage !== appPackage && fs.existsSync(rootPackage)) {
  const rootPkg = JSON.parse(fs.readFileSync(rootPackage, "utf8"));
  rootPkg.scripts ||= {};
  rootPkg.scripts["gsc:sync:ranges"] = "npm --workspace apps/pfotentechnik run gsc:sync:ranges";
  rootPkg.scripts["seo:cockpit"] = "npm --workspace apps/pfotentechnik run seo:cockpit";
  fs.writeFileSync(rootPackage, JSON.stringify(rootPkg, null, 2) + "\n");
}

console.log("\nSEO Cockpit Periods 3.0.0 installiert.");
console.log("Jetzt: npm run seo:cockpit");
