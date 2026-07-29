#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-anchor-governance-and-release-gate-1.0.7";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const AUDIT = path.join(ROOT, "scripts", "audit-internal-links.mjs");
const REPORT = path.join(APP, "reports", "internal-linking", "internal-link-audit.json");
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const log = (message = "") => console.log(`[${NAME}] ${message}`.trimEnd());
const fail = (message) => {
  console.error(`\n[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};
const rel = (file) => path.relative(ROOT, file).replace(/\\/g, "/");

function read(file) {
  if (!fs.existsSync(file)) fail(`Erwartete Datei fehlt: ${rel(file)}`);
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const target = path.join(BACKUP_ROOT, rel(file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function run(command, args, options = {}) {
  log(`Ausführen: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      ...(options.env ?? {})
    }
  });

  if (result.error) fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  if (result.status !== 0 && !options.allowFailure) {
    fail(`Befehl fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`);
  }
  return result;
}

function printErrors() {
  if (!fs.existsSync(REPORT)) return;
  try {
    const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
    const errors = (report.findings ?? []).filter((item) => item.severity === "error");
    const counts = new Map();
    for (const item of errors) counts.set(item.code, (counts.get(item.code) ?? 0) + 1);

    console.error(`\n[${NAME}] Verbleibende Fehler: ${errors.length}`);
    for (const [code, count] of [...counts].sort((a, b) => b[1] - a[1])) {
      console.error(`- ${code}: ${count}`);
    }
    for (const item of errors.slice(0, 50)) {
      console.error(
        `- ${item.code}: ${item.anchor ?? item.sourceRoute ?? item.targetRoute ?? ""}` +
        `${item.targets?.length ? ` → ${item.targets.join(", ")}` : ""}`
      );
    }
  } catch (error) {
    console.error(`[${NAME}] Report konnte nicht gelesen werden: ${error.message}`);
  }
}

log("Vorprüfung");

for (const file of [
  path.join(ROOT, "package.json"),
  path.join(APP, "package.json"),
  AUDIT,
  path.join(APP, "dist", "sitemap-index.xml")
]) {
  if (!fs.existsSync(file)) fail(`Repository-/Build-Struktur unvollständig: ${rel(file)}`);
}

let source = read(AUDIT);

if (
  !source.includes('version: "3.0.1"') ||
  !source.includes("UNRESOLVED_ANCHOR_CONFLICT") ||
  !source.includes("exclusiveOwners")
) {
  fail("Der Source-Link-Audit entspricht nicht der erwarteten Version 3.0.1.");
}

const definitionsOld = `const definitions = docs.flatMap((doc) => doc.aliases.map((anchor) => ({
  id: \`\${doc.collection}:\${doc.slug}\`,
  anchor, normalizedAnchor: normalizeTaxonomyTerm(anchor), href: doc.route,
  group: doc.group, topics: doc.topics, exclusive: doc.exclusiveAnchors.some((item) => normalizeTaxonomyTerm(item) === normalizeTaxonomyTerm(anchor)),
  filePath: doc.filePath
})));`;

const definitionsNew = `const definitions = docs.flatMap((doc) => {
  const taxonomyAliasSet = new Set(
    LINK_TAXONOMY
      .filter((entry) => entry.href && normalizeTaxonomyPath(entry.href) === doc.route)
      .flatMap((entry) => entry.anchorAliases ?? [])
      .map(normalizeTaxonomyTerm)
  );
  const normalizedTitle = normalizeTaxonomyTerm(doc.title);

  return doc.aliases.map((anchor) => {
    const normalizedAnchor = normalizeTaxonomyTerm(anchor);
    return {
      id: \`\${doc.collection}:\${doc.slug}\`,
      anchor,
      normalizedAnchor,
      href: doc.route,
      group: doc.group,
      topics: doc.topics,
      exclusive: doc.exclusiveAnchors.some(
        (item) => normalizeTaxonomyTerm(item) === normalizedAnchor
      ),
      taxonomyOwned: taxonomyAliasSet.has(normalizedAnchor),
      exactTitle: normalizedTitle === normalizedAnchor,
      filePath: doc.filePath
    };
  });
});`;

