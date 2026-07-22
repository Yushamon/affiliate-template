import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { URL } from "node:url";
import { RUNTIME_FILE, atomicWriteJson, loadGoogleClient, loadGoogleToken } from "./config.mjs";
import { SearchError, toPublicError } from "./errors.mjs";
import { startSearchAction, getSearchAction, getRunningActions, ALLOWED_SEARCH_ACTIONS } from "./action-service.mjs";
import { getSearchProvider } from "./provider-registry.mjs";
import { createOriginPolicy, assertJsonRequest, readJsonBody } from "./security.mjs";
import { createAuthorizationSession, exchangeAuthorizationCode, validateOAuthCallback } from "./providers/google/auth.mjs";
import { chooseGoogleProperty } from "./providers/google/setup.mjs";

const host = process.env.SEARCH_ADMIN_HOST || "127.0.0.1";
const port = Number(process.env.SEARCH_ADMIN_PORT || 4178);
const origins = createOriginPolicy();
const setupSessions = new Map();

function headers(origin, extra = {}) {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...(origin && origins.permits(origin) ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
    ...extra,
  };
}

function json(response, status, value, origin) {
  response.writeHead(status, headers(origin));
  response.end(JSON.stringify(value));
}

function publicServiceStatus() {
  return Promise.all([getSearchProvider("google").getStatus(), getSearchProvider("bing").getStatus()]).then(([google, bing]) => ({
    service: { connected: true, localOnly: host === "127.0.0.1" || host === "localhost", host, port, allowedActions: ALLOWED_SEARCH_ACTIONS, runningActions: getRunningActions() },
    providers: { google, bing },
  }));
}

function pruneSessions() {
  const now = Date.now();
  for (const [id, session] of setupSessions) if (session.expiresAt < now) setupSessions.delete(id);
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  let requestUrl;
  try {
    requestUrl = new URL(request.url || "/", `http://${host}:${port}`);
    if (request.method === "OPTIONS") {
      origins.assert(origin);
      response.writeHead(204, headers(origin, { "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "600" }));
      response.end();
      return;
    }
    origins.assert(origin);
    pruneSessions();

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/search/status") {
      json(response, 200, await publicServiceStatus(), origin); return;
    }
    if (request.method === "POST" && requestUrl.pathname === "/api/admin/search/actions") {
      assertJsonRequest(request);
      const body = await readJsonBody(request);
      const action = startSearchAction(body.action);
      json(response, 202, action, origin); return;
    }
    const actionMatch = requestUrl.pathname.match(/^\/api\/admin\/search\/actions\/([0-9a-f-]+)$/i);
    if (request.method === "GET" && actionMatch) {
      const action = getSearchAction(actionMatch[1]);
      if (!action) { json(response, 404, { error: { code: "SEARCH_ACTION_NOT_FOUND", message: "Aktion wurde nicht gefunden." } }, origin); return; }
      json(response, 200, action, origin); return;
    }
    if (request.method === "POST" && requestUrl.pathname === "/api/admin/search/google/setup/start") {
      assertJsonRequest(request); await readJsonBody(request);
      loadGoogleClient();
      const id = randomUUID();
      const redirectUri = `http://127.0.0.1:${port}/api/admin/search/google/callback`;
      const oauth = createAuthorizationSession(redirectUri);
      setupSessions.set(id, { ...oauth, id, status: "waiting", error: null, property: null });
      json(response, 201, { id, status: "waiting", authorizationUrl: oauth.authorizationUrl, expiresAt: new Date(oauth.expiresAt).toISOString() }, origin); return;
    }
    if (request.method === "GET" && requestUrl.pathname === "/api/admin/search/google/setup/status") {
      const session = setupSessions.get(requestUrl.searchParams.get("id"));
      if (!session) { json(response, 404, { error: { code: "SEARCH_OAUTH_REQUIRED", message: "Setup-Session fehlt oder ist abgelaufen." } }, origin); return; }
      json(response, 200, { id: session.id, status: session.status, property: session.property, error: session.error, expiresAt: new Date(session.expiresAt).toISOString() }, origin); return;
    }
    if (request.method === "GET" && requestUrl.pathname === "/api/admin/search/google/callback") {
      const state = requestUrl.searchParams.get("state");
      const session = [...setupSessions.values()].find((candidate) => candidate.state === state);
      if (!session || session.expiresAt < Date.now()) throw new SearchError("SEARCH_OAUTH_STATE_INVALID");
      const code = validateOAuthCallback(session, requestUrl);
      try {
        await exchangeAuthorizationCode(code, session.redirectUri, loadGoogleToken(false));
        const selected = await chooseGoogleProperty({ interactive: false });
        session.status = "succeeded"; session.property = selected.siteUrl;
        response.writeHead(200, { "content-type": "text/html; charset=utf-8", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'", "x-content-type-options": "nosniff" });
        response.end("<main style=\"font:16px system-ui;padding:32px\"><h1>Google Search Console verbunden</h1><p>Dieses Fenster kann geschlossen werden.</p></main>");
      } catch (error) {
        session.status = "failed"; session.error = toPublicError(error);
        throw error;
      }
      return;
    }
    json(response, 404, { error: { code: "SEARCH_ROUTE_NOT_FOUND", message: "Lokale Admin-Route nicht gefunden." } }, origin);
  } catch (error) {
    const safe = toPublicError(error, "SEARCH_ACTION_NOT_ALLOWED");
    const status = safe.code === "SEARCH_SYNC_ALREADY_RUNNING" ? 409 : safe.code === "SEARCH_RATE_LIMITED" ? 429 : safe.code === "SEARCH_ACTION_NOT_ALLOWED" ? 403 : 400;
    json(response, status, { error: safe }, origin);
  }
});

server.listen(port, host, () => {
  atomicWriteJson(RUNTIME_FILE, { schemaVersion: 1, host, port, startedAt: new Date().toISOString(), localOnly: host === "127.0.0.1" || host === "localhost" });
  console.log(`PfotenTechnik Search Admin: http://${host}:${port}`);
  console.log(`Erlaubte Astro-Origins: ${origins.allowed.join(", ")}`);
});

function shutdown() {
  server.close(() => {
    try { if (fs.existsSync(RUNTIME_FILE)) fs.unlinkSync(RUNTIME_FILE); } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 3000).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
