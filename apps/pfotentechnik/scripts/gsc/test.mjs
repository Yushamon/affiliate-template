import { loadConfig } from "./config.mjs";
import { getSite, listSitemaps } from "./client.mjs";

const config = loadConfig();
const site = await getSite(config.siteUrl);
const sitemaps = await listSitemaps(config.siteUrl);

console.log("Google Search Console");
console.log("=====================");
console.log(`Property: ${site.siteUrl}`);
console.log(`Berechtigung: ${site.permissionLevel}`);
console.log(`Sitemaps: ${(sitemaps.sitemap || []).length}`);
console.log("Status: Verbindung erfolgreich");
