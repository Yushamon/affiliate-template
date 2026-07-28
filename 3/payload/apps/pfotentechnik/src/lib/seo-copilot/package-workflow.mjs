import { loadSeoDashboard } from "../seo/loadDashboard.ts";
import { SearchError, redactSecrets } from "../search/errors.mjs";
import {
  recommendedReviewDays,
  resolvePackageLifecycle,
} from "../seo/advisor/work-packages.ts";
import {
  appendCopilotAudit,
  readCopilotWorkspace,
  updateCopilotWorkspace,
} from "./store.mjs";

const ALLOWED_SNOOZE_DAYS = new Set([7, 14, 30, 60]);
const FAMILIES = new Set(["technical-structure", "eeat-content-quality", "ranking-snippet", "search-intent-content-gap", "product-health"]);
const MODES = new Set(["immediate", "search-window", "manual"]);
const STATUSES = new Set(["open", "sent-to-codex", "verification-pending", "waiting-window", "review-due", "needs-work", "verified", "snoozed"]);
const PRIORITIES = new Set(["high", "medium", "low"]);
const CHECK_STATUSES = new Set(["passed", "failed", "not-run"]);
const clean = (value, max = 2_000) => redactSecrets(String(value ?? "").replace(/[\u0000-\u001f]/g, " ").trim()).slice(0, max);
const bounded = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
const array = (value, max = 100) => Array.isArray(value) ? value.slice(0, max) : [];
const unique = (values, max = 100) => [...new Set(values)].slice(0, max);
const nowDate = (value) => value instanceof Date ? value : new Date(value ?? Date.now());
const addDays = (date, days) => new Date(date.getTime() + days * 86_400_000);

const normalizeTask = (raw) => ({
  id: clean(raw?.id, 300),
  title: clean(raw?.title, 300),
  priority: PRIORITIES.has(raw?.priority) ? raw.priority : "low",
  score: bounded(raw?.score),
  explicitImpact: bounded(raw?.explicitImpact),
  confidence: bounded(raw?.confidence, 0, 1),
  effortValue: bounded(raw?.effortValue, 1, 5),
  effort: ["niedrig", "mittel", "hoch"].includes(raw?.effort) ? raw.effort : "mittel",
  family: FAMILIES.has(raw?.family) ? raw.family : "technical-structure",
  verificationMode: MODES.has(raw?.verificationMode) ? raw.verificationMode : "manual",
  url: raw?.url ? clean(raw.url, 500) : undefined,
  query: raw?.query ? clean(raw.query, 500) : undefined,
  affectedFile: raw?.affectedFile ? clean(raw.affectedFile, 700) : undefined,
  problem: clean(raw?.problem, 2_000),
  dataBasis: clean(raw?.dataBasis, 2_000),
  nextAction: clean(raw?.nextAction, 2_000),
  steps: unique(array(raw?.steps, 20).map((item) => clean(item, 1_000)).filter(Boolean), 20),
  acceptanceCriteria: unique(array(raw?.acceptanceCriteria, 20).map((item) => clean(item, 1_000)).filter(Boolean), 20),
  pageType: clean(raw?.pageType, 100),
  lowConfidence: Boolean(raw?.lowConfidence),
  sourceKind: raw?.sourceKind === "product-health" ? "product-health" : "advisor",
});

const validationCommandsFor = (pkg) => {
  const commands = [
    "npm --workspace apps/pfotentechnik run lint:content",
    "npm --workspace apps/pfotentechnik run seo:release:check:no-build",
    "npm run build:pfotentechnik",
  ];
  if (pkg.family === "technical-structure" || pkg.tasks.some((task) => /link|canonical|redirect|struktur/i.test(`${task.problem} ${task.nextAction}`))) {
    commands.splice(1, 0, "npm --workspace apps/pfotentechnik run build:content-graph");
  }
  if (pkg.family === "product-health") commands.splice(1, 0, "npm --workspace apps/pfotentechnik run audit:products:strict");
  return unique(commands, 5);
};

