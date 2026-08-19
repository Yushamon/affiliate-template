#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-external-evidence-methodology-fix-32.7.4";
const root = process.cwd();
const productDir = path.join(root, "apps/pfotentechnik/src/content/products");
const target = path.join(productDir, "cat-mate-335-pet-fountain.md");
const allowed = new Set(["hands-on", "lab-test", "editorial-review", "unknown"]);

function fail(message) {
  console.error(`[${PATCH}] FEHLER: ${message}`);
  process.exit(1);
}
function log(message) {
  console.log(`[${PATCH}] ${message}`);
}

if (!fs.existsSync(target)) fail(`Datei fehlt: ${path.relative(root, target)}`);

const before = fs.readFileSync(target, "utf8");
let after = before;
const pattern = /^(\s*methodology:\s*)["']?long-term["']?\s*$/gm;

if (pattern.test(after)) {
  after = after.replace(pattern, '$1"hands-on"');
  log("cat-mate-335-pet-fountain: methodology long-term -> hands-on");
} else {
  log("cat-mate-335-pet-fountain: kein long-term-Wert mehr vorhanden.");
}

if (after !== before) {
  const tmp = `${target}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, after, "utf8");
  fs.renameSync(tmp, target);
}

const invalid = [];
for (const name of fs.readdirSync(productDir)) {
  if (!/\.mdx?$/i.test(name)) continue;
  const file = path.join(productDir, name);
  const source = fs.readFileSync(file, "utf8");
  const re = /^\s*methodology:\s*["']?([^"'\n#]+?)["']?\s*$/gm;
  let match;
  while ((match = re.exec(source))) {
    const value = match[1].trim();
    if (!allowed.has(value)) {
      const line = source.slice(0, match.index).split("\n").length;
      invalid.push(`${path.relative(root, file)}:${line} -> ${value}`);
    }
  }
}

if (invalid.length) {
  console.error("");
  console.error(`[${PATCH}] Weitere ungültige methodology-Werte gefunden:`);
  for (const item of invalid) console.error(`- ${item}`);
  process.exit(2);
}

console.log("");
log("Alle methodology-Werte entsprechen jetzt dem Collection-Schema.");
log("Keine .bak-Dateien angelegt.");
console.log("");
console.log("Jetzt prüfen:");
console.log("  npm --workspace apps/pfotentechnik run audit:product-evidence");
console.log("  npm --workspace apps/pfotentechnik run build");
