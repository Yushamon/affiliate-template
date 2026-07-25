#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const root = path.resolve(app, "../..");
const checks = [];

const normalize = (value) =>
  String(value).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
const read = (file) => normalize(fs.readFileSync(file, "utf8"));
const check = (name, ok, detail = "") =>
  checks.push({ name, ok, detail });

const files = {
  utils: path.join(app, "scripts/seo/release-url-utils.mjs"),
  manifest: path.join(app, "scripts/seo/release-manifest.mjs"),
  preflight: path.join(app, "scripts/seo/release-preflight.mjs"),
  indexnow: path.join(app, "scripts/submit-indexnow.mjs"),
  docs: path.join(app, "docs/seo-release-workflow.md"),
  appPackage: path.join(app, "package.json"),
  rootPackage: path.join(root, "package.json"),
  gitignore: path.join(root, ".gitignore")
};

for (const [label, file] of Object.entries(files)) {
  check(`${label}: Datei vorhanden`, fs.existsSync(file), file);
}

if (fs.existsSync(files.utils)) {
  const source = read(files.utils);
  check(
    "Comparisons-Markdown wird gemappt",
    source.includes("/src/content/comparisons/")
  );
  check(
    "Hersteller werden gemappt",
    source.includes("/src/content/manufacturers/")
  );
  check(
    "Gelöschte Inhalte werden aus Git gelesen",
    source.includes("git([\"show\"")
  );
  check(
    "Ungetrackte Dateien werden berücksichtigt",
    source.includes("ls-files") &&
      source.includes("--others") &&
      source.includes("--exclude-standard")
  );
  check(
    "Redirect-Quellen werden berücksichtigt",
    source.includes("redirectSource")
  );
  check(
    "Sitemap-Abgleich vorhanden",
    source.includes("missing-from-sitemap")
  );
}

if (fs.existsSync(files.indexnow)) {
  const source = read(files.indexnow);
  check(
    "IndexNow nutzt Release-Manifest",
    source.includes("collectReleaseManifest")
  );
  check(
    "Dry Run vor Key-Suche möglich",
    source.indexOf("if (dryRun)") < source.indexOf("const { key } = findKey()")
  );
  check(
    "URL-Datei unterstützt",
    source.includes('values.get("urls-file")')
  );
  check(
    "Basisrevision unterstützt",
    source.includes('values.get("base")')
  );
}

if (fs.existsSync(files.preflight)) {
  const source = read(files.preflight);
  check("Preflight baut standardmäßig", source.includes('"Astro Build"'));
  check(
    "Preflight führt Technical Audit aus",
    source.includes("audit-week4-technical-seo.mjs")
  );
  check(
    "Preflight schreibt Report",
    source.includes("preflight-latest.json")
  );
  check(
    "Preflight bleibt netzwerkfrei",
    !source.includes("fetch(")
  );
}

if (fs.existsSync(files.appPackage)) {
  const packageData = JSON.parse(read(files.appPackage));
  check(
    "App: seo:release:check",
    packageData.scripts?.["seo:release:check"] ===
      "node scripts/seo/release-preflight.mjs"
  );
  check(
    "App: seo:release:manifest",
    packageData.scripts?.["seo:release:manifest"] ===
      "node scripts/seo/release-manifest.mjs"
  );
  check(
    "App: seo:release:indexnow",
    packageData.scripts?.["seo:release:indexnow"] ===
      "node scripts/submit-indexnow.mjs --changed"
  );
}

if (fs.existsSync(files.rootPackage)) {
  const packageData = JSON.parse(read(files.rootPackage));
  check(
    "Root: seo:release:check",
    Boolean(packageData.scripts?.["seo:release:check"])
  );
  check(
    "Root: seo:release:indexnow",
    Boolean(packageData.scripts?.["seo:release:indexnow"])
  );
}

if (fs.existsSync(files.gitignore)) {
  const source = read(files.gitignore);
  check(
    "Lokale Release-Reports ignoriert",
    source.includes("apps/pfotentechnik/.seo-release/")
  );
}

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  console.log(
    `${entry.ok ? "OK" : "FEHLER"}  ${entry.name}${entry.detail ? ` (${entry.detail})` : ""}`
  );
}

if (failed.length) {
  console.error(`\n${failed.length} Release-Ops-Prüfung(en) fehlgeschlagen.`);
  process.exit(1);
}

console.log("\nWoche-6-Release-Ops-Audit erfolgreich.");