export function normalizeSeoPackageSnapshot(raw) {
  if (!raw || typeof raw !== "object") throw new SearchError("SEARCH_INVALID_DATA", { message: "Paketdaten fehlen." });
  const id = clean(raw.id, 200);
  const family = FAMILIES.has(raw.family) ? raw.family : null;
  const verificationMode = MODES.has(raw.verificationMode) ? raw.verificationMode : null;
  if (!/^seo-package-[a-z0-9]+$/i.test(id) || !family || !verificationMode) {
    throw new SearchError("SEARCH_INVALID_DATA", { message: "Paket-ID, Familie oder Prüfmodus ist ungültig." });
  }
  if (Array.isArray(raw.tasks) && raw.tasks.length > 4) throw new SearchError("SEARCH_INVALID_DATA", { message: "Ein Paket darf höchstens vier Teilaufgaben enthalten." });
  if (Array.isArray(raw.taskIds) && raw.taskIds.length > 4) throw new SearchError("SEARCH_INVALID_DATA", { message: "Ein Paket darf höchstens vier Task-IDs enthalten." });
  if (Array.isArray(raw.affectedFiles) && raw.affectedFiles.length > 5) throw new SearchError("SEARCH_INVALID_DATA", { message: "Ein Paket darf höchstens fünf Dateien betreffen." });
  const tasks = array(raw.tasks, 4).map(normalizeTask).filter((task) => task.id).map((task) => ({ ...task, family, verificationMode }));
  const taskIds = unique([...tasks.map((task) => task.id), ...array(raw.taskIds, 4).map((item) => clean(item, 300)).filter(Boolean)], 4);
  if (!taskIds.length) throw new SearchError("SEARCH_INVALID_DATA", { message: "Ein Paket benötigt ein bis vier stabile Task-IDs." });
  const affectedFiles = unique(array(raw.affectedFiles, 5).map((item) => clean(item, 700)).filter(Boolean), 5);
  const snapshot = {
    id,
    title: clean(raw.title || id, 300),
    rangeKey: clean(raw.rangeKey, 80),
    family,
    priority: PRIORITIES.has(raw.priority) ? raw.priority : "low",
    impact: bounded(raw.impact),
    confidence: bounded(raw.confidence, 0, 1),
    effortValue: bounded(raw.effortValue, 1, 5),
    effort: ["niedrig", "mittel", "hoch"].includes(raw.effort) ? raw.effort : "mittel",
    verificationMode,
    verifyAfter: raw.verifyAfter ? new Date(raw.verifyAfter).toISOString() : null,
    taskIds,
    affectedFiles,
    tasks,
  };
  return { ...snapshot, validationCommands: validationCommandsFor(snapshot) };
}

const normalizeCheck = (raw) => ({
  command: clean(raw?.command, 500),
  status: CHECK_STATUSES.has(raw?.status) ? raw.status : "not-run",
  output: raw?.output ? clean(raw.output, 8_000) : undefined,
  checkedAt: raw?.checkedAt ? clean(raw.checkedAt, 60) : undefined,
});

const packageRecord = (pkg, previous = {}, now = new Date()) => ({
  id: pkg.id,
  status: STATUSES.has(pkg.status) ? pkg.status : STATUSES.has(previous.status) ? previous.status : "open",
  createdAt: previous.createdAt || pkg.createdAt || now.toISOString(),
  updatedAt: now.toISOString(),
  sentAt: previous.sentAt ?? pkg.sentAt ?? null,
  verifyAfter: pkg.verifyAfter ?? previous.verifyAfter ?? null,
  snoozedUntil: previous.snoozedUntil ?? pkg.snoozedUntil ?? null,
  snoozeReason: previous.snoozeReason ?? pkg.snoozeReason ?? null,
  verificationMode: pkg.verificationMode,
  lastVerification: previous.lastVerification ?? pkg.lastVerification ?? null,
  unresolvedTaskIds: array(previous.unresolvedTaskIds ?? pkg.unresolvedTaskIds, 4).map((item) => clean(item, 300)),
  passedChecks: array(previous.passedChecks ?? pkg.passedChecks, 10).map(normalizeCheck),
  failedChecks: array(previous.failedChecks ?? pkg.failedChecks, 10).map(normalizeCheck),
  packageSnapshot: normalizeSeoPackageSnapshot(pkg),
});

