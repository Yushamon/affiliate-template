#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { APP_ROOT, collectReleaseManifest, writeReleaseManifest } from "./release-url-utils.mjs";

const startedAt = new Date();
const args = new Set(process.argv.slice(2));
const production = !args.has("--diagnostic");
const skipBuild = args.has("--skip-build");
const outputDirectory = path.join(APP_ROOT, ".seo-release");
const markdownDirectory = path.join(APP_ROOT, "reports/seo-release");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const phases = [];
const errors = [];
const warnings = [];
const skipped = [];

fs.mkdirSync(outputDirectory, { recursive: true });
fs.mkdirSync(markdownDirectory, { recursive: true });

const appPackage = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "package.json"), "utf8"));
const scripts = appPackage.scripts ?? {};

const requiredScript = (name) => {
  if (!scripts[name]) throw new Error("Verpflichtendes npm-Skript fehlt: " + name);
  return name;
};

const run = (name, command, commandArgs, critical = true, env = {}) => {
  const index = phases.length + 1;
  console.log("\n[" + index + "] " + name);
  console.log("> " + command + " " + commandArgs.join(" "));
  const started = Date.now();
  const result = spawnSync(command, commandArgs, { cwd: APP_ROOT, stdio: "inherit", env: { ...process.env, ...env } });
  const phase = { name, command: [command, ...commandArgs].join(" "), critical, status: result.status, durationMs: Date.now() - started, ok: result.status === 0 };
  phases.push(phase);
  console.log("Status: " + (phase.ok ? "OK" : "FEHLER"));
  if (!phase.ok && critical) throw new Error(name + " fehlgeschlagen (Exit " + result.status + ").");
  if (!phase.ok) warnings.push(name + " fehlgeschlagen (optional).");
};

const npmScript = (name, script, critical = true) => run(name, npm, ["run", requiredScript(script)], critical);

const report = {
  schemaVersion: 2,
  status: "error",
  mode: production ? "production" : "diagnostic",
  startedAt: startedAt.toISOString(),
  finishedAt: null,
  durationMs: 0,
  phases,
  errors,
  warnings,
  skipped,
  build: { requested: !skipBuild, fastBuild: process.env.PFOTENTECHNIK_FAST_BUILD === "1" },
  sitemap: {},
  manifest: null,
  summary: {}
};

try {
  if (production && process.env.PFOTENTECHNIK_FAST_BUILD === "1") {
    throw new Error("PFOTENTECHNIK_FAST_BUILD=1 ist für einen Produktionsrelease unzulässig.");
  }
  if (production && skipBuild) {
    throw new Error("--skip-build ist im Produktionsmodus unzulässig. Nutze --diagnostic --skip-build.");
  }

  npmScript("Repository- und Umgebungsprüfung", "audit:repository:strict");
  npmScript("Content-Graph und Datenschema", "audit:content-graph");
  npmScript("Produktdaten-Audit", "audit:products:strict");
  npmScript("Vergleichsdaten-Audit", "comparison:data:audit:strict");
  npmScript("Vergleichsintegrität", "comparison:audit:strict");
  npmScript("Interner Source-Link-Audit", "audit:internal-links:strict");
  npmScript("Anchor-Governance-Audit", "audit:anchor-governance:strict");
  npmScript("Technischer SEO-Source-Audit", "audit:technical-seo:source");
  npmScript("Comparison-Snippet- und Schema-Audit", "audit:comparison-schema");

  if (!skipBuild) npmScript("Produktionsnaher Astro-Build", "build");

  npmScript("Gerenderte interne Linkziele", "audit:internal-link-targets:strict");
  npmScript("Gerenderter SEO-Build-Output", "audit:release-build-output:strict");
  npmScript("Technischer SEO-Build-Audit", "audit:technical-seo");

  console.log("\n[13] Release-Manifest");
  const manifest = collectReleaseManifest({ baseRef: "", headRef: "HEAD" });
  if (manifest.errors.length) throw new Error(manifest.errors.join("\n"));
  const written = writeReleaseManifest(manifest, outputDirectory);
  report.manifest = { urlCount: manifest.urlCount, warnings: manifest.warnings, errors: manifest.errors, jsonPath: written.latestJson, markdownPath: written.latestMarkdown };
  warnings.push(...manifest.warnings);
  phases.push({ name: "Release-Manifest", command: "internal", critical: true, status: 0, durationMs: 0, ok: true });

  const buildReportPath = path.join(markdownDirectory, "build-output-latest.json");
  if (fs.existsSync(buildReportPath)) report.sitemap = JSON.parse(fs.readFileSync(buildReportPath, "utf8")).summary ?? {};

  report.status = "ok";
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  errors.push(message);
  console.error("\nSEO-Release-Preflight fehlgeschlagen: " + message);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  report.durationMs = Date.now() - startedAt.getTime();
  report.summary = {
    phases: phases.length,
    passed: phases.filter((phase) => phase.ok).length,
    failed: phases.filter((phase) => !phase.ok).length,
    criticalFailed: phases.filter((phase) => phase.critical && !phase.ok).length,
    warnings: warnings.length,
    skipped: skipped.length
  };

  const json = JSON.stringify(report, null, 2) + "\n";
  fs.writeFileSync(path.join(outputDirectory, "preflight-latest.json"), json, "utf8");
  const markdown = [
    "# SEO Release Preflight",
    "",
    "- Status: " + report.status.toUpperCase(),
    "- Modus: " + report.mode,
    "- Dauer: " + report.durationMs + " ms",
    "- Phasen: " + report.summary.phases,
    "- Fehler: " + errors.length,
    "- Warnungen: " + warnings.length,
    "",
    "## Phasen",
    "",
    ...phases.map((phase) => "- " + (phase.ok ? "OK" : "FEHLER") + " **" + phase.name + "** – " + phase.command),
    "",
    "## Fehler",
    "",
    ...(errors.length ? errors.map((item) => "- " + item) : ["Keine."]),
    "",
    "## Warnungen",
    "",
    ...(warnings.length ? warnings.map((item) => "- " + item) : ["Keine."]),
    ""
  ].join("\n");
  fs.writeFileSync(path.join(markdownDirectory, "preflight-latest.md"), markdown, "utf8");
  console.log("\n=== Ergebnis ===");
  console.log("Status: " + (report.status === "ok" ? "ERFOLGREICH" : "FEHLER"));
  console.log("Report: " + path.join(outputDirectory, "preflight-latest.json"));
}
