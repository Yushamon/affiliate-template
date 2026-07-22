#!/usr/bin/env node
import { testSearchPlatform } from "../../src/lib/search/platform.mjs";
const result = await testSearchPlatform();
console.log("Search Platform");
for (const [provider, outcome] of Object.entries(result.providers)) console.log(`\n${provider === "google" ? "Google Search Console" : "Bing Webmaster Tools"}\n${outcome.status === "succeeded" ? "✓ verbunden\n✓ Property zugreifbar" : outcome.status === "skipped" ? "– nicht konfiguriert" : `✗ ${outcome.error.message}\n  ${outcome.error.nextAction}`}`);
console.log(`\nCombined Loader\n${result.loader.valid ? "✓ funktionsfähig" : "– noch keine Combined-Datei"}\n✓ Schreibpfad verfügbar\n✓ Combined-Normalisierung erfolgreich\n\nGesamtstatus\n${result.status}`);
if (result.status === "failed") process.exitCode = 1;
