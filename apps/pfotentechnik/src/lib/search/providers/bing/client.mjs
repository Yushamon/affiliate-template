import { SearchError } from "../../errors.mjs";
import { loadBingConfig } from "./config.mjs";

const API_BASE = "https://ssl.bing.com/webmaster/api.svc/json/";
const METHODS = new Set(["GetUserSites", "GetQueryStats", "GetPageStats", "GetCrawlStats", "GetFeeds"]);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function bingError(status, body) {
  const rawCode = String(body?.ErrorCode || body?.d?.ErrorCode || body?.error?.code || "");
  if (status === 401 || rawCode.match(/auth|key|unauthorized/i)) return new SearchError("BING_AUTH_FAILED");
  if (status === 403 || rawCode.match(/access|denied/i)) return new SearchError("BING_ACCESS_DENIED");
  if (status === 404) return new SearchError("BING_SITE_NOT_FOUND");
  if (status === 429) return new SearchError("BING_RATE_LIMITED", { retryable: true });
  if (status >= 500) return new SearchError("BING_API_UNAVAILABLE", { retryable: true });
  return new SearchError("BING_INVALID_RESPONSE");
}

export function unwrapBingResponse(body) {
  if (!body || typeof body !== "object" || !("d" in body)) throw new SearchError("BING_INVALID_RESPONSE");
  if (body.d?.ErrorCode || body.ErrorCode) throw bingError(400, body);
  return body.d;
}

export function createBingClient({ fetchImpl = globalThis.fetch, config = loadBingConfig(), timeoutMs = 20_000, maxResponseBytes = 8_000_000 } = {}) {
  if (typeof fetchImpl !== "function") throw new SearchError("BING_API_UNAVAILABLE", { message: "Diese Node-Version stellt kein fetch bereit." });
  async function request(method, parameters = {}) {
    if (!METHODS.has(method)) throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: "Unbekannte Bing-API-Methode." });
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const url = new URL(method, API_BASE);
      for (const [key, value] of Object.entries(parameters)) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      url.searchParams.set("apikey", config.apiKey);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(url, { method: "GET", headers: { accept: "application/json", "user-agent": "PfotenTechnik-SearchPlatform/1.0" }, signal: controller.signal });
        const length = Number(response.headers?.get?.("content-length") || 0);
        if (length > maxResponseBytes) throw new SearchError("BING_INVALID_RESPONSE", { message: "Bing-Antwort überschreitet das sichere Größenlimit." });
        const text = await response.text();
        if (text.length > maxResponseBytes) throw new SearchError("BING_INVALID_RESPONSE", { message: "Bing-Antwort überschreitet das sichere Größenlimit." });
        let body;
        try { body = text ? JSON.parse(text) : null; } catch { throw new SearchError("BING_INVALID_RESPONSE"); }
        if (!response.ok) throw bingError(response.status, body);
        return unwrapBingResponse(body);
      } catch (error) {
        const normalized = error?.name === "AbortError" ? new SearchError("BING_TIMEOUT", { retryable: true }) : error instanceof SearchError ? error : new SearchError("BING_API_UNAVAILABLE", { retryable: true });
        if (!normalized.retryable || attempt === 3) throw normalized;
        await delay(350 * (2 ** attempt));
      } finally { clearTimeout(timer); }
    }
  }
  return {
    getUserSites: () => request("GetUserSites"),
    getQueryStats: (siteUrl = config.siteUrl) => request("GetQueryStats", { siteUrl }),
    getPageStats: (siteUrl = config.siteUrl) => request("GetPageStats", { siteUrl }),
    getCrawlStats: (siteUrl = config.siteUrl) => request("GetCrawlStats", { siteUrl }),
    getFeeds: (siteUrl = config.siteUrl) => request("GetFeeds", { siteUrl }),
  };
}
