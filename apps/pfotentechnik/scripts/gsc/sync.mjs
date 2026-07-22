import fs from "node:fs";
import path from "node:path";

const appDir = process.cwd();
const gscDir = path.join(appDir, ".gsc");
const outputDir = path.join(appDir, "src", "data", "seo");
const outputFile = path.join(outputDir, "gsc-dashboard.json");
const property = process.env.GSC_PROPERTY || "sc-domain:pfotentechnik.de";
const days = Number(process.env.GSC_DAYS || 28);

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const findFirst = (files) => files.find((file) => fs.existsSync(file));
const dateOnly = (date) => date.toISOString().slice(0, 10);
const shiftDays = (date, amount) => { const d = new Date(date); d.setUTCDate(d.getUTCDate() + amount); return d; };
const round = (value, digits = 2) => { const factor = 10 ** digits; return Math.round((Number(value) + Number.EPSILON) * factor) / factor; };
const pctChange = (current, previous) => previous ? round(((current - previous) / previous) * 100, 1) : (current ? 100 : 0);

const clientFile = findFirst([path.join(gscDir, "client-secret.json"), path.join(gscDir, "client_secret.json")]);
const tokenFile = findFirst([path.join(gscDir, "token.json"), path.join(gscDir, "tokens.json"), path.join(gscDir, "oauth-token.json")]);
if (!clientFile || !tokenFile) throw new Error("GSC-Zugangsdaten fehlen. Bitte zuerst npm run gsc:setup ausführen.");

const rawClient = readJson(clientFile);
const client = rawClient.installed || rawClient.web || rawClient;
let token = readJson(tokenFile);

async function accessToken() {
  if (token.access_token && token.expiry_date && token.expiry_date > Date.now() + 60000) return token.access_token;
  if (!token.refresh_token) throw new Error("Kein refresh_token gefunden. Bitte gsc:setup erneut ausführen.");
  const body = new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, refresh_token: token.refresh_token, grant_type: "refresh_token" });
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  const data = await response.json();
  if (!response.ok) throw new Error("Token-Refresh fehlgeschlagen: " + JSON.stringify(data));
  token = { ...token, ...data, expiry_date: Date.now() + Number(data.expires_in || 3600) * 1000 };
  fs.writeFileSync(tokenFile, JSON.stringify(token, null, 2) + "\n");
  return data.access_token;
}

async function query(tokenValue, startDate, endDate, dimensions) {
  const endpoint = "https://searchconsole.googleapis.com/webmasters/v3/sites/" + encodeURIComponent(property) + "/searchAnalytics/query";
  const response = await fetch(endpoint, { method: "POST", headers: { authorization: "Bearer " + tokenValue, "content-type": "application/json" }, body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 25000, dataState: "final" }) });
  const data = await response.json();
  if (!response.ok) throw new Error("Search Console API Fehler: " + JSON.stringify(data));
  return data.rows || [];
}

function metrics(rows) {
  let clicks = 0, impressions = 0, weightedPosition = 0;
  for (const row of rows) { clicks += row.clicks || 0; impressions += row.impressions || 0; weightedPosition += (row.position || 0) * (row.impressions || 0); }
  return { clicks: round(clicks, 0), impressions: round(impressions, 0), ctr: impressions ? round(clicks / impressions * 100, 2) : 0, position: impressions ? round(weightedPosition / impressions, 2) : 0 };
}

function recommendations(row) {
  const page = row.keys?.[0] || "";
  const ctr = (row.ctr || 0) * 100;
  const position = row.position || 0;
  const impressions = row.impressions || 0;
  const result = [];
  if (impressions >= 100 && ctr < 2.5) result.push({ page, type: "ctr", priority: position <= 10 ? "high" : "medium", title: "Snippet optimieren", reason: Math.round(impressions) + " Impressionen bei nur " + round(ctr, 2) + " % CTR.", action: "Title und Meta Description stärker an Suchintention und Nutzenversprechen ausrichten." });
  if (position >= 8 && position <= 20 && impressions >= 50) result.push({ page, type: "quick-win", priority: "high", title: "Top-10-Quick-Win", reason: "Durchschnittsposition " + round(position, 1) + " bei " + Math.round(impressions) + " Impressionen.", action: "Interne Links, Content-Tiefe und passende FAQ gezielt verstärken." });
  if (position > 20 && impressions >= 250) result.push({ page, type: "content-gap", priority: "medium", title: "Suchintention nachschärfen", reason: "Hohe Sichtbarkeit, aber Position " + round(position, 1) + ".", action: "Keyword-Cluster, Abschnittsstruktur und Seitenfokus prüfen." });
  return result;
}

const end = shiftDays(new Date(), -3);
const currentStart = shiftDays(end, -(days - 1));
const previousEnd = shiftDays(currentStart, -1);
const previousStart = shiftDays(previousEnd, -(days - 1));
const auth = await accessToken();
const [currentDaily, previousDaily, pages, queries] = await Promise.all([
  query(auth, dateOnly(currentStart), dateOnly(end), ["date"]),
  query(auth, dateOnly(previousStart), dateOnly(previousEnd), ["date"]),
  query(auth, dateOnly(currentStart), dateOnly(end), ["page"]),
  query(auth, dateOnly(currentStart), dateOnly(end), ["query"]),
]);
const current = metrics(currentDaily);
const previous = metrics(previousDaily);
const pageRows = pages.map((row) => ({ page: row.keys?.[0] || "", clicks: round(row.clicks || 0, 0), impressions: round(row.impressions || 0, 0), ctr: round((row.ctr || 0) * 100, 2), position: round(row.position || 0, 2) })).sort((a,b) => b.impressions - a.impressions);
const queryRows = queries.map((row) => ({ query: row.keys?.[0] || "", clicks: round(row.clicks || 0, 0), impressions: round(row.impressions || 0, 0), ctr: round((row.ctr || 0) * 100, 2), position: round(row.position || 0, 2) })).sort((a,b) => b.impressions - a.impressions);
const priorityRank = { high: 0, medium: 1, low: 2 };

const recs = pages
  .flatMap(recommendations)
  .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
  .slice(0, 50);
const payload = { generatedAt: new Date().toISOString(), property, period: { days, startDate: dateOnly(currentStart), endDate: dateOnly(end), previousStartDate: dateOnly(previousStart), previousEndDate: dateOnly(previousEnd) }, metrics: { current, previous, change: { clicks: pctChange(current.clicks, previous.clicks), impressions: pctChange(current.impressions, previous.impressions), ctr: round(current.ctr - previous.ctr, 2), position: round(current.position - previous.position, 2) } }, pages: pageRows.slice(0,250), queries: queryRows.slice(0,250), recommendations: recs };
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2) + "\n");
console.log("GSC-Dashboard aktualisiert:", outputFile);
console.log("Zeitraum:", payload.period.startDate, "bis", payload.period.endDate);
console.log("Seiten:", payload.pages.length, "Suchanfragen:", payload.queries.length, "Empfehlungen:", payload.recommendations.length);
