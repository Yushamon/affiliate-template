import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, REPORTS_DIR, atomicWriteJson, ensureSearchDirectories } from "../../config.mjs";
import { SearchError } from "../../errors.mjs";
import { searchLog } from "../../logging.mjs";
import { updateProviderStatus } from "../../status-store.mjs";

export async function generateBingReport({ range = "28d" } = {}) {
  const source = path.join(DATA_DIR, "bing-dashboard-ranges.json"); const started = Date.now();
  if (!fs.existsSync(source)) throw new SearchError("BING_NO_DATA", { message: "Der Bing-Bericht benötigt zuerst einen erfolgreichen Bing-Sync." });
  let payload; try { payload = JSON.parse(fs.readFileSync(source, "utf8")); } catch (cause) { throw new SearchError("BING_INVALID_RESPONSE", { cause }); }
  const data = payload.ranges?.[range] || payload.ranges?.[payload.defaultRange]; if (!data) throw new SearchError("BING_NO_DATA");
  const generatedAt = new Date().toISOString(); ensureSearchDirectories();
  const topPages = [...data.pages].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 10);
  const topQueries = [...data.queries].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 10);
  const crawlWarnings = data.crawl.filter((row) => row.crawlErrors || row.code4xx || row.code5xx || row.blockedByRobotsTxt).slice(-10);
  const report = { schemaVersion: 1, provider: "bing", generatedAt, siteUrl: payload.siteUrl, dataUpdatedAt: payload.dataUpdatedAt, freshness: payload.freshness, range: data.key, period: { startDate: data.startDate, endDate: data.endDate }, metrics: data.metrics, topPages, topQueries, quickWins: data.recommendations, crawlWarnings };
  const jsonFile = path.join(REPORTS_DIR, "bing-search-report.json"); const markdownFile = path.join(REPORTS_DIR, "bing-search-report.md"); atomicWriteJson(jsonFile, report);
  const table = (items, field) => items.length ? `| Ziel | Klicks | Impressionen | CTR | Position |\n|---|---:|---:|---:|---:|\n${items.map((item) => `| ${item[field]} | ${item.clicks} | ${item.impressions} | ${item.ctr.toFixed(2)} % | ${item.position ?? "–"} |`).join("\n")}` : "Keine Einträge im gewählten Zeitraum.";
  const crawl = crawlWarnings.length ? `| Datum | Gecrawlt | Fehler | 4xx | 5xx | Index |\n|---|---:|---:|---:|---:|---:|\n${crawlWarnings.map((row) => `| ${row.date.slice(0, 10)} | ${row.crawledPages} | ${row.crawlErrors} | ${row.code4xx} | ${row.code5xx} | ${row.inIndex} |`).join("\n")}` : "Keine Crawl-Warnungen in den gelieferten Daten.";
  fs.writeFileSync(markdownFile, `# Bing Webmaster Tools Report\n\nGeneriert: ${generatedAt}\n\nDatenstand: ${payload.dataUpdatedAt || "nicht verfügbar"}\n\n${payload.freshness?.note || ""}\n\n## Kennzahlen\n\n- Klicks: ${data.metrics.current.clicks}\n- Impressionen: ${data.metrics.current.impressions}\n- CTR: ${data.metrics.current.ctr.toFixed(2)} %\n- Position: ${data.metrics.current.position ?? "nicht verfügbar"}\n\n## Top-Seiten\n\n${table(topPages, "page")}\n\n## Top-Queries\n\n${table(topQueries, "query")}\n\n## Crawl-Hinweise\n\n${crawl}\n`, "utf8");
  const durationMs = Date.now() - started; updateProviderStatus("bing", { lastReportAt: generatedAt, lastDurationMs: durationMs, lastError: null }); searchLog({ provider: "bing", action: "report", status: "succeeded", durationMs });
  return { ok: true, markdownFile, jsonFile, generatedAt };
}