const storedPackageView = (stored, now = new Date()) => {
  if (!stored?.packageSnapshot) return null;
  let status = STATUSES.has(stored.status) ? stored.status : "open";
  const snoozeExpired = status === "snoozed" && stored.snoozedUntil && new Date(stored.snoozedUntil) <= now;
  if (snoozeExpired) status = "open";
  if (status === "waiting-window" && stored.verifyAfter && new Date(stored.verifyAfter) <= now) status = "review-due";
  return {
    ...stored.packageSnapshot,
    status,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    sentAt: stored.sentAt ?? null,
    verifyAfter: stored.verifyAfter ?? stored.packageSnapshot.verifyAfter ?? null,
    snoozedUntil: snoozeExpired ? null : stored.snoozedUntil ?? null,
    snoozeReason: snoozeExpired ? null : stored.snoozeReason ?? null,
    lastVerification: stored.lastVerification ?? null,
    unresolvedTaskIds: stored.unresolvedTaskIds ?? [],
    passedChecks: stored.passedChecks ?? [],
    failedChecks: stored.failedChecks ?? [],
  };
};

export function mergeGeneratedPackagesIntoWorkspace(packages, { now = new Date() } = {}) {
  const moment = nowDate(now);
  const normalized = array(packages, 500).map(normalizeSeoPackageSnapshot);
  const currentIds = new Set(normalized.map((pkg) => pkg.id));
  return updateCopilotWorkspace((workspace) => {
    const records = new Map(workspace.workPackages
      .filter((pkg) => currentIds.has(pkg.id) || pkg.status !== "open")
      .map((pkg) => [pkg.id, pkg]));
    for (const pkg of normalized) {
      const previous = records.get(pkg.id);
      const view = previous ? storedPackageView(previous, moment) : null;
      records.set(pkg.id, packageRecord({
        ...pkg,
        status: view?.status ?? "open",
        sentAt: view?.sentAt ?? null,
        verifyAfter: view?.verifyAfter ?? pkg.verifyAfter ?? null,
        snoozedUntil: view?.snoozedUntil ?? null,
        snoozeReason: view?.snoozeReason ?? null,
        lastVerification: view?.lastVerification ?? null,
        unresolvedTaskIds: view?.unresolvedTaskIds ?? [],
        passedChecks: view?.passedChecks ?? [],
        failedChecks: view?.failedChecks ?? [],
      }, previous, moment));
    }
    workspace.workPackages = [...records.values()].slice(-500);
    return workspace;
  });
}

export function getSeoWorkPackageStatus(_rangeKey, { now = new Date() } = {}) {
  const moment = nowDate(now);
  const current = readCopilotWorkspace();
  let changed = false;
  const nextPackages = current.workPackages.map((stored) => {
    const view = storedPackageView(stored, moment);
    if (!view || (view.status === stored.status && view.snoozedUntil === (stored.snoozedUntil ?? null) && view.snoozeReason === (stored.snoozeReason ?? null))) return stored;
    changed = true;
    return { ...stored, status: view.status, snoozedUntil: view.snoozedUntil, snoozeReason: view.snoozeReason, updatedAt: moment.toISOString() };
  });
  const workspace = changed
    ? updateCopilotWorkspace((state) => { state.workPackages = nextPackages; return state; })
    : current;
  const packages = workspace.workPackages.map((stored) => storedPackageView(stored, moment)).filter(Boolean);
  return {
    packages,
    counts: {
      open: packages.filter((pkg) => pkg.status === "open").length,
      highImpact: packages.filter((pkg) => pkg.impact >= 70).length,
      inCodex: packages.filter((pkg) => ["sent-to-codex", "verification-pending"].includes(pkg.status)).length,
      waiting: packages.filter((pkg) => pkg.status === "waiting-window").length,
      needsWork: packages.filter((pkg) => pkg.status === "needs-work").length,
      verified: packages.filter((pkg) => pkg.status === "verified").length,
      snoozed: packages.filter((pkg) => pkg.status === "snoozed").length,
    },
    changed,
  };
}

