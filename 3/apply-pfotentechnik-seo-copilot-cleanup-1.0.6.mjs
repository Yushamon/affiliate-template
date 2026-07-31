#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const VERSION = "1.0.6";
const BASE_COMMIT = "fe54eeaaf6382a01a24ee906678847e8a9102b60";
const BRANCH = "agent/seo-copilot-architecture-cleanup";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const payloadDir = path.join(scriptDir, "payload");
const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const keepOnFailure = args.has("--keep-on-failure");
const noCommit = args.has("--no-commit");
const noBranch = args.has("--no-branch");

const fail = (message) => {
  console.error(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] FEHLER: ${message}`);
  process.exit(1);
};

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
    timeout: options.timeout ?? 30 * 60_000,
    stdio: options.inherit ? "inherit" : "pipe",
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error,
  };
};

const git = (repoRoot, commandArgs, options = {}) =>
  run("git", commandArgs, { cwd: repoRoot, ...options });

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const findRepoRoot = () => {
  const result = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
  if (result.status !== 0) fail("Das aktuelle Verzeichnis ist kein Git-Repository.");
  const repoRoot = result.stdout.trim();
  if (!fs.existsSync(path.join(repoRoot, "apps", "pfotentechnik", "package.json"))) {
    fail("apps/pfotentechnik wurde im Repository nicht gefunden.");
  }
  return repoRoot;
};

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolute = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(absolute) : [absolute];
});

const relativePayloadFiles = walk(payloadDir)
  .map((file) => path.relative(payloadDir, file).replaceAll("\\", "/"))
  .sort();

const extraTargets = [
  "apps/pfotentechnik/src/lib/search/action-service.mjs",
  "apps/pfotentechnik/package.json",
  "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro",
  "apps/pfotentechnik/src/components/EditorialTransparency.astro",
];

const targetFiles = [...new Set([...relativePayloadFiles, ...extraTargets])];

const assertBaseline = (repoRoot) => {
  const exists = git(repoRoot, ["cat-file", "-e", `${BASE_COMMIT}^{commit}`]);
  if (exists.status !== 0 && !force) {
    fail(`Basis-Commit ${BASE_COMMIT} ist lokal nicht vorhanden. Zuerst den aktuellen main-Stand holen oder bewusst --force verwenden.`);
  }

  if (exists.status === 0) {
    const ancestor = git(repoRoot, ["merge-base", "--is-ancestor", BASE_COMMIT, "HEAD"]);
    if (ancestor.status !== 0 && !force) {
      fail(`HEAD basiert nicht auf ${BASE_COMMIT}. Zuerst den aktuellen main-Stand integrieren oder bewusst --force verwenden.`);
    }

    const changed = git(repoRoot, ["diff", "--name-only", `${BASE_COMMIT}..HEAD`, "--", ...targetFiles]);
    const changedFiles = changed.stdout.trim().split(/\r?\n/).filter(Boolean);
    if (changedFiles.length && !force) {
      fail(`Seit dem geprüften Basis-Commit wurden Zieldateien verändert:\n- ${changedFiles.join("\n- ")}\nInstaller neu erzeugen oder bewusst --force nach manueller Prüfung verwenden.`);
    }
  }

  const dirty = git(repoRoot, ["status", "--porcelain", "--", ...targetFiles]);
  const dirtyFiles = dirty.stdout.trim().split(/\r?\n/).filter(Boolean);
  if (dirtyFiles.length && !force) {
    fail(`Zieldateien enthalten lokale Änderungen:\n${dirtyFiles.join("\n")}\nÄnderungen zuerst sichern oder bewusst --force verwenden.`);
  }
};

const ensureBranch = (repoRoot) => {
  if (noBranch) return git(repoRoot, ["branch", "--show-current"]).stdout.trim();

  const current = git(repoRoot, ["branch", "--show-current"]).stdout.trim();
  if (!["main", "master"].includes(current)) return current;

  const exists = git(repoRoot, ["show-ref", "--verify", "--quiet", `refs/heads/${BRANCH}`]);
  if (exists.status === 0) {
    fail(`Branch ${BRANCH} existiert bereits. Bitte prüfen, löschen oder den Installer mit --no-branch auf dem gewünschten Branch ausführen.`);
  }

  const created = git(repoRoot, ["switch", "-c", BRANCH]);
  if (created.status !== 0) fail(created.stderr.trim() || `Branch ${BRANCH} konnte nicht angelegt werden.`);
  return BRANCH;
};

const backupTargets = (repoRoot) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot = path.join(
    repoRoot,
    ".patch-backups",
    `pfotentechnik-seo-copilot-cleanup-${VERSION}-${stamp}`,
  );
  fs.mkdirSync(backupRoot, { recursive: true });

  const manifest = targetFiles.map((relativePath) => {
    const source = path.join(repoRoot, relativePath);
    const existed = fs.existsSync(source);
    if (existed) {
      const destination = path.join(backupRoot, "files", relativePath);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
    }
    return { path: relativePath, existed };
  });

  fs.writeFileSync(
    path.join(backupRoot, "backup-manifest.json"),
    `${JSON.stringify({ version: VERSION, createdAt: new Date().toISOString(), files: manifest }, null, 2)}\n`,
  );
  return { backupRoot, manifest };
};

const restoreBackup = (repoRoot, backup) => {
  for (const entry of backup.manifest) {
    const target = path.join(repoRoot, entry.path);
    if (entry.existed) {
      const source = path.join(backup.backupRoot, "files", entry.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    } else if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }
  }
};

const atomicWrite = (target, content) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, content, "utf8");
  fs.renameSync(temporary, target);
};

const applyPayload = (repoRoot) => {
  for (const relativePath of relativePayloadFiles) {
    const source = path.join(payloadDir, relativePath);
    const target = path.join(repoRoot, relativePath);
    atomicWrite(target, fs.readFileSync(source, "utf8"));
    console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Geschrieben: ${relativePath}`);
  }
};

