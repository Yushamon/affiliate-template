import { safeSearchConfig } from "../../config.mjs";
import { readSearchStatus } from "../../status-store.mjs";
import { setupGoogleSearch } from "./setup.mjs";
import { testGoogleSearch } from "./test.mjs";
import { syncGoogleSearch } from "./sync.mjs";
import { generateGoogleReport } from "./report.mjs";

export const googleSearchProvider = {
  id: "google",
  label: "Google Search Console",
  async getStatus() {
    const status = readSearchStatus().google;
    const config = safeSearchConfig().google;
    return {
      ...status,
      configured: config.clientConfigured,
      connected: status.connected && config.tokenPresent,
      health: !config.clientConfigured ? "not-configured" : !config.tokenPresent ? "needs-auth" : status.health,
      property: status.property || config.property,
    };
  },
  setup: setupGoogleSearch,
  test: testGoogleSearch,
  sync: syncGoogleSearch,
  report: generateGoogleReport,
};
