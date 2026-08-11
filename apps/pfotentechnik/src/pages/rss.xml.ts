import type { APIRoute } from "astro";
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
        `      <title>${escapeXml(entry.hubTitle)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <description>${escapeXml(entry.hubDescription)}</description>`,
        `      <pubDate>${escapeXml(pubDate)}</pubDate>`,
        `      <category>${escapeXml(entry.type)}</category>`,
        "    </item>"
      ].join("\n");
    })
    .join("\n");

  const lastBuildDate =
    content.length > 0
      ? itemDate(content[0]).toUTCString()
      : new Date().toUTCString();

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(site.siteName)}</title>`,
    `    <link>${escapeXml(site.domain)}</link>`,
    `    <description>${escapeXml(site.siteDescription)}</description>`,
    "    <language>de-DE</language>",
    `    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(new URL("/rss.xml", site.domain).toString())}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    ""
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600"
    }
  });
};
