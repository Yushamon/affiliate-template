#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-anchor-governance-and-release-gate-1.0.8";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const TAXONOMY = path.join(
  APP,
  "src",
  "domain",
  "content",
  "linkTaxonomy.data.mjs"
);
const AUDIT = path.join(ROOT, "scripts", "audit-internal-links.mjs");
const REPORT = path.join(
  APP,
  "reports",
  "internal-linking",
  "internal-link-audit.json"
);
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const OWNER_OVERRIDES = {
  "futtermenge katze": "/futtermenge-katze/",
  "hundetrinkbrunnen": "/trinkbrunnen-hund/",
  "katze trinkt viel": "/katze-trinkt-viel/",
  "katze trinkt zu wenig": "/wie-viel-wasser-braucht-eine-katze/",
  "petkit yumshare dual hopper 2": "/produkt/petkit-yumshare-dual-hopper/",
  "trinkbrunnen reinigen": "/katzentrinkbrunnen-richtig-reinigen/",
  "wasserbedarf hund": "/wie-viel-wasser-braucht-ein-hund/",
  "wie oft hund futtern": "/fuetterungszeiten-nach-alter/"
};

const log = (message = "") =>
  console.log(`[${NAME}] ${message}`.trimEnd());

const fail = (message) => {
  console.error(`\n[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

const rel = (file) =>
  path.relative(ROOT, file).replace(/\\/g, "/");

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`Erwartete Datei fehlt: ${rel(file)}`);
  }
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
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

  if (result.error) {
    fail(
      `${command} konnte nicht gestartet werden: ` +
      result.error.message
    );
  }

  if (result.status !== 0 && !options.allowFailure) {
    fail(
      `Befehl fehlgeschlagen (${result.status}): ` +
      `${command} ${args.join(" ")}`
    );
  }

  return result;
}

function printErrors() {
  if (!fs.existsSync(REPORT)) return;

  try {
    const report = JSON.parse(
      fs.readFileSync(REPORT, "utf8")
    );

    const errors = (report.findings ?? []).filter(
      (item) => item.severity === "error"
    );

    console.error(
      `\n[${NAME}] Verbleibende Fehler: ${errors.length}`
    );

    for (const item of errors.slice(0, 50)) {
      console.error(
        `- ${item.code}: ` +
        `${item.anchor ?? item.sourceRoute ?? item.targetRoute ?? ""}` +
        `${item.targets?.length
          ? ` → ${item.targets.join(", ")}`
          : ""}`
      );
    }
  } catch (error) {
    console.error(
      `[${NAME}] Report konnte nicht gelesen werden: ` +
      error.message
    );
  }
}

log("Vorprüfung");

for (const file of [
  path.join(ROOT, "package.json"),
  path.join(APP, "package.json"),
  TAXONOMY,
  AUDIT,
  path.join(APP, "dist", "sitemap-index.xml")
]) {
  if (!fs.existsSync(file)) {
    fail(`Repository-/Build-Struktur unvollständig: ${rel(file)}`);
  }
}

let taxonomySource = read(TAXONOMY);
let auditSource = read(AUDIT);

if (!taxonomySource.includes("export const LINK_TAXONOMY")) {
  fail("LINK_TAXONOMY wurde nicht gefunden.");
}

if (
  !auditSource.includes('version: "3.0.2"') ||
  !auditSource.includes("resolvedByTaxonomy") ||
  !auditSource.includes("UNRESOLVED_ANCHOR_CONFLICT")
) {
  fail(
    "Der Source-Link-Audit entspricht nicht der erwarteten Version 3.0.2."
  );
}

const ownerExport = `export const ANCHOR_OWNER_OVERRIDES = Object.freeze({
${Object.entries(OWNER_OVERRIDES)
  .map(([anchor, route]) => `  ${JSON.stringify(anchor)}: ${JSON.stringify(route)}`)
  .join(",\n")}
});`;

if (!taxonomySource.includes("export const ANCHOR_OWNER_OVERRIDES")) {
  const taxonomyAnchor = "export const LINK_TAXONOMY = [";
  const index = taxonomySource.indexOf(taxonomyAnchor);

  if (index < 0) {
    fail("Einfügeanker vor LINK_TAXONOMY wurde nicht gefunden.");
  }

  backup(TAXONOMY);
  taxonomySource =
    taxonomySource.slice(0, index) +
    ownerExport +
    "\n\n" +
    taxonomySource.slice(index);

  fs.writeFileSync(TAXONOMY, taxonomySource, "utf8");
  log(`Geändert: ${rel(TAXONOMY)}`);
} else {
  log("Explizite Anchor-Owner sind bereits vorhanden.");
}

if (!auditSource.includes("ANCHOR_OWNER_OVERRIDES,")) {
  const importAnchor = `  BLOCKED_ANCHOR_SET,
  LINK_TAXONOMY,`;

  if (!auditSource.includes(importAnchor)) {
    fail("Import-Anker im Source-Link-Audit wurde nicht gefunden.");
  }

  auditSource = auditSource.replace(
    importAnchor,
    `  ANCHOR_OWNER_OVERRIDES,
  BLOCKED_ANCHOR_SET,
  LINK_TAXONOMY,`
  );
}

const resolutionAnchor = `  const resolvedByExclusive = uniqueOwnerTarget(exclusiveOwners);
  const resolvedByTaxonomy = uniqueOwnerTarget(taxonomyOwners);
  const resolvedByExactTitle = uniqueOwnerTarget(exactTitleOwners);
  const resolvedTarget =
    resolvedByExclusive ||
    resolvedByTaxonomy ||
    resolvedByExactTitle;`;

const resolutionReplacement = `  const configuredOwner =
    ANCHOR_OWNER_OVERRIDES[anchor]
      ? normalizeTaxonomyPath(ANCHOR_OWNER_OVERRIDES[anchor])
      : "";

  const configuredOwnerIsCandidate =
    configuredOwner &&
    distinctTargets.includes(configuredOwner);

  const resolvedByExclusive = uniqueOwnerTarget(exclusiveOwners);
  const resolvedByTaxonomy = uniqueOwnerTarget(taxonomyOwners);
  const resolvedByExactTitle = uniqueOwnerTarget(exactTitleOwners);
  const resolvedTarget =
    (configuredOwnerIsCandidate ? configuredOwner : "") ||
    resolvedByExclusive ||
    resolvedByTaxonomy ||
    resolvedByExactTitle;`;

if (!auditSource.includes("configuredOwnerIsCandidate")) {
  if (!auditSource.includes(resolutionAnchor)) {
    fail("Owner-Auflösungsanker im Audit wurde nicht gefunden.");
  }

  auditSource = auditSource.replace(
    resolutionAnchor,
    resolutionReplacement
  );
}

const labelAnchor = `    const resolution =
      resolvedByExclusive
        ? "exclusive-anchor"
        : resolvedByTaxonomy
          ? "taxonomy-owner"
          : "exact-title-owner";`;

const labelReplacement = `    const resolution =
      configuredOwnerIsCandidate
        ? "configured-owner"
        : resolvedByExclusive
          ? "exclusive-anchor"
          : resolvedByTaxonomy
            ? "taxonomy-owner"
            : "exact-title-owner";`;

if (!auditSource.includes('? "configured-owner"')) {
  if (!auditSource.includes(labelAnchor)) {
    fail("Resolution-Label-Anker wurde nicht gefunden.");
  }

  auditSource = auditSource.replace(
    labelAnchor,
    labelReplacement
  );
}

const unresolvedAnchor = `  } else {
    addFinding(
      "error",
      "UNRESOLVED_ANCHOR_CONFLICT",`;

const unresolvedReplacement = `  } else {
    if (configuredOwner && !configuredOwnerIsCandidate) {
      addFinding(
        "error",
        "CONFIGURED_ANCHOR_OWNER_INVALID",
        \`„\${anchor}“ ist auf \${configuredOwner} konfiguriert, dieses Ziel gehört aber nicht zu den Konfliktkandidaten.\`,
        {
          anchor,
          owner: configuredOwner,
          targets: distinctTargets
        }
      );
      continue;
    }

    addFinding(
      "error",
      "UNRESOLVED_ANCHOR_CONFLICT",`;

if (!auditSource.includes("CONFIGURED_ANCHOR_OWNER_INVALID")) {
  if (!auditSource.includes(unresolvedAnchor)) {
    fail("Fehlerbehandlungsanker wurde nicht gefunden.");
  }

  auditSource = auditSource.replace(
    unresolvedAnchor,
    unresolvedReplacement
  );
}

auditSource = auditSource.replace(
  'version: "3.0.2"',
  'version: "3.0.3"'
);

backup(AUDIT);
fs.writeFileSync(AUDIT, auditSource, "utf8");
log(`Geändert: ${rel(AUDIT)}`);

run(process.execPath, ["--check", TAXONOMY]);
run(process.execPath, ["--check", AUDIT]);

const auditResult = run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "audit:internal-links:strict"
  ],
  { allowFailure: true }
);

if (auditResult.status !== 0) {
  printErrors();
  fail(
    "Nach der expliziten Owner-Zuordnung bestehen weiterhin echte Fehler. " +
    `Report: ${rel(REPORT)}`
  );
}

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "audit:internal-link-targets:strict"
  ]
);

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "seo:release:check"
  ],
  {
    env: {
      PFOTENTECHNIK_FAST_BUILD: "0"
    }
  }
);

log("");
log("ABGESCHLOSSEN.");
log("Source-Link-Audit auf Version 3.0.3 aktualisiert.");
log("Acht redaktionell mehrdeutige Anchor besitzen jetzt explizite Owner.");
for (const [anchor, route] of Object.entries(OWNER_OVERRIDES)) {
  log(`- ${anchor} → ${route}`);
}
log("Ungültige Owner-Konfigurationen bleiben release-blockierend.");
log("Keine Content-Dateien oder sichtbaren Links wurden verändert.");
log(`Backups: ${rel(BACKUP_ROOT)}`);
log(`Report: ${rel(REPORT)}`);
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");
