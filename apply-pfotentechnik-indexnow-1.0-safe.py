#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import json
import secrets
import subprocess
import sys

APP = Path("apps/pfotentechnik")
APP_PACKAGE = APP / "package.json"
ROOT_PACKAGE = Path("package.json")
SCRIPT = APP / "scripts/submit-indexnow.mjs"
PUBLIC = APP / "public"

def fail(message):
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)

def find_root(start):
    for candidate in (start, *start.parents):
        if (candidate / APP_PACKAGE).is_file() and (candidate / ROOT_PACKAGE).is_file():
            return candidate
    fail("Repository-Root nicht gefunden.")

def run(command, cwd):
    print("$", " ".join(command))
    result = subprocess.run(command, cwd=cwd)
    if result.returncode != 0:
        raise RuntimeError("Befehl fehlgeschlagen: " + " ".join(command))

def write_json(path, data):
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

root = find_root(Path.cwd().resolve())
app_package_path = root / APP_PACKAGE
root_package_path = root / ROOT_PACKAGE

app_package = json.loads(app_package_path.read_text(encoding="utf-8"))
root_package = json.loads(root_package_path.read_text(encoding="utf-8"))

if "indexnow:submit" in app_package.get("scripts", {}):
    fail("IndexNow scheint bereits installiert zu sein.")

key = secrets.token_hex(32)
key_file = PUBLIC / f"{key}.txt"
key_path = root / key_file

node_script = """#!/usr/bin/env node
/** pfotentechnik-indexnow-1.0 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://pfotentechnik.de";
const HOST = "pfotentechnik.de";
const KEY = "__INDEXNOW_KEY__";
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
    for (const match of xml.matchAll(/<loc>(.*?)<\\/loc>/g)) {
      const location = match[1].replaceAll("&amp;", "&");
      const url = new URL(location);
      if (url.hostname !== HOST) continue;

      if (url.pathname.endsWith(".xml")) {
        const local = resolve(DIST, url.pathname.replace(/^\\//, ""));
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

  return output.split("\\n").map((line) => {
    const parts = line.split("\\t");
    return { status: parts[0], path: parts.at(-1) };
  });
}

function frontmatterValue(file, key) {
  if (!existsSync(file)) return null;
  const text = readFileSync(file, "utf8");
  const pattern = new RegExp(
    `^${key}:\\\\s*["']?([^"'\\\\n]+)["']?\\\\s*$`,
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
    return `${SITE}/${slug.replace(/^\\/+|\\/+$/g, "")}/`;
  }

  if (path.startsWith(productPrefix) && path.endsWith(".md")) {
    const absolute = resolve(REPO_ROOT, path);
    const fallback = path.slice(productPrefix.length, -3);
    const slug = frontmatterValue(absolute, "slug") || fallback;
    return `${SITE}/produkt/${slug.replace(/^\\/+|\\/+$/g, "")}/`;
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

    return `${SITE}/vergleiche/${String(slug).replace(/^\\/+|\\/+$/g, "")}/`;
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
""".replace("__INDEXNOW_KEY__", key)

app_package.setdefault("scripts", {}).update({
    "indexnow:submit": "node scripts/submit-indexnow.mjs --changed",
    "indexnow:submit:all": "node scripts/submit-indexnow.mjs --all",
    "indexnow:dry-run": "node scripts/submit-indexnow.mjs --changed --dry-run",
    "indexnow:dry-run:all": "node scripts/submit-indexnow.mjs --all --dry-run",
})

root_package.setdefault("scripts", {}).update({
    "indexnow:pfotentechnik": "npm --workspace apps/pfotentechnik run indexnow:submit",
    "indexnow:pfotentechnik:all": "npm --workspace apps/pfotentechnik run indexnow:submit:all",
})

targets = [APP_PACKAGE, ROOT_PACKAGE, SCRIPT, key_file]
originals = {}
created = []

for relative in targets:
    path = root / relative
    if path.exists():
        originals[relative] = path.read_text(encoding="utf-8")
    else:
        created.append(relative)

stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".indexnow-1.0-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)

for relative, content in originals.items():
    destination = backup / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(content, encoding="utf-8")

try:
    (root / SCRIPT).parent.mkdir(parents=True, exist_ok=True)
    key_path.parent.mkdir(parents=True, exist_ok=True)

    write_json(app_package_path, app_package)
    write_json(root_package_path, root_package)
    (root / SCRIPT).write_text(node_script, encoding="utf-8")
    key_path.write_text(key + "\n", encoding="utf-8")

    run(["npm", "run", "build:pfotentechnik"], root)
    run(
        [
            "npm",
            "--workspace",
            "apps/pfotentechnik",
            "run",
            "indexnow:dry-run:all",
        ],
        root,
    )

except Exception as exc:
    print(f"Validierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)

    for relative, content in originals.items():
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    for relative in created:
        path = root / relative
        if path.exists():
            path.unlink()

    raise SystemExit(1)

print("IndexNow 1.0 erfolgreich installiert.")
print(f"Key-Datei: {key_file}")
print("Nach dem nächsten Deployment einmalig:")
print("  npm run indexnow:pfotentechnik:all")
print("Danach nach Deployments:")
print("  npm run indexnow:pfotentechnik")
print(f"Backup: {backup}")
