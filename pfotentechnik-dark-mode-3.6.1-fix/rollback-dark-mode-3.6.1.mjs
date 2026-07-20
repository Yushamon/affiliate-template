#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(
  root,
  "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
);
const backup = `${target}.before-dark-mode-3.6.1`;

if (!fs.existsSync(backup)) {
  console.error("Kein Backup für Dark Mode 3.6.1 gefunden.");
  process.exit(1);
}

fs.copyFileSync(backup, target);
console.log("Dark Mode 3.6.1 wurde zurückgerollt.");
