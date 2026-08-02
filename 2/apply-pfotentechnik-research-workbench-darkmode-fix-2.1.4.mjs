#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-research-workbench-darkmode-fix-2.1.4";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runTests = !args.has("--no-tests");
const runBuild = args.has("--build");

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
const WORKBENCH = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "components",
  "admin",
  "ResearchWorkbench.astro"
);
const TEST = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "test",
  "seo-research-workbench-darkmode-2.1.4.test.mjs"
);

if (!fs.existsSync(WORKBENCH)) {
  throw new Error("ResearchWorkbench.astro nicht gefunden.");
}

const original = fs.readFileSync(WORKBENCH, "utf8");
if (!original.includes("growth-workbench")) {
  throw new Error("Research-Workbench-Architektur wurde nicht erkannt.");
}

const tokenBlock = `.growth-workbench{
  --growth-surface:var(--seo-surface,Canvas);
  --growth-surface-raised:var(--seo-surface-raised,color-mix(in srgb,Canvas 94%,CanvasText 6%));
  --growth-surface-subtle:var(--seo-surface-subtle,color-mix(in srgb,Canvas 90%,CanvasText 10%));
  --growth-border:var(--seo-border,color-mix(in srgb,CanvasText 22%,transparent));
  --growth-text:var(--seo-text,CanvasText);
  --growth-text-muted:var(--seo-text-muted,color-mix(in srgb,CanvasText 68%,transparent));
  --growth-code-bg:var(--seo-code-bg,color-mix(in srgb,Canvas 84%,CanvasText 16%));
  --growth-code-text:var(--seo-code-text,CanvasText);
  color:var(--growth-text);
  display:grid;
  gap:1rem
}`;

let next = original;

if (!next.includes("--growth-surface:")) {
  next = next.replace(
    /\.growth-workbench\{display:grid;gap:1rem\}/,
    tokenBlock
  );
}

const replacements = [
  [
    /background:var\(--seo-surface-subtle,#f4f6f8\)/g,
    "background:var(--growth-surface-subtle)"
  ],
  [
    /background:var\(--seo-surface,Canvas\)/g,
    "background:var(--growth-surface)"
  ],
  [
    /border:1px solid var\(--seo-border,#d9dee7\)/g,
    "border:1px solid var(--growth-border)"
  ],
  [
    /border-top:1px solid var\(--seo-border,#d9dee7\)/g,
    "border-top:1px solid var(--growth-border)"
  ],
  [
    /border-left:4px solid var\(--seo-border,#d9dee7\)/g,
    "border-left:4px solid var(--growth-border)"
  ],
  [
    /color:var\(--seo-text-muted,#5f6875\)/g,
    "color:var(--growth-text-muted)"
  ],
  [
    /border:1px dashed var\(--seo-border,#d9dee7\)/g,
    "border:1px dashed var(--growth-border)"
  ]
];

for (const [pattern, replacement] of replacements) {
  next = next.replace(pattern, replacement);
}

next = next
  .replace(
    /\.growth-actions code\{([^}]*)\}/,
    `.growth-actions code{$1;color:var(--growth-code-text);background:var(--growth-code-bg);border:1px solid var(--growth-border)}`
  )
  .replace(
    /\.growth-gaps\{([^}]*)\}/,
    `.growth-gaps{$1;color:var(--growth-text);background:var(--growth-surface-raised);border:1px solid var(--growth-border)}`
  )
  .replace(
    /\.growth-brief__content\{([^}]*)\}/,
    `.growth-brief__content{$1;color:var(--growth-text);background:var(--growth-surface-raised);border:1px solid var(--growth-border)}`
  )
  .replace(
    /\.growth-card\{([^}]*)\}/,
    `.growth-card{$1;color:var(--growth-text)}`
  );

if (!next.includes(".growth-workbench :where(h2,h3,strong,summary){color:var(--growth-text)}")) {
  next = next.replace(
    /<\/style>/,
    `.growth-workbench :where(h2,h3,strong,summary){color:var(--growth-text)}.growth-workbench :where(p,li,small,span,code){text-wrap:pretty}.growth-workbench a{color:var(--pt-color-link,var(--growth-text))}.growth-workbench code{color:var(--growth-code-text)}@media(prefers-color-scheme:dark){.growth-workbench{color-scheme:dark}}\n</style>`
  );
}

const requiredMarkers = [
  "--growth-surface:",
  "--growth-surface-raised:",
  "--growth-border:",
  "--growth-text:",
  "--growth-code-bg:",
  ".growth-gaps",
  "background:var(--growth-surface-raised)",
  ".growth-workbench :where(h2,h3,strong,summary)"
];

for (const marker of requiredMarkers) {
  if (!next.includes(marker)) {
    throw new Error(`Dark-Mode-Marker fehlt nach Patch: ${marker}`);
  }
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const FILE = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "components",
  "admin",
  "ResearchWorkbench.astro"
);

test("Research Workbench nutzt dark-mode-fähige Oberflächen-Tokens", () => {
  const source = fs.readFileSync(FILE, "utf8");
  assert.match(source, /--growth-surface:/);
  assert.match(source, /--growth-surface-raised:/);
  assert.match(source, /--growth-border:/);
  assert.match(source, /--growth-text:/);
  assert.match(source, /--growth-code-bg:/);
  assert.doesNotMatch(source, /background:var\\(--seo-surface-subtle,#f4f6f8\\)/);
});

test("Helle Inhaltsboxen bekommen passende Text- und Randfarben", () => {
  const source = fs.readFileSync(FILE, "utf8");
  assert.match(source, /\\.growth-gaps\\{[^}]*color:var\\(--growth-text\\)/);
  assert.match(source, /\\.growth-gaps\\{[^}]*background:var\\(--growth-surface-raised\\)/);
  assert.match(source, /\\.growth-brief__content\\{[^}]*background:var\\(--growth-surface-raised\\)/);
  assert.match(source, /\\.growth-actions code\\{[^}]*color:var\\(--growth-code-text\\)/);
});
`;

const changed = next !== original || !fs.existsSync(TEST) || fs.readFileSync(TEST, "utf8") !== testSource;

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(`[${NAME}] Änderungen erforderlich: ${changed ? "ja" : "nein"}`);
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);

if (next !== original) {
  const backup = path.join(backupRoot, path.relative(ROOT, WORKBENCH));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(WORKBENCH, backup);
  fs.writeFileSync(WORKBENCH, next, "utf8");
  console.log(`[${NAME}] Geändert: ${path.relative(ROOT, WORKBENCH)}`);
  console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);
} else {
  console.log(`[${NAME}] Workbench ist bereits aktuell.`);
}

fs.mkdirSync(path.dirname(TEST), { recursive: true });
fs.writeFileSync(TEST, testSource, "utf8");
console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, TEST)}`);

if (runTests) {
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--test",
      "apps/pfotentechnik/test/seo-research-workbench-darkmode-2.1.4.test.mjs",
      "apps/pfotentechnik/test/seo-research-briefing-engine-2.1.1.test.mjs"
    ],
    { cwd: ROOT, stdio: "inherit" }
  );
}

if (runBuild) {
  const command = process.platform === "win32"
    ? ["cmd.exe", ["/d", "/s", "/c", "npm --workspace apps/pfotentechnik run build"]]
    : ["npm", ["--workspace", "apps/pfotentechnik", "run", "build"]];

  execFileSync(command[0], command[1], { cwd: ROOT, stdio: "inherit" });
}

console.log(`[${NAME}] Fertig.`);
