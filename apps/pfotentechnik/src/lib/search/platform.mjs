import fs from "node:fs";
import { DATA_DIR, safeSearchConfig } from "./config.mjs";
import { buildCombinedDashboard, combineMetricValues, readProviderDashboard, writeCombinedDashboard } from "./combined.mjs";
import { SearchError, toPublicError } from "./errors.mjs";
import { withSearchLock } from "./locks.mjs";
import { searchLog } from "./logging.mjs";
import { getSearchProvider } from "./provider-registry.mjs";
import { readSearchDashboardCandidates } from "./dashboard-file-loader.mjs";
import { updateProviderStatus } from "./status-store.mjs";

export function classifyProviderResults(providerResults) {
  const configured = Object.values(providerResults).filter((value) => value !== "skipped");
  if (!configured.length) return "skipped";
  const successes = configured.filter((value) => value === "succeeded").length;
  const failures = configured.filter((value) => value === "failed").length;
  if (successes && failures) return "partial";
  if (successes === configured.length) return "succeeded";
  return "failed";
}

export function rebuildAdvisorSource() {
  const rangesFile = `${DATA_DIR}/search-dashboard-ranges.json`; const singleFile = `${DATA_DIR}/search-dashboard.json`;
  const loaded = readSearchDashboardCandidates({ rangesFile, singleFile });
  if (!loaded.root || loaded.source === "none") throw new SearchError("SEARCH_NO_DATA", { message: "Combined-Datenquelle für den SEO Advisor fehlt." });
  const rangeCount = Object.keys(loaded.root.ranges || {}).length;
  return { ok: true, provider: loaded.root.provider || "combined", rangeCount, generatedAt: loaded.root.generatedAt, message: "Combined-Datenquelle ist valide; der Advisor berechnet seine Empfehlungen beim nächsten Seitenaufruf neu." };
}

