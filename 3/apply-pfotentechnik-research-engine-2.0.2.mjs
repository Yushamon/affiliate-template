#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-research-engine-2.0.2";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runTests = !args.has("--no-tests");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 14; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const IMPORTER = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "scripts",
  "seo",
  "import-research.mjs"
);
const TEST = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "test",
  "seo-research-check-command-2.0.2.test.mjs"
);

if (!fs.existsSync(IMPORTER)) {
  throw new Error("import-research.mjs nicht gefunden.");
}

const original = fs.readFileSync(IMPORTER, "utf8");

if (!original.includes("normalizeResearchStore")) {
  throw new Error("Erwartete Research-Importer-Architektur wurde nicht erkannt.");
}

const next = `import fs from "node:fs";
import path from "node:path";
import { normalizeResearchStore } from "../../src/lib/seo/research/schema.ts";

const APP = path.resolve(import.meta.dirname, "../..");
const STORE = path.join(APP, "research", "research.json");
const args = process.argv.slice(2);
const input = args.find((argument) => !argument.startsWith("--"));
const check = args.includes("--check");

const resolveInputFile = () => {
  if (input) return path.resolve(process.cwd(), input);
  if (check) return STORE;
  return null;
};

const file = resolveInputFile();

if (!file) {
  console.error(
    "Nutzung: npm --workspace apps/pfotentechnik run research:import -- ./research-import.json"
  );
  process.exit(1);
}

if (!fs.existsSync(file)) {
  console.error(
    check && file === STORE
      ? \`Research-Store fehlt: \${STORE}\`
      : \`Importdatei fehlt: \${file}\`
  );
  process.exit(1);
}

try {
  const normalized = normalizeResearchStore(
    JSON.parse(fs.readFileSync(file, "utf8"))
  );

  if (check) {
    const label = file === STORE ? "Research-Store" : "Research-Import";
    console.log(\`\${label} gültig: \${normalized.items.length} Einträge.\`);
    process.exit(0);
  }

  const previous = fs.existsSync(STORE)
    ? JSON.parse(fs.readFileSync(STORE, "utf8"))
    : { items: [] };

  const byId = new Map(
    (Array.isArray(previous.items) ? previous.items : []).map((item) => [
      item.id,
      item
    ])
  );

  const merged = {
    ...normalized,
    updatedAt: new Date().toISOString(),
    items: normalized.items.map((item) => {
      const old = byId.get(item.id);
      return old
        ? {
            ...item,
            discoveredAt: old.discoveredAt ?? item.discoveredAt,
            status: ["implemented", "rejected"].includes(old.status)
              ? old.status
              : item.status
          }
        : item;
    })
  };

  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(merged, null, 2) + "\\n");
  console.log(\`Research importiert: \${merged.items.length} Einträge.\`);
} catch (error) {
  console.error(
    \`Research-\${check ? "Prüfung" : "Import"} fehlgeschlagen: \${error instanceof Error ? error.message : String(error)}\`
  );
  process.exit(1);
}
`;

const alreadyCurrent = original === next;

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(
    alreadyCurrent
      ? `[${NAME}] Keine Änderung nötig.`
      : `[${NAME}] research:check kann sicher auf den bestehenden Store umgestellt werden.`
  );
  process.exit(0);
}

if (!alreadyCurrent) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);
  const backupFile = path.join(backupRoot, path.relative(ROOT, IMPORTER));
  fs.mkdirSync(path.dirname(backupFile), { recursive: true });
  fs.copyFileSync(IMPORTER, backupFile);
  fs.writeFileSync(IMPORTER, next, "utf8");
  console.log(`[${NAME}] Geändert: ${path.relative(ROOT, IMPORTER)}`);
  console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);
} else {
  console.log(`[${NAME}] Importer ist bereits aktuell.`);
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const IMPORTER = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "scripts",
  "seo",
  "import-research.mjs"
);

test("research:check validiert ohne Eingabedatei den bestehenden Store", () => {
  const source = fs.readFileSync(IMPORTER, "utf8");
  assert.match(source, /if \\(check\\) return STORE/);
  assert.match(source, /Research-Store/);
  assert.doesNotMatch(
    source,
    /if\\(!input\\).*Nutzung: npm --workspace apps\\/pfotentechnik run research:import/s
  );
});
`;

fs.writeFileSync(TEST, testSource, "utf8");
console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, TEST)}`);

if (runTests) {
  execFileSync(
    process.execPath,
    [
      "--test",
      "apps/pfotentechnik/test/seo-research-check-command-2.0.2.test.mjs",
      "apps/pfotentechnik/test/seo-research-engine-2.0.0.test.mjs",
      "apps/pfotentechnik/test/seo-research-engine.test.mjs"
    ],
    { cwd: ROOT, stdio: "inherit" }
  );

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(
    npm,
    ["--workspace", "apps/pfotentechnik", "run", "research:check"],
    { cwd: ROOT, stdio: "inherit" }
  );
}

console.log(`[${NAME}] Fertig.`);
