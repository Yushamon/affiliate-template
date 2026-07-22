import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SearchError } from "./errors.mjs";

export const APP_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
export const REPO_ROOT = path.resolve(APP_ROOT, "../..");
export const SEARCH_DIR = path.join(APP_ROOT, ".search");
export const LEGACY_GSC_DIR = path.join(APP_ROOT, ".gsc");
export const DATA_DIR = path.join(APP_ROOT, "src", "data", "seo");
export const REPORTS_DIR = path.join(APP_ROOT, "reports", "search");
export const TOKEN_FILE = path.join(SEARCH_DIR, "google-token.json");
export const CLIENT_FILE = path.join(SEARCH_DIR, "google-client.json");
export const GOOGLE_CONFIG_FILE = path.join(SEARCH_DIR, "google-config.json");
export const STATUS_FILE = path.join(SEARCH_DIR, "status.json");
export const AUDIT_LOG_FILE = path.join(SEARCH_DIR, "audit.log.jsonl");
export const RUNTIME_FILE = path.join(SEARCH_DIR, "admin-runtime.json");
export const READONLY_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
export const DEFAULT_PROPERTY = process.env.GOOGLE_SEARCH_PROPERTY || "sc-domain:pfotentechnik.de";
export const DEFAULT_REDIRECT_URI = process.env.GOOGLE_SEARCH_REDIRECT_URI || "http://127.0.0.1:53682/oauth2callback";

export function ensureSearchDirectories() {
  fs.mkdirSync(SEARCH_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

export function readJson(file, required = true) {
  if (!fs.existsSync(file)) {
    if (required) throw new SearchError("SEARCH_CONFIG_MISSING", { message: `Erforderliche lokale Datei fehlt: ${path.basename(file)}` });
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (cause) {
    throw new SearchError("SEARCH_INVALID_DATA", { message: `Ungültige JSON-Datei: ${path.basename(file)}`, cause });
  }
}

export function atomicWriteJson(file, value) {
  ensureSearchDirectories();
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    JSON.parse(fs.readFileSync(temporary, "utf8"));
    fs.renameSync(temporary, file);
  } catch (cause) {
    try { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); } catch {}
    throw new SearchError("SEARCH_WRITE_FAILED", { cause });
  }
}

function parseClient(raw) {
  const client = raw?.installed || raw?.web || raw;
  if (!client?.client_id || !client?.client_secret) return null;
  return { clientId: client.client_id, clientSecret: client.client_secret, redirectUris: client.redirect_uris || [] };
}

export function loadGoogleClient(required = true) {
  if (process.env.GOOGLE_SEARCH_CLIENT_ID && process.env.GOOGLE_SEARCH_CLIENT_SECRET) {
    return {
      clientId: process.env.GOOGLE_SEARCH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SEARCH_CLIENT_SECRET,
      redirectUris: process.env.GOOGLE_SEARCH_REDIRECT_URI ? [process.env.GOOGLE_SEARCH_REDIRECT_URI] : [],
      source: "environment",
    };
  }
  const candidates = [CLIENT_FILE, path.join(LEGACY_GSC_DIR, "client-secret.json"), path.join(LEGACY_GSC_DIR, "client_secret.json")];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const parsed = parseClient(readJson(file));
    if (parsed) return { ...parsed, source: path.relative(APP_ROOT, file) };
  }
  if (!required) return null;
  throw new SearchError("SEARCH_CLIENT_CREDENTIALS_MISSING");
}

export function loadGoogleToken(required = true) {
  const candidates = [TOKEN_FILE, path.join(LEGACY_GSC_DIR, "token.json")];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const token = readJson(file);
    if (token?.refresh_token || token?.access_token) return { ...token, source: path.relative(APP_ROOT, file) };
  }
  if (!required) return null;
  throw new SearchError("SEARCH_TOKEN_MISSING");
}

export function loadGoogleConfig(required = true) {
  const candidates = [GOOGLE_CONFIG_FILE, path.join(LEGACY_GSC_DIR, "config.json")];
  for (const file of candidates) if (fs.existsSync(file)) return readJson(file);
  if (!required) return null;
  throw new SearchError("SEARCH_CONFIG_MISSING");
}

export function safeSearchConfig() {
  const client = loadGoogleClient(false);
  const token = loadGoogleToken(false);
  const config = loadGoogleConfig(false);
  return {
    google: {
      clientConfigured: Boolean(client),
      tokenPresent: Boolean(token?.refresh_token || token?.access_token),
      property: config?.property || config?.siteUrl || DEFAULT_PROPERTY,
      redirectUri: DEFAULT_REDIRECT_URI,
    },
    bing: { configured: false, status: "prepared" },
  };
}