export function resolveSeoPackageForAction(payload) {
  const packageId = clean(payload?.packageId || payload?.package?.id, 200);
  if (!packageId) throw new SearchError("SEARCH_INVALID_DATA", { message: "Paket-ID fehlt." });
  const workspace = readCopilotWorkspace();
  const stored = workspace.workPackages.find((item) => item.id === packageId);
  const incoming = payload?.package ? normalizeSeoPackageSnapshot(payload.package) : null;
  if (incoming && incoming.id !== packageId) throw new SearchError("SEARCH_INVALID_DATA", { message: "Paket-ID und Paketsnapshot stimmen nicht überein." });
  if (!stored && !incoming) throw new SearchError("SEARCH_INVALID_DATA", { message: "Paket wurde im lokalen Workspace nicht gefunden." });
  const snapshot = incoming ?? stored.packageSnapshot;
  const state = storedPackageView(stored, new Date());
  return {
    ...snapshot,
    status: state?.status ?? "open",
    createdAt: state?.createdAt ?? new Date().toISOString(),
    updatedAt: state?.updatedAt ?? new Date().toISOString(),
    sentAt: state?.sentAt ?? null,
    verifyAfter: state?.verifyAfter ?? snapshot.verifyAfter ?? null,
    snoozedUntil: state?.snoozedUntil ?? null,
    snoozeReason: state?.snoozeReason ?? null,
    lastVerification: state?.lastVerification ?? null,
    unresolvedTaskIds: state?.unresolvedTaskIds ?? [],
    passedChecks: state?.passedChecks ?? [],
    failedChecks: state?.failedChecks ?? [],
  };
}

const assertPackageStatus = (pkg, allowed, action) => {
  if (!allowed.includes(pkg.status)) throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: `${action} ist im Paketstatus ${pkg.status} nicht erlaubt.` });
};

const normalizeManifest = (raw, packageId) => {
  if (!raw || typeof raw !== "object") return null;
  const safe = {
    packageId: clean(raw.packageId || packageId, 200),
    completedTaskIds: unique(array(raw.completedTaskIds, 20).map((item) => clean(item, 300)).filter(Boolean), 20),
    blockedTaskIds: unique(array(raw.blockedTaskIds, 20).map((item) => clean(item, 300)).filter(Boolean), 20),
    changedFiles: unique(array(raw.changedFiles, 50).map((item) => clean(item, 700)).filter(Boolean), 50),
    validation: array(raw.validation, 10).map(normalizeCheck),
    remainingRisks: unique(array(raw.remainingRisks, 30).map((item) => clean(item, 1_000)).filter(Boolean), 30),
    recommendedReviewAfter: raw.recommendedReviewAfter ? clean(raw.recommendedReviewAfter, 60) : null,
  };
  return JSON.parse(redactSecrets(JSON.stringify(safe)));
};

function persistPackage(pkg, patch, action, extraAudit = {}) {
  const moment = new Date();
  let updated;
  updateCopilotWorkspace((workspace) => {
    const previous = workspace.workPackages.find((item) => item.id === pkg.id);
    const base = packageRecord(pkg, previous, moment);
    updated = { ...base, ...patch, updatedAt: moment.toISOString(), packageSnapshot: normalizeSeoPackageSnapshot(pkg) };
    workspace.workPackages = [...workspace.workPackages.filter((item) => item.id !== pkg.id), updated].slice(-500);
    return workspace;
  });
  appendCopilotAudit({
    action,
    packageId: pkg.id,
    taskIds: pkg.taskIds,
    statusBefore: pkg.status,
    statusAfter: updated.status,
    ...extraAudit,
  });
  return updated;
}

export async function markSeoPackageSent(payload) {
  const pkg = resolveSeoPackageForAction(payload);
  assertPackageStatus(pkg, ["open", "needs-work", "review-due", "sent-to-codex"], "Übergabe an Codex");
  const sentAt = new Date().toISOString();
  const verifyAfter = pkg.verificationMode === "search-window"
    ? addDays(new Date(sentAt), recommendedReviewDays(pkg.tasks ?? [])).toISOString()
    : null;
  const updated = persistPackage(pkg, {
    status: "sent-to-codex",
    sentAt,
    verifyAfter,
    snoozedUntil: null,
    snoozeReason: null,
    unresolvedTaskIds: pkg.taskIds,
  }, "copilot.package.sent");
  return { package: updated, suppressedTaskIds: pkg.taskIds, reloadRequired: true };
}

export async function snoozeSeoPackage(payload) {
  const days = Number(payload?.days);
  if (!ALLOWED_SNOOZE_DAYS.has(days)) throw new SearchError("SEARCH_INVALID_DATA", { message: "Zurückstellen ist nur für 7, 14, 30 oder 60 Tage erlaubt." });
  const reason = clean(payload?.reason || `Manuell für ${days} Tage zurückgestellt.`, 500);
  const pkg = resolveSeoPackageForAction(payload);
  assertPackageStatus(pkg, ["open", "sent-to-codex", "verification-pending", "waiting-window", "review-due", "needs-work"], "Zurückstellen");
  const snoozedUntil = addDays(new Date(), days).toISOString();
  const updated = persistPackage(pkg, { status: "snoozed", snoozedUntil, snoozeReason: reason }, "copilot.package.snooze", { warnings: [reason] });
  return { package: updated, reloadRequired: true };
}

