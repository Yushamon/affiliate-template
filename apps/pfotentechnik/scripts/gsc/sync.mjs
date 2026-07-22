#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const appDir = process.cwd();
const dataDir = path.join(appDir, "src/data/seo");
const propertyPreference = process.env.GSC_PROPERTY || "sc-domain:pfotentechnik.de";
const rowLimit = Math.min(Number(process.env.GSC_ROW_LIMIT || 25000), 25000);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function existingFile(candidates) {
  return candidates.find((file) => fs.existsSync(file));
}

function walk(dir, depth = 0) {
  if (!fs.existsSync(dir) || depth > 5) return [];
  const result = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", ".astro", "dist", "coverage"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full, depth + 1));
    else result.push(full);
  }
  return result;
}

function findOAuthFiles() {
  const explicitClient = process.env.GSC_CLIENT_FILE
    ? path.resolve(process.env.GSC_CLIENT_FILE)
    : null;
  const explicitToken = process.env.GSC_TOKEN_FILE
    ? path.resolve(process.env.GSC_TOKEN_FILE)
    : null;

  const commonClient = existingFile([
    explicitClient,
    path.join(appDir, ".gsc/client-secret.json"),
    path.join(appDir, ".gsc/client_secret.json"),
    path.join(appDir, ".gsc/client.json"),
    path.join(appDir, "client-secret.json"),
    path.join(appDir, "client_secret.json"),
  ].filter(Boolean));

  const commonToken = existingFile([
    explicitToken,
    path.join(appDir, ".gsc/token.json"),
    path.join(appDir, ".gsc/tokens.json"),
    path.join(appDir, "token.json"),
  ].filter(Boolean));

  if (commonClient && commonToken) {
    return { clientFile: commonClient, tokenFile: commonToken };
  }

  let clientFile = commonClient;
  let tokenFile = commonToken;

  for (const file of walk(appDir).filter((file) => file.endsWith(".json"))) {
    const json = readJson(file);
    if (!json) continue;

    const oauthConfig = json.installed || json.web;
    if (!clientFile && oauthConfig?.client_id && oauthConfig?.client_secret) {
      clientFile = file;
    }

    if (!tokenFile && (json.refresh_token || json.access_token)) {
      tokenFile = file;
    }

    if (clientFile && tokenFile) break;
  }

  if (!clientFile || !tokenFile) {
    throw new Error(
      [
        "GSC-OAuth-Dateien wurden nicht gefunden.",
        "Erwartet werden beispielsweise:",
        "  .gsc/client-secret.json",
        "  .gsc/token.json",
        "Alternativ GSC_CLIENT_FILE und GSC_TOKEN_FILE als Umgebungsvariablen setzen.",
      ].join("\n")
    );
  }

  return { clientFile, tokenFile };
}

function createAuth() {
  const { clientFile, tokenFile } = findOAuthFiles();
  const clientJson = readJson(clientFile);
  const tokenJson = readJson(tokenFile);
  const config = clientJson?.installed || clientJson?.web;

  if (!config?.client_id || !config?.client_secret) {
    throw new Error(`Ungültige OAuth-Client-Datei: ${clientFile}`);
  }

  if (!tokenJson?.refresh_token && !tokenJson?.access_token) {
    throw new Error(`Ungültige OAuth-Token-Datei: ${tokenFile}`);
  }

  const auth = new google.auth.OAuth2(
    config.client_id,
    config.client_secret,
    config.redirect_uris?.[0]
  );
  auth.setCredentials(tokenJson);

  return {
    auth,
    clientFile: path.relative(appDir, clientFile),
    tokenFile: path.relative(appDir, tokenFile),
  };
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function percentChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function summarize(rows = []) {
  let clicks = 0;
  let impressions = 0;
  let weightedPosition = 0;

  for (const row of rows) {
    const rowClicks = Number(row.clicks || 0);
    const rowImpressions = Number(row.impressions || 0);
    clicks += rowClicks;
    impressions += rowImpressions;
    weightedPosition += Number(row.position || 0) * rowImpressions;
  }

  return {
    clicks: Math.round(clicks),
    impressions: Math.round(impressions),
    ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
    position: impressions ? Number((weightedPosition / impressions).toFixed(1)) : 0,
  };
}

function normalizeRows(rows = [], field, keyIndex = 0) {
  return rows.map((row) => ({
    [field]: row.keys?.[keyIndex] || "",
    clicks: Math.round(Number(row.clicks || 0)),
    impressions: Math.round(Number(row.impressions || 0)),
    ctr: Number((Number(row.ctr || 0) * 100).toFixed(2)),
    position: Number(Number(row.position || 0).toFixed(1)),
  }));
}

function buildRecommendations(pages = []) {
  const recommendations = [];

  for (const page of pages) {
    if (page.position >= 8 && page.position <= 20 && page.impressions >= 20) {
      recommendations.push({
        priority: "high",
        type: "quick-win",
        title: "Top-10-Chance",
        page: page.page,
        reason: `${page.impressions} Impressionen bei Position ${page.position.toFixed(1)}`,
        action: "Suchintention vertiefen und passende interne Links aus Hubs oder Cornerstones setzen.",
      });
    }

    if (page.impressions >= 50 && page.position <= 15 && page.ctr < 2.5) {
      recommendations.push({
        priority: "medium",
        type: "ctr",
        title: "Snippet optimieren",
        page: page.page,
        reason: `${page.impressions} Impressionen bei ${page.ctr.toFixed(2)} % CTR`,
        action: "Title und Description stärker auf Nutzen, Suchintention und Differenzierung ausrichten.",
      });
    }
  }

  const priorityRank = { high: 0, medium: 1, low: 2 };
  return recommendations
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, 100);
}

