import { getAccessToken } from "./auth.mjs";

async function request(url, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`GSC API ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

export function listSites() {
  return request("https://www.googleapis.com/webmasters/v3/sites");
}

export function getSite(siteUrl) {
  return request(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`,
  );
}

export function listSitemaps(siteUrl) {
  return request(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
  );
}

export function querySearchAnalytics(siteUrl, payload) {
  return request(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}
