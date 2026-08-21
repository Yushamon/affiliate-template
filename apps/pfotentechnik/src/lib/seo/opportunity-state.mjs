import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const STATE_FILE = path.join(APP_ROOT, "reports", "seo-recovery", "opportunity-state.json");

const defaultState = () => ({
  schemaVersion: 1,
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

export function readOpportunityState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return defaultState();

    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return {
      schemaVersion: 1,
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
    schemaVersion: 1,
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
    note: String(input.note || "").trim().slice(0, 500)
  };

  writeOpportunityState(state);

  return {
    ok: true,
    entry: state.entries[page]
  };
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