async function query(api, siteUrl, requestBody) {
  const response = await api.searchanalytics.query({ siteUrl, requestBody });
  return response.data || {};
}

async function loadStandardRange(api, siteUrl, key, label, days) {
  const now = new Date();
  const end = addDays(now, -1);
  const start = addDays(end, -(days - 1));
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(days - 1));

  const base = {
    type: "web",
    dataState: "all",
    rowLimit,
  };

  const [currentRaw, previousRaw, pagesRaw, queriesRaw, trendRaw] = await Promise.all([
    query(api, siteUrl, {
      ...base,
      startDate: isoDate(start),
      endDate: isoDate(end),
    }),
    query(api, siteUrl, {
      ...base,
      startDate: isoDate(previousStart),
      endDate: isoDate(previousEnd),
    }),
    query(api, siteUrl, {
      ...base,
      startDate: isoDate(start),
      endDate: isoDate(end),
      dimensions: ["page"],
    }),
    query(api, siteUrl, {
      ...base,
      startDate: isoDate(start),
      endDate: isoDate(end),
      dimensions: ["query"],
    }),
    query(api, siteUrl, {
      ...base,
      startDate: isoDate(start),
      endDate: isoDate(end),
      dimensions: ["date"],
    }),
  ]);

  const current = summarize(currentRaw.rows);
  const previous = summarize(previousRaw.rows);
  const pages = normalizeRows(pagesRaw.rows, "page");
  const queries = normalizeRows(queriesRaw.rows, "query");
  const trend = normalizeRows(trendRaw.rows, "date");

  return {
    key,
    label,
    startDate: isoDate(start),
    endDate: isoDate(end),
    comparisonStartDate: isoDate(previousStart),
    comparisonEndDate: isoDate(previousEnd),
    dataState: "all",
    partial: Boolean(currentRaw.metadata?.first_incomplete_date),
    metrics: {
      current,
      previous,
      change: {
        clicks: percentChange(current.clicks, previous.clicks),
        impressions: percentChange(current.impressions, previous.impressions),
        ctr: Number((current.ctr - previous.ctr).toFixed(2)),
        position: Number((previous.position - current.position).toFixed(1)),
      },
    },
    pages,
    queries,
    trend,
    recommendations: buildRecommendations(pages),
  };
}

function rowTimestamp(row) {
  const date = row.keys?.[0];
  const hour = row.keys?.[1];
  if (!date || hour === undefined) return NaN;
  return Date.parse(`${date}T${String(hour).padStart(2, "0")}:00:00Z`);
}

function aggregateHourlyRows(rows, dimensionIndex, cutoffStart, cutoffEnd) {
  const map = new Map();

  for (const row of rows || []) {
    const timestamp = rowTimestamp(row);
    if (!Number.isFinite(timestamp) || timestamp < cutoffStart || timestamp >= cutoffEnd) continue;

    const key = row.keys?.[dimensionIndex];
    if (!key) continue;

    const current = map.get(key) || { clicks: 0, impressions: 0, weightedPosition: 0 };
    const impressions = Number(row.impressions || 0);
    current.clicks += Number(row.clicks || 0);
    current.impressions += impressions;
    current.weightedPosition += Number(row.position || 0) * impressions;
    map.set(key, current);
  }

  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      clicks: Math.round(value.clicks),
      impressions: Math.round(value.impressions),
      ctr: value.impressions
        ? Number(((value.clicks / value.impressions) * 100).toFixed(2))
        : 0,
      position: value.impressions
        ? Number((value.weightedPosition / value.impressions).toFixed(1))
        : 0,
    }))
    .sort((a, b) => b.impressions - a.impressions);
}

