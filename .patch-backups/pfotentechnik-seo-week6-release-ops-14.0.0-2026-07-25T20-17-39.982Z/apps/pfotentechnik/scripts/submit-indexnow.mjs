#!/usr/bin/env node
/** pfotentechnik-indexnow-1.1 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, sep, basename } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://pfotentechnik.de";
const HOST = "pfotentechnik.de";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const APP_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const REPO_ROOT = resolve(APP_ROOT, "../..");
const PUBLIC_ROOT = resolve(APP_ROOT, "public");
const DIST = resolve(APP_ROOT, "dist");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const submitAll = args.has("--all");
const statusOnly = args.has("--status");
const skipRemoteVerification = args.has("--skip-key-check");
const explicitArg = [...args].find((arg) => arg.startsWith("--urls="));
const explicitUrls = explicitArg ? explicitArg.slice(7).split(",").map(v => v.trim()).filter(Boolean) : [];

function findKey() {
  const candidates = readdirSync(PUBLIC_ROOT)
    .filter((name) => /^[a-f0-9]{64}\.txt$/i.test(name))
    .map((name) => {
      const file = resolve(PUBLIC_ROOT, name);
      const content = readFileSync(file, "utf8").replace(/^\uFEFF/, "").trim();
      return { key: basename(name, ".txt"), file, content };
    });
  const valid = candidates.filter(c => c.content === c.key);
  if (!valid.length) throw new Error("Keine gültige IndexNow-Keydatei gefunden.");
  if (valid.length > 1) console.warn(`WARNUNG: ${valid.length} gültige Keydateien gefunden. Verwendet wird ${basename(valid[0].file)}.`);
  return valid[0];
}

const { key: KEY, file: KEY_FILE } = findKey();
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
function normalizeUrl(value) { const u = new URL(value, SITE); if (u.hostname !== HOST) throw new Error(`Fremde Domain: ${value}`); u.hash = ""; return u.href; }
function unique(values) { return [...new Set(values.map(normalizeUrl))].sort(); }

function sitemapUrls() {
  if (!existsSync(DIST)) throw new Error("dist fehlt. Zuerst bauen.");
  const queue = ["sitemap-0.xml", "sitemap-index.xml", "sitemap.xml"].map(f => resolve(DIST, f)).filter(existsSync);
  if (!queue.length) throw new Error("Keine Sitemap in dist gefunden.");
  const seen = new Set(), urls = [];
  while (queue.length) {
    const file = queue.shift(); if (seen.has(file)) continue; seen.add(file);
    const xml = readFileSync(file, "utf8");
    for (const match of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
      const location = match[1].replaceAll("&amp;", "&"); const url = new URL(location);
      if (url.hostname !== HOST) continue;
      if (url.pathname.endsWith(".xml")) { const local = resolve(DIST, url.pathname.replace(/^\//, "")); if (existsSync(local)) queue.push(local); }
      else urls.push(url.href);
    }
  }
  return unique(urls);
}

function git(a) { try { return execFileSync("git", a, { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return ""; } }
function changedFiles() {
  const base = process.env.INDEXNOW_BASE_REF?.trim() || git(["rev-parse", "HEAD~1"]);
  if (!base) return null;
  const output = git(["diff", "--name-status", "--find-renames", base, "HEAD"]);
  if (!output) return [];
  return output.split("\n").map(line => { const parts = line.split("\t"); return { status: parts[0], path: parts.at(-1) }; });
}
function frontmatterValue(file, key) { if (!existsSync(file)) return null; const text = readFileSync(file, "utf8"); return text.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, "m"))?.[1]?.trim() || null; }
function fileToUrl(entry) {
  const p = entry.path.split(sep).join("/");
  const pagePrefix = "apps/pfotentechnik/src/content/pages/", productPrefix = "apps/pfotentechnik/src/content/products/", comparisonPrefix = "apps/pfotentechnik/src/data/comparisons/";
  if (p.startsWith(pagePrefix) && p.endsWith(".md")) { const abs = resolve(REPO_ROOT, p); const slug = frontmatterValue(abs, "slug") || p.slice(pagePrefix.length, -3); return `${SITE}/${slug.replace(/^\/+|\/+$/g, "")}/`; }
  if (p.startsWith(productPrefix) && p.endsWith(".md")) { const abs = resolve(REPO_ROOT, p); const slug = frontmatterValue(abs, "slug") || p.slice(productPrefix.length, -3); return `${SITE}/produkt/${slug.replace(/^\/+|\/+$/g, "")}/`; }
  if (p.startsWith(comparisonPrefix) && p.endsWith(".json")) { const abs = resolve(REPO_ROOT, p); let slug = p.slice(comparisonPrefix.length, -5); if (existsSync(abs)) { try { slug = JSON.parse(readFileSync(abs, "utf8")).slug || slug; } catch {} } return `${SITE}/vergleiche/${String(slug).replace(/^\/+|\/+$/g, "")}/`; }
  if (p.startsWith("apps/pfotentechnik/src/pages/") || p.startsWith("packages/affiliate-core/") || p.includes("/components/") || p.includes("/layouts/")) return "__ALL__";
  return null;
}
function changedUrls() { const changes = changedFiles(); if (changes === null) return sitemapUrls(); const mapped = changes.map(fileToUrl).filter(Boolean); return mapped.includes("__ALL__") ? sitemapUrls() : unique(mapped); }

async function remoteKeyStatus() {
  try {
    const response = await fetch(KEY_LOCATION, { headers: { "user-agent": "PfotenTechnik-IndexNow/1.1", "cache-control": "no-cache" } });
    const body = (await response.text()).replace(/^\uFEFF/, "").trim();
    return { reachable: response.ok, status: response.status, matches: response.ok && body === KEY, body, contentType: response.headers.get("content-type") || "" };
  } catch (error) { return { reachable: false, status: null, matches: false, body: "", contentType: "", error: error instanceof Error ? error.message : String(error) }; }
}
async function printStatus() {
  const remote = await remoteKeyStatus();
  console.log("IndexNow-Status\n===============");
  console.log(`Lokale Keydatei: ${KEY_FILE}`); console.log(`Lokaler Schlüssel: ${KEY}`); console.log(`Öffentliche URL: ${KEY_LOCATION}`);
  if (!remote.reachable) { console.log(`Remote: NICHT ERREICHBAR${remote.status ? ` (HTTP ${remote.status})` : ""}`); if (remote.error) console.log(`Fehler: ${remote.error}`); return false; }
  console.log(`Remote: erreichbar (HTTP ${remote.status})`); console.log(`Content-Type: ${remote.contentType || "unbekannt"}`);
  if (remote.matches) { console.log("Inhalt: korrekt"); return true; }
  console.log("Inhalt: stimmt NICHT mit dem lokalen Schlüssel überein"); console.log(`Remote-Inhalt: ${JSON.stringify(remote.body.slice(0, 200))}`);
  return false;
}
async function verifyKey() {
  if (skipRemoteVerification) { console.warn("WARNUNG: Remote-Keyprüfung übersprungen."); return; }
  const remote = await remoteKeyStatus();
  if (!remote.reachable) throw new Error(`IndexNow-Keydatei nicht erreichbar${remote.status ? ` (HTTP ${remote.status})` : ""}: ${KEY_LOCATION}`);
  if (!remote.matches) throw new Error(["Öffentliche IndexNow-Keydatei stimmt nicht mit dem lokalen Schlüssel überein.", `Lokal: ${KEY}`, `Remote: ${JSON.stringify(remote.body.slice(0, 200))}`, `URL: ${KEY_LOCATION}`, "Aktuellen Commit deployen und danach npm run indexnow:status ausführen."].join("\n"));
}
async function submit(urls) {
  if (!urls.length) { console.log("Keine URLs gefunden."); return; }
  console.log(`IndexNow: ${urls.length} URL(s).`); urls.slice(0, 20).forEach(u => console.log(`- ${u}`)); if (urls.length > 20) console.log(`- … und ${urls.length - 20} weitere`);
  if (dryRun) { console.log("Dry Run: keine Übertragung."); return; }
  await verifyKey();
  for (let i = 0; i < urls.length; i += 10000) {
    const batch = urls.slice(i, i + 10000);
    const response = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json; charset=utf-8", "user-agent": "PfotenTechnik-IndexNow/1.1" }, body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch }) });
    if (![200, 202].includes(response.status)) throw new Error(`IndexNow HTTP ${response.status}: ${await response.text()}`);
    console.log(`Übertragen: ${batch.length} URL(s), HTTP ${response.status}.`);
  }
}
if (statusOnly) { const healthy = await printStatus(); process.exitCode = healthy ? 0 : 1; }
else { const urls = explicitUrls.length ? unique(explicitUrls) : submitAll ? sitemapUrls() : changedUrls(); await submit(urls); }
