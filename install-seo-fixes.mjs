#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupRoot = path.join(root, ".seo-fix-backup-2026-07-17");

const files = {
  layout: "packages/affiliate-core/src/layouts/AffiliateLayout.astro",
  product: "apps/pfotentechnik/src/pages/produkt/[product].astro",
  comparison: "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro",
  knowledge: "apps/pfotentechnik/src/pages/[slug].astro",
};

function read(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    throw new Error(`Datei nicht gefunden: ${rel}`);
  }
  return fs.readFileSync(abs, "utf8");
}

function backup(rel, content) {
  const target = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

function write(rel, content) {
  const abs = path.join(root, rel);
  fs.writeFileSync(abs, content, "utf8");
  console.log(`✓ ${rel}`);
}

function replaceOnce(content, before, after, label) {
  const count = content.split(before).length - 1;
  if (count !== 1) {
    throw new Error(
      `${label}: Erwartet wurde genau ein Treffer, gefunden wurden ${count}. ` +
      `Es wurde nichts geschrieben.`
    );
  }
  return content.replace(before, after);
}

function insertOnce(content, marker, insertion, label) {
  return replaceOnce(content, marker, `${insertion}${marker}`, label);
}

fs.mkdirSync(backupRoot, { recursive: true });

try {
  // 1) Core layout: non-home pages default to WebPage, not Article.
  // Article dates are emitted only when the page actually supplies them.
  {
    const rel = files.layout;
    const original = read(rel);
    backup(rel, original);
    let next = original;

    next = replaceOnce(
      next,
      'const resolvedSchemaType = schemaType ?? (isHome ? "website" : "article");',
      'const resolvedSchemaType = schemaType ?? (isHome ? "website" : "webpage");',
      "AffiliateLayout: Schema-Standard"
    );

    next = replaceOnce(
      next,
`  datePublished: publishedAt ?? siteMeta.articleDefaults.publishedAt,
  dateModified:
    updatedAt ??
    publishedAt ??
    siteMeta.articleDefaults.updatedAt`,
`  ...(publishedAt ? { datePublished: publishedAt } : {}),
  ...(updatedAt || publishedAt
    ? { dateModified: updatedAt ?? publishedAt }
    : {})`,
      "AffiliateLayout: Artikeldaten"
    );

    write(rel, next);
  }

  // 2) Knowledge pages: honor an explicitly configured SEO canonical.
  {
    const rel = files.knowledge;
    const original = read(rel);
    backup(rel, original);
    let next = original;

    next = replaceOnce(
      next,
      '  canonical={`/${page.data.slug}/`}',
      `  canonical={
    page.data.seo?.canonical ??
    \`/\${page.data.slug}/\`
  }`,
      "Knowledge page: Canonical"
    );

    write(rel, next);
  }

  // 3) Comparison pages are collection/list-style WebPages, not dated Articles.
  {
    const rel = files.comparison;
    const original = read(rel);
    backup(rel, original);
    let next = original;

    next = replaceOnce(
      next,
      '  schemaType="article"',
      '  schemaType="webpage"',
      "Comparison page: Schema-Typ"
    );

    write(rel, next);
  }

  // 4) Product pages: replace generic Article markup with Product + Review JSON-LD.
  {
    const rel = files.product;
    const original = read(rel);
    backup(rel, original);
    let next = original;

    next = replaceOnce(
      next,
      'import { projectConfig } from "../../project.config";',
      'import { projectConfig, site } from "../../project.config";',
      "Product page: site import"
    );

    next = replaceOnce(
      next,
`const publishedAt =
  contentProduct.publishedAt ??
  "2026-07-09";

const updatedAt =
  contentProduct.updatedAt ??
  publishedAt;`,
`const publishedAt = contentProduct.publishedAt;
const updatedAt =
  contentProduct.updatedAt ??
  publishedAt;`,
      "Product page: Datums-Fallback"
    );

    const schemaBlock = `
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: contentProduct.title,
  description: seoDescription,
  url: new URL(canonical, site.domain).toString(),
  image: [
    new URL(optimizedOgImage.src, site.domain).toString()
  ],
  sku: contentProduct.slug,
  category: contentProduct.category.label,
  brand: {
    "@type": "Brand",
    name: contentProduct.manufacturer.name
  },
  review: {
    "@type": "Review",
    name: \`\${contentProduct.title} – redaktionelle Einordnung\`,
    reviewBody: contentProduct.recommendation,
    author: {
      "@type": "Organization",
      name: "PfotenTechnik Redaktion"
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: contentProduct.rating,
      bestRating: 5,
      worstRating: 1
    }
  }
};

`;

    next = insertOnce(
      next,
      'const productSearchValues = [',
      schemaBlock,
      "Product page: Product-Schema"
    );

    next = replaceOnce(
      next,
      '  schemaType="article"',
      '  schemaType="webpage"',
      "Product page: Schema-Typ"
    );

    next = replaceOnce(
      next,
      '  <Breadcrumbs items={breadcrumbs} />',
`  <script
    type="application/ld+json"
    set:html={JSON.stringify(productSchema)}
  />

  <Breadcrumbs items={breadcrumbs} />`,
      "Product page: JSON-LD-Ausgabe"
    );

    write(rel, next);
  }

  console.log("");
  console.log("SEO-Fixes erfolgreich installiert.");
  console.log(`Backups: ${path.relative(root, backupRoot)}`);
  console.log("Als Nächstes ausführen: npm run build:pfotentechnik");
} catch (error) {
  console.error("");
  console.error("Installation abgebrochen:");
  console.error(error instanceof Error ? error.message : error);
  console.error("Bereits geschriebene Dateien können aus dem Backup-Verzeichnis wiederhergestellt werden.");
  process.exit(1);
}
