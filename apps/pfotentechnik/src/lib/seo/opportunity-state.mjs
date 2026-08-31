import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const STATE_FILE = path.join(APP_ROOT, "reports", "seo-recovery", "opportunity-state.json");

const defaultState = () => ({
  schemaVersion: 2,
  updatedAt: "",
  entries: {}
});

export const normalizeOpportunityPage = (value) => {
  const raw = String(value || "").trim();
  if (!raw) throw new Error("Opportunity-URL fehlt.");

  let pathname = raw;
  try {
    pathname = new URL(raw, "https://pfotentechnik.de").pathname;
  } catch {}

  pathname = ("/" + pathname)
    .replace(/\/+/g, "/")
    .replace(/\/+$/, "");

  return pathname ? pathname + "/" : "/";
};

const finite = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeBaseline = (value = {}) => ({
  clicks: finite(value.clicks),
  impressions: finite(value.impressions),
  ctr: finite(value.ctr),
  position: finite(value.position)
});

export const evaluateOpportunityMetrics = (baseline, current) => {
  const impressionDelta = baseline.impressions
    ? Number((((current.impressions - baseline.impressions) / baseline.impressions) * 100).toFixed(1))
    : 0;
  const clickDelta = current.clicks - baseline.clicks;
  const ctrDelta = Number((current.ctr - baseline.ctr).toFixed(2));
  const positionDelta = Number((baseline.position - current.position).toFixed(1));
  const sufficientData = baseline.impressions >= 10 && current.impressions >= 10;
  const deltas = { impressions: impressionDelta, clicks: clickDelta, ctr: ctrDelta, position: positionDelta };
  if (!sufficientData) return {
    status: "insufficient-data",
    sufficientData,
    deltas,
    reason: "Für eine belastbare Bewertung fehlen vor oder nach der Änderung mindestens zehn Impressionen.",
  };
  const positive = Number(impressionDelta >= 20) + Number(clickDelta > 0) + Number(ctrDelta >= 0.5) + Number(positionDelta >= 1);
  const negative = Number(impressionDelta <= -20) + Number(clickDelta < 0) + Number(ctrDelta <= -0.5) + Number(positionDelta <= -1);
  const status = positive >= 2 ? "improved" : negative >= 2 ? "declined" : "neutral";
  return {
    status,
    sufficientData,
    deltas,
    reason: status === "improved"
      ? "Mindestens zwei belastbare positive Metriksignale liegen vor."
      : status === "declined"
        ? "Mindestens zwei belastbare negative Metriksignale liegen vor."
        : "Die Metriken zeigen noch kein eindeutiges Ergebnis.",
  };
};

export function readOpportunityState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return defaultState();

    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return {
      schemaVersion: 2,
      updatedAt: String(parsed?.updatedAt || ""),
      entries:
        parsed?.entries && typeof parsed.entries === "object"
          ? parsed.entries
          : {}
    };
  } catch {
    return defaultState();
  }
}

function writeOpportunityState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });

  const next = {
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
    entries: state.entries || {}
  };

  const temp = `${STATE_FILE}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, JSON.stringify(next, null, 2) + "\n", "utf8");
  fs.renameSync(temp, STATE_FILE);

  return next;
}

export function isOpportunityObserving(entry, now = Date.now()) {
  if (!entry?.observeUntil) return false;

  const until = new Date(entry.observeUntil).getTime();
  return Number.isFinite(until) && until > now;
}

export async function getOpportunityState() {
  return readOpportunityState();
}

export async function markOpportunityOptimized(input = {}) {
  const page = normalizeOpportunityPage(input.page);

  const rawObserveDays = Number(input.observeDays ?? 21);
  const observeDays = Math.max(
    7,
    Math.min(
      90,
      Number.isFinite(rawObserveDays) ? Math.round(rawObserveDays) : 21
    )
  );

  const now = new Date();
  const observeUntil = new Date(now.getTime() + observeDays * 86_400_000);
  const state = readOpportunityState();

  state.entries[page] = {
    page,
    status: "observing",
    optimizedAt: now.toISOString(),
    observeUntil: observeUntil.toISOString(),
    observeDays,
    baseline: normalizeBaseline(input.baseline),
    note: String(input.note || "").trim().slice(0, 500),
    measurements: [],
    outcome: null,
  };

  writeOpportunityState(state);

  return {
    ok: true,
    entry: state.entries[page]
  };
}

export async function evaluateOpportunityOutcome(input = {}, { now = new Date() } = {}) {
  const page = normalizeOpportunityPage(input.page);
  const state = readOpportunityState();
  const entry = state.entries[page];
  if (!entry) throw new Error("Opportunity wurde nicht gefunden.");
  const observationEnd = new Date(entry.observeUntil).getTime();
  if (!Number.isFinite(observationEnd) || now.getTime() < observationEnd) {
    return { ok: true, pending: true, entry, reason: "Das Beobachtungsfenster ist noch nicht abgeschlossen." };
  }
  const current = normalizeBaseline(input.current);
  const result = evaluateOpportunityMetrics(normalizeBaseline(entry.baseline), current);
  const measuredAt = String(input.measuredAt || now.toISOString());
  const measurement = { measuredAt, current, ...result };
  const measurements = [
    ...(Array.isArray(entry.measurements) ? entry.measurements.filter((item) => item?.measuredAt !== measuredAt) : []),
    measurement,
  ].slice(-20);
  state.entries[page] = { ...entry, status: result.status, measurements, outcome: measurement, evaluatedAt: measuredAt };
  writeOpportunityState(state);
  return { ok: true, pending: false, entry: state.entries[page], outcome: measurement };
}

export async function reopenOpportunity(input = {}) {
  const page = normalizeOpportunityPage(input.page);
  const state = readOpportunityState();
  const existed = Boolean(state.entries[page]);

  delete state.entries[page];
  writeOpportunityState(state);

  return {
    ok: true,
    page,
    reopened: existed
  };
}

export { STATE_FILE as opportunityStateFile };
