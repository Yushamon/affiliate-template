#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-source-route-discovery-33.1.0";
const log = (message) => console.log(`[${PATCH}] ${message}`);

function findRepoRoot(start = process.cwd()) {
  let current = path.resolve(start);
  for (let i = 0; i < 16; i += 1) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const repo = findRepoRoot();
const auditFile = path.join(repo, "scripts", "audit-internal-links.mjs");
const testFile = path.join(
  repo,
  "apps",
  "pfotentechnik",
  "test",
  "source-route-discovery-33.1.0.test.mjs"
);

if (!fs.existsSync(auditFile)) {
  throw new Error(`Erwartete Datei fehlt: ${path.relative(repo, auditFile)}`);
}

const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const normalize = (source) =>
  String(source).replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trimEnd() + "\n";

const originals = new Map([
  [auditFile, read(auditFile)],
  [testFile, fs.existsSync(testFile) ? read(testFile) : null],
]);

const backupRoot = path.join(
  repo,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

for (const [file, content] of originals) {
  if (content == null) continue;
  const target = path.join(backupRoot, path.relative(repo, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}
log(`Backup: ${path.relative(repo, backupRoot)}`);

const write = (file, source) => {
  const next = normalize(source);
  const current = fs.existsSync(file) ? read(file) : "";
  if (current === next) {
    log(`Bereits aktuell: ${path.relative(repo, file)}`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  log(`Geändert: ${path.relative(repo, file)}`);
};

const run = (command, args, label, cwd = repo) => {
  log(`Prüfe: ${label}`);
  const executable =
    process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  }
  log(`BESTANDEN: ${label}`);
};

try {
  let source = read(auditFile);

  if (!source.includes("const routeForSourcePage = (file) =>")) {
    const anchor = `const buildRouteSet = new Set(
  walkFiles(path.join(appRoot, "dist"))
    .filter((file) => file.endsWith(".html"))
    .map(routeForBuildFile)
    .filter(Boolean)
);

const routeSet = new Set([...contentRouteSet, ...buildRouteSet]);`;

    if (!source.includes(anchor)) {
      throw new Error(
        "Audit-Struktur weicht vom erwarteten main-Stand ab: RouteSet-Anker fehlt."
      );
    }

    const replacement = `const buildRouteSet = new Set(
  walkFiles(path.join(appRoot, "dist"))
    .filter((file) => file.endsWith(".html"))
    .map(routeForBuildFile)
    .filter(Boolean)
);

/**
 * Statische Astro-Seiten gehören zum gültigen Source-Routenvertrag und dürfen
 * nicht davon abhängen, ob dist vor dem Source-Link-Audit bereits frisch gebaut
 * wurde. Dynamische Routen ([slug], [...path]) werden hier bewusst ausgelassen,
 * weil ihre konkreten URLs aus Content bzw. Build stammen müssen.
 */
const routeForSourcePage = (file) => {
  const pagesRoot = path.join(appRoot, "src/pages");
  const relative = path.relative(pagesRoot, file).replace(/\\\\/g, "/");

  if (!/\\.(astro|md|mdx)$/i.test(relative)) return "";
  if (relative.split("/").some((segment) => segment.includes("[") || segment.includes("]"))) {
    return "";
  }

  const withoutExtension = relative.replace(/\\.(astro|md|mdx)$/i, "");
  if (withoutExtension === "index") return "/";

  const routePath = withoutExtension.endsWith("/index")
    ? withoutExtension.slice(0, -"/index".length)
    : withoutExtension;

  return normalizeTaxonomyPath(\`/\${routePath}/\`);
};

const sourcePageRouteSet = new Set(
  walkFiles(path.join(appRoot, "src/pages"))
    .map(routeForSourcePage)
    .filter(Boolean)
);

const routeSet = new Set([
  ...contentRouteSet,
  ...sourcePageRouteSet,
  ...buildRouteSet
]);`;

    source = source.replace(anchor, replacement);
  }

  write(auditFile, source);

  const testSource = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(app, "../..");
const auditPath = path.join(repo, "scripts", "audit-internal-links.mjs");
const audit = fs.readFileSync(auditPath, "utf8");

test("Source-Link-Audit erkennt statische src/pages-Routen ohne dist-Abhängigkeit", () => {
  assert.match(audit, /const routeForSourcePage = \\(file\\) =>/);
  assert.match(audit, /sourcePageRouteSet/);
  assert.match(audit, /\\.\\.\\.sourcePageRouteSet/);
});

test("dynamische Astro-Routen werden nicht pauschal als existierend gewertet", () => {
  assert.match(audit, /segment\\.includes\\("\\["\\)/);
  assert.match(audit, /segment\\.includes\\("\\]"\\)/);
});

test("statische Hub-Routen existieren im Source-Bestand", () => {
  for (const relative of [
    "src/pages/vergleiche/index.astro",
    "src/pages/wissen.astro",
    "src/pages/redaktion.astro"
  ]) {
    assert.ok(
      fs.existsSync(path.join(app, relative)),
      \`Erwartete statische Route fehlt: \${relative}\`
    );
  }
});
`;
  write(testFile, testSource);

  run("node", ["--check", auditFile], "Syntaxprüfung Source-Link-Audit");
  run("node", ["--check", testFile], "Syntaxprüfung Regressionstest");
  run("node", ["--test", testFile], "Source-Route-Regressionstest");

  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "audit:internal-links:strict"],
    "Interner Source-Link-Audit"
  );

  log("BESTANDEN: /vergleiche/, /wissen/ und /redaktion/ werden aus src/pages erkannt.");
  log("BESTANDEN: Der Source-Link-Audit hängt für statische Seiten nicht mehr von stale dist ab.");
  log("Abgeschlossen.");
} catch (error) {
  for (const [file, content] of originals) {
    if (content == null) {
      if (fs.existsSync(file)) fs.rmSync(file, { force: true });
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content, "utf8");
    }
  }
  console.error(
    `[${PATCH}] FEHLER: ${error instanceof Error ? error.message : String(error)}`
  );
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}
