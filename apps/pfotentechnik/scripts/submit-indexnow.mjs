#!/usr/bin/env node
/** pfotentechnik-indexnow-2.0 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_ROOT,
  HOST,
  SITE,
  collectReleaseManifest,
  normalizeUrl,
  sitemapUrls,
  unique,
  writeReleaseManifest
} from "./seo/release-url-utils.mjs";

const ENDPOINT = "https://api.indexnow.org/indexnow";
const PUBLIC_ROOT = path.join(APP_ROOT, "public");
const rawArgs = process.argv.slice(2);
const flags = new Set(rawArgs.filter((arg) => !arg.includes("=")));
const values = new Map(
  rawArgs
    .filter((arg) => arg.startsWith("--") && arg.includes("="))
    .map((arg) => {
      const [key, ...value] = arg.slice(2).split("=");
      return [key, value.join("=")];
    })
);

const dryRun = flags.has("--dry-run");
const submitAll = flags.has("--all");
const statusOnly = flags.has("--status");
const skipRemoteVerification = flags.has("--skip-key-check");
const explicitUrls = (values.get("urls") || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function urlsFromFile(file) {
  const source = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
  if (file.endsWith(".json")) {
    const parsed = JSON.parse(source);
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed.urls || parsed.urlList || [];
    return rows
      .map((entry) => typeof entry === "string" ? entry : entry.url)
      .filter(Boolean);
  }

  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^https?:\/\//.test(line));
}

function findKey() {
  if (!fs.existsSync(PUBLIC_ROOT)) {
    throw new Error(`Public-Verzeichnis fehlt: ${PUBLIC_ROOT}`);
  }

  const candidates = fs.readdirSync(PUBLIC_ROOT)
    .filter((name) => /^[a-f0-9]{64}\.txt$/i.test(name))
    .map((name) => {
      const file = path.join(PUBLIC_ROOT, name);
      const content = fs.readFileSync(file, "utf8")
        .replace(/^\uFEFF/, "")
        .trim();
      return {
        key: path.basename(name, ".txt"),
        file,
        content
      };
    })
    .filter((candidate) => candidate.content === candidate.key);

  if (!candidates.length) {
    throw new Error("Keine gültige IndexNow-Keydatei gefunden.");
  }
  if (candidates.length > 1) {
    console.warn(
      `WARNUNG: ${candidates.length} gültige Keydateien gefunden. Verwendet wird ${path.basename(candidates[0].file)}.`
    );
  }
  return candidates[0];
}

async function remoteKeyStatus(key) {
  const keyLocation = `${SITE}/${key}.txt`;
  try {
    const response = await fetch(keyLocation, {
      headers: {
        "user-agent": "PfotenTechnik-IndexNow/2.0",
        "cache-control": "no-cache"
      }
    });
    const body = (await response.text())
      .replace(/^\uFEFF/, "")
      .trim();

    return {
      keyLocation,
      reachable: response.ok,
      status: response.status,
      matches: response.ok && body === key,
      body,
      contentType: response.headers.get("content-type") || ""
    };
  } catch (error) {
    return {
      keyLocation,
      reachable: false,
      status: null,
      matches: false,
      body: "",
      contentType: "",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function printStatus() {
  const { key, file } = findKey();
  const remote = await remoteKeyStatus(key);

  console.log("IndexNow-Status");
  console.log("===============");
  console.log(`Lokale Keydatei: ${file}`);
  console.log(`Lokaler Schlüssel: ${key}`);
  console.log(`Öffentliche URL: ${remote.keyLocation}`);

  if (!remote.reachable) {
    console.log(
      `Remote: NICHT ERREICHBAR${remote.status ? ` (HTTP ${remote.status})` : ""}`
    );
    if (remote.error) console.log(`Fehler: ${remote.error}`);
    return false;
  }

  console.log(`Remote: erreichbar (HTTP ${remote.status})`);
  console.log(`Content-Type: ${remote.contentType || "unbekannt"}`);
  console.log(
    remote.matches
      ? "Inhalt: korrekt"
      : `Inhalt: falsch (${JSON.stringify(remote.body.slice(0, 200))})`
  );
  return remote.matches;
}

async function verifyKey(key) {
  if (skipRemoteVerification) {
    console.warn("WARNUNG: Remote-Keyprüfung übersprungen.");
    return;
  }

  const remote = await remoteKeyStatus(key);
  if (!remote.reachable) {
    throw new Error(
      `IndexNow-Keydatei nicht erreichbar${remote.status ? ` (HTTP ${remote.status})` : ""}: ${remote.keyLocation}`
    );
  }
  if (!remote.matches) {
    throw new Error(
      [
        "Öffentliche IndexNow-Keydatei stimmt nicht mit dem lokalen Schlüssel überein.",
        `Lokal: ${key}`,
        `Remote: ${JSON.stringify(remote.body.slice(0, 200))}`,
        `URL: ${remote.keyLocation}`,
        "Aktuellen Commit deployen und danach erneut prüfen."
      ].join("\n")
    );
  }
}

async function submit(urls) {
  if (!urls.length) {
    console.log("Keine URLs gefunden.");
    return;
  }

  console.log(`IndexNow: ${urls.length} URL(s).`);
  urls.slice(0, 30).forEach((url) => console.log(`- ${url}`));
  if (urls.length > 30) {
    console.log(`- … und ${urls.length - 30} weitere`);
  }

  if (dryRun) {
    console.log("Dry Run: keine Übertragung.");
    return;
  }

  const { key } = findKey();
  const keyLocation = `${SITE}/${key}.txt`;
  await verifyKey(key);

  for (let index = 0; index < urls.length; index += 10000) {
    const batch = urls.slice(index, index + 10000);
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        "user-agent": "PfotenTechnik-IndexNow/2.0"
      },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation,
        urlList: batch
      })
    });

    if (![200, 202].includes(response.status)) {
      throw new Error(
        `IndexNow HTTP ${response.status}: ${await response.text()}`
      );
    }

    console.log(
      `Übertragen: ${batch.length} URL(s), HTTP ${response.status}.`
    );
  }
}

if (statusOnly) {
  const healthy = await printStatus();
  process.exitCode = healthy ? 0 : 1;
} else {
  let urls = [];
  let manifest = null;

  if (explicitUrls.length) {
    urls = unique(explicitUrls);
  } else if (values.get("urls-file")) {
    urls = unique(urlsFromFile(values.get("urls-file")));
  } else if (submitAll) {
    urls = sitemapUrls();
  } else {
    manifest = collectReleaseManifest({
      baseRef: values.get("base") || "",
      headRef: values.get("head") || "HEAD"
    });
    urls = manifest.urls.map((entry) => normalizeUrl(entry.url));

    const output = values.get("output")
      ? path.resolve(process.cwd(), values.get("output"))
      : path.join(APP_ROOT, ".seo-release");
    writeReleaseManifest(manifest, output);

    for (const warning of manifest.warnings) {
      console.warn(`WARNUNG: ${warning}`);
    }
    if (manifest.errors.length) {
      throw new Error(manifest.errors.join("\n"));
    }
  }

  await submit(urls);
}
