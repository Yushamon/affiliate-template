import { google } from "googleapis";
import { getAuthorizedClient } from "./auth.mjs";
import { SearchError } from "../../errors.mjs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function mapApiError(error) {
  const status = Number(error?.response?.status || error?.code || 0);
  if (status === 401) return new SearchError("SEARCH_TOKEN_REFRESH_FAILED", { cause: error });
  if (status === 403) return new SearchError("SEARCH_PROPERTY_ACCESS_DENIED", { cause: error });
  if (status === 429) return new SearchError("SEARCH_RATE_LIMITED", { cause: error, retryable: true });
  return new SearchError("SEARCH_API_UNAVAILABLE", { cause: error, retryable: status >= 500 });
}

async function withRetry(operation, attempts = 4) {
  let last;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await operation(); } catch (error) {
      last = mapApiError(error);
      if (!last.retryable || attempt === attempts - 1) throw last;
      await sleep(400 * (2 ** attempt));
    }
  }
  throw last;
}

export async function createGoogleClient(options = {}) {
  const auth = await getAuthorizedClient(options);
  const api = google.searchconsole({ version: "v1", auth });
  return {
    async listSites() {
      const response = await withRetry(() => api.sites.list());
      return response.data.siteEntry || [];
    },
    async getSite(siteUrl) {
      const response = await withRetry(() => api.sites.get({ siteUrl }));
      return response.data;
    },
    async query(siteUrl, requestBody) {
      const response = await withRetry(() => api.searchanalytics.query({ siteUrl, requestBody }));
      return response.data || {};
    },
    async queryAll(siteUrl, requestBody, { pageSize = 25000, maxRows = 100000 } = {}) {
      const rows = [];
      let startRow = 0;
      let metadata = null;
      while (rows.length < maxRows) {
        const result = await this.query(siteUrl, { ...requestBody, rowLimit: Math.min(pageSize, maxRows - rows.length), startRow });
        const batch = result.rows || [];
        rows.push(...batch);
        metadata ||= result.metadata || null;
        if (batch.length < pageSize) break;
        startRow += batch.length;
      }
      return { rows, metadata };
    },
  };
}
