import { safeSearchConfig } from "../../config.mjs";
import { readSearchStatus } from "../../status-store.mjs";
import { SearchError } from "../../errors.mjs";
import { testBingSearch } from "./test.mjs";
import { syncBingSearch } from "./sync.mjs";
import { generateBingReport } from "./report.mjs";

export const bingSearchProvider = {
  id: "bing",
  label: "Bing Webmaster Tools",
  async getStatus() {
    const status = readSearchStatus().bing; const config = safeSearchConfig().bing;
    return { ...status, configured: config.configured, connected: status.connected && config.configured, health: !config.configured ? "not-configured" : status.health, property: status.property || config.siteUrl, siteUrl: status.siteUrl || config.siteUrl };
  },
  async setup() { throw new SearchError("BING_CONFIG_MISSING", { message: "Bing wird über BING_WEBMASTER_API_KEY in der lokalen .env konfiguriert." }); },
  test: testBingSearch,
  sync: syncBingSearch,
  report: generateBingReport,
};