const patchActionService = (repoRoot) => {
  const relativePath = "apps/pfotentechnik/src/lib/search/action-service.mjs";
  const target = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(target, "utf8");
  const start = source.indexOf("async function runSafeQualityAutoFix(payload, progress) {");
  const end = source.indexOf("\n\nconst DEFAULT_HANDLERS", start);

  if (start < 0 || end < 0) {
    fail(`${relativePath} entspricht keinem geprüften Stand: runSafeQualityAutoFix wurde nicht gefunden.`);
  }

  const currentBlock = source.slice(start, end);
  if (!/comparison:fix:check/.test(currentBlock) || !/comparison:audit:strict/.test(currentBlock)) {
    fail(`${relativePath} enthält eine unbekannte Auto-Fix-Implementierung.`);
  }

  const replacement = `const QUALITY_AUTO_FIX_RUNNERS = Object.freeze({
  "comparison-fix-check": () =>
    runFixedNpm(["--workspace", "apps/pfotentechnik", "run", "comparison:fix:check"], REPO_ROOT),
  "comparison-fix": () =>
    runFixedNpm(["--workspace", "apps/pfotentechnik", "run", "comparison:fix"], REPO_ROOT),
  "comparison-audit-strict": () =>
    runFixedNpm(["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"], REPO_ROOT),
  "quality-ops-sync": () =>
    runFixedScript(path.join(APP_ROOT, "scripts", "quality-ops", "sync.mjs"), APP_ROOT),
});

async function runSafeQualityAutoFix(payload, progress) {
  const { resolveQualityFindingForAutoFix, markQualityFindingAutoFixed } = await qualityActions();
  const { finding, definition } = resolveQualityFindingForAutoFix(payload);
  const outputs = [];

  for (const step of definition.steps) {
    const runner = QUALITY_AUTO_FIX_RUNNERS[step.id];
    if (!runner) {
      throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", {
        message: \`Nicht erlaubter Auto-Fix-Schritt: \${step.id}\`,
      });
    }

    progress({
      step: step.phase,
      message: step.label,
      percent: step.percent,
    });

    const result = await runner();
    if (result?.output) outputs.push(result.output);
  }

  const updated = markQualityFindingAutoFixed(finding.id, {
    note: definition.successNote,
  });

  progress({
    step: "completed",
    message: "Auto-Fix wurde geprüft und protokolliert.",
    percent: 100,
  });

  return {
    ok: true,
    finding: updated,
    autoFixId: definition.id,
    output: outputs.join("\\n\\n"),
    reloadRequired: true,
  };
}`;

  atomicWrite(target, `${source.slice(0, start)}${replacement}${source.slice(end)}`);
  console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Gepatcht: ${relativePath}`);
};

const patchComparisonRoute = (repoRoot) => {
  const relativePath = "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro";
  const target = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(target, "utf8");
  const broken = 'findJourneyEntry(journeyEntries, "comparison", comparison.data.slug)';
  const fixed = 'findJourneyEntry(journeyEntries, "comparison", comparison.slug)';

  if (source.includes(fixed)) {
    console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Unverändert: ${relativePath} (Journey-Slug bereits korrigiert)`);
    return;
  }
  if (!source.includes(broken)) {
    fail(`${relativePath} entspricht keinem geprüften Stand: Journey-Slug-Zugriff wurde nicht gefunden.`);
  }

  atomicWrite(target, source.replace(broken, fixed));
  console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Gepatcht: ${relativePath}`);
};

const patchEditorialTransparency = (repoRoot) => {
  const relativePath = "apps/pfotentechnik/src/components/EditorialTransparency.astro";
  const target = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(target, "utf8");

  if (source.includes("const isMethodologyPage =")) {
    console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Unverändert: ${relativePath} (Selbstlink bereits verhindert)`);
    return;
  }

  const marker = 'const authorHref = author.url || "/redaktion/";';
  if (!source.includes(marker)) {
    fail(`${relativePath} entspricht keinem geprüften Stand: authorHref-Marker wurde nicht gefunden.`);
  }

  let updated = source.replace(
    marker,
    `${marker}\nconst isMethodologyPage = Astro.url.pathname === "/so-bewerten-wir/" || Astro.url.pathname === "/so-bewerten-wir";`,
  );

  const methodologyLink = '<a href="/so-bewerten-wir/">Methodik und Bewertungssystem</a>';
  const replacement = '{isMethodologyPage ? (\n            <span aria-current="page">Methodik und Bewertungssystem</span>\n          ) : (\n            <a href="/so-bewerten-wir/">Methodik und Bewertungssystem</a>\n          )}';
  const occurrences = updated.split(methodologyLink).length - 1;
  if (occurrences !== 2) {
    fail(`${relativePath} entspricht keinem geprüften Stand: erwartete zwei Methodik-Links, gefunden ${occurrences}.`);
  }
  updated = updated.replaceAll(methodologyLink, replacement);

  atomicWrite(target, updated);
  console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Gepatcht: ${relativePath}`);
};

const patchPackageJson = (repoRoot) => {
  const relativePath = "apps/pfotentechnik/package.json";
  const target = path.join(repoRoot, relativePath);
  const pkg = JSON.parse(fs.readFileSync(target, "utf8"));
  const architectureTest = "test/seo-copilot-architecture-cleanup.test.mjs";
  const current = String(pkg.scripts?.["test:seo-copilot"] || "").trim();

  if (!current) fail("package.json enthält kein test:seo-copilot-Skript.");
  if (!current.includes(architectureTest)) {
    pkg.scripts["test:seo-copilot"] = `${current} ${architectureTest}`;
  }

  atomicWrite(target, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Aktualisiert: ${relativePath}`);
};

