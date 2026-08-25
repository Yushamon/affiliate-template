import { execFile } from "node:child_process";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { APP_ROOT, REPO_ROOT } from "./config.mjs";
import { SearchError, redactSecrets, toPublicError } from "./errors.mjs";
import { searchLog } from "./logging.mjs";
import { getSearchProvider } from "./provider-registry.mjs";
import { rebuildAdvisorSource, syncSearchPlatform, syncSingleSearchProvider, testSearchPlatform } from "./platform.mjs";
import { generateSearchReport } from "./search-report.mjs";
import {
  buildImagePack,
  completeCopilotTask,
  createImagePromptPack,
  createProductDraft,
  generateCopilotPrompt,
} from "./copilot-actions.mjs";
import {
  approveProductDraft,
  generateEntityResearchPrompt,
  generateProductDraft,
  ignoreStoredCandidate,
  publishApprovedProduct,
  refreshContentGaps,
  refreshNicheOpportunities,
  rollbackPublishedProduct,
  runProductDiscovery,
  runStoredCandidatePreflight,
  validateStoredCandidate,
} from "../seo-copilot/workflow.mjs";
const packageWorkflow = () => import("../seo-copilot/package-workflow.mjs");
const qualityActions = () => import("../seo-copilot/quality-actions.mjs");

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

function runFixedNpm(args, cwd) {
  return new Promise((resolve, reject) => {
    const executable = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = execFile(executable, args, { cwd, timeout: ACTION_TIMEOUT, windowsHide: true, maxBuffer: MAX_OUTPUT }, (error, stdout, stderr) => {
      const output = redactSecrets(`${stdout || ""}${stderr || ""}`).slice(-MAX_OUTPUT);
      if (error) reject(new SearchError(error.killed ? "SEARCH_ACTION_TIMEOUT" : "SEARCH_API_UNAVAILABLE", { message: output.trim() || "Die feste npm-Aktion ist fehlgeschlagen.", cause: error }));
      else resolve({ ok: true, output: output.trim() });
    });
    child.on("error", (cause) => reject(new SearchError("SEARCH_API_UNAVAILABLE", { message: "Die feste npm-Aktion konnte nicht gestartet werden.", cause })));
  });
}

const PACKAGE_COMMANDS = Object.freeze({
  "npm --workspace apps/pfotentechnik run lint:content": () => runFixedNpm(["--workspace", "apps/pfotentechnik", "run", "lint:content"], REPO_ROOT),
  "npm --workspace apps/pfotentechnik run build:content-graph": () => runFixedNpm(["--workspace", "apps/pfotentechnik", "run", "build:content-graph"], REPO_ROOT),
  "npm --workspace apps/pfotentechnik run audit:products:strict": () => runFixedNpm(["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"], REPO_ROOT),
  "npm --workspace apps/pfotentechnik run seo:release:check:no-build": () => runFixedNpm(["--workspace", "apps/pfotentechnik", "run", "seo:release:check:no-build"], REPO_ROOT),
  "npm run build:pfotentechnik": () => runFixedNpm(["run", "build:pfotentechnik"], REPO_ROOT),
});

async function verifySeoPackage(payload, progress) {
  const { resolveSeoPackageForAction, allowedPackageVerificationCommands, setSeoPackageVerificationPending } = await packageWorkflow();
  const pkg = resolveSeoPackageForAction(payload);
  const commands = allowedPackageVerificationCommands(pkg);
  const checks = [];
  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];
    const runner = PACKAGE_COMMANDS[command];
    if (!runner) throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: `Nicht erlaubte Paketprüfung: ${command}` });
    progress({ step: "package-verification", message: command, percent: Math.round(index / Math.max(1, commands.length + 1) * 90) });
    try {
      const result = await runner();
      checks.push({ command, status: "passed", output: result.output, checkedAt: new Date().toISOString() });
    } catch (error) {
      checks.push({ command, status: "failed", output: redactSecrets(error?.message || String(error)).slice(-8_000), checkedAt: new Date().toISOString() });
    }
  }
  progress({ step: "advisor-rebuild", message: "Advisor-Datenquelle wird nach den Prüfungen neu aufgebaut.", percent: 94 });
  try {
    const result = await rebuildAdvisorSource();
    checks.push({ command: "internal:advisor-rebuild", status: "passed", output: redactSecrets(JSON.stringify(result ?? {})).slice(-8_000), checkedAt: new Date().toISOString() });
  } catch (error) {
    checks.push({ command: "internal:advisor-rebuild", status: "failed", output: redactSecrets(error?.message || String(error)).slice(-8_000), checkedAt: new Date().toISOString() });
  }
  progress({ step: "package-verification", message: "Paket wartet auf Advisor-Abgleich.", percent: 100 });
  return setSeoPackageVerificationPending(payload, checks);
}

