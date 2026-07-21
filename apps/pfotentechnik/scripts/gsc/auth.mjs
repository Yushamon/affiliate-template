import { createServer } from "node:http";
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
