import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { google } from "googleapis";
import {
  DEFAULT_REDIRECT_URI,
  READONLY_SCOPE,
  TOKEN_FILE,
  atomicWriteJson,
  loadGoogleClient,
  loadGoogleToken,
} from "../../config.mjs";
import { SearchError } from "../../errors.mjs";

function createOAuthClient(redirectUri = DEFAULT_REDIRECT_URI) {
  const client = loadGoogleClient();
  return new google.auth.OAuth2(client.clientId, client.clientSecret, redirectUri);
}

function normalizedToken(token) {
  const { source: _source, ...safeToken } = token || {};
  if (safeToken.expires_at && !safeToken.expiry_date) safeToken.expiry_date = safeToken.expires_at;
  return safeToken;
}

export function createAuthorizationSession(redirectUri = DEFAULT_REDIRECT_URI) {
  const oauth = createOAuthClient(redirectUri);
  const state = randomBytes(32).toString("base64url");
  const authorizationUrl = oauth.generateAuthUrl({
    access_type: "offline",
    scope: [READONLY_SCOPE],
    prompt: "consent",
    state,
    include_granted_scopes: true,
  });
  return { state, redirectUri, authorizationUrl, createdAt: Date.now(), expiresAt: Date.now() + 10 * 60_000 };
}

export function validateOAuthCallback(session, requestUrl, now = Date.now()) {
  if (!session || session.expiresAt < now) throw new SearchError("SEARCH_OAUTH_REQUIRED", { message: "OAuth-Session fehlt oder ist abgelaufen." });
  const url = requestUrl instanceof URL ? requestUrl : new URL(requestUrl, session.redirectUri);
  if (url.searchParams.get("state") !== session.state) throw new SearchError("SEARCH_OAUTH_STATE_INVALID");
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  if (!code || oauthError) throw new SearchError("SEARCH_OAUTH_REQUIRED", { message: `Google-Autorisierung fehlgeschlagen: ${oauthError || "kein Code"}` });
  return code;
}

export async function exchangeAuthorizationCode(code, redirectUri, previousToken = null) {
  const oauth = createOAuthClient(redirectUri);
  let response;
  try {
    response = await oauth.getToken(code);
  } catch (cause) {
    throw new SearchError("SEARCH_OAUTH_REQUIRED", { message: "Der Google-Autorisierungscode konnte nicht eingelöst werden.", cause });
  }
  const credentials = {
    ...normalizedToken(previousToken),
    ...response.tokens,
    refresh_token: response.tokens.refresh_token || previousToken?.refresh_token,
    obtained_at: Date.now(),
  };
  if (!credentials.refresh_token) {
    throw new SearchError("SEARCH_TOKEN_MISSING", { message: "Google hat kein Refresh-Token geliefert. Entferne den App-Zugriff im Google-Konto und verbinde erneut." });
  }
  atomicWriteJson(TOKEN_FILE, credentials);
  return credentials;
}

export async function getAuthorizedClient({ forceRefresh = false } = {}) {
  const token = normalizedToken(loadGoogleToken());
  const oauth = createOAuthClient();
  const credentials = forceRefresh && token.refresh_token
    ? { refresh_token: token.refresh_token, expiry_date: 0 }
    : token;
  oauth.setCredentials(credentials);
  oauth.on("tokens", (fresh) => {
    atomicWriteJson(TOKEN_FILE, {
      ...token,
      ...fresh,
      refresh_token: fresh.refresh_token || token.refresh_token,
      obtained_at: Date.now(),
    });
  });
  try {
    const access = await oauth.getAccessToken();
    if (!access?.token) throw new Error("Kein Access Token geliefert");
  } catch (cause) {
    throw new SearchError("SEARCH_TOKEN_REFRESH_FAILED", { cause });
  }
  return oauth;
}

function openBrowser(url) {
  const commands = process.platform === "win32"
    ? [["rundll32.exe", ["url.dll,FileProtocolHandler", url]]]
    : process.platform === "darwin"
      ? [["open", [url]]]
      : [["xdg-open", [url]]];
  const [command, args] = commands[0];
  const child = execFile(command, args, { windowsHide: true }, () => {});
  child.unref();
}

export async function runInteractiveAuthorization({ timeoutMs = 5 * 60_000 } = {}) {
  const configured = new URL(DEFAULT_REDIRECT_URI);
  if (configured.hostname !== "127.0.0.1" && configured.hostname !== "localhost") {
    throw new SearchError("SEARCH_CONFIG_MISSING", { message: "Der lokale OAuth-Redirect muss auf 127.0.0.1 oder localhost zeigen." });
  }

  return new Promise((resolve, reject) => {
    let session;
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close();
      error ? reject(error) : resolve(result);
    };
    const server = createServer(async (request, response) => {
      const requestUrl = new URL(request.url || "/", session?.redirectUri || DEFAULT_REDIRECT_URI);
      if (!session || requestUrl.pathname !== new URL(session.redirectUri).pathname) {
        response.writeHead(404).end("Not found");
        return;
      }
      try {
        const code = validateOAuthCallback(session, requestUrl);
        const token = await exchangeAuthorizationCode(code, session.redirectUri, loadGoogleToken(false));
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end("<h1>Google Search Console verbunden</h1><p>Dieses Fenster kann geschlossen werden.</p>");
        finish(null, token);
      } catch (error) {
        response.writeHead(error?.code === "SEARCH_OAUTH_STATE_INVALID" ? 400 : 500, { "content-type": "text/plain; charset=utf-8" }).end(error?.code === "SEARCH_OAUTH_STATE_INVALID" ? "Ungültiger OAuth-State." : "Token konnte nicht gespeichert werden.");
        finish(error);
      }
    });
    server.on("error", (cause) => finish(new SearchError("SEARCH_OAUTH_REQUIRED", { message: "Der lokale OAuth-Callback konnte nicht gestartet werden.", cause })));
    const requestedPort = Number(configured.port || 53682);
    server.listen(requestedPort, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : requestedPort;
      const redirectUri = `http://127.0.0.1:${port}${configured.pathname}`;
      session = createAuthorizationSession(redirectUri);
      console.log("Google-Autorisierung im Browser öffnen:");
      console.log(session.authorizationUrl);
      openBrowser(session.authorizationUrl);
    });
    const timer = setTimeout(() => finish(new SearchError("SEARCH_ACTION_TIMEOUT", { message: "OAuth-Setup nach fünf Minuten beendet." })), timeoutMs);
  });
}