export async function reopenSeoPackage(payload) {
  const pkg = resolveSeoPackageForAction(payload);
  assertPackageStatus(pkg, ["snoozed", "verified"], "Wieder öffnen");
  const updated = persistPackage(pkg, { status: "open", snoozedUntil: null, snoozeReason: null, unresolvedTaskIds: [] }, "copilot.package.reopen");
  return { package: updated, reloadRequired: true };
}

const requiredVerificationChecks = (pkg) => [...allowedPackageVerificationCommands(pkg), "internal:advisor-rebuild"];

export async function setSeoPackageVerificationPending(payload, checks) {
  const pkg = resolveSeoPackageForAction(payload);
  assertPackageStatus(pkg, ["open", "sent-to-codex", "needs-work", "review-due"], "Prüfung");
  const checkedAt = new Date().toISOString();
  const received = new Map(array(checks, 10).map(normalizeCheck).map((check) => [check.command, check]));
  const normalizedChecks = requiredVerificationChecks(pkg).map((command) => received.get(command) ?? { command, status: "not-run", checkedAt });
  const passedChecks = normalizedChecks.filter((check) => check.status === "passed");
  const failedChecks = normalizedChecks.filter((check) => check.status !== "passed");
  const manifest = normalizeManifest(payload?.manifest, pkg.id);
  const sentAt = pkg.sentAt ?? checkedAt;
  const verifyAfter = pkg.verificationMode === "search-window"
    ? pkg.verifyAfter ?? addDays(new Date(sentAt), recommendedReviewDays(pkg.tasks ?? [])).toISOString()
    : null;
  const updated = persistPackage(pkg, {
    status: "verification-pending",
    sentAt,
    verifyAfter,
    lastVerification: { checkedAt, manifest },
    passedChecks,
    failedChecks,
    unresolvedTaskIds: pkg.taskIds,
  }, "copilot.package.verify", { passedChecks, failedChecks });
  return { package: updated, checks: normalizedChecks, reloadRequired: true };
}

export async function reconcileSeoPackage(payload) {
  const pkg = resolveSeoPackageForAction(payload);
  assertPackageStatus(pkg, ["verification-pending", "waiting-window", "review-due"], "Abgleich");
  if (!Array.isArray(payload?.activeTaskIds)) throw new SearchError("SEARCH_INVALID_DATA", { message: "Aktuelle Task-IDs des Advisor-Zeitraums fehlen." });
  const stored = readCopilotWorkspace().workPackages.find((item) => item.id === pkg.id);
  const checks = [...array(stored?.passedChecks, 10), ...array(stored?.failedChecks, 10)].map(normalizeCheck);
  const activeTaskIds = unique(array(payload?.activeTaskIds, 5_000).map((item) => clean(item, 300)).filter(Boolean), 5_000);
  const searchGeneratedAt = loadSeoDashboard().generatedAt ?? null;
  const lifecycle = resolvePackageLifecycle({
    verificationMode: pkg.verificationMode,
    verifyAfter: stored?.verifyAfter ?? pkg.verifyAfter,
    sentAt: stored?.sentAt ?? pkg.sentAt,
    taskIds: pkg.taskIds,
  }, {
    now: new Date(),
    activeTaskIds,
    checks,
    searchGeneratedAt,
  });
  const updated = persistPackage(pkg, {
    status: lifecycle.status,
    unresolvedTaskIds: lifecycle.unresolvedTaskIds,
    passedChecks: lifecycle.passedChecks,
    failedChecks: lifecycle.failedChecks,
    lastVerification: {
      checkedAt: new Date().toISOString(),
      searchGeneratedAt,
      manifest: stored?.lastVerification?.manifest ?? null,
      reason: lifecycle.reason,
    },
  }, "copilot.package.reconcile", { warnings: lifecycle.status === "verified" ? [] : [lifecycle.reason] });
  return { package: updated, reason: lifecycle.reason, reloadRequired: true };
}

export const allowedPackageVerificationCommands = (pkg) => validationCommandsFor(normalizeSeoPackageSnapshot(pkg));