const validations = [
  {
    name: "SEO-Copilot Tests",
    args: ["--workspace", "apps/pfotentechnik", "run", "test:seo-copilot"],
  },
  {
    name: "Design System",
    args: ["--workspace", "apps/pfotentechnik", "run", "design-system:check"],
  },
  {
    name: "Astro Build",
    args: ["run", "build:pfotentechnik"],
    timeout: 45 * 60_000,
  },
  {
    name: "Quality Operations Sync",
    args: ["--workspace", "apps/pfotentechnik", "run", "quality-ops:sync"],
  },
  {
    name: "Technical SEO",
    args: ["--workspace", "apps/pfotentechnik", "run", "audit:technical-seo"],
  },
  {
    name: "Internal Linking",
    args: ["--workspace", "apps/pfotentechnik", "run", "audit:internal-links:strict"],
  },
  {
    name: "Decision Journey",
    args: ["--workspace", "apps/pfotentechnik", "run", "audit:decision-journeys:strict"],
  },
  {
    name: "Content Quality",
    args: ["--workspace", "apps/pfotentechnik", "run", "audit:content-quality:strict"],
  },
  {
    name: "Comparison Governance",
    args: ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"],
  },
  {
    name: "SEO Release Diagnose",
    args: ["--workspace", "apps/pfotentechnik", "exec", "--", "node", "scripts/seo/release-preflight.mjs", "--diagnostic", "--skip-build"],
    blocking: false,
  },
];

