#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-design-system-recovery-11.0.1";
const args = new Set(process.argv.slice(2));
const noBuild = args.has("--no-build");
const noCommit = args.has("--no-commit");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  console.error(`[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

function findRepoRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = findRepoRoot(process.cwd()) || findRepoRoot(scriptDir);
if (!root) fail("Repository-Root konnte nicht gefunden werden.");

const app = path.join(root, "apps", "pfotentechnik");
const auditPath = path.join(app, "scripts", "design-system", "audit.mjs");
const tokenPath = path.join(app, "src", "styles", "pfotentechnik-design-tokens.css");
const layoutPath = path.join(app, "src", "layouts", "ProjectLayout.astro");
const packagePath = path.join(app, "package.json");

if (!fs.existsSync(tokenPath)) {
  fail(`Token-Datei fehlt tatsächlich: ${path.relative(root, tokenPath)}`);
}
if (!fs.existsSync(layoutPath)) {
  fail(`ProjectLayout fehlt: ${path.relative(root, layoutPath)}`);
}

const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const auditDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(auditDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const errors = [];

const tokenFile = path.join(appRoot, "src", "styles", "pfotentechnik-design-tokens.css");
const layoutFile = path.join(appRoot, "src", "layouts", "ProjectLayout.astro");

if (!fs.existsSync(tokenFile)) {
  errors.push("Token-Datei fehlt: " + path.relative(repoRoot, tokenFile));
}

if (!fs.existsSync(layoutFile)) {
  errors.push("ProjectLayout fehlt: " + path.relative(repoRoot, layoutFile));
} else {
  const layout = fs.readFileSync(layoutFile, "utf8");
  if (!layout.includes("pfotentechnik-design-tokens.css")) {
    errors.push("Token-Import fehlt in " + path.relative(repoRoot, layoutFile));
  }
}

for (const packageFile of [
  path.join(repoRoot, "package.json"),
  path.join(appRoot, "package.json"),
]) {
  try {
    JSON.parse(fs.readFileSync(packageFile, "utf8"));
  } catch (error) {
    errors.push(
      "Ungültiges JSON: " +
      path.relative(repoRoot, packageFile) +
      " – " +
      error.message
    );
  }
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".astro"].includes(entry.name)) return [];
    const item = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(item) : [item];
  });
}

for (const file of [
  ...walk(path.join(appRoot, "src")),
  ...walk(path.join(repoRoot, "packages", "affiliate-core", "src")),
].filter((file) => /\.(css|astro|js|mjs|ts|tsx|json)$/.test(file))) {
  const text = fs.readFileSync(file, "utf8");
  if (/^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(text)) {
    errors.push("Merge-Konfliktmarker: " + path.relative(repoRoot, file));
  }
}

if (errors.length) {
  console.error(errors.join("\\n"));
  process.exit(1);
}

console.log("Design-System-Audit erfolgreich.");
`;

fs.mkdirSync(path.dirname(auditPath), { recursive: true });
fs.writeFileSync(auditPath, auditSource);

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.scripts ||= {};
pkg.scripts["design-system:audit"] = "node scripts/design-system/audit.mjs";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");

log("Audit-Pfadauflösung repariert.");

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  return result.status === 0;
}

if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:audit"])) {
  fail("Design-System-Audit ist weiterhin fehlgeschlagen.");
}

if (!noBuild && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("Build fehlgeschlagen. Die Konsolidierungsänderungen bleiben zur Diagnose erhalten.");
}

if (!noCommit) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });
  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", "-A"])) fail("git add fehlgeschlagen.");
    if (
      !run("git", [
        "commit",
        "-m",
        "refactor(pfotentechnik): consolidate design system",
      ])
    ) {
      fail("Commit fehlgeschlagen.");
    }
    log("Konsolidierung lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Recovery erfolgreich abgeschlossen.");
