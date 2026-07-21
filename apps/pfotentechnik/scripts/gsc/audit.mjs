import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  REPORTS_DIR,
  ensureDirectories,
  loadConfig,
  writeJson,
} from "./config.mjs";
import { getSite, listSitemaps, querySearchAnalytics } from "./client.mjs";

function isoDate(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

ensureDirectories();
const config = loadConfig();
const [site, sitemapResult, performance] = await Promise.all([
  getSite(config.siteUrl),
  listSitemaps(config.siteUrl),
  querySearchAnalytics(config.siteUrl, {
    startDate: isoDate(30),
    endDate: isoDate(3),
    dimensions: ["date"],
    rowLimit: 25000,
    dataState: "final",
  }),
]);

const rows = performance.rows || [];
const summary = rows.reduce(
  (acc, row) => {
    acc.clicks += Number(row.clicks || 0);
    acc.impressions += Number(row.impressions || 0);
    acc.positionWeighted += Number(row.position || 0) * Number(row.impressions || 0);
    return acc;
  },
  { clicks: 0, impressions: 0, positionWeighted: 0 },
);
summary.ctr = summary.impressions ? summary.clicks / summary.impressions : 0;
summary.position = summary.impressions
  ? summary.positionWeighted / summary.impressions
  : 0;
delete summary.positionWeighted;

const sitemaps = (sitemapResult.sitemap || []).map((item) => ({
  path: item.path,
  lastSubmitted: item.lastSubmitted || null,
  isPending: Boolean(item.isPending),
  isSitemapsIndex: Boolean(item.isSitemapsIndex),
  errors: Number(item.errors || 0),
  warnings: Number(item.warnings || 0),
}));

const report = {
  generatedAt: new Date().toISOString(),
  property: site,
  period: { startDate: isoDate(30), endDate: isoDate(3) },
  summary,
  sitemaps,
  dailyRows: rows,
};

writeJson(resolve(REPORTS_DIR, "gsc-status.json"), report);

const markdown = `# Google Search Console Status

Generiert: ${report.generatedAt}

## Property

- Property: \`${site.siteUrl}\`
- Berechtigung: \`${site.permissionLevel}\`
- Zeitraum: ${report.period.startDate} bis ${report.period.endDate}

## Performance

| Kennzahl | Wert |
|---|---:|
| Klicks | ${summary.clicks.toLocaleString("de-DE")} |
| Impressionen | ${summary.impressions.toLocaleString("de-DE")} |
| CTR | ${(summary.ctr * 100).toFixed(2)} % |
| Durchschnittliche Position | ${summary.position.toFixed(2)} |

## Sitemaps

${sitemaps.length
  ? `| Sitemap | Fehler | Warnungen | Ausstehend |
|---|---:|---:|---|
${sitemaps
  .map(
    (item) =>
      `| ${item.path} | ${item.errors} | ${item.warnings} | ${item.isPending ? "Ja" : "Nein"} |`,
  )
  .join("\n")}`
  : "Keine Sitemap über die API gefunden."}

## Hinweise

- Search-Analytics-Daten können verzögert sein; deshalb endet der Zeitraum drei Tage vor dem Ausführungsdatum.
- Dieser Report nutzt ausschließlich Leserechte.
- URL-Inspection und Opportunity Engine folgen in späteren Versionen.
`;

writeFileSync(resolve(REPORTS_DIR, "gsc-status.md"), markdown, "utf8");
console.log("Erstellt:");
console.log(resolve(REPORTS_DIR, "gsc-status.md"));
console.log(resolve(REPORTS_DIR, "gsc-status.json"));
