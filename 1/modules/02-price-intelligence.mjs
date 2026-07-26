const files = [
  "apps/pfotentechnik/src/lib/admin/atomic-file.mjs",
  "apps/pfotentechnik/src/lib/admin/public-fetch.mjs",
  "apps/pfotentechnik/src/lib/price-intelligence/safe-fetch.mjs",
  "apps/pfotentechnik/src/lib/price-intelligence/extract-offer.mjs",
  "apps/pfotentechnik/src/lib/price-intelligence/frontmatter-price.mjs",
  "apps/pfotentechnik/src/lib/price-intelligence/service.mjs",
  "apps/pfotentechnik/src/pages/admin/seo/prices.astro",
  "apps/pfotentechnik/scripts/price-intelligence/audit.mjs",
  "apps/pfotentechnik/test/price-intelligence.test.mjs"
];

const priceSchemas = `
const productPriceSourceSchema =
  z.object({
    id: z.string(),
    label: z.string(),
    type: z
      .enum([
        "merchant",
        "affiliate",
        "editorial",
        "unknown"
      ])
      .default("unknown"),
    url: z.string().url().optional()
  });

const productPriceRangeSchema =
  z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    sampleSize: z.number().int().nonnegative(),
    generatedAt: z.coerce.date().optional(),
    source: z.literal("category-engine").default("category-engine")
  });

const productPriceSchema =
  z.object({
    current: z.number().positive().nullable().default(null),
    currency: z.string().length(3).default("EUR"),
    status: z
      .enum([
        "cheap",
        "fair",
        "expensive",
        "unknown"
      ])
      .default("unknown"),
    range: productPriceRangeSchema.optional(),
    comparisonText: z.string().optional(),
    checkedAt: z.coerce.date().optional(),
    affiliateUrl: z.string().url().optional(),
    source: productPriceSourceSchema.optional()
  })
  .default({
    current: null,
    currency: "EUR",
    status: "unknown"
  });
`;

function patchSchema(source) {
  let next = source;
  if (!next.includes("const productPriceSchema")) {
    const anchor = "\nconst productEditorialSchema =";
    if (!next.includes(anchor)) throw new Error("Anker nicht gefunden: Product Editorial Schema");
    next = next.replace(anchor, `\n${priceSchemas}\nconst productEditorialSchema =`);
  }
  if (!/\n\s+price:\s*\n\s+productPriceSchema/.test(next)) {
    const pattern = /(\n\s+conversion:\s*\n\s+productConversionSchema,?\r?\n)/;
    if (!pattern.test(next)) throw new Error("Anker nicht gefunden: Product Conversion Field");
    next = next.replace(pattern, `$1\n    price:\n      productPriceSchema,\n`);
  }
  return next;
}

function patchProductSchemaOffer(source) {
  let next = source;
  if (!next.includes("const schemaPriceIsFresh")) {
    const anchor = "const productSchema = {";
    if (!next.includes(anchor)) throw new Error("Anker nicht gefunden: Product JSON-LD");
    const block = `const schemaPriceCurrent = contentProduct.price?.current;\nconst schemaPriceCheckedAt = contentProduct.price?.checkedAt\n  ? new Date(contentProduct.price.checkedAt).getTime()\n  : Number.NaN;\nconst schemaPriceIsFresh =\n  typeof schemaPriceCurrent === "number" &&\n  Number.isFinite(schemaPriceCurrent) &&\n  schemaPriceCurrent > 0 &&\n  Number.isFinite(schemaPriceCheckedAt) &&\n  Date.now() - schemaPriceCheckedAt <= 14 * 86_400_000;\n\n`;
    next = next.replace(anchor, `${block}${anchor}`);
  }
  if (!next.includes('"@type": "Offer"')) {
    const brandPattern = /(\n\s+brand:\s*\{\r?\n\s+"@type": "Brand",\r?\n\s+name: contentProduct\.manufacturer\.name\r?\n\s+\},)/;
    if (!brandPattern.test(next)) throw new Error("Anker nicht gefunden: Product Brand JSON-LD");
    next = next.replace(brandPattern, `$1\n  ...(schemaPriceIsFresh\n    ? {\n        offers: {\n          "@type": "Offer",\n          price: schemaPriceCurrent,\n          priceCurrency: contentProduct.price.currency,\n          url: new URL(canonical, site.domain).toString()\n        }\n      }\n    : {}),`);
  }
  return next;
}

