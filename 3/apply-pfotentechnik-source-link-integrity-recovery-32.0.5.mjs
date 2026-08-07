#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-source-link-integrity-recovery-32.0.5";
const PREVIOUS = "pfotentechnik-source-link-integrity-fix-32.0.4";

function findRepoRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

const root = findRepoRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const contentRoot = path.join(app, "src", "content");
const auditScript = path.join(root, "scripts", "audit-internal-links.mjs");
const brokenTest = path.join(app, "test", "source-link-integrity-fix-32.0.4.test.mjs");
const reportFile = path.join(app, "reports", "internal-linking", "internal-link-audit.json");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

function run(command, args, allowFailure = false) {
  console.log(`\n[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`[${PATCH}] Prüfung fehlgeschlagen: ${command} ${args.join(" ")}`);
  }
  return result.status ?? 1;
}

/*
 * 32.0.4 created a backup immediately before every content mutation.
 * Restore only those exact backups. This is safer than git checkout because
 * unrelated local content work must remain untouched.
 */
const suffix = `.${PREVIOUS}.bak`;
const backups = walk(contentRoot).filter((file) => file.endsWith(suffix));
const restored = [];

for (const backup of backups) {
  const target = backup.slice(0, -suffix.length);
  const backupSource = fs.readFileSync(backup, "utf8");
  const currentSource = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;

  if (currentSource !== backupSource) {
    fs.writeFileSync(target, backupSource, "utf8");
    restored.push(path.relative(root, target));
  }
}

if (fs.existsSync(brokenTest)) {
  fs.rmSync(brokenTest);
  console.log(`[${PATCH}] Entfernt: ${path.relative(root, brokenTest)}`);
}

console.log(`\n[${PATCH}] Aus 32.0.4-Backups wiederhergestellt: ${restored.length}`);
for (const file of restored) console.log(`- ${file}`);

if (!fs.existsSync(auditScript)) {
  throw new Error(`[${PATCH}] Audit-Skript fehlt: ${path.relative(root, auditScript)}`);
}

/*
 * The repository's canonical audit is the source of truth.
 * Do not mutate content based on a second, incompatible route model.
 */
run(process.execPath, [auditScript, "--strict"]);

if (!fs.existsSync(reportFile)) {
  throw new Error(`[${PATCH}] Internal-Link-Report fehlt nach Audit.`);
}

const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
const summary = report.summary ?? {};

console.log(`\n[${PATCH}] Kanonischer Audit nach Recovery:`);
console.log(`- Fehler: ${summary.errors ?? "?"}`);
console.log(`- Warnungen: ${summary.warnings ?? "?"}`);
console.log(`- strict-kritisch: ${summary.critical ?? "?"}`);

if ((summary.critical ?? 0) !== 0 || (summary.errors ?? 0) !== 0) {
  const criticalCodes = new Set([
    "TARGET_ROUTE_MISSING",
    "LINK_TARGET_ROUTE_MISSING",
    "UNRESOLVED_ANCHOR_CONFLICT",
    "BLOCKED_GENERIC_ANCHOR",
    "BLOCKED_ANCHOR_EFFECTIVE",
    "SELF_LINK",
    "WRONG_CLUSTER_TARGET_HIGH_CONFIDENCE",
    "SEMANTIC_ANCHOR_EXPANSION_PRESENT"
  ]);

  const critical = (report.findings ?? []).filter(
    (item) => item.severity === "error" && criticalCodes.has(item.code)
  );

  console.error(`\n[${PATCH}] Verbleibende echte Befunde:`);
  for (const item of critical) {
    console.error(`- ${item.code}: ${item.message}`);
    if (item.sourceRoute) console.error(`  Quelle: ${item.sourceRoute}`);
    if (item.targetRoute) console.error(`  Ziel: ${item.targetRoute}`);
    if (item.anchor) console.error(`  Anchor: ${item.anchor}`);
    if (Array.isArray(item.targets)) console.error(`  Kandidaten: ${item.targets.join(", ")}`);
  }
  throw new Error(`[${PATCH}] Der kanonische Strict-Audit ist noch nicht sauber.`);
}

console.log(`\n[${PATCH}] Recovery erfolgreich. Keine Source-Link-Mutation mehr erforderlich.`);
console.log(`[${PATCH}] Jetzt vollständigen Release-Check starten: npm run seo:release:check`);
