#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root,"apps/pfotentechnik/src/styles/pfotentechnik-design-system.css");
const backup = `${target}.before-ui-fix-3.6.2`;

if (!fs.existsSync(backup)) {
  console.error("Kein Backup gefunden.");
  process.exit(1);
}
fs.copyFileSync(backup,target);
console.log("UI Fix 3.6.2 zurückgerollt.");
