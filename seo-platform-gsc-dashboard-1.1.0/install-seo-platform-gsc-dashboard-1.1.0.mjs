#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const appDir = fs.existsSync(path.join(cwd, "apps/pfotentechnik")) ? path.join(cwd, "apps/pfotentechnik") : cwd;

const syncScript = `import fs from "node:fs";
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
  fs.writeFileSync(tokenFile, JSON.stringify(token, null, 2) + "\\n");
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
const recs = pages.flatMap(recommendations).sort((a,b) => ({high:0,medium:1,low:2}[a.priority] - ({high:0,medium:1,low:2}[b.priority])).slice(0,50);
const payload = { generatedAt: new Date().toISOString(), property, period: { days, startDate: dateOnly(currentStart), endDate: dateOnly(end), previousStartDate: dateOnly(previousStart), previousEndDate: dateOnly(previousEnd) }, metrics: { current, previous, change: { clicks: pctChange(current.clicks, previous.clicks), impressions: pctChange(current.impressions, previous.impressions), ctr: round(current.ctr - previous.ctr, 2), position: round(current.position - previous.position, 2) } }, pages: pageRows.slice(0,250), queries: queryRows.slice(0,250), recommendations: recs };
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2) + "\\n");
console.log("GSC-Dashboard aktualisiert:", outputFile);
console.log("Zeitraum:", payload.period.startDate, "bis", payload.period.endDate);
console.log("Seiten:", payload.pages.length, "Suchanfragen:", payload.queries.length, "Empfehlungen:", payload.recommendations.length);
`;

const dashboard = `---
import data from "../../../data/seo/gsc-dashboard.json";
const metrics = [
  { label: "Klicks", value: data.metrics.current.clicks.toLocaleString("de-DE"), change: data.metrics.change.clicks, suffix: "%" },
  { label: "Impressionen", value: data.metrics.current.impressions.toLocaleString("de-DE"), change: data.metrics.change.impressions, suffix: "%" },
  { label: "CTR", value: data.metrics.current.ctr.toFixed(2) + " %", change: data.metrics.change.ctr, suffix: " Pp." },
  { label: "Position", value: data.metrics.current.position.toFixed(1), change: data.metrics.change.position, suffix: "" },
];
const formatChange = (value, suffix) => (value > 0 ? "+" : "") + value.toLocaleString("de-DE") + suffix;
const changeClass = (label, change) => label === "Position" ? (change <= 0 ? "positive" : "negative") : (change >= 0 ? "positive" : "negative");
---
<!doctype html><html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="robots" content="noindex,nofollow"/><title>SEO Dashboard | PfotenTechnik</title><style>
:root{color-scheme:light dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif}body{margin:0;background:#f4f6f8;color:#17211b}main{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:32px 0 64px}header{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:24px}h1{margin:0 0 6px;font-size:clamp(1.8rem,4vw,2.8rem)}h2{margin:0 0 16px;font-size:1.25rem}p{margin:0;color:#5f6d64}.grid{display:grid;gap:16px}.metrics{grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:24px}.card{background:#fff;border:1px solid #dfe6e1;border-radius:18px;padding:20px;box-shadow:0 8px 30px rgba(23,33,27,.05)}.metric strong{display:block;margin:8px 0 4px;font-size:1.8rem}.metric small{font-weight:700}.positive{color:#16784a}.negative{color:#b42318}.columns{grid-template-columns:1.15fr .85fr;align-items:start}table{width:100%;border-collapse:collapse;font-size:.92rem}th,td{padding:12px 10px;border-bottom:1px solid #edf0ee;text-align:right;vertical-align:top}th:first-child,td:first-child{text-align:left}td:first-child{max-width:420px;overflow-wrap:anywhere}.recommendation{padding:16px 0;border-bottom:1px solid #edf0ee}.badge{display:inline-flex;border-radius:999px;padding:4px 9px;font-size:.75rem;font-weight:800;background:#fff1d6;color:#815300}.recommendation h3{margin:8px 0 6px;font-size:1rem}.recommendation p{margin-top:5px;font-size:.9rem}.meta{font-size:.86rem}@media(max-width:900px){.metrics,.columns{grid-template-columns:1fr 1fr}.columns>*{grid-column:1/-1}}@media(max-width:560px){main{width:min(100% - 20px,1180px);padding-top:20px}header{align-items:start;flex-direction:column}.metrics{grid-template-columns:1fr 1fr}.card{border-radius:14px;padding:15px}.metric strong{font-size:1.45rem}.table-wrap{overflow-x:auto}table{min-width:680px}}@media(prefers-color-scheme:dark){body{background:#101512;color:#edf4ef}p{color:#aebbb2}.card{background:#171e19;border-color:#2b352e;box-shadow:none}th,td,.recommendation{border-color:#2b352e}}
</style></head><body><main><header><div><h1>SEO Dashboard</h1><p>Google Search Console · {data.period.startDate || "noch nicht synchronisiert"} bis {data.period.endDate || "–"}</p></div><p class="meta">Letztes Update: {data.generatedAt ? new Date(data.generatedAt).toLocaleString("de-DE") : "npm run gsc:sync ausführen"}</p></header><section class="grid metrics">{metrics.map((metric)=><article class="card metric"><p>{metric.label}</p><strong>{metric.value}</strong><small class={changeClass(metric.label,metric.change)}>{formatChange(metric.change,metric.suffix)}</small></article>)}</section><section class="grid columns"><article class="card"><h2>Seiten mit der größten Sichtbarkeit</h2><div class="table-wrap"><table><thead><tr><th>Seite</th><th>Klicks</th><th>Impressionen</th><th>CTR</th><th>Position</th></tr></thead><tbody>{data.pages.slice(0,30).map((row)=><tr><td>{row.page.replace("https://www.pfotentechnik.de","")||"/"}</td><td>{row.clicks}</td><td>{row.impressions}</td><td>{row.ctr.toFixed(2)} %</td><td>{row.position.toFixed(1)}</td></tr>)}</tbody></table></div></article><article class="card"><h2>Direkte Empfehlungen</h2>{data.recommendations.length?data.recommendations.slice(0,20).map((item)=><div class="recommendation"><span class="badge">{item.priority==="high"?"Hohe Priorität":"Mittlere Priorität"}</span><h3>{item.title}</h3><p>{item.page.replace("https://www.pfotentechnik.de","")}</p><p>{item.reason}</p><p><strong>Nächster Schritt:</strong> {item.action}</p></div>):<p>Noch keine Empfehlungen. Zuerst <code>npm run gsc:sync</code> ausführen.</p>}</article></section><section class="card" style="margin-top:16px"><h2>Top-Suchanfragen</h2><div class="table-wrap"><table><thead><tr><th>Suchanfrage</th><th>Klicks</th><th>Impressionen</th><th>CTR</th><th>Position</th></tr></thead><tbody>{data.queries.slice(0,50).map((row)=><tr><td>{row.query}</td><td>{row.clicks}</td><td>{row.impressions}</td><td>{row.ctr.toFixed(2)} %</td><td>{row.position.toFixed(1)}</td></tr>)}</tbody></table></div></section></main></body></html>`;

