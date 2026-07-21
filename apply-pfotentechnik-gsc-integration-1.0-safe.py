#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from datetime import datetime
import json
import shutil
import subprocess
import sys

APP = Path("apps/pfotentechnik")
ROOT_PACKAGE = Path("package.json")
APP_PACKAGE = APP / "package.json"
GSC_DIR = APP / "scripts/gsc"
CONFIG_DIR = APP / ".gsc"
REPORTS_DIR = APP / "reports"
GITIGNORE = Path(".gitignore")

FILES = {
    GSC_DIR / "config.mjs": r"""import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
""",
    GSC_DIR / "auth.mjs": r"""import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { URL } from "node:url";
import { exec } from "node:child_process";
import {
  CLIENT_FILE,
  READONLY_SCOPE,
  loadClient,
  loadToken,
  writeJson,
  TOKEN_FILE,
} from "./config.mjs";

function openBrowser(url) {
  const command =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
  exec(command, () => {});
}

async function tokenRequest(params) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`OAuth-Tokenfehler ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

export async function authorizeInteractive() {
  const client = loadClient();
  const redirectUri = "http://127.0.0.1:53682/oauth2callback";
  const state = randomBytes(24).toString("hex");

  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.searchParams.set("client_id", client.client_id);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", READONLY_SCOPE);
  authorizationUrl.searchParams.set("access_type", "offline");
  authorizationUrl.searchParams.set("prompt", "consent");
  authorizationUrl.searchParams.set("state", state);

  const code = await new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url || "/", redirectUri);
      if (url.pathname !== "/oauth2callback") {
        response.writeHead(404).end("Not found");
        return;
      }
      if (url.searchParams.get("state") !== state) {
        response.writeHead(400).end("Invalid state");
        server.close();
        reject(new Error("OAuth-State stimmt nicht überein."));
        return;
      }
      const error = url.searchParams.get("error");
      const authCode = url.searchParams.get("code");
      if (error || !authCode) {
        response.writeHead(400).end("Authorization failed");
        server.close();
        reject(new Error(`Google-Autorisierung fehlgeschlagen: ${error || "kein Code"}`));
        return;
      }
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<h1>Google Search Console verbunden</h1><p>Dieses Fenster kann geschlossen werden.</p>");
      server.close();
      resolve(authCode);
    });

    server.on("error", reject);
    server.listen(53682, "127.0.0.1", () => {
      console.log("Browser wird für die Google-Autorisierung geöffnet.");
      console.log(authorizationUrl.href);
      openBrowser(authorizationUrl.href);
    });
  });

  const token = await tokenRequest({
    code,
    client_id: client.client_id,
    client_secret: client.client_secret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const saved = {
    ...token,
    obtained_at: Date.now(),
    expires_at: Date.now() + Number(token.expires_in || 3600) * 1000,
  };
  writeJson(TOKEN_FILE, saved);
  return saved;
}

export async function getAccessToken() {
  const client = loadClient();
  const token = loadToken();
  if (token.access_token && Number(token.expires_at || 0) > Date.now() + 60_000) {
    return token.access_token;
  }
  if (!token.refresh_token) {
    throw new Error(`Kein Refresh-Token vorhanden. Erneut "npm run gsc:setup" ausführen.`);
  }
  const refreshed = await tokenRequest({
    client_id: client.client_id,
    client_secret: client.client_secret,
    refresh_token: token.refresh_token,
    grant_type: "refresh_token",
  });
  const saved = {
    ...token,
    ...refreshed,
    refresh_token: token.refresh_token,
    obtained_at: Date.now(),
    expires_at: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
  };
  writeJson(TOKEN_FILE, saved);
  return saved.access_token;
}

export { CLIENT_FILE };
""",
    GSC_DIR / "client.mjs": r"""import { getAccessToken } from "./auth.mjs";

async function request(url, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`GSC API ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

export function listSites() {
  return request("https://www.googleapis.com/webmasters/v3/sites");
}

export function getSite(siteUrl) {
  return request(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`,
  );
}

export function listSitemaps(siteUrl) {
  return request(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
  );
}

export function querySearchAnalytics(siteUrl, payload) {
  return request(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}
""",
    GSC_DIR / "setup.mjs": r"""import { copyFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { resolve } from "node:path";
import {
  CLIENT_FILE,
  CONFIG_FILE,
  ensureDirectories,
  writeJson,
} from "./config.mjs";
import { authorizeInteractive } from "./auth.mjs";
import { listSites } from "./client.mjs";

ensureDirectories();

const sourceArg = process.argv.find((value) => value.startsWith("--client="));
if (sourceArg) {
  const source = resolve(sourceArg.slice("--client=".length));
  copyFileSync(source, CLIENT_FILE);
  console.log(`OAuth-Client kopiert: ${CLIENT_FILE}`);
}

if (!existsSync(CLIENT_FILE)) {
  console.error("OAuth-Client fehlt.");
  console.error(`Lege die aus Google Cloud heruntergeladene Desktop-App-Datei hier ab:`);
  console.error(CLIENT_FILE);
  console.error("Alternativ:");
  console.error("npm run gsc:setup -- --client=/pfad/client_secret.json");
  process.exit(1);
}

await authorizeInteractive();
const result = await listSites();
const sites = (result.siteEntry || []).filter(
  (site) => site.permissionLevel !== "siteUnverifiedUser",
);

if (!sites.length) {
  throw new Error("Keine verifizierte Search-Console-Property gefunden.");
}

const rl = createInterface({ input, output });
console.log("\nVerfügbare Properties:");
sites.forEach((site, index) => {
  console.log(`${index + 1}. ${site.siteUrl} (${site.permissionLevel})`);
});
const answer = await rl.question(
  `Property auswählen [1-${sites.length}] (Standard 1): `,
);
rl.close();

const index = answer.trim() ? Number(answer.trim()) - 1 : 0;
if (!Number.isInteger(index) || !sites[index]) {
  throw new Error("Ungültige Auswahl.");
}

const selected = sites[index];
writeJson(CONFIG_FILE, {
  siteUrl: selected.siteUrl,
  permissionLevel: selected.permissionLevel,
  configuredAt: new Date().toISOString(),
});

console.log(`\nGSC eingerichtet: ${selected.siteUrl}`);
console.log("Verbindung prüfen mit: npm run gsc:test");
""",
    GSC_DIR / "test.mjs": r"""import { loadConfig } from "./config.mjs";
import { getSite, listSitemaps } from "./client.mjs";

const config = loadConfig();
const site = await getSite(config.siteUrl);
const sitemaps = await listSitemaps(config.siteUrl);

console.log("Google Search Console");
console.log("=====================");
console.log(`Property: ${site.siteUrl}`);
console.log(`Berechtigung: ${site.permissionLevel}`);
console.log(`Sitemaps: ${(sitemaps.sitemap || []).length}`);
console.log("Status: Verbindung erfolgreich");
""",
    GSC_DIR / "audit.mjs": r"""import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  REPORTS_DIR,
  ensureDirectories,
  loadConfig,
  writeJson,
} from "./config.mjs";
import { getSite, listSitemaps, querySearchAnalytics } from "./client.mjs";

function isoDate(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

ensureDirectories();
const config = loadConfig();
const [site, sitemapResult, performance] = await Promise.all([
  getSite(config.siteUrl),
  listSitemaps(config.siteUrl),
  querySearchAnalytics(config.siteUrl, {
    startDate: isoDate(30),
    endDate: isoDate(3),
    dimensions: ["date"],
    rowLimit: 25000,
    dataState: "final",
  }),
]);

const rows = performance.rows || [];
const summary = rows.reduce(
  (acc, row) => {
    acc.clicks += Number(row.clicks || 0);
    acc.impressions += Number(row.impressions || 0);
    acc.positionWeighted += Number(row.position || 0) * Number(row.impressions || 0);
    return acc;
  },
  { clicks: 0, impressions: 0, positionWeighted: 0 },
);
summary.ctr = summary.impressions ? summary.clicks / summary.impressions : 0;
summary.position = summary.impressions
  ? summary.positionWeighted / summary.impressions
  : 0;
delete summary.positionWeighted;

const sitemaps = (sitemapResult.sitemap || []).map((item) => ({
  path: item.path,
  lastSubmitted: item.lastSubmitted || null,
  isPending: Boolean(item.isPending),
  isSitemapsIndex: Boolean(item.isSitemapsIndex),
  errors: Number(item.errors || 0),
  warnings: Number(item.warnings || 0),
}));

const report = {
  generatedAt: new Date().toISOString(),
  property: site,
  period: { startDate: isoDate(30), endDate: isoDate(3) },
  summary,
  sitemaps,
  dailyRows: rows,
};

writeJson(resolve(REPORTS_DIR, "gsc-status.json"), report);

const markdown = `# Google Search Console Status

Generiert: ${report.generatedAt}

## Property

- Property: \`${site.siteUrl}\`
- Berechtigung: \`${site.permissionLevel}\`
- Zeitraum: ${report.period.startDate} bis ${report.period.endDate}

## Performance

| Kennzahl | Wert |
|---|---:|
| Klicks | ${summary.clicks.toLocaleString("de-DE")} |
| Impressionen | ${summary.impressions.toLocaleString("de-DE")} |
| CTR | ${(summary.ctr * 100).toFixed(2)} % |
| Durchschnittliche Position | ${summary.position.toFixed(2)} |

## Sitemaps

${sitemaps.length
  ? `| Sitemap | Fehler | Warnungen | Ausstehend |
|---|---:|---:|---|
${sitemaps
  .map(
    (item) =>
      `| ${item.path} | ${item.errors} | ${item.warnings} | ${item.isPending ? "Ja" : "Nein"} |`,
  )
  .join("\n")}`
  : "Keine Sitemap über die API gefunden."}

## Hinweise

- Search-Analytics-Daten können verzögert sein; deshalb endet der Zeitraum drei Tage vor dem Ausführungsdatum.
- Dieser Report nutzt ausschließlich Leserechte.
- URL-Inspection und Opportunity Engine folgen in späteren Versionen.
`;

writeFileSync(resolve(REPORTS_DIR, "gsc-status.md"), markdown, "utf8");
console.log("Erstellt:");
console.log(resolve(REPORTS_DIR, "gsc-status.md"));
console.log(resolve(REPORTS_DIR, "gsc-status.json"));
""",
}

