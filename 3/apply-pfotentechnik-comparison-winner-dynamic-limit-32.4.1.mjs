#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-winner-dynamic-limit-32.4.1";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const skipBuild = process.argv.includes("--skip-build");

const candidates = [process.cwd(), path.resolve(SCRIPT_DIR, ".."), path.resolve(SCRIPT_DIR, "../..")];
const root = candidates.find((candidate) =>
  fs.existsSync(path.join(candidate, "apps/pfotentechnik")) &&
  fs.existsSync(path.join(candidate, "packages/affiliate-core"))
);
if (!root) throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);

const files = {
  shell: "packages/affiliate-core/src/components/comparison/ComparisonShell.astro",
  explorer: "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro",
  test: "apps/pfotentechnik/test/pfotentechnik-comparison-winner-dynamic-limit-32.4.1.test.mjs"
};

const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
let changed = 0;
let backupCreated = false;
const abs = (rel) => path.join(root, rel);

function backup(rel) {
  const src = abs(rel);
  if (!fs.existsSync(src)) return;
  const dst = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  backupCreated = true;
}

function writeIfChanged(rel, content) {
  const target = abs(rel);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (current === content) {
    console.log(`[${PATCH}] Unverändert: ${rel}`);
    return;
  }
  backup(rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, target);
  changed += 1;
  console.log(`[${PATCH}] Geschrieben: ${rel}`);
}

function replaceRequired(source, oldValue, newValue, label) {
  if (source.includes(newValue)) return source;
  if (!source.includes(oldValue)) throw new Error(`[${PATCH}] ${label}: Ausgangsblock fehlt.`);
  return source.replace(oldValue, newValue);
}

let shell = fs.readFileSync(abs(files.shell), "utf8");
shell = replaceRequired(
  shell,
  `const comparisonProducts = model.products.filter((product) => product.slug !== winner?.slug);`,
  `const comparisonProducts = model.products;`,
  "Top-Empfehlung aufnehmen"
);
writeIfChanged(files.shell, shell);

let explorer = fs.readFileSync(abs(files.explorer), "utf8");
explorer = replaceRequired(
  explorer,
  `const defaultSelection = products.slice(0, Math.min(3, products.length)).map((product) => product.slug);`,
  `const maximumSelection = Math.min(4, products.length);\nconst defaultSelection = products\n  .slice(0, Math.min(3, maximumSelection))\n  .map((product) => product.slug);`,
  "Auswahlmaximum vorbereiten"
);
explorer = replaceRequired(
  explorer,
  `  data-default-selection={JSON.stringify(defaultSelection)}`,
  `  data-default-selection={JSON.stringify(defaultSelection)}\n  data-max-selection={maximumSelection}`,
  "Auswahlmaximum übergeben"
);
explorer = replaceRequired(
  explorer,
  `<h2>Wähle bis zu vier Modelle</h2>`,
  `<h2>Wähle bis zu {maximumSelection} Modelle</h2>`,
  "Überschrift dynamisieren"
);
explorer = replaceRequired(
  explorer,
  `<span>von 4 gewählt</span>`,
  `<span>von {maximumSelection} gewählt</span>`,
  "Zähler dynamisieren"
);
explorer = replaceRequired(
  explorer,
  `    const MAX_SELECTION = 4;`,
  `    const MAX_SELECTION = Math.max(\n      1,\n      Math.min(4, Number(root.dataset.maxSelection ?? "4"))\n    );`,
  "Client-Limit dynamisieren"
);
writeIfChanged(files.explorer, explorer);

writeIfChanged(files.test, "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\n\nconst root = process.cwd();\nconst read = (relative) => fs.readFileSync(path.join(root, relative), \"utf8\");\n\nconst shell = read(\"packages/affiliate-core/src/components/comparison/ComparisonShell.astro\");\nconst explorer = read(\"packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro\");\n\ntest(\"Top-Empfehlung bleibt im Direktvergleich enthalten\", () => {\n  assert.match(shell, /const comparisonProducts = model\\.products;/);\n  assert.doesNotMatch(shell, /comparisonProducts = model\\.products\\.filter\\([\\s\\S]*winner/);\n});\n\ntest(\"Alternativenbereich schließt den Sieger weiterhin aus\", () => {\n  assert.match(shell, /const alternativeProducts = model\\.recommendationProducts\\.filter\\(\\(product\\) => product\\.slug !== winner\\?\\.slug\\);/);\n});\n\ntest(\"Auswahlmaximum entspricht höchstens vier vorhandenen Modellen\", () => {\n  assert.match(explorer, /const maximumSelection = Math\\.min\\(4, products\\.length\\);/);\n  assert.match(explorer, /data-max-selection=\\{maximumSelection\\}/);\n});\n\ntest(\"Überschrift und Zähler verwenden das dynamische Limit\", () => {\n  assert.match(explorer, /<h2>Wähle bis zu \\{maximumSelection\\} Modelle<\\/h2>/);\n  assert.match(explorer, /<span>von \\{maximumSelection\\} gewählt<\\/span>/);\n  assert.doesNotMatch(explorer, /von 4 gewählt/);\n  assert.doesNotMatch(explorer, /Wähle bis zu vier Modelle/);\n});\n\ntest(\"Client-Limit ist dynamisch\", () => {\n  assert.match(explorer, /Number\\(root\\.dataset\\.maxSelection \\?\\? \"4\"\\)/);\n  assert.doesNotMatch(explorer, /const MAX_SELECTION = 4;/);\n});\n\ntest(\"Standardauswahl bleibt auf maximal drei Modelle begrenzt\", () => {\n  assert.match(explorer, /slice\\(0, Math\\.min\\(3, maximumSelection\\)\\)/);\n});\n");

if (!backupCreated && fs.existsSync(backupRoot)) fs.rmSync(backupRoot, { recursive: true, force: true });

function run(command, args) {
  console.log(`[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`[${PATCH}] Kommando fehlgeschlagen (${result.status}).`);
}

run(process.execPath, ["--test", files.test]);

if (!skipBuild) run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);

console.log(`[${PATCH}] Fertig. ${changed} Datei(en) geändert.${skipBuild ? " Build übersprungen." : ""}`);
