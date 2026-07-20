#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(
  root,
  "apps/pfotentechnik/src/components/ProductTrustPanel.astro"
);
const backup = `${target}.before-trust-panel-fix-3.6.4`;

if (!fs.existsSync(backup)) {
  console.error("Kein Backup für Trust Panel Fix 3.6.4 gefunden.");
  process.exit(1);
}

fs.copyFileSync(backup, target);
console.log("Trust Panel Fix 3.6.4 wurde zurückgerollt.");
