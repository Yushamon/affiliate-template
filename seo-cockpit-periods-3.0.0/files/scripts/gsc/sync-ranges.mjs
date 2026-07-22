#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const appDir = process.cwd();
const outDir = path.join(appDir, "src/data/seo");
const preferredProperty = process.env.GSC_PROPERTY || "sc-domain:pfotentechnik.de";

function walk(dir, depth = 0) {
  if (depth > 5 || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", ".git", "dist", ".astro"].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full, depth + 1) : [full];
  });
}
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}
function findAuth() {
  let client;
  let token;
  for (const file of walk(appDir).filter((f) => f.endsWith(".json"))) {
    const json = readJson(file);
    const config = json?.installed || json?.web;
    if (!client && config?.client_id && config?.client_secret) client = config;
    if (!token && (json?.refresh_token || json?.access_token)) token = json;
  }
  if (!client || !token) {
    throw new Error("OAuth-Client oder GSC-Token wurde in apps/pfotentechnik nicht gefunden.");
  }
  return { client, token };
}
const iso = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};
const pct = (current, previous) =>
  previous ? Number((((current - previous) / previous) * 100).toFixed(1)) : current ? 100 : 0;

function totals(rows = []) {
  let clicks = 0, impressions = 0, weightedPosition = 0;
  for (const row of rows) {
    clicks += row.clicks || 0;
    impressions += row.impressions || 0;
    weightedPosition += (row.position || 0) * (row.impressions || 0);
  }
  return {
    clicks: Math.round(clicks),
    impressions: Math.round(impressions),
    ctr: impressions ? Number((clicks / impressions * 100).toFixed(2)) : 0,
    position: impressions ? Number((weightedPosition / impressions).toFixed(1)) : 0,
  };
}
function rowsToObjects(rows = [], field) {
  return rows.map((row) => ({
    [field]: row.keys?.[0] || "",
    clicks: Math.round(row.clicks || 0),
    impressions: Math.round(row.impressions || 0),
    ctr: Number(((row.ctr || 0) * 100).toFixed(2)),
    position: Number((row.position || 0).toFixed(1)),
  }));
}
async function query(api, siteUrl, body) {
  const response = await api.searchanalytics.query({ siteUrl, requestBody: body });
  return response.data;
}
async function loadRange(api, siteUrl, key, days, fresh = false) {
  const now = new Date();
  const end = fresh ? now : addDays(now, -1);
  const start = addDays(end, -(days - 1));
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(days - 1));
  const common = { type: "web", dataState: "all", rowLimit: 25000 };

  const [currentRaw, previousRaw, pageRaw, queryRaw, trendRaw] = await Promise.all([
    query(api, siteUrl, { ...common, startDate: iso(start), endDate: iso(end) }),
    query(api, siteUrl, { ...common, startDate: iso(previousStart), endDate: iso(previousEnd) }),
    query(api, siteUrl, { ...common, startDate: iso(start), endDate: iso(end), dimensions: ["page"] }),
    query(api, siteUrl, { ...common, startDate: iso(start), endDate: iso(end), dimensions: ["query"] }),
    query(api, siteUrl, { ...common, startDate: iso(start), endDate: iso(end), dimensions: ["date"] }),
  ]);

  const current = totals(currentRaw.rows);
  const previous = totals(previousRaw.rows);
  const labels = {
    "24h": "Letzte 24 Stunden",
    "7d": "Letzte 7 Tage",
    "28d": "Letzte 28 Tage",
    "3m": "Letzte 3 Monate",
    "6m": "Letzte 6 Monate",
    "12m": "Letzte 12 Monate",
  };

  const dataset = {
    key,
    label: labels[key],
    startDate: iso(start),
    endDate: iso(end),
    comparisonStartDate: iso(previousStart),
    comparisonEndDate: iso(previousEnd),
    partial: fresh || Boolean(currentRaw.metadata?.first_incomplete_date),
    metrics: {
      current,
      previous,
      change: {
        clicks: pct(current.clicks, previous.clicks),
        impressions: pct(current.impressions, previous.impressions),
        ctr: Number((current.ctr - previous.ctr).toFixed(2)),
        position: Number((previous.position - current.position).toFixed(1)),
      },
    },
    pages: rowsToObjects(pageRaw.rows, "page"),
    queries: rowsToObjects(queryRaw.rows, "query"),
    trend: rowsToObjects(trendRaw.rows, "date"),
  };

  const rank = { high: 0, medium: 1, low: 2 };
  dataset.recommendations = dataset.pages.flatMap((row) => {
    const result = [];
    if (row.position >= 8 && row.position <= 20 && row.impressions >= 20) {
      result.push({
        priority: "high",
        title: "Top-10-Chance",
        page: row.page,
        reason: row.impressions + " Impressionen bei Position " + row.position.toFixed(1),
        action: "Inhalt erweitern und 3–5 passende interne Links setzen.",
      });
    }
    if (row.impressions >= 50 && row.position <= 15 && row.ctr < 2.5) {
      result.push({
        priority: "medium",
        title: "CTR-Chance",
        page: row.page,
        reason: row.impressions + " Impressionen bei " + row.ctr.toFixed(2) + " % CTR",
        action: "Title und Description stärker auf Suchintention und Nutzen ausrichten.",
      });
    }
    return result;
  }).sort((a, b) => rank[a.priority] - rank[b.priority]).slice(0, 100);

  return dataset;
}

async function main() {
  const { client, token } = findAuth();
  const auth = new google.auth.OAuth2(client.client_id, client.client_secret, client.redirect_uris?.[0]);
  auth.setCredentials(token);
  const api = google.searchconsole({ version: "v1", auth });

  const sites = await api.sites.list();
  const available = (sites.data.siteEntry || []).map((site) => site.siteUrl);
  const siteUrl = available.includes(preferredProperty)
    ? preferredProperty
    : available.find((site) => site.includes("pfotentechnik.de")) || available[0];
  if (!siteUrl) throw new Error("Keine Search-Console-Property verfügbar.");

  const definitions = [
    ["24h", 1, true],
    ["7d", 7, false],
    ["28d", 28, false],
    ["3m", 90, false],
    ["6m", 180, false],
    ["12m", 365, false],
  ];

  const ranges = {};
  for (const [key, days, fresh] of definitions) {
    console.log("Lade", key, "...");
    ranges[key] = await loadRange(api, siteUrl, key, days, fresh);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    property: siteUrl,
    defaultRange: "7d",
    ranges,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "gsc-dashboard-ranges.json"), JSON.stringify(payload, null, 2) + "\n");
  fs.writeFileSync(path.join(outDir, "gsc-dashboard.json"), JSON.stringify({
    generatedAt: payload.generatedAt,
    property: payload.property,
    range: "7d",
    ...ranges["7d"],
  }, null, 2) + "\n");

  console.log("Fertig: src/data/seo/gsc-dashboard-ranges.json");
}
main().catch((error) => {
  console.error("GSC Multi-Range Sync fehlgeschlagen:");
  console.error(error?.response?.data || error);
  process.exit(1);
});
