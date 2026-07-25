import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const siteUrl = "https://pfotentechnik.de";

const normalizePath = (value) => {
  const pathname = value.startsWith("http")
    ? new URL(value).pathname
    : value;
  const withLeadingSlash = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;
  return withLeadingSlash === "/" || withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
};

const readFrontmatter = (file) => {
  const source = readFileSync(file, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? yaml.load(match[1]) : null;
};

const sitemapMetadata = new Map();

const addCollection = (collection, getPath) => {
  const directory = path.join(appRoot, "src", "content", collection);
  for (const file of readdirSync(directory, { withFileTypes: true })) {
    if (!file.isFile() || !/\.mdx?$/.test(file.name)) continue;
    const data = readFrontmatter(path.join(directory, file.name));
    if (!data?.slug) continue;
    sitemapMetadata.set(normalizePath(getPath(data)), {
      include: data.seo?.sitemap !== false && data.seo?.noindex !== true,
      lastmod: data.updatedAt ?? data.publishedAt,
      changefreq: data.seo?.changefreq,
      priority: data.seo?.priority
    });
  }
};

addCollection("pages", (data) => `/${data.slug}/`);
addCollection("products", (data) => data.productUrl ?? `/produkt/${data.slug}/`);
addCollection("manufacturers", (data) => `/hersteller/${data.slug}/`);
addCollection("comparisons", (data) => `/vergleiche/${data.slug}/`);

export default defineConfig({
  site: siteUrl,
  output: "static",
  outDir: "./dist",

  image: {

    layout: "constrained"

  },
  integrations: [
    sitemap({
      filter: (page) =>
        sitemapMetadata.get(normalizePath(page))?.include !== false,
      serialize: (item) => {
        const metadata = sitemapMetadata.get(normalizePath(item.url));
        if (!metadata) return item;
        return {
          ...item,
          ...(metadata.lastmod
            ? { lastmod: new Date(`${metadata.lastmod}T00:00:00Z`) }
            : {}),
          ...(metadata.changefreq
            ? { changefreq: metadata.changefreq }
            : {}),
          ...(metadata.priority !== undefined
            ? { priority: metadata.priority }
            : {})
        };
      }
    })
  ],
  vite: {
    resolve: {
      alias: {
        "@affiliate-core": fileURLToPath(
          new URL("../../packages/affiliate-core/src", import.meta.url)
        ),
        "@app": fileURLToPath(new URL("./src", import.meta.url))
      }
    }
  }
});
