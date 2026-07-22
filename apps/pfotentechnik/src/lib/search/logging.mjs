import fs from "node:fs";
import { AUDIT_LOG_FILE, ensureSearchDirectories } from "./config.mjs";
import { redactSecrets } from "./errors.mjs";

export function searchLog(entry) {
  ensureSearchDirectories();
  const safe = sanitizeLogEntry(entry);
  fs.appendFileSync(AUDIT_LOG_FILE, `${JSON.stringify(safe)}\n`, { encoding: "utf8", mode: 0o600 });
  if (process.env.SEARCH_DEBUG === "1") console.log("[search]", safe);
}

export function sanitizeLogEntry(entry) {
  return {
    timestamp: new Date().toISOString(),
    provider: entry.provider || "system",
    action: entry.action || "unknown",
    status: entry.status || "info",
    durationMs: Number.isFinite(entry.durationMs) ? entry.durationMs : undefined,
    code: entry.code || undefined,
    message: redactSecrets(entry.message || ""),
    records: Number.isFinite(entry.records) ? entry.records : undefined,
    range: entry.range || undefined,
  };
}