if (!source.includes("taxonomyOwned: taxonomyAliasSet.has")) {
  if (!source.includes(definitionsOld)) {
    fail("Der Definitions-Codeanker wurde nicht gefunden.");
  }
  source = source.replace(definitionsOld, definitionsNew);
}

const conflictOld = `  const exclusiveOwners = owners.filter((owner) => owner.exclusive);
  if (exclusiveOwners.length === 1) {
    addFinding("info", "ANCHOR_CONFLICT_RESOLVED_BY_OWNER", \`„\${anchor}“ besitzt den eindeutigen Eigentümer \${exclusiveOwners[0].href}.\`, { anchor, targets: distinctTargets });
  } else {
    addFinding("error", "UNRESOLVED_ANCHOR_CONFLICT", \`„\${anchor}“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht.\`, { anchor, targets: distinctTargets, files: owners.map((owner) => owner.filePath) });
  }`;

const conflictNew = `  const exclusiveOwners = owners.filter((owner) => owner.exclusive);
  const taxonomyOwners = owners.filter((owner) => owner.taxonomyOwned);
  const exactTitleOwners = owners.filter((owner) => owner.exactTitle);

  const uniqueOwnerTarget = (candidates) => {
    const targets = [...new Set(candidates.map((item) => item.href))];
    return targets.length === 1 ? targets[0] : "";
  };

  const resolvedByExclusive = uniqueOwnerTarget(exclusiveOwners);
  const resolvedByTaxonomy = uniqueOwnerTarget(taxonomyOwners);
  const resolvedByExactTitle = uniqueOwnerTarget(exactTitleOwners);
  const resolvedTarget =
    resolvedByExclusive ||
    resolvedByTaxonomy ||
    resolvedByExactTitle;

  if (resolvedTarget) {
    const resolution =
      resolvedByExclusive
        ? "exclusive-anchor"
        : resolvedByTaxonomy
          ? "taxonomy-owner"
          : "exact-title-owner";

    addFinding(
      "info",
      "ANCHOR_CONFLICT_RESOLVED_BY_OWNER",
      \`„\${anchor}“ besitzt den eindeutigen Eigentümer \${resolvedTarget} (\${resolution}).\`,
      {
        anchor,
        owner: resolvedTarget,
        resolution,
        targets: distinctTargets
      }
    );
  } else {
    addFinding(
      "error",
      "UNRESOLVED_ANCHOR_CONFLICT",
      \`„\${anchor}“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht.\`,
      {
        anchor,
        targets: distinctTargets,
        files: owners.map((owner) => owner.filePath)
      }
    );
  }`;

if (!source.includes('resolution =') && !source.includes('"taxonomy-owner"')) {
  if (!source.includes(conflictOld)) {
    fail("Der Konfliktauflösungs-Codeanker wurde nicht gefunden.");
  }
  source = source.replace(conflictOld, conflictNew);
}

source = source.replace('version: "3.0.1"', 'version: "3.0.2"');

backup(AUDIT);
fs.writeFileSync(AUDIT, source, "utf8");
log(`Geändert: ${rel(AUDIT)}`);

run(process.execPath, ["--check", AUDIT]);

const audit = run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:internal-links:strict"],
  { allowFailure: true }
);

if (audit.status !== 0) {
  printErrors();
  fail(
    "Nach der hierarchischen Eigentümerauflösung bestehen weiterhin echte Konflikte. " +
    `Report: ${rel(REPORT)}`
  );
}

run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:internal-link-targets:strict"]
);

run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "seo:release:check"],
  { env: { PFOTENTECHNIK_FAST_BUILD: "0" } }
);

log("");
log("ABGESCHLOSSEN.");
log("Source-Link-Audit auf Version 3.0.2 aktualisiert.");
log("Anchor-Eigentümer werden hierarchisch aufgelöst:");
log("1. exclusiveAnchors");
log("2. zentrale LINK_TAXONOMY.anchorAliases");
log("3. eindeutiger exakter Seitentitel");
log("Nur danach verbleibende Mehrdeutigkeiten bleiben Strict-Fehler.");
log("Keine Content-Dateien, Anchor-Aliase oder Links wurden verändert.");
log(`Backups: ${rel(BACKUP_ROOT)}`);
log(`Report: ${rel(REPORT)}`);
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");
