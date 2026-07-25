#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  APP_ROOT,
  collectReleaseManifest,
  writeReleaseManifest
} from "./release-url-utils.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const rawArgs = process.argv.slice(2);
const flags = new Set(rawArgs.filter((arg) => !arg.includes("=")));
const values = new Map(
  rawArgs
    .filter((arg) => arg.startsWith("--") && arg.includes("="))
    .map((arg) => {
      const [key, ...value] = arg.slice(2).split("=");
      return [key, value.join("=")];
    })
);

const skipBuild = flags.has("--skip-build");
const outputDirectory = values.get("output")
  ? path.resolve(process.cwd(), values.get("output"))
  : path.join(APP_ROOT, ".seo-release");

fs.mkdirSync(outputDirectory, { recursive: true });

const node = process.execPath;
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const steps = [];

function runStep(name, command, args, options = {}) {
  const started = Date.now();
  console.log(`\n=== ${name} ===`);
  console.log(`> ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    cwd: options.cwd || APP_ROOT,
    encoding: "utf8",
    stdio: "inherit",
    env: process.env
  });

  const row = {
    name,
    command: [command, ...args].join(" "),
    optional: Boolean(options.optional),
    skipped: false,
    status: result.status,
    durationMs: Date.now() - started,
    ok: result.status === 0
  };
  steps.push(row);

  if (!row.ok && !row.optional) {
    throw new Error(`${name} fehlgeschlagen (Exit ${result.status}).`);
  }
  return row.ok;
}

function runNodeFile(name, relativePath, { optional = false } = {}) {
  const file = path.join(APP_ROOT, relativePath);
  if (!fs.existsSync(file)) {
    steps.push({
      name,
      command: `${node} ${relativePath}`,
      optional,
      skipped: true,
      status: null,
      durationMs: 0,
      ok: optional
    });

    if (optional) {
      console.warn(`ÜBERSPRUNGEN: ${name} – ${relativePath} fehlt.`);
      return true;
    }
    throw new Error(`${name}: Datei fehlt: ${relativePath}`);
  }

  return runStep(name, node, [file], { optional });
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  baseRef: values.get("base") || null,
  headRef: values.get("head") || "HEAD",
  skipBuild,
  ok: false,
  steps,
  manifest: null,
  error: null
};

try {
  if (!skipBuild) {
    runStep("Astro Build", npm, ["run", "build"]);
  }

  runNodeFile(
    "Technisches SEO Build-Audit",
    "scripts/seo/audit-week4-technical-seo.mjs"
  );

  runNodeFile(
    "Woche-2 Top-20 Audit",
    "scripts/seo/audit-week2-top20.mjs",
    { optional: true }
  );
  runNodeFile(
    "Woche-3 Authority Audit",
    "scripts/seo/audit-week3-authority-links.mjs",
    { optional: true }
  );
  runNodeFile(
    "Woche-5 Katzenbrunnen Audit",
    "scripts/seo/audit-week5-katzenbrunnen-serp.mjs",
    { optional: true }
  );
  runNodeFile(
    "Comparison Integrity",
    "scripts/comparison-platform/integrity.mjs",
    { optional: true }
  );

  console.log("\n=== Release-URL-Manifest ===");
  const manifest = collectReleaseManifest({
    baseRef: values.get("base") || "",
    headRef: values.get("head") || "HEAD"
  });
  const written = writeReleaseManifest(manifest, outputDirectory);

  report.manifest = {
    urlCount: manifest.urlCount,
    changeCount: manifest.changeCount,
    includeAllSitemapUrls: manifest.includeAllSitemapUrls,
    warnings: manifest.warnings,
    errors: manifest.errors,
    jsonPath: written.latestJson,
    markdownPath: written.latestMarkdown
  };

  for (const entry of manifest.urls.slice(0, 30)) {
    console.log(`- ${entry.url} [${entry.status}]`);
  }
  if (manifest.urls.length > 30) {
    console.log(`- … und ${manifest.urls.length - 30} weitere`);
  }
  for (const warning of manifest.warnings) {
    console.warn(`WARNUNG: ${warning}`);
  }
  if (manifest.errors.length) {
    throw new Error(manifest.errors.join("\n"));
  }

  report.ok = true;
} catch (error) {
  report.error = error instanceof Error ? error.message : String(error);
  console.error(`\nSEO-Release-Preflight fehlgeschlagen: ${report.error}`);
  process.exitCode = 1;
} finally {
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const latest = path.join(outputDirectory, "preflight-latest.json");
  const stamp = report.generatedAt
    .replace(/\.\d{3}Z$/, "Z")
    .replaceAll(":", "-");
  const historical = path.join(
    outputDirectory,
    `preflight-${stamp}.json`
  );

  fs.writeFileSync(latest, json, "utf8");
  fs.writeFileSync(historical, json, "utf8");

  console.log("\n=== Ergebnis ===");
  console.log(`Status: ${report.ok ? "ERFOLGREICH" : "FEHLER"}`);
  console.log(`Report: ${latest}`);
  if (report.manifest) {
    console.log(`Release-URLs: ${report.manifest.urlCount}`);
  }
}

if (report.ok) {
  console.log(
    "\nNach dem Deployment: npm run indexnow:status && npm run seo:release:indexnow"
  );
}
