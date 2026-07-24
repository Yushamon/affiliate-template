#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd(), "apps/pfotentechnik/src/content/comparisons");
const write = process.argv.includes("--write");
const files = (await fs.readdir(root)).filter((file) => /\.(md|mdx)$/.test(file));
let changed = 0;

for (const file of files) {
  const target = path.join(root, file);
  const source = await fs.readFile(target, "utf8");
  if (/^automaticRecommendations:/m.test(source)) continue;

  const marker = /^recommendation:\s*$/m;
  const match = source.match(marker);
  if (!match || match.index === undefined) continue;

  const insertion = [
    "automaticRecommendations:",
    "  enabled: true",
    ""
  ].join("\n");

  const next = source.slice(0, match.index) + insertion + source.slice(match.index);
  changed += 1;

  if (write) {
    await fs.writeFile(`${target}.comparison-framework-2.1.bak`, source, "utf8");
    await fs.writeFile(target, next, "utf8");
  } else {
    console.log(`[dry-run] ${file}`);
  }
}

console.log(`${changed} Vergleichsdateien ${write ? "migriert" : "würden migriert"}.`);
if (!write) console.log("Zum Schreiben --write ergänzen.");
