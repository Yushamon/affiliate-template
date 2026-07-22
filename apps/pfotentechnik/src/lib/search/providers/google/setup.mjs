import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { CLIENT_FILE, DEFAULT_PROPERTY, GOOGLE_CONFIG_FILE, APP_ROOT, atomicWriteJson, ensureSearchDirectories, loadGoogleToken } from "../../config.mjs";
import { SearchError } from "../../errors.mjs";
import { searchLog } from "../../logging.mjs";
import { updateProviderStatus } from "../../status-store.mjs";
import { runInteractiveAuthorization } from "./auth.mjs";
import { createGoogleClient } from "./client.mjs";

export function installClientFile(source) {
  const resolved = path.resolve(source);
  if (!fs.existsSync(resolved)) throw new SearchError("SEARCH_CLIENT_CREDENTIALS_MISSING", { message: `OAuth-Client-Datei nicht gefunden: ${resolved}` });
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(resolved, "utf8")); } catch (cause) { throw new SearchError("SEARCH_CLIENT_CREDENTIALS_MISSING", { message: "OAuth-Client-Datei enthält kein gültiges JSON.", cause }); }
  const client = parsed.installed || parsed.web;
  if (!client?.client_id || !client?.client_secret) throw new SearchError("SEARCH_CLIENT_CREDENTIALS_MISSING", { message: "Erwartet wird ein Google OAuth-Client vom Typ Desktop-App." });
  ensureSearchDirectories();
  atomicWriteJson(CLIENT_FILE, parsed);
  return path.relative(APP_ROOT, CLIENT_FILE);
}

export async function chooseGoogleProperty({ interactive = true } = {}) {
  const client = await createGoogleClient();
  const sites = (await client.listSites()).filter((site) => site.permissionLevel !== "siteUnverifiedUser");
  if (!sites.length) throw new SearchError("SEARCH_PROPERTY_NOT_FOUND");
  let selected = sites.find((site) => site.siteUrl === DEFAULT_PROPERTY) || sites[0];
  if (interactive && !sites.some((site) => site.siteUrl === DEFAULT_PROPERTY) && sites.length > 1) {
    console.log("\nVerfügbare Search-Console-Properties:");
    sites.forEach((site, index) => console.log(`${index + 1}. ${site.siteUrl} (${site.permissionLevel})`));
    const rl = createInterface({ input, output });
    const answer = await rl.question(`Property auswählen [1-${sites.length}] (Standard 1): `);
    rl.close();
    const index = answer.trim() ? Number(answer.trim()) - 1 : 0;
    if (!Number.isInteger(index) || !sites[index]) throw new SearchError("SEARCH_PROPERTY_NOT_FOUND", { message: "Ungültige Property-Auswahl." });
    selected = sites[index];
  }
  const configuredAt = new Date().toISOString();
  atomicWriteJson(GOOGLE_CONFIG_FILE, { provider: "google", property: selected.siteUrl, permissionLevel: selected.permissionLevel, configuredAt });
  updateProviderStatus("google", { configured: true, connected: true, health: "connected", property: selected.siteUrl, lastAttemptAt: configuredAt, lastError: null });
  return selected;
}

export async function setupGoogleSearch({ clientFile, force = false, interactive = true } = {}) {
  const started = Date.now();
  try {
    if (clientFile) installClientFile(clientFile);
    if (!force && loadGoogleToken(false)?.refresh_token) {
      try {
        const selected = await chooseGoogleProperty({ interactive: false });
        return { connected: true, property: selected.siteUrl, message: "Vorhandenes Refresh-Token ist gültig; keine erneute Anmeldung erforderlich." };
      } catch {}
    }
    await runInteractiveAuthorization();
    const selected = await chooseGoogleProperty({ interactive });
    searchLog({ provider: "google", action: "setup", status: "succeeded", durationMs: Date.now() - started });
    return { connected: true, property: selected.siteUrl, message: "Google Search Console wurde erfolgreich verbunden." };
  } catch (error) {
    searchLog({ provider: "google", action: "setup", status: "failed", durationMs: Date.now() - started, code: error?.code, message: error?.message });
    throw error;
  }
}
