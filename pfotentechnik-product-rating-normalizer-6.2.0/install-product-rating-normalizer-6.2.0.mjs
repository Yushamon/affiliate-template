#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageDir = path.dirname(fileURLToPath(import.meta.url));

const targetScript = path.join(
  root,
  "apps",
  "pfotentechnik",
  "scripts",
  "normalize-product-ratings.mjs"
);
const rootPackage = path.join(root, "package.json");
const productsDir = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "content",
  "products"
);

for (const target of [rootPackage, productsDir]) {
  if (!fs.existsSync(target)) {
    console.error(`Erwarteter Repo-Pfad fehlt: ${target}`);
    process.exit(1);
  }
}

const packageJson = JSON.parse(fs.readFileSync(rootPackage, "utf8"));
const backupRoot = path.join(
  root,
  `.product-rating-normalizer-6.2.0-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

const backup = (file) => {
  if (!fs.existsSync(file)) return;
  const destination = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
};

backup(rootPackage);
backup(targetScript);

for (const name of fs.readdirSync(productsDir)) {
  if (name.endsWith(".md")) {
    backup(path.join(productsDir, name));
  }
}

fs.mkdirSync(path.dirname(targetScript), { recursive: true });
fs.copyFileSync(
  path.join(packageDir, "normalize-product-ratings.mjs"),
  targetScript
);

packageJson.scripts ??= {};
packageJson.scripts["ratings:fix"] =
  "node apps/pfotentechnik/scripts/normalize-product-ratings.mjs";
packageJson.scripts["ratings:check"] =
  "node apps/pfotentechnik/scripts/normalize-product-ratings.mjs --check";

fs.writeFileSync(
  rootPackage,
  JSON.stringify(packageJson, null, 2) + "\n",
  "utf8"
);

const result = spawnSync(
  process.execPath,
  [targetScript],
  {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit"
  }
);

if (result.status !== 0) {
  console.error("Normalisierung fehlgeschlagen. Backups wurden nicht automatisch zurückgespielt.");
  process.exit(result.status ?? 1);
}

const manifest = {
  installedAt: new Date().toISOString(),
  version: "6.2.0",
  backupRoot: path.relative(root, backupRoot),
  files: [
    path.relative(root, targetScript),
    "package.json",
    "apps/pfotentechnik/src/content/products/*.md",
    "apps/pfotentechnik/reports/product-rating-normalization-6.2.0.json"
  ],
  commands: {
    fix: "npm run ratings:fix",
    check: "npm run ratings:check"
  }
};

fs.writeFileSync(
  path.join(root, ".product-rating-normalizer-6.2.0.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8"
);

console.log("Product Rating Normalizer 6.2.0 installiert.");
console.log("Jetzt: npm run build:pfotentechnik");
