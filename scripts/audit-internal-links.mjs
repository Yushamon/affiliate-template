#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagesDir = path.join(root, "apps/pfotentechnik/src/content/pages");

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });

const files = walk(pagesDir).filter((file) => /\.(md|mdx)$/.test(file));
const missing = [];
const duplicateAnchors = new Map();

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) continue;

  const slug = frontmatter[1].match(/^slug:\s*["']?([^"'\n]+)["']?/m)?.[1];
  const linkingBlock = frontmatter[1].match(
    /^linking:\n([\s\S]*?)(?=^[a-zA-Z][\w-]*:|\Z)/m
  );

  if (!linkingBlock) {
    missing.push(slug ?? path.basename(file));
    continue;
  }

  const keywords = Array.from(
    linkingBlock[1].matchAll(/^\s+-\s+["']?(.+?)["']?\s*$/gm),
    (match) => match[1]
  );

  for (const keyword of keywords) {
    const normalized = keyword.toLocaleLowerCase("de-DE").trim();
    const owners = duplicateAnchors.get(normalized) ?? [];
    owners.push(slug ?? file);
    duplicateAnchors.set(normalized, owners);
  }
}

console.log(`Geprüfte Seiten: ${files.length}`);
console.log(`Ohne linking-Block: ${missing.length}`);
if (missing.length > 0) {
  console.log("\nSeiten ohne automatische Linkziele:");
  missing.forEach((slug) => console.log(`- ${slug}`));
}

const conflicts = [...duplicateAnchors.entries()].filter(
  ([, owners]) => new Set(owners).size > 1
);
console.log(`\nDoppelte Anchor-Begriffe: ${conflicts.length}`);
conflicts.forEach(([keyword, owners]) => {
  console.log(`- "${keyword}": ${[...new Set(owners)].join(", ")}`);
});
