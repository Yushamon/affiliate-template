#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-rss-feed-33.9.0";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const endpoint = path.join(app, "src", "pages", "rss.xml.ts");
const testFile = path.join(app, "test", "rss-feed-33.9.0.test.mjs");
const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);

const expected = [
  path.join(app, "src", "domain", "content", "registry.ts"),
  path.join(app, "src", "project.config.ts"),
  path.join(app, "package.json"),
];

for (const file of expected) {
  if (!fs.existsSync(file)) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, file)}`);
  }
}

fs.mkdirSync(backupRoot, { recursive: true });
const targets = [endpoint, testFile];
const existed = new Map();

function backup(file) {
  const rel = path.relative(root, file);
  const dest = path.join(backupRoot, rel);
  existed.set(file, fs.existsSync(file));
  if (!fs.existsSync(file)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
}

function rollback() {
  for (const file of targets) {
    const rel = path.relative(root, file);
    const backed = path.join(backupRoot, rel);
    if (existed.get(file)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(backed, file);
    } else if (fs.existsSync(file)) {
      fs.rmSync(file);
    }
  }
}

for (const file of targets) backup(file);

const endpointSource = `import type { APIRoute } from "astro";
import { getAllContent } from "../domain/content/registry";
import { site } from "../project.config";

export const prerender = true;

const MAX_ITEMS = 50;

const escapeXml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const itemDate = (entry: Awaited<ReturnType<typeof getAllContent>>[number]) =>
  toDate(entry.entry.data.updatedAt) ??
  toDate(entry.entry.data.publishedAt) ??
  new Date("2026-07-08T00:00:00.000Z");

const isIndexable = (entry: Awaited<ReturnType<typeof getAllContent>>[number]) => {
  const data = entry.entry.data as {
    seo?: { noindex?: boolean; sitemap?: boolean };
    productStatus?: string;
  };

  if (data.seo?.noindex === true || data.seo?.sitemap === false) return false;
  if (entry.type === "product" && data.productStatus === "retired") return false;
  return true;
};

export const GET: APIRoute = async () => {
  const content = (await getAllContent())
    .filter(isIndexable)
    .sort((a, b) => itemDate(b).getTime() - itemDate(a).getTime())
    .slice(0, MAX_ITEMS);

  const items = content
    .map((entry) => {
      const url = new URL(entry.href, site.domain).toString();
      const pubDate = itemDate(entry).toUTCString();

      return [
        "    <item>",
        \`      <title>\${escapeXml(entry.hubTitle)}</title>\`,
        \`      <link>\${escapeXml(url)}</link>\`,
        \`      <guid isPermaLink="true">\${escapeXml(url)}</guid>\`,
        \`      <description>\${escapeXml(entry.hubDescription)}</description>\`,
        \`      <pubDate>\${escapeXml(pubDate)}</pubDate>\`,
        \`      <category>\${escapeXml(entry.type)}</category>\`,
        "    </item>"
      ].join("\\n");
    })
    .join("\\n");

  const lastBuildDate =
    content.length > 0
      ? itemDate(content[0]).toUTCString()
      : new Date().toUTCString();

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    \`    <title>\${escapeXml(site.siteName)}</title>\`,
    \`    <link>\${escapeXml(site.domain)}</link>\`,
    \`    <description>\${escapeXml(site.siteDescription)}</description>\`,
    "    <language>de-DE</language>",
    \`    <lastBuildDate>\${escapeXml(lastBuildDate)}</lastBuildDate>\`,
    \`    <atom:link href="\${escapeXml(new URL("/rss.xml", site.domain).toString())}" rel="self" type="application/rss+xml" />\`,
    items,
    "  </channel>",
    "</rss>",
    ""
  ].join("\\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600"
    }
  });
};
`;

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const endpoint = path.join(root, "src", "pages", "rss.xml.ts");

test("RSS-Endpoint nutzt zentrale Content-Registry und Site-Konfiguration", () => {
  const source = fs.readFileSync(endpoint, "utf8");
  assert.match(source, /getAllContent/);
  assert.match(source, /from "\\.\\.\\/domain\\/content\\/registry"/);
  assert.match(source, /from "\\.\\.\\/project\\.config"/);
  assert.match(source, /export const prerender = true/);
});

test("RSS-Feed schließt noindex und sitemap:false aus", () => {
  const source = fs.readFileSync(endpoint, "utf8");
  assert.match(source, /data\\.seo\\?\\.noindex === true/);
  assert.match(source, /data\\.seo\\?\\.sitemap === false/);
});

test("RSS-Ausgabe ist XML-sicher und auf 50 Einträge begrenzt", () => {
  const source = fs.readFileSync(endpoint, "utf8");
  assert.match(source, /const MAX_ITEMS = 50/);
  assert.match(source, /escapeXml/);
  assert.match(source, /application\\/rss\\+xml/);
  assert.match(source, /atom:link/);
});

test("Feed wird unter rss.xml bereitgestellt", () => {
  assert.equal(path.basename(endpoint), "rss.xml.ts");
});
`;

try {
  fs.mkdirSync(path.dirname(endpoint), { recursive: true });
  fs.mkdirSync(path.dirname(testFile), { recursive: true });
  fs.writeFileSync(endpoint, endpointSource, "utf8");
  fs.writeFileSync(testFile, testSource, "utf8");

  console.log(`[${PATCH}] RSS-Endpoint geschrieben: ${path.relative(root, endpoint)}`);
  console.log(`[${PATCH}] Regressionstest geschrieben: ${path.relative(root, testFile)}`);

  const checks = [
    ["Endpoint-Syntax", process.execPath, ["--check", endpoint]],
    ["Test-Syntax", process.execPath, ["--check", testFile]],
    ["Regressionstest", process.execPath, ["--test", testFile]],
    ["Astro-Build", "npm", ["--workspace", "apps/pfotentechnik", "run", "build"]],
  ];

  for (const [label, command, args] of checks) {
    console.log(`[${PATCH}] Prüfe: ${label}`);
    const result = spawnSync(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status !== 0) {
      throw new Error(`${label} fehlgeschlagen (Exit ${result.status})`);
    }
    console.log(`[${PATCH}] BESTANDEN: ${label}`);
  }

  const builtFeed = path.join(app, "dist", "rss.xml");
  if (!fs.existsSync(builtFeed)) {
    throw new Error(`Build erfolgreich, aber ${path.relative(root, builtFeed)} fehlt`);
  }

  const built = fs.readFileSync(builtFeed, "utf8");
  for (const needle of ["<rss", "<channel>", "<item>", 'rel="self"', "https://pfotentechnik.de/"]) {
    if (!built.includes(needle)) {
      throw new Error(`Gebauter RSS-Feed enthält erwartetes Merkmal nicht: ${needle}`);
    }
  }

  console.log(`[${PATCH}] BESTANDEN: gebauter Feed ${path.relative(root, builtFeed)}`);
  console.log(`[${PATCH}] Abgeschlossen.`);
  console.log(`[${PATCH}] Feed-URL nach Deployment: https://pfotentechnik.de/rss.xml`);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backupRoot)}`);
} catch (error) {
  rollback();
  console.error(`[${PATCH}] FEHLER: ${error.message}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exitCode = 1;
}