export async function syncSearchPlatform({ onProgress } = {}) {
  return withSearchLock("search-sync", async () => {
    const started = Date.now(); const lastAttemptAt = new Date().toISOString(); const config = safeSearchConfig();
    const configured = { google: config.google.clientConfigured && config.google.tokenPresent, bing: config.bing.configured };
    updateProviderStatus("combined", { lastAttemptAt, status: "running", lastError: null });
    if (!configured.google && !configured.bing) {
      const result = { ok: false, status: "skipped", providerResults: { google: "skipped", bing: "skipped" }, message: "Kein Search-Provider ist vollständig konfiguriert." };
      updateProviderStatus("combined", { status: "skipped", providerResults: result.providerResults, lastDurationMs: Date.now() - started }); return result;
    }
    const tasks = [];
    if (configured.google) tasks.push(["google", async () => { onProgress?.({ step: "google-sync", message: "Google Search Console wird synchronisiert." }); return getSearchProvider("google").sync({ onProgress }); }]);
    if (configured.bing) tasks.push(["bing", async () => { onProgress?.({ step: "bing-sync", message: "Bing Webmaster Tools wird synchronisiert." }); return getSearchProvider("bing").sync({ onProgress }); }]);
    const settled = await Promise.all(tasks.map(async ([provider, task]) => { try { return [provider, { status: "succeeded", result: await task() }]; } catch (error) { return [provider, { status: "failed", error: toPublicError(error) }]; } }));
    const outcomes = Object.fromEntries(settled); const providerResults = { google: configured.google ? outcomes.google?.status || "failed" : "skipped", bing: configured.bing ? outcomes.bing?.status || "failed" : "skipped" };
    const successes = Object.values(providerResults).filter((value) => value === "succeeded").length; const failures = Object.values(providerResults).filter((value) => value === "failed").length;
    if (!successes) {
      const errors = Object.fromEntries(Object.entries(outcomes).filter(([, value]) => value.error).map(([provider, value]) => [provider, value.error]));
      updateProviderStatus("combined", { status: "failed", providerResults, lastDurationMs: Date.now() - started, lastError: { code: "SEARCH_SYNC_FAILED", message: "Kein konfigurierter Provider konnte synchronisiert werden.", nextAction: "Prüfe die Provider-Fehler einzeln.", retryable: true }, providerErrors: errors });
      searchLog({ provider: "combined", action: "sync", status: "failed", durationMs: Date.now() - started });
      return { ok: false, status: "failed", providerResults, providerOutcomes: outcomes, combined: null };
    }
    onProgress?.({ step: "combine", message: "Google- und Bing-Daten werden normalisiert zusammengeführt." });
    const staleProviders = Object.entries(providerResults).filter(([, value]) => value === "failed").map(([provider]) => provider);
    const google = configured.google ? readProviderDashboard("google") : null; const bing = configured.bing ? readProviderDashboard("bing") : null;
    const combinedPayload = buildCombinedDashboard({ google, bing, staleProviders }); const combined = writeCombinedDashboard(combinedPayload);
    onProgress?.({ step: "advisor", message: "SEO-Advisor-Datenquelle wird validiert." }); const advisor = rebuildAdvisorSource();
    onProgress?.({ step: "dashboard", message: "Dashboard-Status wird aktualisiert." });
    const status = classifyProviderResults(providerResults); const durationMs = Date.now() - started;
    updateProviderStatus("combined", { status, lastAttemptAt, lastSuccessfulSyncAt: combinedPayload.generatedAt, lastDurationMs: durationMs, lastError: failures ? { code: "SEARCH_PARTIAL", message: "Mindestens ein Provider ist fehlgeschlagen; letzte gültige Daten bleiben als veraltet enthalten.", nextAction: "Prüfe den betroffenen Provider.", retryable: true } : null, providerResults, providerErrors: Object.fromEntries(Object.entries(outcomes).filter(([, value]) => value.error).map(([provider, value]) => [provider, value.error])), pagesCount: combined.pagesCount, queriesCount: combined.queriesCount, metrics: combined.metrics, dataUpdatedAt: combinedPayload.dataUpdatedAt });
    searchLog({ provider: "combined", action: "sync", status, durationMs, records: combined.pagesCount + combined.queriesCount });
    return { ok: true, status, providerResults, providerOutcomes: outcomes, combined: { ...combined, generatedAt: combinedPayload.generatedAt }, advisor, durationMs };
  });
}

export async function testSearchPlatform() {
  const config = safeSearchConfig(); const results = {};
  for (const [provider, enabled] of [["google", config.google.clientConfigured && config.google.tokenPresent], ["bing", config.bing.configured]]) {
    if (!enabled) { results[provider] = { status: "skipped", reason: "nicht konfiguriert" }; continue; }
    try { results[provider] = { status: "succeeded", result: await getSearchProvider(provider).test() }; }
    catch (error) { results[provider] = { status: "failed", error: toPublicError(error) }; }
  }
  const diagnostics = []; const files = { rangesFile: `${DATA_DIR}/search-dashboard-ranges.json`, singleFile: `${DATA_DIR}/search-dashboard.json` };
  const loader = readSearchDashboardCandidates(files); diagnostics.push(...loader.diagnostics);
  fs.accessSync(DATA_DIR, fs.constants.W_OK);
  const normalization = combineMetricValues([{ clicks: 1, impressions: 10, ctr: 10, position: 5 }, { clicks: 1, impressions: 30, ctr: 3.33, position: 9 }]);
  if (normalization.clicks !== 2 || normalization.impressions !== 40 || normalization.position !== 8) throw new SearchError("SEARCH_INVALID_DATA", { message: "Combined-Normalisierungstest fehlgeschlagen." });
  const failed = Object.values(results).some((item) => item.status === "failed"); const succeeded = Object.values(results).some((item) => item.status === "succeeded");
  return { ok: !failed, status: failed ? succeeded ? "partial" : "failed" : succeeded ? "succeeded" : "skipped", providers: results, loader: { source: loader.source, valid: loader.source !== "none", diagnostics }, writePath: DATA_DIR, combinedNormalization: "succeeded" };
}
