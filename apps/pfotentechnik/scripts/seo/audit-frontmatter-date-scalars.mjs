#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..", "..");
const contentRoot = path.join(appRoot, "src", "content");
const strict = process.argv.includes("--strict");

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return /\\.mdx?$/i.test(entry.name) ? [full] : [];
});

const findings = [];

for (const file of walk(contentRoot)) {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---(?:\\r?\\n|$)/);
  if (!match) continue;

  const lines = match[1].split(/\\r?\\n/);
  lines.forEach((line, index) => {
    const m = line.match(/^\\s*(publishedAt|updatedAt):\\s*(.+?)\\s*$/);
    if (!m) return;

    const key = m[1];
    const raw = m[2].replace(/\\s+#.*$/, "").trim();
    if (!raw || raw.startsWith('"') || raw.startsWith("'")) return;

    findings.push({
      file: path.relative(appRoot, file),
      line: index + 2,
      key,
      value: raw,
      reason: "Datumsfelder müssen als YAML-String gequotet sein."
    });
  });
}

console.log(`Frontmatter Date Contract: ${findings.length} Fehler.`);
for (const finding of findings) {
  console.log(`ERROR ${finding.file}:${finding.line} ${finding.key}: ${finding.value} -> ${finding.reason}`);
}

if (strict && findings.length) process.exitCode = 1;