def fail(message: str) -> None:
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)

def find_root(start: Path) -> Path:
    for candidate in (start, *start.parents):
        if (candidate / ROOT_PACKAGE).is_file() and (candidate / APP_PACKAGE).is_file():
            return candidate
    fail("Repository-Root nicht gefunden.")

def run(command: list[str], cwd: Path) -> None:
    print("$", " ".join(command))
    result = subprocess.run(command, cwd=cwd)
    if result.returncode:
        raise RuntimeError("Befehl fehlgeschlagen: " + " ".join(command))

def write_json(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

root = find_root(Path.cwd().resolve())
stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".gsc-integration-1.0-backup-{stamp}"
backup.mkdir(parents=True)

targets = [ROOT_PACKAGE, APP_PACKAGE, GITIGNORE, *FILES.keys()]
originals: dict[Path, str | None] = {}
for relative in targets:
    path = root / relative
    originals[relative] = path.read_text(encoding="utf-8") if path.exists() else None
    if path.exists():
        destination = backup / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, destination)

try:
    for relative, content in FILES.items():
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    (root / CONFIG_DIR).mkdir(parents=True, exist_ok=True)
    readme = root / CONFIG_DIR / "README.md"
    readme.write_text(
        "# Lokale Google-Search-Console-Konfiguration\n\n"
        "Die OAuth-Dateien in diesem Ordner dürfen nicht committed werden.\n",
        encoding="utf-8",
    )

    app_package_path = root / APP_PACKAGE
    app_package = json.loads(app_package_path.read_text(encoding="utf-8"))
    app_package.setdefault("scripts", {}).update({
        "gsc:setup": "node scripts/gsc/setup.mjs",
        "gsc:test": "node scripts/gsc/test.mjs",
        "gsc:audit": "node scripts/gsc/audit.mjs",
        "gsc:report": "node scripts/gsc/audit.mjs",
    })
    write_json(app_package_path, app_package)

    root_package_path = root / ROOT_PACKAGE
    root_package = json.loads(root_package_path.read_text(encoding="utf-8"))
    root_package.setdefault("scripts", {}).update({
        "gsc:setup": "npm --workspace apps/pfotentechnik run gsc:setup --",
        "gsc:test": "npm --workspace apps/pfotentechnik run gsc:test",
        "gsc:audit": "npm --workspace apps/pfotentechnik run gsc:audit",
        "gsc:report": "npm --workspace apps/pfotentechnik run gsc:report",
    })
    write_json(root_package_path, root_package)

    gitignore_path = root / GITIGNORE
    gitignore = gitignore_path.read_text(encoding="utf-8") if gitignore_path.exists() else ""
    additions = [
        "",
        "# PfotenTechnik Google Search Console OAuth",
        "apps/pfotentechnik/.gsc/client-secret.json",
        "apps/pfotentechnik/.gsc/token.json",
        "apps/pfotentechnik/.gsc/config.json",
    ]
    for line in additions[1:]:
        if line not in gitignore:
            gitignore += line + "\n"
    gitignore_path.write_text(gitignore, encoding="utf-8")

    run(["node", "--check", "apps/pfotentechnik/scripts/gsc/config.mjs"], root)
    run(["node", "--check", "apps/pfotentechnik/scripts/gsc/auth.mjs"], root)
    run(["node", "--check", "apps/pfotentechnik/scripts/gsc/client.mjs"], root)
    run(["node", "--check", "apps/pfotentechnik/scripts/gsc/setup.mjs"], root)
    run(["node", "--check", "apps/pfotentechnik/scripts/gsc/test.mjs"], root)
    run(["node", "--check", "apps/pfotentechnik/scripts/gsc/audit.mjs"], root)
    run(["npm", "run", "build:pfotentechnik"], root)

except Exception as exc:
    print(f"Installation fehlgeschlagen: {exc}", file=sys.stderr)
    print("Rollback wird ausgeführt.", file=sys.stderr)
    for relative, content in originals.items():
        path = root / relative
        if content is None:
            if path.is_file():
                path.unlink()
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
    raise SystemExit(1)

print("")
print("GSC Integration 1.0 erfolgreich installiert.")
print(f"Backup: {backup}")
print("")
print("Nächste Schritte:")
print("1. In Google Cloud die Search Console API aktivieren.")
print("2. Einen OAuth-Client vom Typ 'Desktop-App' herunterladen.")
print("3. Setup starten:")
print("   npm run gsc:setup -- --client=/pfad/client_secret.json")
print("4. Verbindung prüfen:")
print("   npm run gsc:test")
print("5. Report erzeugen:")
print("   npm run gsc:audit")