const runValidations = (repoRoot) => {
  const results = [];

  for (const validation of validations) {
    console.log(`\n[pfotentechnik-seo-copilot-cleanup-${VERSION}] Prüfe: ${validation.name}`);
    const startedAt = Date.now();
    const result = run(npmCommand, validation.args, {
      cwd: repoRoot,
      timeout: validation.timeout,
      inherit: false,
    });
    const output = `${result.stdout}${result.stderr}`.trim();
    const passed = result.status === 0;
    const blocking = validation.blocking !== false;
    const status = passed ? "passed" : blocking ? "failed" : "warning";
    console.log(output);
    console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] ${passed ? "BESTANDEN" : blocking ? "FEHLER" : "WARNUNG"}: ${validation.name}`);

    results.push({
      name: validation.name,
      command: `${npmCommand} ${validation.args.join(" ")}`,
      status,
      exitCode: result.status,
      durationMs: Date.now() - startedAt,
      output: output.slice(-12_000),
      error: result.error?.message || null,
    });

    if (!passed && blocking) {
      console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Weitere Prüfungen werden übersprungen, um keine Folgefehler aus unvollständigem dist zu erzeugen.`);
      break;
    }

    if (!passed && !blocking) {
      console.warn(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Unabhängiger Release-Blocker erkannt. Die Architekturvalidierung bleibt gültig; der Befund wird im Bericht dokumentiert.`);
    }
  }

  return results;
};

const writeValidationReport = (repoRoot, results, branch) => {
  const report = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    baseCommit: BASE_COMMIT,
    branch,
    status: results.some((item) => item.status === "failed") ? "failed" : "passed",
    summary: {
      passed: results.filter((item) => item.status === "passed").length,
      warnings: results.filter((item) => item.status === "warning").length,
      failed: results.filter((item) => item.status === "failed").length,
      total: results.length,
    },
    results,
  };

  const relativePath = "apps/pfotentechnik/reports/seo-copilot/architecture-cleanup-validation-latest.json";
  const target = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  atomicWrite(target, `${JSON.stringify(report, null, 2)}\n`);
  return { report, relativePath };
};

const commitChanges = (repoRoot, reportPath) => {
  const paths = [...targetFiles, reportPath];
  const added = git(repoRoot, ["add", "--", ...paths]);
  if (added.status !== 0) fail(added.stderr.trim() || "Änderungen konnten nicht gestaged werden.");

  const staged = git(repoRoot, ["diff", "--cached", "--quiet"]);
  if (staged.status === 0) {
    console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Keine neuen Änderungen zu committen.`);
    return null;
  }

  const committed = git(repoRoot, [
    "commit",
    "-m",
    "refactor(pfotentechnik): consolidate SEO Copilot architecture",
  ]);
  if (committed.status !== 0) {
    console.warn(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Commit nicht erstellt: ${committed.stderr.trim()}`);
    return null;
  }
  return git(repoRoot, ["rev-parse", "HEAD"]).stdout.trim();
};

const main = () => {
  const repoRoot = findRepoRoot();
  assertBaseline(repoRoot);
  const branch = ensureBranch(repoRoot);
  const backup = backupTargets(repoRoot);

  console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Branch: ${branch || "(detached)"}`);
  console.log(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Backup: ${path.relative(repoRoot, backup.backupRoot)}`);

  try {
    applyPayload(repoRoot);
    patchActionService(repoRoot);
    patchComparisonRoute(repoRoot);
    patchEditorialTransparency(repoRoot);
    patchPackageJson(repoRoot);

    const results = runValidations(repoRoot);
    const { report, relativePath } = writeValidationReport(repoRoot, results, branch);

    if (report.status !== "passed") {
      const failureCopy = path.join(backup.backupRoot, "validation-failed.json");
      fs.copyFileSync(path.join(repoRoot, relativePath), failureCopy);

      if (!keepOnFailure) {
        restoreBackup(repoRoot, backup);
        fs.rmSync(path.join(repoRoot, relativePath), { force: true });
        console.error(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Validierung fehlgeschlagen. Änderungen wurden zurückgerollt.`);
      } else {
        console.error(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Validierung fehlgeschlagen. Stand bleibt wegen --keep-on-failure erhalten.`);
      }
      console.error(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] Protokoll: ${path.relative(repoRoot, failureCopy)}`);
      process.exitCode = 1;
      return;
    }

    const commit = noCommit ? null : commitChanges(repoRoot, relativePath);
    console.log(`\n[pfotentechnik-seo-copilot-cleanup-${VERSION}] Abgeschlossen.`);
    console.log(`Branch: ${branch}`);
    console.log(`Validierung: ${relativePath}`);
    console.log(`Backup: ${path.relative(repoRoot, backup.backupRoot)}`);
    if (commit) console.log(`Commit: ${commit}`);
    if (noCommit) console.log("Commit: übersprungen (--no-commit)");
  } catch (error) {
    if (!keepOnFailure) restoreBackup(repoRoot, backup);
    console.error(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] ${error instanceof Error ? error.stack || error.message : String(error)}`);
    console.error(`[pfotentechnik-seo-copilot-cleanup-${VERSION}] ${keepOnFailure ? "Stand bleibt erhalten." : "Änderungen wurden aus dem Backup wiederhergestellt."}`);
    process.exitCode = 1;
  }
};

main();
