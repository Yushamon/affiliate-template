#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const auditDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(auditDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const errors = [];

const tokenFile = path.join(appRoot, "src", "styles", "pfotentechnik-design-tokens.css");
const layoutFile = path.join(appRoot, "src", "layouts", "ProjectLayout.astro");

if (!fs.existsSync(tokenFile)) {
  errors.push("Token-Datei fehlt: " + path.relative(repoRoot, tokenFile));
}

if (!fs.existsSync(layoutFile)) {
  errors.push("ProjectLayout fehlt: " + path.relative(repoRoot, layoutFile));
} else {
  const layout = fs.readFileSync(layoutFile, "utf8");
  if (!layout.includes("pfotentechnik-design-tokens.css")) {
    errors.push("Token-Import fehlt in " + path.relative(repoRoot, layoutFile));
  }
}

for (const packageFile of [
  path.join(repoRoot, "package.json"),
  path.join(appRoot, "package.json"),
]) {
  try {
    JSON.parse(fs.readFileSync(packageFile, "utf8"));
  } catch (error) {
    errors.push(
      "Ungültiges JSON: " +
      path.relative(repoRoot, packageFile) +
      " – " +
      error.message
    );
  }
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro"].includes(entry.name)) return [];
    const item = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(item) : [item];
  });
}

for (const file of [
  ...walk(path.join(appRoot, "src")),
  ...walk(path.join(repoRoot, "packages", "affiliate-core", "src")),
].filter((file) => /.(css|astro|js|mjs|ts|tsx|json)$/.test(file))) {
  const text = fs.readFileSync(file, "utf8");
  if (/^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(text)) {
    errors.push("Merge-Konfliktmarker: " + path.relative(repoRoot, file));
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Design-System-Audit erfolgreich.");
