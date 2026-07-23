#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = process.cwd();
const app = path.join(repo, "apps", "pfotentechnik");
const payload = path.join(here, "payload");
const backup = path.join(repo, ".patch-backups", `product-standard-2-foundation-${Date.now()}`);

if (!fs.existsSync(path.join(app, "package.json"))) {
  console.error("Bitte im Root von Yushamon/affiliate-template ausführen.");
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

for (const source of walk(payload)) {
  const rel = path.relative(payload, source);
  const target = path.join(repo, rel);
  if (fs.existsSync(target)) {
    const save = path.join(backup, rel);
    fs.mkdirSync(path.dirname(save), { recursive: true });
    fs.copyFileSync(target, save);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`✓ ${rel}`);
}

const packagePath = path.join(app, "package.json");
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.scripts ||= {};
pkg.scripts["audit:product-standard-2"] = "node scripts/audit-product-standard-2.mjs";
pkg.scripts["audit:product-standard-2:strict"] = "node scripts/audit-product-standard-2.mjs --strict";
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log("\nFoundation installiert.");
console.log("Jetzt ProductStandard2 manuell in src/pages/produkt/[product].astro einfügen.");
console.log("Audit: npm --workspace apps/pfotentechnik run audit:product-standard-2");