const seed = JSON.stringify({generatedAt:null,property:"sc-domain:pfotentechnik.de",period:{days:28,startDate:null,endDate:null,previousStartDate:null,previousEndDate:null},metrics:{current:{clicks:0,impressions:0,ctr:0,position:0},previous:{clicks:0,impressions:0,ctr:0,position:0},change:{clicks:0,impressions:0,ctr:0,position:0}},pages:[],queries:[],recommendations:[]}, null, 2) + "\n";

const files = {
  "scripts/gsc/sync.mjs": syncScript,
  "src/data/seo/gsc-dashboard.json": seed,
  "src/pages/admin/seo/index.astro": dashboard,
};

for (const [relative, content] of Object.entries(files)) {
  const target = path.join(appDir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) fs.copyFileSync(target, target + ".bak-seo-platform-1.1.0");
  fs.writeFileSync(target, content, "utf8");
  console.log("geschrieben:", path.relative(cwd, target));
}

const packageFile = path.join(appDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
pkg.scripts ||= {};
pkg.scripts["gsc:sync"] = "node scripts/gsc/sync.mjs";
pkg.scripts["seo:sync"] = "npm run gsc:sync";
fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2) + "\n");

const rootPackageFile = path.join(cwd, "package.json");
if (rootPackageFile !== packageFile && fs.existsSync(rootPackageFile)) {
  const rootPkg = JSON.parse(fs.readFileSync(rootPackageFile, "utf8"));
  rootPkg.scripts ||= {};
  rootPkg.scripts["gsc:sync"] = "npm --workspace apps/pfotentechnik run gsc:sync";
  rootPkg.scripts["seo:sync"] = "npm --workspace apps/pfotentechnik run seo:sync";
  fs.writeFileSync(rootPackageFile, JSON.stringify(rootPkg, null, 2) + "\n");
}

const gitignoreFile = path.join(cwd, ".gitignore");
let gitignore = fs.existsSync(gitignoreFile) ? fs.readFileSync(gitignoreFile, "utf8") : "";
for (const rule of ["apps/pfotentechnik/.gsc/", ".gsc/", "client_secret_*.json"]) {
  if (!gitignore.split(/\r?\n/).includes(rule)) gitignore += "\n" + rule;
}
fs.writeFileSync(gitignoreFile, gitignore.trimEnd() + "\n");

console.log("\nSEO Platform GSC Dashboard 1.1.0 installiert.");
console.log("Danach ausführen:");
console.log("  npm run gsc:sync");
console.log("  npm run build:pfotentechnik");
console.log("Dashboard: /admin/seo/");
