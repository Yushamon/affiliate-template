import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const APP_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const REPO_ROOT = resolve(APP_ROOT, "../..");
export const GSC_DIR = resolve(APP_ROOT, ".gsc");
export const CLIENT_FILE = resolve(GSC_DIR, "client-secret.json");
export const TOKEN_FILE = resolve(GSC_DIR, "token.json");
export const CONFIG_FILE = resolve(GSC_DIR, "config.json");
export const REPORTS_DIR = resolve(APP_ROOT, "reports");
export const READONLY_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export function ensureDirectories() {
  mkdirSync(GSC_DIR, { recursive: true });
  mkdirSync(REPORTS_DIR, { recursive: true });
}

export function readJson(path, required = true) {
  if (!existsSync(path)) {
    if (required) throw new Error(`Datei fehlt: ${path}`);
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  ensureDirectories();
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function loadClient() {
  const raw = readJson(CLIENT_FILE);
  const client = raw.installed || raw.web;
  if (!client?.client_id || !client?.client_secret) {
    throw new Error(
      "Ungültige OAuth-Datei. Erwartet wird ein Google-OAuth-Client vom Typ Desktop-App.",
    );
  }
  return client;
}

export function loadConfig(required = true) {
  return readJson(CONFIG_FILE, required);
}

export function loadToken(required = true) {
  return readJson(TOKEN_FILE, required);
}
