#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(
  root,
  "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
);
const backup = `${target}.before-ui-polish-4.0`;

if (!fs.existsSync(backup)) {
  console.error("Kein Backup für UI Polish 4.0 gefunden.");
  process.exit(1);
}

fs.copyFileSync(backup, target);
console.log("UI Polish 4.0 wurde zurückgerollt.");
