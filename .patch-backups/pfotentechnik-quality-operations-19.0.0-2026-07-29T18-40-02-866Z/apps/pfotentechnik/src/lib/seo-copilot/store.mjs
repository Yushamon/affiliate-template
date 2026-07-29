import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { SEARCH_DIR, atomicWriteJson, readJson } from "../search/config.mjs";
import { redactSecrets } from "../search/errors.mjs";
import { JOB_TRANSITIONS } from "./config.ts";

export const COPILOT_DIR = path.join(SEARCH_DIR, "seo-copilot");
export const WORKSPACE_FILE = path.join(COPILOT_DIR, "workspace.json");
export const AUDIT_FILE = path.join(COPILOT_DIR, "audit-log.jsonl");
export const DRAFT_DIR = path.join(COPILOT_DIR, "product-drafts");
export const COPILOT_WORKSPACE_SCHEMA_VERSION = 2;

const emptyWorkspace = () => ({
  schemaVersion: COPILOT_WORKSPACE_SCHEMA_VERSION,
  updatedAt: null,
  productCandidates: [],
  contentGaps: [],
  nicheOpportunities: [],
  productDrafts: [],
  jobs: [],
  ignoredCandidateIds: [],
  workPackages: [],
});

const array = (value) => Array.isArray(value) ? value : [];

export function migrateCopilotWorkspace(stored) {
  const base = emptyWorkspace();
  if (!stored || typeof stored !== "object") return base;
  return {
    ...base,
    ...stored,
    schemaVersion: COPILOT_WORKSPACE_SCHEMA_VERSION,
    productCandidates: array(stored.productCandidates),
    contentGaps: array(stored.contentGaps),
    nicheOpportunities: array(stored.nicheOpportunities),
    productDrafts: array(stored.productDrafts),
    jobs: array(stored.jobs),
    ignoredCandidateIds: array(stored.ignoredCandidateIds),
    workPackages: array(stored.workPackages).map((pkg) => ({
      id: String(pkg?.id || ""),
      status: pkg?.status || "open",
      createdAt: pkg?.createdAt || stored.updatedAt || null,
      updatedAt: pkg?.updatedAt || stored.updatedAt || null,
      sentAt: pkg?.sentAt ?? null,
      verifyAfter: pkg?.verifyAfter ?? null,
      snoozedUntil: pkg?.snoozedUntil ?? null,
      snoozeReason: pkg?.snoozeReason ?? null,
      verificationMode: pkg?.verificationMode || pkg?.packageSnapshot?.verificationMode || "manual",
      lastVerification: pkg?.lastVerification ?? null,
      unresolvedTaskIds: array(pkg?.unresolvedTaskIds),
      passedChecks: array(pkg?.passedChecks),
      failedChecks: array(pkg?.failedChecks),
      packageSnapshot: pkg?.packageSnapshot && typeof pkg.packageSnapshot === "object" ? pkg.packageSnapshot : undefined,
    })).filter((pkg) => pkg.id),
  };
}

export function readCopilotWorkspace() {
  return migrateCopilotWorkspace(readJson(WORKSPACE_FILE, false));
}

export function writeCopilotWorkspace(workspace) {
  fs.mkdirSync(COPILOT_DIR, { recursive: true });
  const normalized = {
    ...migrateCopilotWorkspace(workspace),
    schemaVersion: COPILOT_WORKSPACE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  atomicWriteJson(WORKSPACE_FILE, normalized);
  return normalized;
}

export function updateCopilotWorkspace(mutator) {
  const current = readCopilotWorkspace();
  const next = mutator(structuredClone(current)) ?? current;
  return writeCopilotWorkspace(next);
}

export function appendCopilotAudit(entry) {
  fs.mkdirSync(COPILOT_DIR, { recursive: true });
  const safe = JSON.parse(redactSecrets(JSON.stringify({
    id: entry.id || randomUUID(),
    occurredAt: entry.occurredAt || new Date().toISOString(),
    buildResult: "not-run",
    generatedFiles: [],
    changedFiles: [],
    warnings: [],
    sources: [],
    userApproval: false,
    ...entry,
  })));
  fs.appendFileSync(AUDIT_FILE, `${JSON.stringify(safe)}\n`, { encoding: "utf8", mode: 0o600 });
  return safe;
}

export function createCopilotJob(action, { approvalRequired = false } = {}) {
  const job = {
    id: randomUUID(),
    action,
    status: "pending",
    createdAt: new Date().toISOString(),
    progress: 0,
    currentStep: "Wartet auf Start",
    generatedFiles: [],
    changedFiles: [],
    warnings: [],
    sources: [],
    approval: { required: approvalRequired, granted: false },
  };
  updateCopilotWorkspace((workspace) => {
    workspace.jobs = [...workspace.jobs, job].slice(-200);
    return workspace;
  });
  return job;
}

export function updateCopilotJob(id, patch) {
  let updated;
  updateCopilotWorkspace((workspace) => {
    workspace.jobs = workspace.jobs.map((job) => {
      if (job.id !== id) return job;
      updated = { ...job, ...patch };
      return updated;
    });
    return workspace;
  });
  return updated;
}

export function transitionCopilotJob(job, nextStatus) {
  const allowed = JOB_TRANSITIONS[job.status] || [];
  if (!allowed.includes(nextStatus)) throw new Error(`Ungültiger Job-Übergang: ${job.status} → ${nextStatus}`);
  return {
    ...job,
    status: nextStatus,
    ...(nextStatus === "running" && !job.startedAt ? { startedAt: new Date().toISOString() } : {}),
    ...(["completed", "failed", "cancelled", "blocked"].includes(nextStatus) ? { finishedAt: new Date().toISOString() } : {}),
  };
}
