import path from "node:path";
import { createGoogleClient } from "./client.mjs";
import { DATA_DIR, DEFAULT_PROPERTY, loadGoogleConfig } from "../../config.mjs";
import { SearchError } from "../../errors.mjs";
import { searchLog } from "../../logging.mjs";
import { recordProviderError, updateProviderStatus } from "../../status-store.mjs";
import fs from "node:fs";

export async function testGoogleSearch() {
  const started = Date.now();
  try {
    const config = loadGoogleConfig(false);
    const property = config?.property || config?.siteUrl || DEFAULT_PROPERTY;
    const client = await createGoogleClient({ forceRefresh: true });
    const sites = await client.listSites();
    if (!sites.some((site) => site.siteUrl === property)) throw new SearchError("SEARCH_PROPERTY_ACCESS_DENIED");
    const end = new Date(); end.setUTCDate(end.getUTCDate() - 3);
    const start = new Date(end); start.setUTCDate(start.getUTCDate() - 6);
    await client.query(property, { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), rowLimit: 1, dimensions: ["date"], type: "web" });
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
    const now = new Date().toISOString();
    updateProviderStatus("google", { configured: true, connected: true, health: "connected", property, lastTestAt: now, lastAttemptAt: now, lastDurationMs: Date.now() - started, lastError: null });
    searchLog({ provider: "google", action: "test", status: "succeeded", durationMs: Date.now() - started });
    return { ok: true, property, tokenRefresh: true, dataAccess: true, writePath: path.relative(process.cwd(), DATA_DIR), message: "OAuth, Token-Refresh, API, Property und Datenzugriff sind funktionsfähig." };
  } catch (error) {
    recordProviderError("google", error, { lastTestAt: new Date().toISOString(), lastDurationMs: Date.now() - started });
    searchLog({ provider: "google", action: "test", status: "failed", code: error?.code, message: error?.message, durationMs: Date.now() - started });
    throw error;
  }
}
