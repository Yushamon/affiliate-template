import fs from "node:fs";
import { DATA_DIR } from "../../config.mjs";
import { SearchError } from "../../errors.mjs";
import { searchLog } from "../../logging.mjs";
import { recordProviderError, updateProviderStatus } from "../../status-store.mjs";
import { createBingClient } from "./client.mjs";
import { findConfiguredSite, loadBingConfig } from "./config.mjs";

export async function testBingSearch({ client: providedClient } = {}) {
  const started = Date.now();
  try {
    const config = loadBingConfig(); const client = providedClient || createBingClient({ config });
    const sites = await client.getUserSites(); const matches = findConfiguredSite(sites, config.siteUrl);
    if (matches.length !== 1) throw new SearchError("BING_SITE_NOT_FOUND");
    const site = matches[0]; if (site.IsVerified === false) throw new SearchError("BING_SITE_NOT_VERIFIED");
    await client.getQueryStats(site.Url || config.siteUrl);
    fs.mkdirSync(DATA_DIR, { recursive: true }); fs.accessSync(DATA_DIR, fs.constants.W_OK);
    const now = new Date().toISOString();
    updateProviderStatus("bing", { configured: true, connected: true, health: "connected", property: site.Url || config.siteUrl, siteUrl: site.Url || config.siteUrl, lastTestAt: now, lastAttemptAt: now, lastDurationMs: Date.now() - started, lastError: null });
    searchLog({ provider: "bing", action: "test", status: "succeeded", durationMs: Date.now() - started });
    return { ok: true, siteUrl: site.Url || config.siteUrl, apiKeyPresent: true, apiReachable: true, verified: true, dataAccess: true, message: "API-Key, Website, Verifizierung und Statistikzugriff sind funktionsfähig." };
  } catch (error) {
    recordProviderError("bing", error, { lastTestAt: new Date().toISOString(), lastDurationMs: Date.now() - started });
    searchLog({ provider: "bing", action: "test", status: "failed", durationMs: Date.now() - started, code: error?.code, message: error?.message });
    throw error;
  }
}
