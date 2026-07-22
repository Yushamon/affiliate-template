import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, REPORTS_DIR, atomicWriteJson, ensureSearchDirectories } from "../../config.mjs";
import { SearchError } from "../../errors.mjs";
import { searchLog } from "../../logging.mjs";
import { updateProviderStatus } from "../../status-store.mjs";

export async function generateGoogleReport({ range = "28d" } = {}) {
  const started = Date.now();
  const source = path.join(DATA_DIR, "gsc-dashboard-ranges.json");
  if (!fs.existsSync(source)) throw new SearchError("SEARCH_NO_DATA", { message: "Der Bericht benötigt zuerst einen erfolgreichen GSC-Sync." });
  let payload;
  try { payload = JSON.parse(fs.readFileSync(source, "utf8")); } catch (cause) { throw new SearchError("SEARCH_INVALID_DATA", { cause }); }
  const data = payload.ranges?.[range] || payload.ranges?.[payload.defaultRange];
  if (!data) throw new SearchError("SEARCH_NO_DATA");
  ensureSearchDirectories();
  const generatedAt = new Date().toISOString();
  const topPages = [...data.pages].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 10);
  const topQueries = [...data.queries].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 10);
  const quickWins = data.pages.filter((row) => row.position >= 4 && row.position <= 20).sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  const ctrChances = data.pages.filter((row) => row.position <= 15 && row.impressions >= 20 && row.ctr < 2.5).sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  const summary = { schemaVersion: 1, generatedAt, provider: "google", property: payload.property, range: data.key, period: { startDate: data.startDate, endDate: data.endDate }, metrics: data.metrics, topPages, topQueries, quickWins, ctrChances, dataNotice: data.lowData ? "Geringe Datenbasis; Empfehlungen konservativ bewerten." : "Search-Console-Daten können zeitverzögert sein." };
  const jsonFile = path.join(REPORTS_DIR, "google-search-report.json");
  const markdownFile = path.join(REPORTS_DIR, "google-search-report.md");
  atomicWriteJson(jsonFile, summary);
  const row = (item, key) => `| ${item[key]} | ${item.clicks} | ${item.impressions} | ${item.ctr.toFixed(2)} % | ${item.position.toFixed(1)} |`;
  const table = (items, key) => items.length ? `| Ziel | Klicks | Impressionen | CTR | Position |\n|---|---:|---:|---:|---:|\n${items.map((item) => row(item, key)).join("\n")}` : "Keine belastbaren Einträge.";
  const markdown = `# Google Search Console Report\n\nGeneriert: ${generatedAt}\n\nZeitraum: ${data.startDate} bis ${data.endDate}\n\n## Kennzahlen\n\n- Klicks: ${data.metrics.current.clicks}\n- Impressionen: ${data.metrics.current.impressions}\n- CTR: ${data.metrics.current.ctr.toFixed(2)} %\n- Position: ${data.metrics.current.position.toFixed(1)}\n\n## Top-Seiten\n\n${table(topPages, "page")}\n\n## Top-Queries\n\n${table(topQueries, "query")}\n\n## Quick Wins\n\n${table(quickWins, "page")}\n\n## CTR-Chancen\n\n${table(ctrChances, "page")}\n\n## Datenhinweis\n\n${summary.dataNotice}\n`;
  fs.writeFileSync(markdownFile, markdown, "utf8");
  const durationMs = Date.now() - started;
  updateProviderStatus("google", { lastReportAt: generatedAt, lastDurationMs: durationMs, lastError: null });
  searchLog({ provider: "google", action: "report", status: "succeeded", durationMs });
  return { ok: true, markdownFile, jsonFile, generatedAt };
}
