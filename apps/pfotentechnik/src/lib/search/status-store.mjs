import { STATUS_FILE, atomicWriteJson, readJson } from "./config.mjs";
import { toPublicError } from "./errors.mjs";

const emptyProvider = (provider, label) => ({
  provider, label, health: "not-configured", connected: false, configured: false, property: null,
  lastAttemptAt: null, lastSuccessfulSyncAt: null, lastTestAt: null, lastReportAt: null,
  lastDurationMs: null, lastError: null, pagesCount: 0, queriesCount: 0,
});

const emptyCombined = () => ({
  status: "skipped", lastAttemptAt: null, lastSuccessfulSyncAt: null, lastReportAt: null,
  lastDurationMs: null, lastError: null, providerResults: { google: "skipped", bing: "skipped" },
  pagesCount: 0, queriesCount: 0, metrics: null,
});

export function readSearchStatus(file = STATUS_FILE) {
  const stored = readJson(file, false) || {};
  return {
    schemaVersion: 1,
    updatedAt: stored.updatedAt || null,
    google: { ...emptyProvider("google", "Google Search Console"), ...(stored.google || {}) },
    bing: { ...emptyProvider("bing", "Bing Webmaster Tools"), health: "not-configured", ...(stored.bing || {}) },
    combined: { ...emptyCombined(), ...(stored.combined || {}) },
  };
}

export function updateProviderStatus(provider, patch, file = STATUS_FILE) {
  const current = readSearchStatus(file);
  const updatedAt = new Date().toISOString();
  const next = { ...current, updatedAt, [provider]: { ...current[provider], ...patch } };
  atomicWriteJson(file, next);
  return next[provider];
}

export function recordProviderError(provider, error, patch = {}, file = STATUS_FILE) {
  return updateProviderStatus(provider, {
    lastAttemptAt: new Date().toISOString(),
    health: "degraded",
    lastError: toPublicError(error),
    ...patch,
  }, file);
}
