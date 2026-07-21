#!/usr/bin/env node
/** pfotentechnik-indexnow-1.0 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://pfotentechnik.de";
const HOST = "pfotentechnik.de";
const KEY = "1c0d2aeffd62d07b43f814e6fd5a578276c411ef769f64a9c90887173df5fe04";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const APP_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const REPO_ROOT = resolve(APP_ROOT, "../..");
const DIST = resolve(APP_ROOT, "dist");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const submitAll = args.has("--all");
const explicitArg = [...args].find((arg) => arg.startsWith("--urls="));
const explicitUrls = explicitArg
  ? explicitArg.slice("--urls=".length).split(",").map((value) => value.trim()).filter(Boolean)
  : [];

function normalizeUrl(value) {
  const url = new URL(value, SITE);
  if (url.hostname !== HOST) throw new Error(`Fremde Domain: ${value}`);
  url.hash = "";
  return url.href;
}

function unique(values) {
  return [...new Set(values.map(normalizeUrl))].sort();
}

function sitemapUrls() {
  if (!existsSync(DIST)) throw new Error("dist fehlt. Zuerst bauen.");

  const queue = ["sitemap-0.xml", "sitemap-index.xml", "sitemap.xml"]
    .map((file) => resolve(DIST, file))
    .filter(existsSync);

  if (!queue.length) throw new Error("Keine Sitemap in dist gefunden.");

  const seen = new Set();
  const urls = [];

  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);

    const xml = readFileSync(file, "utf8");
    for (const match of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
      const location = match[1].replaceAll("&amp;", "&");
      const url = new URL(location);
      if (url.hostname !== HOST) continue;

      if (url.pathname.endsWith(".xml")) {
        const local = resolve(DIST, url.pathname.replace(/^\//, ""));
        if (existsSync(local)) queue.push(local);
      } else {
        urls.push(url.href);
      }
    }
  }

  return unique(urls);
}

function git(commandArgs) {
  try {
    return execFileSync("git", commandArgs, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function changedFiles() {
  const base =
    process.env.INDEXNOW_BASE_REF?.trim() ||
    git(["rev-parse", "HEAD~1"]);

  if (!base) return null;

  const output = git([
    "diff",
    "--name-status",
    "--find-renames",
    base,
    "HEAD",
  ]);

  if (!output) return [];

  return output.split("\n").map((line) => {
    const parts = line.split("\t");
    return { status: parts[0], path: parts.at(-1) };
  });
}

function frontmatterValue(file, key) {
  if (!existsSync(file)) return null;
  const text = readFileSync(file, "utf8");
  const pattern = new RegExp(
    `^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`,
    "m",
  );
  return text.match(pattern)?.[1]?.trim() || null;
}

function fileToUrl(entry) {
  const path = entry.path.split(sep).join("/");
  const pagePrefix = "apps/pfotentechnik/src/content/pages/";
  const productPrefix = "apps/pfotentechnik/src/content/products/";
  const comparisonPrefix = "apps/pfotentechnik/src/data/comparisons/";

  if (path.startsWith(pagePrefix) && path.endsWith(".md")) {
    const absolute = resolve(REPO_ROOT, path);
    const fallback = path.slice(pagePrefix.length, -3);
    const slug = frontmatterValue(absolute, "slug") || fallback;
    return `${SITE}/${slug.replace(/^\/+|\/+$/g, "")}/`;
  }

  if (path.startsWith(productPrefix) && path.endsWith(".md")) {
    const absolute = resolve(REPO_ROOT, path);
    const fallback = path.slice(productPrefix.length, -3);
    const slug = frontmatterValue(absolute, "slug") || fallback;
    return `${SITE}/produkt/${slug.replace(/^\/+|\/+$/g, "")}/`;
  }

  if (path.startsWith(comparisonPrefix) && path.endsWith(".json")) {
    const absolute = resolve(REPO_ROOT, path);
    const fallback = path.slice(comparisonPrefix.length, -5);
    let slug = fallback;

    if (existsSync(absolute)) {
      try {
        slug = JSON.parse(readFileSync(absolute, "utf8")).slug || fallback;
      } catch {}
    }

    return `${SITE}/vergleiche/${String(slug).replace(/^\/+|\/+$/g, "")}/`;
  }

  if (
    path.startsWith("apps/pfotentechnik/src/pages/") ||
    path.startsWith("packages/affiliate-core/") ||
    path.includes("/components/") ||
    path.includes("/layouts/")
  ) {
    return "__ALL__";
  }

  return null;
}

function changedUrls() {
  const changes = changedFiles();
  if (changes === null) return sitemapUrls();

  const mapped = changes.map(fileToUrl).filter(Boolean);
  return mapped.includes("__ALL__") ? sitemapUrls() : unique(mapped);
}

async function verifyKey() {
  const response = await fetch(KEY_LOCATION, {
    headers: { "user-agent": "PfotenTechnik-IndexNow/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Key-Datei nicht erreichbar: HTTP ${response.status}`);
  }

  if ((await response.text()).trim() !== KEY) {
    throw new Error("Key-Datei enthält nicht den erwarteten Schlüssel.");
  }
}

async function submit(urls) {
  if (!urls.length) {
    console.log("Keine URLs gefunden.");
    return;
  }

  console.log(`IndexNow: ${urls.length} URL(s).`);
  urls.slice(0, 20).forEach((url) => console.log(`- ${url}`));
  if (urls.length > 20) console.log(`- … und ${urls.length - 20} weitere`);

  if (dryRun) {
    console.log("Dry Run: keine Übertragung.");
    return;
  }

  await verifyKey();

  for (let index = 0; index < urls.length; index += 10000) {
    const batch = urls.slice(index, index + 10000);
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        "user-agent": "PfotenTechnik-IndexNow/1.0",
      },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: batch,
      }),
    });

    if (![200, 202].includes(response.status)) {
      throw new Error(
        `IndexNow HTTP ${response.status}: ${await response.text()}`,
      );
    }

    console.log(
      `Übertragen: ${batch.length} URL(s), HTTP ${response.status}.`,
    );
  }
}

const urls = explicitUrls.length
  ? unique(explicitUrls)
  : submitAll
    ? sitemapUrls()
    : changedUrls();

await submit(urls);
