import { copyFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { resolve } from "node:path";
import {
  CLIENT_FILE,
  CONFIG_FILE,
  ensureDirectories,
  writeJson,
} from "./config.mjs";
import { authorizeInteractive } from "./auth.mjs";
import { listSites } from "./client.mjs";

ensureDirectories();

const sourceArg = process.argv.find((value) => value.startsWith("--client="));
if (sourceArg) {
  const source = resolve(sourceArg.slice("--client=".length));
  copyFileSync(source, CLIENT_FILE);
  console.log(`OAuth-Client kopiert: ${CLIENT_FILE}`);
}

if (!existsSync(CLIENT_FILE)) {
  console.error("OAuth-Client fehlt.");
  console.error(`Lege die aus Google Cloud heruntergeladene Desktop-App-Datei hier ab:`);
  console.error(CLIENT_FILE);
  console.error("Alternativ:");
  console.error("npm run gsc:setup -- --client=/pfad/client_secret.json");
  process.exit(1);
}

await authorizeInteractive();
const result = await listSites();
const sites = (result.siteEntry || []).filter(
  (site) => site.permissionLevel !== "siteUnverifiedUser",
);

if (!sites.length) {
  throw new Error("Keine verifizierte Search-Console-Property gefunden.");
}

const rl = createInterface({ input, output });
console.log("\nVerfügbare Properties:");
sites.forEach((site, index) => {
  console.log(`${index + 1}. ${site.siteUrl} (${site.permissionLevel})`);
});
const answer = await rl.question(
  `Property auswählen [1-${sites.length}] (Standard 1): `,
);
rl.close();

const index = answer.trim() ? Number(answer.trim()) - 1 : 0;
if (!Number.isInteger(index) || !sites[index]) {
  throw new Error("Ungültige Auswahl.");
}

const selected = sites[index];
writeJson(CONFIG_FILE, {
  siteUrl: selected.siteUrl,
  permissionLevel: selected.permissionLevel,
  configuredAt: new Date().toISOString(),
});

console.log(`\nGSC eingerichtet: ${selected.siteUrl}`);
console.log("Verbindung prüfen mit: npm run gsc:test");
