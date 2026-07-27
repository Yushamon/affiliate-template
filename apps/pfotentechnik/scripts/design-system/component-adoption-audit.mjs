#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const auditDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(auditDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro", ".git"].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const files = [
  ...walk(path.join(appRoot, "src")),
  ...walk(path.join(repoRoot, "packages", "affiliate-core", "src")),
].filter((file) => /\.(astro|tsx?|jsx?)$/.test(file));

const findings = new Set();
const classRe = /\bclass\s*=\s*(["'])([\s\S]*?)\1/g;

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  let match;

  while ((match = classRe.exec(source))) {
    const raw = match[2];
    if (/[{}$`]/.test(raw)) continue;

    const classes = raw.trim().split(/\s+/).filter(Boolean);

    const hasButtonClass = classes.some((name) =>
      /(?:^|[-_])(button|btn)(?:$|[-_])/i.test(name)
    );
    const hasChipClass = classes.some((name) =>
      /(?:^|[-_])(chip|pill|tag)(?:$|[-_])/i.test(name)
    );
    const hasControlClass = classes.some((name) =>
      /(?:^|[-_])(input|select|textarea|control|field)(?:$|[-_])/i.test(name)
    );

    const relative = path.relative(repoRoot, file);

    if (hasButtonClass && !classes.includes("pt-button")) {
      findings.add(relative + ": Button ohne pt-button");
    }
    if (hasChipClass && !classes.includes("pt-chip")) {
      findings.add(relative + ": Chip ohne pt-chip");
    }
    if (hasControlClass && !classes.includes("pt-control")) {
      findings.add(relative + ": Control ohne pt-control");
    }
  }
}

if (findings.size) {
  console.error("Nicht adoptierte statische Komponenten gefunden:");
  console.error([...findings].slice(0, 200).join("\n"));
  process.exit(1);
}

console.log("Component-Adoption-Audit erfolgreich.");
