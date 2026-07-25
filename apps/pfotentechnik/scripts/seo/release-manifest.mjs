#!/usr/bin/env node
import path from "node:path";
import {
  APP_ROOT,
  collectReleaseManifest,
  writeReleaseManifest
} from "./release-url-utils.mjs";

const rawArgs = process.argv.slice(2);
const args = new Map(
  rawArgs
    .filter((arg) => arg.startsWith("--") && arg.includes("="))
    .map((arg) => {
      const [key, ...value] = arg.slice(2).split("=");
      return [key, value.join("=")];
    })
);

const flags = new Set(rawArgs.filter((arg) => !arg.includes("=")));

if (flags.has("--help")) {
  console.log(`PfotenTechnik Release-Manifest

Optionen:
  --base=<ref>       Basisrevision; Standard: SEO_RELEASE_BASE_REF oder HEAD~1
  --head=<ref>       Zielrevision; Standard: HEAD
  --output=<ordner>  Ausgabeordner; Standard: apps/pfotentechnik/.seo-release
  --json             Manifest zusätzlich vollständig auf stdout ausgeben
  --no-write         keine Dateien schreiben
`);
  process.exit(0);
}

const manifest = collectReleaseManifest({
  baseRef: args.get("base") || "",
  headRef: args.get("head") || "HEAD"
});

let written = null;
if (!flags.has("--no-write")) {
  const output = args.get("output")
    ? path.resolve(process.cwd(), args.get("output"))
    : path.join(APP_ROOT, ".seo-release");
  written = writeReleaseManifest(manifest, output);
}

console.log("PfotenTechnik SEO Release-Manifest");
console.log("=================================");
console.log(`Basis: ${manifest.baseRef || "nicht verfügbar"}`);
console.log(`Head: ${manifest.headRef}`);
console.log(`Dateiänderungen: ${manifest.changeCount}`);
console.log(`URLs: ${manifest.urlCount}`);
console.log(`Globaler Sitemap-Refresh: ${manifest.includeAllSitemapUrls ? "ja" : "nein"}`);

for (const entry of manifest.urls.slice(0, 30)) {
  console.log(`- ${entry.url} [${entry.status}]`);
}
if (manifest.urls.length > 30) {
  console.log(`- … und ${manifest.urls.length - 30} weitere`);
}

for (const warning of manifest.warnings) {
  console.warn(`WARNUNG: ${warning}`);
}
for (const error of manifest.errors) {
  console.error(`FEHLER: ${error}`);
}

if (written) {
  console.log(`JSON: ${written.latestJson}`);
  console.log(`Markdown: ${written.latestMarkdown}`);
}

if (flags.has("--json")) {
  console.log(JSON.stringify(manifest, null, 2));
}

if (manifest.errors.length) {
  process.exitCode = 1;
}