function patchAdminServer(source) {
  let next = source;
  if (!next.includes('from "../admin/operations-router.mjs"')) {
    const anchor = 'import { getCopilotWorkspaceStatus } from "../seo-copilot/workflow.mjs";';
    if (!next.includes(anchor)) throw new Error("Anker nicht gefunden: Admin Server Imports");
    next = next.replace(anchor, `${anchor}\nimport { handleOperationsRoute } from "../admin/operations-router.mjs";`);
  }
  if (!next.includes("handleOperationsRoute({ request, response, requestUrl")) {
    const anchor = "    pruneSessions();";
    if (!next.includes(anchor)) throw new Error("Anker nicht gefunden: Admin Server Router");
    next = next.replace(anchor, `${anchor}\n\n    if (await handleOperationsRoute({ request, response, requestUrl, origin, json, assertJsonRequest, readJsonBody })) return;`);
  }
  return next;
}

function patchLayout(source) {
  let next = source;
  if (!next.includes("--seo-on-accent")) {
    next = next.replace("--seo-accent-strong: #1f6426;", "--seo-accent-strong: #1f6426;\n         --seo-on-accent: #fff;");
    next = next.replaceAll("--seo-accent-strong: #8ee6a1;", "--seo-accent-strong: #8ee6a1;\n         --seo-on-accent: #07120a;");
  }
  if (!next.includes('"prices"')) {
    next = next.replace('active?: "overview" | "cockpit" | "advisor" | "tasks" | "history" | "prompts";', 'active?: "overview" | "cockpit" | "advisor" | "tasks" | "history" | "prompts" | "prices";');
    const anchor = '  ["prompts", "/admin/seo/prompts/", "Prompts"],';
    if (!next.includes(anchor)) throw new Error("Anker nicht gefunden: SEO Admin Navigation");
    next = next.replace(anchor, `${anchor}\n  ["prices", "/admin/seo/prices/", "Preise"],`);
  }
  return next;
}

function patchIndex(source) {
  if (source.includes('href: "/admin/seo/prices/"')) return source;
  const anchor = '  { href: "/admin/seo/prompts/", title: "Prompt-Bibliothek", text: "Fertige ChatGPT- und Codex-Arbeitsaufträge aus der aktuellen Datenbasis kopieren." },';
  if (!source.includes(anchor)) throw new Error("Anker nicht gefunden: SEO Workspace Sections");
  return source.replace(anchor, `${anchor}\n  { href: "/admin/seo/prices/", title: "Preise", text: "Aktuelle Händlerpreise prüfen und automatisch innerhalb vergleichbarer Produktkategorien einordnen." },`);
}

export default {
  id: "02-price-intelligence",
  dependsOn: "01-product-experience",
  title: "Price Intelligence 1.0",
  async apply(ctx) {
    for (const file of files) await ctx.copyPayload(file);
    await ctx.copyExternal("modules/assets/operations-router-price.mjs", "apps/pfotentechnik/src/lib/admin/operations-router.mjs");
    await ctx.edit("apps/pfotentechnik/src/content/schema/product.ts", patchSchema);
    await ctx.edit("apps/pfotentechnik/src/pages/produkt/[product].astro", patchProductSchemaOffer);
    await ctx.edit("apps/pfotentechnik/src/lib/search/admin-server.mjs", patchAdminServer);
    await ctx.edit("apps/pfotentechnik/src/layouts/SeoAdminLayout.astro", patchLayout);
    await ctx.edit("apps/pfotentechnik/src/pages/admin/seo/index.astro", patchIndex);
    await ctx.updateJson("apps/pfotentechnik/package.json", (data) => {
      data.scripts = data.scripts ?? {};
      data.scripts["test:price-intelligence"] = "node --test test/price-intelligence.test.mjs";
      data.scripts["price:audit"] = "node scripts/price-intelligence/audit.mjs";
      data.scripts["price:audit:strict"] = "node scripts/price-intelligence/audit.mjs --strict";
      return data;
    });
  },
  async checks(ctx) {
    await ctx.check("npm --workspace apps/pfotentechnik run test:price-intelligence", "Price Intelligence Unit-Tests");
    await ctx.check("npm --workspace apps/pfotentechnik run price:audit", "Price Intelligence Audit");
    await ctx.check("npm run build:pfotentechnik", "PfotenTechnik Build nach Price Intelligence 1.0");
  }
};
