import { execFile } from "node:child_process";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { APP_ROOT, REPO_ROOT } from "./config.mjs";
import { SearchError, redactSecrets, toPublicError } from "./errors.mjs";
import { searchLog } from "./logging.mjs";
import { getSearchProvider } from "./provider-registry.mjs";
import { rebuildAdvisorSource, syncSearchPlatform, testSearchPlatform } from "./platform.mjs";
import { generateSearchReport } from "./search-report.mjs";
import {
  buildImagePack,
  completeCopilotTask,
  createImagePromptPack,
  createProductDraft,
  generateCopilotPrompt,
} from "./copilot-actions.mjs";

const MAX_OUTPUT = 80_000;
const ACTION_TIMEOUT = 12 * 60_000;

function runFixedScript(file, cwd) {
  return new Promise((resolve, reject) => {
    const child = execFile(process.execPath, [file], { cwd, timeout: ACTION_TIMEOUT, windowsHide: true, maxBuffer: MAX_OUTPUT }, (error, stdout, stderr) => {
      const output = redactSecrets(`${stdout || ""}${stderr || ""}`).slice(-MAX_OUTPUT);
      if (error) {
        const code = error.killed ? "SEARCH_ACTION_TIMEOUT" : "SEARCH_API_UNAVAILABLE";
        reject(new SearchError(code, { message: output.trim() || "Die lokale Wartungsaktion ist fehlgeschlagen.", cause: error }));
      } else resolve({ ok: true, output: output.trim() });
    });
    child.on("error", (cause) => reject(new SearchError("SEARCH_API_UNAVAILABLE", { message: "Lokale Wartungsaktion konnte nicht gestartet werden.", cause })));
  });
}

const DEFAULT_HANDLERS = {
  "google.test": ({ progress }) => { progress({ step: "connection", message: "OAuth, Token, API und Property werden geprüft." }); return getSearchProvider("google").test(); },
  "google.sync": ({ progress }) => getSearchProvider("google").sync({ onProgress: progress }),
  "google.report": ({ progress }) => { progress({ step: "report", message: "Bericht wird aus lokalen Sync-Daten erzeugt." }); return getSearchProvider("google").report(); },
  "bing.test": ({ progress }) => { progress({ step: "bing-test", message: "Bing API-Key, Website und Zugriff werden geprüft." }); return getSearchProvider("bing").test(); },
  "bing.sync": ({ progress }) => getSearchProvider("bing").sync({ onProgress: progress }),
  "bing.report": ({ progress }) => { progress({ step: "bing-report", message: "Bing-Bericht wird aus lokalen Sync-Daten erzeugt." }); return getSearchProvider("bing").report(); },
  "search.test": ({ progress }) => { progress({ step: "search-test", message: "Alle konfigurierten Search-Provider werden geprüft." }); return testSearchPlatform(); },
  "search.sync": ({ progress }) => syncSearchPlatform({ onProgress: progress }),
  "search.report": ({ progress }) => { progress({ step: "search-report", message: "Gemeinsamer Search-Bericht wird erzeugt." }); return generateSearchReport(); },
  "advisor.rebuild": ({ progress }) => { progress({ step: "advisor", message: "Advisor-Datenquelle wird validiert." }); return rebuildAdvisorSource(); },
  "seo.audit": ({ progress }) => { progress({ step: "audit", message: "SEO-Audit läuft." }); return runFixedScript(path.join(REPO_ROOT, "tools", "seo-platform", "audit.mjs"), REPO_ROOT); },
  "contentGraph.build": ({ progress }) => { progress({ step: "graph", message: "Content Graph wird aktualisiert." }); return runFixedScript(path.join(APP_ROOT, "scripts", "build-content-graph.mjs"), APP_ROOT); },
  "copilot.prompt": ({ payload, progress }) => { progress({ step: "prompt", message: "Prompt wird aus der vorhandenen Empfehlung erzeugt." }); return generateCopilotPrompt(payload); },
  "copilot.task.complete": ({ payload, progress }) => { progress({ step: "learning", message: "Abschluss-Snapshot wird lokal gespeichert." }); return completeCopilotTask(payload); },
  "product.draft.create": ({ payload, progress }) => { progress({ step: "product-draft", message: "Sicherer Produktentwurf wird außerhalb der Content-Collection angelegt." }); return createProductDraft(payload); },
  "product.images.prompts": ({ payload, progress }) => { progress({ step: "image-prompts", message: "Sechs Bildprompts werden erzeugt." }); return createImagePromptPack(payload); },
  "product.images.pack": ({ payload, progress }) => { progress({ step: "image-pack", message: "Importbilder werden validiert, zugeschnitten und als WebP/ZIP paketiert." }); return buildImagePack(payload); },
};

export function createSearchActionService(handlers = DEFAULT_HANDLERS, { maxStartsPerMinute = 8, logger = searchLog } = {}) {
  const actions = new Map();
  const locks = new Set();
  const starts = [];
  const allowedActions = Object.freeze(Object.keys(handlers));

  function enforceRateLimit() {
    const cutoff = Date.now() - 60_000;
    while (starts.length && starts[0] < cutoff) starts.shift();
    if (starts.length >= maxStartsPerMinute) throw new SearchError("SEARCH_RATE_LIMITED", { message: "Zu viele lokale Admin-Aktionen innerhalb einer Minute." });
    starts.push(Date.now());
  }

  function start(action, payload = {}) {
    if (typeof action !== "string" || !Object.hasOwn(handlers, action)) throw new SearchError("SEARCH_ACTION_NOT_ALLOWED");
    enforceRateLimit();
    const conflicts = action === "search.sync" ? ["search.sync", "google.sync", "bing.sync"] : action === "google.sync" || action === "bing.sync" ? [action, "search.sync"] : [action];
    if (conflicts.some((candidate) => locks.has(candidate))) throw new SearchError("SEARCH_SYNC_ALREADY_RUNNING");
    const id = randomUUID();
    const record = { id, action, status: "queued", progress: null, queuedAt: new Date().toISOString(), startedAt: null, finishedAt: null, result: null, error: null };
    actions.set(id, record);
    if (actions.size > 100) actions.delete(actions.keys().next().value);
    locks.add(action);
    queueMicrotask(async () => {
      record.status = "running"; record.startedAt = new Date().toISOString();
      logger({ provider: action.split(".")[0], action, status: "running" });
      try {
        record.result = await handlers[action]({ payload: structuredClone(payload), progress: (progress) => { record.progress = { ...progress }; } });
        record.status = "succeeded";
        logger({ provider: action.split(".")[0], action, status: "succeeded" });
      } catch (error) {
        record.status = "failed"; record.error = toPublicError(error);
        logger({ provider: action.split(".")[0], action, status: "failed", code: record.error.code, message: record.error.message });
      } finally { record.finishedAt = new Date().toISOString(); locks.delete(action); }
    });
    return { ...record };
  }

  return {
    allowedActions,
    start,
    get(id) { const record = actions.get(id); return record ? structuredClone(record) : null; },
    running() { return [...actions.values()].filter((item) => item.status === "queued" || item.status === "running").map((item) => structuredClone(item)); },
  };
}

const service = createSearchActionService();
export const ALLOWED_SEARCH_ACTIONS = service.allowedActions;
export const startSearchAction = (action, payload) => service.start(action, payload);
export const getSearchAction = (id) => service.get(id);
export const getRunningActions = () => service.running();
