import { normalizeQuery, normalizeUrl } from "../../normalizer.mjs";

const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function parseBingDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  const raw = String(value || "").trim();
  const microsoft = raw.match(/^\/Date\((-?\d+)(?:[+-]\d{4})?\)\/$/);
  const date = microsoft ? new Date(Number(microsoft[1])) : new Date(raw);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function traffic(row) {
  const clicks = number(row.Clicks);
  const impressions = number(row.Impressions);
  const impressionPosition = Number.isFinite(Number(row.AvgImpressionPosition)) ? Number(row.AvgImpressionPosition) : null;
  const clickPosition = Number.isFinite(Number(row.AvgClickPosition)) ? Number(row.AvgClickPosition) : null;
  return { clicks, impressions, ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0, position: impressions && impressionPosition !== null ? impressionPosition : null, avgClickPosition: clickPosition };
}

export function mapBingQueryStats(rows = []) {
  return rows.map((row) => {
    const query = normalizeQuery(row.Query).original;
    const date = parseBingDate(row.Date);
    return query && date ? { query, date, ...traffic(row) } : null;
  }).filter(Boolean);
}

export function mapBingPageStats(rows = []) {
  return rows.map((row) => {
    const rawPage = String(row.Query || "").trim();
    const date = parseBingDate(row.Date);
    return rawPage && date ? { page: normalizeUrl(rawPage), originalPage: rawPage, date, ...traffic(row) } : null;
  }).filter(Boolean);
}

export function mapBingCrawlStats(rows = []) {
  const fields = ["AllOtherCodes", "BlockedByRobotsTxt", "Code2xx", "Code301", "Code302", "Code4xx", "Code5xx", "ConnectionTimeout", "ContainsMalware", "CrawlErrors", "CrawledPages", "DnsFailures", "InIndex", "InLinks"];
  return rows.map((row) => {
    const date = parseBingDate(row.Date);
    if (!date) return null;
    const mapped = { date };
    for (const field of fields) mapped[field.charAt(0).toLowerCase() + field.slice(1)] = number(row[field]);
    return mapped;
  }).filter(Boolean);
}