const QUALITY_AUTO_FIX_RUNNERS = Object.freeze({
  "comparison-fix-check": () =>
    runFixedNpm(["--workspace", "apps/pfotentechnik", "run", "comparison:fix:check"], REPO_ROOT),
  "comparison-fix": () =>
    runFixedNpm(["--workspace", "apps/pfotentechnik", "run", "comparison:fix"], REPO_ROOT),
  "comparison-audit-strict": () =>
    runFixedNpm(["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"], REPO_ROOT),
  "quality-ops-sync": () =>
    runFixedScript(path.join(APP_ROOT, "scripts", "quality-ops", "sync.mjs"), APP_ROOT),
});

async function runSafeQualityAutoFix(payload, progress) {
  const { resolveQualityFindingForAutoFix, markQualityFindingAutoFixed } = await qualityActions();
  const { finding, definition } = resolveQualityFindingForAutoFix(payload);
  const outputs = [];

  for (const step of definition.steps) {
    const runner = QUALITY_AUTO_FIX_RUNNERS[step.id];
    if (!runner) {
      throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", {
        message: `Nicht erlaubter Auto-Fix-Schritt: ${step.id}`,
      });
    }

    progress({
      step: step.phase,
      message: step.label,
      percent: step.percent,
    });

    const result = await runner();
    if (result?.output) outputs.push(result.output);
  }

  const updated = markQualityFindingAutoFixed(finding.id, {
    note: definition.successNote,
  });

  progress({
    step: "completed",
    message: "Auto-Fix wurde geprüft und protokolliert.",
    percent: 100,
  });

  return {
    ok: true,
    finding: updated,
    autoFixId: definition.id,
    output: outputs.join("\n\n"),
    reloadRequired: true,
  };
}