async function load24Hours(api, siteUrl) {
  const now = Date.now();
  const currentStart = now - 24 * 60 * 60 * 1000;
  const previousStart = currentStart - 24 * 60 * 60 * 1000;

  const startDate = isoDate(new Date(previousStart));
  const endDate = isoDate(new Date(now));

  const base = {
    type: "web",
    dataState: "hourly_all",
    startDate,
    endDate,
    rowLimit,
  };

  const [hourlyRaw, pagesRaw, queriesRaw] = await Promise.all([
    query(api, siteUrl, { ...base, dimensions: ["date", "hour"] }),
    query(api, siteUrl, { ...base, dimensions: ["date", "hour", "page"] }),
    query(api, siteUrl, { ...base, dimensions: ["date", "hour", "query"] }),
  ]);

  const currentHourly = aggregateHourlyRows(hourlyRaw.rows, 0, currentStart, now);
  const previousHourly = aggregateHourlyRows(hourlyRaw.rows, 0, previousStart, currentStart);
  const current = summarize(currentHourly);
  const previous = summarize(previousHourly);

  const pages = aggregateHourlyRows(pagesRaw.rows, 2, currentStart, now)
    .map(({ key, ...values }) => ({ page: key, ...values }));
  const queries = aggregateHourlyRows(queriesRaw.rows, 2, currentStart, now)
    .map(({ key, ...values }) => ({ query: key, ...values }));

  const trend = (hourlyRaw.rows || [])
    .filter((row) => {
      const timestamp = rowTimestamp(row);
      return Number.isFinite(timestamp) && timestamp >= currentStart && timestamp < now;
    })
    .map((row) => ({
      date: `${row.keys?.[0]}T${String(row.keys?.[1]).padStart(2, "0")}:00:00Z`,
      clicks: Math.round(Number(row.clicks || 0)),
      impressions: Math.round(Number(row.impressions || 0)),
      ctr: Number((Number(row.ctr || 0) * 100).toFixed(2)),
      position: Number(Number(row.position || 0).toFixed(1)),
    }));

  return {
    key: "24h",
    label: "Letzte 24 Stunden",
    startDate: new Date(currentStart).toISOString(),
    endDate: new Date(now).toISOString(),
    comparisonStartDate: new Date(previousStart).toISOString(),
    comparisonEndDate: new Date(currentStart).toISOString(),
    dataState: "hourly_all",
    partial: true,
    metrics: {
      current,
      previous,
      change: {
        clicks: percentChange(current.clicks, previous.clicks),
        impressions: percentChange(current.impressions, previous.impressions),
        ctr: Number((current.ctr - previous.ctr).toFixed(2)),
        position: Number((previous.position - current.position).toFixed(1)),
      },
    },
    pages,
    queries,
    trend,
    recommendations: buildRecommendations(pages),
  };
}

async function main() {
  const { auth, clientFile, tokenFile } = createAuth();
  const api = google.searchconsole({ version: "v1", auth });

  const sitesResponse = await api.sites.list();
  const properties = (sitesResponse.data.siteEntry || []).map((entry) => entry.siteUrl);

  const siteUrl =
    properties.includes(propertyPreference)
      ? propertyPreference
      : properties.find((property) => property.includes("pfotentechnik.de")) ||
        properties[0];

  if (!siteUrl) {
    throw new Error("Im verbundenen Google-Konto wurde keine Search-Console-Property gefunden.");
  }

  console.log("Property:", siteUrl);
  console.log("OAuth-Client:", clientFile);
  console.log("OAuth-Token:", tokenFile);

  const ranges = {};
  const definitions = [
    ["7d", "Letzte 7 Tage", 7],
    ["28d", "Letzte 28 Tage", 28],
    ["3m", "Letzte 3 Monate", 90],
    ["6m", "Letzte 6 Monate", 180],
    ["12m", "Letzte 12 Monate", 365],
  ];

  console.log("Lade 24h …");
  try {
    ranges["24h"] = await load24Hours(api, siteUrl);
  } catch (error) {
    console.warn("24h-Daten konnten nicht geladen werden:", error?.message || error);
  }

  for (const [key, label, days] of definitions) {
    console.log(`Lade ${label} …`);
    ranges[key] = await loadStandardRange(api, siteUrl, key, label, days);
  }

  const payload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    property: siteUrl,
    defaultRange: "7d",
    ranges,
  };

  fs.mkdirSync(dataDir, { recursive: true });

  const rangesFile = path.join(dataDir, "gsc-dashboard-ranges.json");
  const legacyFile = path.join(dataDir, "gsc-dashboard.json");

  fs.writeFileSync(rangesFile, JSON.stringify(payload, null, 2) + "\n");

  const defaultDataset = ranges["7d"];
  fs.writeFileSync(
    legacyFile,
    JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: payload.generatedAt,
        property: payload.property,
        range: "7d",
        ...defaultDataset,
      },
      null,
      2
    ) + "\n"
  );

  console.log("\nGSC-Dashboard aktualisiert:");
  console.log(" ", rangesFile);
  console.log(" ", legacyFile);
  console.log("Standardzeitraum: Letzte 7 Tage");
}

main().catch((error) => {
  console.error("\nGSC-Synchronisierung fehlgeschlagen:");
  console.error(error?.response?.data || error?.stack || error);
  process.exit(1);
});
