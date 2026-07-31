import { appendCopilotAudit, readCopilotWorkspace, updateCopilotWorkspace } from "./store.mjs";
import { QUALITY_STATUSES } from "./quality-operations.mjs";

const DAY = 86_400_000;
const text = (value, maximum = 2_000) => String(value ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, maximum);

export function updateQualityFindingStatus(payload = {}) {
  const findingId = text(payload.findingId, 120);
  const status = text(payload.status, 40);
  if (!findingId || !QUALITY_STATUSES.includes(status)) throw new Error("Ungültige Finding-ID oder Status.");
  if (status === "auto-fixed") throw new Error("Auto Fixed darf nur nach einem bestandenen, sicheren Auto-Fix gesetzt werden.");
  const days = Math.min(365, Math.max(1, Number(payload.days) || 14));
  const now = new Date().toISOString();
  let updated;
  updateCopilotWorkspace((workspace) => {
    workspace.qualityFindings = workspace.qualityFindings.map((finding) => {
      if (finding.id !== findingId) return finding;
      updated = {
        ...finding,
        status,
        note: text(payload.note),
        snoozedUntil: status === "snoozed" ? new Date(Date.now() + days * DAY).toISOString() : null,
        lastChangedAt: now,
      };
      return updated;
    });
    if (!updated) throw new Error("Finding wurde nicht gefunden.");
    workspace.qualityHistory.push({
      findingId,
      occurredAt: now,
      from: readCopilotWorkspace().qualityFindings.find((item) => item.id === findingId)?.status || null,
      to: status,
      severity: updated.severity,
      source: updated.source,
      description: updated.description,
      note: updated.note,
    });
    workspace.qualityHistory = workspace.qualityHistory.slice(-5000);
    return workspace;
  });
  appendCopilotAudit({ action: "quality.finding.status", findingId, status, userApproval: true });
  return { ok: true, finding: updated, reloadRequired: true };
}

export function resolveQualityFindingForAutoFix(payload = {}) {
  const findingId = text(payload.findingId, 120);
  const finding = readCopilotWorkspace().qualityFindings.find((item) => item.id === findingId);
  if (!finding) throw new Error("Finding wurde nicht gefunden.");
  if (!finding.autoFixAvailable || finding.autoFixId !== "comparison-safe-autofix") throw new Error("Für dieses Finding ist kein freigegebener Auto-Fix verfügbar.");
  if (payload.confirm !== true) throw new Error("Der Auto-Fix benötigt eine explizite Bestätigung.");
  return finding;
}

export function markQualityFindingAutoFixed(findingId, details = {}) {
  const now = new Date().toISOString();
  let updated;
  updateCopilotWorkspace((workspace) => {
    workspace.qualityFindings = workspace.qualityFindings.map((finding) => {
      if (finding.id !== findingId) return finding;
      updated = { ...finding, status: "auto-fixed", lastChangedAt: now, lastCheckedAt: now, note: text(details.note || "Sicherer Auto-Fix und Nachprüfung erfolgreich.") };
      return updated;
    });
    if (!updated) throw new Error("Finding wurde nicht gefunden.");
    workspace.qualityHistory.push({ findingId, occurredAt: now, from: "open", to: "auto-fixed", severity: updated.severity, source: updated.source, description: updated.description });
    workspace.qualityHistory = workspace.qualityHistory.slice(-5000);
    return workspace;
  });
  appendCopilotAudit({ action: "quality.finding.auto-fix", findingId, changedFiles: details.changedFiles || [], userApproval: true });
  return updated;
}