const DEFAULT_HANDLERS = {
  "google.test": ({ progress }) => { progress({ step: "connection", message: "OAuth, Token, API und Property werden geprüft." }); return getSearchProvider("google").test(); },
  "google.sync": ({ progress }) => syncSingleSearchProvider("google", { onProgress: progress }),
  "google.report": ({ progress }) => { progress({ step: "report", message: "Bericht wird aus lokalen Sync-Daten erzeugt." }); return getSearchProvider("google").report(); },
  "bing.test": ({ progress }) => { progress({ step: "bing-test", message: "Bing API-Key, Website und Zugriff werden geprüft." }); return getSearchProvider("bing").test(); },
  "bing.sync": ({ progress }) => syncSingleSearchProvider("bing", { onProgress: progress }),
  "bing.report": ({ progress }) => { progress({ step: "bing-report", message: "Bing-Bericht wird aus lokalen Sync-Daten erzeugt." }); return getSearchProvider("bing").report(); },
  "search.test": ({ progress }) => { progress({ step: "search-test", message: "Alle konfigurierten Search-Provider werden geprüft." }); return testSearchPlatform(); },
  "search.sync": ({ progress }) => syncSearchPlatform({ onProgress: progress }),
  "search.report": ({ progress }) => { progress({ step: "search-report", message: "Gemeinsamer Search-Bericht wird erzeugt." }); return generateSearchReport(); },
  "advisor.rebuild": ({ progress }) => { progress({ step: "advisor", message: "Advisor-Datenquelle wird validiert." }); return rebuildAdvisorSource(); },
  "seo.audit": ({ progress }) => { progress({ step: "audit", message: "SEO-Audit läuft." }); return runFixedScript(path.join(REPO_ROOT, "tools", "seo-platform", "audit.mjs"), REPO_ROOT); },
  "contentGraph.build": ({ progress }) => { progress({ step: "graph", message: "Content Graph wird aktualisiert." }); return runFixedScript(path.join(APP_ROOT, "scripts", "build-content-graph.mjs"), APP_ROOT); },
  "copilot.prompt": ({ payload, progress }) => { progress({ step: "prompt", message: "Prompt wird aus der vorhandenen Empfehlung erzeugt." }); return generateCopilotPrompt(payload); },
  "copilot.task.complete": ({ payload, progress }) => { progress({ step: "learning", message: "Abschluss-Snapshot wird lokal gespeichert." }); return completeCopilotTask(payload); },
  "copilot.package.sent": async ({ payload, progress }) => { progress({ step: "package", message: "Paket wird als an Codex übergeben gespeichert." }); const { markSeoPackageSent } = await packageWorkflow(); return markSeoPackageSent(payload); },
  "copilot.package.snooze": async ({ payload, progress }) => { progress({ step: "package", message: "Paket wird nachvollziehbar zurückgestellt." }); const { snoozeSeoPackage } = await packageWorkflow(); return snoozeSeoPackage(payload); },
  "copilot.package.verify": ({ payload, progress }) => verifySeoPackage(payload, progress),
  "copilot.package.reconcile": async ({ payload, progress }) => { progress({ step: "package", message: "Aktuelle Advisor-Befunde werden serverseitig abgeglichen." }); const { reconcileSeoPackage } = await packageWorkflow(); return reconcileSeoPackage(payload); },
  "copilot.package.reopen": async ({ payload, progress }) => { progress({ step: "package", message: "Paket wird wieder geöffnet." }); const { reopenSeoPackage } = await packageWorkflow(); return reopenSeoPackage(payload); },
  "quality.finding.status": async ({ payload, progress }) => { progress({ step: "quality-status", message: "Finding-Status wird im zentralen Workspace protokolliert." }); const { updateQualityFindingStatus } = await qualityActions(); return updateQualityFindingStatus(payload); },
  "quality.finding.auto-fix": ({ payload, progress }) => runSafeQualityAutoFix(payload, progress),
  "product.draft.create": ({ payload, progress }) => { progress({ step: "product-draft", message: "Sicherer Produktentwurf wird außerhalb der Content-Collection angelegt." }); return createProductDraft(payload); },
  "product.images.prompts": ({ payload, progress }) => { progress({ step: "image-prompts", message: "Sechs Bildprompts werden erzeugt." }); return createImagePromptPack(payload); },
  "product.images.pack": ({ payload, progress }) => { progress({ step: "image-pack", message: "Importbilder werden validiert, zugeschnitten und als WebP/ZIP paketiert." }); return buildImagePack(payload); },
  "product.health.refresh": ({ progress }) => { progress({ step: "product-health", message: "Product-Health-Report wird aus den aktuellen Collections erzeugt." }); return runFixedScript(path.join(APP_ROOT, "scripts", "seo-copilot-report.mjs"), APP_ROOT); },
  "product.discovery.run": ({ payload, progress }) => runProductDiscovery(payload, { progress }),
  "product.discovery.validate": ({ payload, progress }) => { progress({ step: "validation", message: "Quellen, Marktsignale und Repository-Abdeckung werden erneut bewertet." }); return validateStoredCandidate(payload); },
  "product.discovery.ignore": ({ payload, progress }) => { progress({ step: "ignore", message: "Kandidat wird nachvollziehbar aus der aktiven Liste entfernt." }); return ignoreStoredCandidate(payload); },
  "product.research.refresh": ({ payload, progress }) => { progress({ step: "research-prompt", message: "Konkrete Rechercheprompts werden aus dem Kandidatenkontext erzeugt." }); return generateEntityResearchPrompt({ ...payload, kind: "product-research" }); },
  "product.preflight.run": ({ payload, progress }) => { progress({ step: "preflight", message: "Schema, Duplikate, Hersteller, Vergleiche, Bilder und Zielpfade werden geprüft." }); return runStoredCandidatePreflight(payload); },
  "product.draft.generate": ({ payload, progress }) => { progress({ step: "draft", message: "Entwurf und Vorschau werden außerhalb der Content Collection erzeugt." }); return generateProductDraft(payload); },
  "product.draft.approve": ({ payload, progress }) => { progress({ step: "approval", message: "Explizit freigegebener Markdown-Entwurf wird validiert." }); return approveProductDraft(payload); },
  "product.images.prepare": ({ payload, progress }) => { progress({ step: "image-prompts", message: "Bildrollen und belegte Merkmale werden für den Entwurf vorbereitet." }); return generateProductDraft(payload); },
  "product.create": async ({ payload, progress }) => {
    progress({ step: "create", message: "Freigegebener Entwurf wird nach aktuellem Preflight angelegt." });
    let created;
    try {
      created = publishApprovedProduct(payload);
      progress({ step: "product-audit", message: "Produkt-Audit validiert die neue Datei." });
      const productAudit = await runFixedScript(path.join(APP_ROOT, "scripts", "audit-product-data.mjs"), APP_ROOT);
      progress({ step: "build", message: "Astro-Build validiert Content Collection und Ausgabe." });
      const build = await runFixedNpm(["run", "build"], APP_ROOT);
      return { ...created, productAudit, build, status: "completed" };
    } catch (error) {
      rollbackPublishedProduct(created, error);
      throw error;
    }
  },
  "product.update": ({ payload, progress }) => { progress({ step: "update-prompt", message: "Sicherer Aktualisierungsprompt wird erzeugt; keine Datei wird automatisch überschrieben." }); return generateEntityResearchPrompt({ ...payload, kind: "product-research", problems: [...(payload?.problems || []), "Bestehende Produktdatei nur gezielt aktualisieren"] }); },
  "product.add-to-comparison": ({ payload, progress }) => { progress({ step: "comparison-preview", message: "Vergleichseignung und Vorschauprompt werden erzeugt; keine automatische Zuordnung." }); return generateEntityResearchPrompt({ ...payload, kind: "comparison" }); },
  "manufacturer.create": ({ payload, progress }) => { progress({ step: "manufacturer-preview", message: "Hersteller-Recherche und Anlagevorschau werden vorbereitet; keine Collection-Datei wird geschrieben." }); return generateEntityResearchPrompt({ ...payload, kind: "manufacturer" }); },
  "content-gap.refresh": ({ progress }) => { progress({ step: "content-gaps", message: "Validierte Kandidaten werden mit der Repository-Abdeckung abgeglichen." }); return refreshContentGaps(); },
  "niche-opportunities.refresh": ({ payload, progress }) => { progress({ step: "niches", message: "Nischen werden mit konfigurierbarer Mindestschwelle bewertet." }); return refreshNicheOpportunities(payload); },
  "prompt.chatgpt.generate": ({ payload, progress }) => { progress({ step: "prompt", message: "Kontextspezifischer ChatGPT-Prompt wird erzeugt." }); return generateEntityResearchPrompt(payload).chatgpt; },
  "prompt.codex.generate": ({ payload, progress }) => { progress({ step: "prompt", message: "Kontextspezifischer Codex-Prompt wird erzeugt." }); return generateEntityResearchPrompt(payload).codex; },
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
    const controller = new AbortController();
    const record = { id, action, status: "queued", progress: null, queuedAt: new Date().toISOString(), startedAt: null, finishedAt: null, result: null, error: null, payload: structuredClone(payload), controller };
    actions.set(id, record);
    if (actions.size > 100) actions.delete(actions.keys().next().value);
    locks.add(action);
    queueMicrotask(async () => {
      if (record.status === "cancelled") { locks.delete(action); return; }
      record.status = "running"; record.startedAt = new Date().toISOString();
      logger({ provider: action.split(".")[0], action, status: "running" });
      try {
        record.result = await handlers[action]({ payload: structuredClone(payload), signal: controller.signal, progress: (progress) => { record.progress = { ...progress }; } });
        if (record.status === "cancelled") return;
        record.status = "succeeded";
        logger({ provider: action.split(".")[0], action, status: "succeeded" });
      } catch (error) {
        if (record.status === "cancelled") return;
        record.status = "failed"; record.error = toPublicError(error);
        logger({ provider: action.split(".")[0], action, status: "failed", code: record.error.code, message: record.error.message });
      } finally { record.finishedAt = new Date().toISOString(); locks.delete(action); delete record.controller; }
    });
    const { controller: _, payload: __, ...publicRecord } = record;
    return { ...publicRecord };
  }

  return {
    allowedActions,
    start,
    get(id) { const record = actions.get(id); if (!record) return null; const { controller, payload, ...safe } = record; return structuredClone(safe); },
    running() { return [...actions.values()].filter((item) => item.status === "queued" || item.status === "running").map((item) => { const { controller, payload, ...safe } = item; return structuredClone(safe); }); },
    cancel(id) {
      const record = actions.get(id);
      if (!record || !["queued", "running"].includes(record.status)) return false;
      record.status = "cancelled"; record.finishedAt = new Date().toISOString(); record.controller?.abort();
      return true;
    },
    retry(id) {
      const record = actions.get(id);
      if (!record || !["failed", "cancelled"].includes(record.status) || !record.payload) return null;
      return start(record.action, record.payload);
    },
  };
}

const service = createSearchActionService();
export const ALLOWED_SEARCH_ACTIONS = service.allowedActions;
export const startSearchAction = (action, payload) => service.start(action, payload);
export const getSearchAction = (id) => service.get(id);
export const getRunningActions = () => service.running();
export const cancelSearchAction = (id) => service.cancel(id);
export const retrySearchAction = (id) => service.retry(id);
