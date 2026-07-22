import { readSearchStatus } from "../../status-store.mjs";
import { SearchError } from "../../errors.mjs";

const unavailable = () => { throw new SearchError("SEARCH_CONFIG_MISSING", { message: "Bing Webmaster Tools ist technisch vorbereitet, aber noch nicht konfiguriert.", nextAction: "Implementiere API-Key/OAuth und die Bing-Datenabfragen in einer späteren Ausbaustufe." }); };

export const bingSearchProvider = {
  id: "bing",
  label: "Bing Webmaster Tools",
  async getStatus() { return { ...readSearchStatus().bing, configured: false, connected: false, health: "not-configured" }; },
  setup: unavailable,
  test: unavailable,
  sync: unavailable,
  report: unavailable,
};
