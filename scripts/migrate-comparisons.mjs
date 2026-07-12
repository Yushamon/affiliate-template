import { build } from "esbuild";
import yaml from "js-yaml";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const pagesDirectory = path.join(root, "apps/pfotentechnik/src/content/pages");
const comparisonsDirectory = path.join(root, "apps/pfotentechnik/src/content/comparisons");
const productSource = path.join(root, "apps/pfotentechnik/src/data/products.ts");
const slugs = [
  "beste-futterautomaten-fuer-katzen",
  "beste-futterautomaten-fuer-hunde",
  "beste-futterautomaten-fuer-zwei-katzen",
  "beste-futterautomaten-ohne-wlan",
  "beste-futterautomaten-mit-kamera",
  "beste-futterautomaten-fuer-nassfutter"
];
const icons = ["🐈", "🐕", "🐾", "📴", "📷", "🥣"];

const bundle = await build({
  entryPoints: [productSource],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`;
const { products } = await import(moduleUrl);

const productByKey = new Map(Object.entries(products));
const routeSlug = (product) => product?.productUrl?.split("/").filter(Boolean).at(-1);

await mkdir(comparisonsDirectory, { recursive: true });

for (const [index, slug] of slugs.entries()) {
  const pageFile = path.join(pagesDirectory, `${slug}.md`);
  const source = await readFile(pageFile, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`Ungültiges Frontmatter: ${pageFile}`);

  const data = yaml.load(match[1]);
  const body = match[2].trim();
  const productKeys = data.comparisonProducts ?? [];
  const items = productKeys.map((key) => {
    const product = productByKey.get(key);
    if (!product) throw new Error(`Unbekannter ProductKey ${key} in ${slug}`);
    return {
      slug: routeSlug(product),
      label: product.name,
      type: "product",
      recommendation: product.recommendation
    };
  });

  if (items.length < 2) {
    throw new Error(`${slug} enthält weniger als zwei belegbare Vergleichsprodukte.`);
  }

  const recommendation = data.comparisonRecommendation ?? {
    title: data.premiumBlocks?.[0]?.title ?? data.title,
    text: data.premiumBlocks?.[0]?.text ?? data.description
  };

  const comparison = {
    title: data.title,
    slug,
    type: "comparison",
    layout: "comparison",
    description: data.description,
    publishedAt: String(data.publishedAt),
    updatedAt: String(data.updatedAt ?? data.publishedAt),
    author: data.author,
    tags: data.tags ?? [],
    hub: {
      sections: ["vergleiche"],
      title: data.hub?.title ?? data.title,
      description: data.hub?.description ?? data.description,
      icon: data.hub?.icon ?? icons[index],
      order: data.hub?.order ?? (index + 1) * 10
    },
    seo: {
      title: data.seoTitle,
      description: data.seoDescription ?? data.description,
      canonical: `/vergleiche/${slug}/`,
      sitemap: true,
      priority: 0.8,
      changefreq: "monthly"
    },
    comparisonType: "use-case",
    group: "Futterautomaten",
    icon: data.hub?.icon ?? icons[index],
    items,
    criteria: (recommendation.criteria ?? []).map((label) => ({
      key: String(label).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      label
    })),
    recommendation: {
      title: recommendation.title,
      text: recommendation.text
    },
    tableTitle: recommendation.tableTitle,
    cardsTitle: recommendation.cardsTitle,
    faq: data.faq ?? []
  };

  const frontmatter = yaml.dump(comparison, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: true
  });
  const comparisonFile = path.join(comparisonsDirectory, `${slug}.md`);
  await writeFile(comparisonFile, `---\n${frontmatter}---\n\n${body}\n`, "utf8");

  const legacySource = source.replace(
    /(hub:\r?\n\s+sections:\r?\n)([\s\S]*?)(\s+title:)/,
    (_all, start, sections, title) => {
      const retained = sections
        .split(/\r?\n/)
        .filter((line) => !line.includes('"vergleiche"'))
        .join("\n");
      return `${start}${retained}${title}`;
    }
  );
  await writeFile(pageFile, legacySource, "utf8");
  console.log(`Migriert: ${slug}`);
}
