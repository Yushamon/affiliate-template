import { DEFAULT_BING_SITE_URL } from "../../config.mjs";
import { SearchError } from "../../errors.mjs";

export function loadBingConfig(required = true) {
  const apiKey = String(process.env.BING_WEBMASTER_API_KEY || "").trim();
  const siteUrl = String(process.env.BING_WEBMASTER_SITE_URL || process.env.BING_SITE_URL || DEFAULT_BING_SITE_URL || "").trim();
  return validateBingConfig({ apiKey, siteUrl }, required);
}

export function validateBingConfig({ apiKey, siteUrl }, required = true) {
  const normalized = { apiKey: String(apiKey || "").trim(), siteUrl: String(siteUrl || "").trim() };
  if (!normalized.apiKey && required) throw new SearchError("BING_API_KEY_MISSING");
  if (!normalized.siteUrl && required) throw new SearchError("BING_SITE_URL_MISSING");
  return { ...normalized, configured: Boolean(normalized.apiKey && normalized.siteUrl) };
}

export function normalizeBingSiteIdentity(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = url.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${pathname}`;
  } catch { return ""; }
}

export function findConfiguredSite(sites, configuredUrl) {
  const identity = normalizeBingSiteIdentity(configuredUrl);
  return (sites || []).filter((site) => normalizeBingSiteIdentity(site.Url || site.url) === identity);
}
