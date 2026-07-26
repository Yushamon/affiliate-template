const files = [
  "apps/pfotentechnik/src/domain/price/types.ts",
  "apps/pfotentechnik/src/domain/price/engine.ts",
  "apps/pfotentechnik/src/domain/price/tier.ts",
  "apps/pfotentechnik/src/domain/price/adapters/contentPriceAdapter.ts",
  "apps/pfotentechnik/src/domain/productExperience/decisionEngine.ts",
  "apps/pfotentechnik/src/domain/productExperience/model.ts",
  "apps/pfotentechnik/src/components/product-standard-2/ProductRenderer.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductExperience2.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductGallery2.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductHero2.astro",
  "apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductDecisionAssistant.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductEverydayTimeline.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductAlternatives2.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductTrust2.astro",
  "apps/pfotentechnik/src/components/product-experience-2/ProductDetails2.astro",
  "apps/pfotentechnik/test/product-experience-2.test.mjs",
  "apps/pfotentechnik/scripts/audit-product-experience-2.mjs"
];

function patchProductPage(source) {
  let next = source;
  const rendererStart = next.indexOf("<ProductRenderer");
  const rendererEnd = rendererStart >= 0 ? next.indexOf("/>", rendererStart) : -1;
  if (rendererStart < 0 || rendererEnd < 0) throw new Error("Anker nicht gefunden: ProductRenderer-Aufruf");
  const beforeBlock = next.slice(rendererStart, rendererEnd + 2);
  let block = beforeBlock;
  if (!block.includes("currentEntry={contentEntry}")) {
    block = block.replace(/(\n\s*)reviewProduct=\{reviewProduct\}/, "$1currentEntry={contentEntry}$1allProducts={allProducts}$1reviewProduct={reviewProduct}");
    if (block === beforeBlock) throw new Error("Anker nicht gefunden: ProductRenderer Props");
  }
  next = next.slice(0, rendererStart) + block + next.slice(rendererEnd + 2);

  next = next.replace(/\nconst productSearchValues = \[[\s\S]*\n\];\r?\n\r?\n---/, "\n\n---");
  next = next.replace(/\n\s*<section\r?\n\s*class="pt-everyday-review"[\s\S]*?<\/section>\r?\n/, "\n");
  next = next.replace(/\n\s*<aside\r?\n\s*class="pt-product-health"[\s\S]*?<\/aside>\r?\n/, "\n");
  next = next.replace(/\n<script is:inline data-pt-editorial-status-cleanup>[\s\S]*?<\/script>\r?\n/, "\n");
  next = next.replace(/\n<style is:global>\s*\/\* PT PRODUCT DARK \+ MOBILE FIX 4\.2 START \*\/[\s\S]*?\/\* PT PRODUCT DARK \+ MOBILE FIX 4\.2 END \*\/\s*<\/style>\r?\n/, "\n");
  next = next.replace(/\n<style is:global>\s*\/\* PT mobile product breadcrumb 4\.2\.0 \*\/[\s\S]*?\/\* End PT mobile product breadcrumb 4\.2\.0 \*\/\s*<\/style>\r?\n/, "\n");
  next = next.replace(/\n<style is:global>\s*\/\* PT product quickfacts icons 4\.4\.0 \*\/[\s\S]*?\/\* End PT product quickfacts icons 4\.4\.0 \*\/\s*<\/style>\r?\n/, "\n");
  return next;
}

export default {
  id: "01-product-experience",
  title: "Product Experience 2.0",
  async apply(ctx) {
    for (const file of files) await ctx.copyPayload(file);
    await ctx.edit("apps/pfotentechnik/src/pages/produkt/[product].astro", patchProductPage);
    await ctx.edit(".gitignore", (source) => source.includes(".pfotentechnik-platform-2.0/") ? source : `${source.replace(/\s*$/, "")}\n\n# PfotenTechnik Platform 2.0 local installer state and backups\n.pfotentechnik-platform-2.0/\n.patch-backups/pfotentechnik-platform-2.0/\n`);
    await ctx.updateJson("apps/pfotentechnik/package.json", (data) => {
      data.scripts = data.scripts ?? {};
      data.scripts["test:product-experience-2"] = "node --experimental-strip-types --test test/product-experience-2.test.mjs";
      data.scripts["audit:product-experience-2"] = "node scripts/audit-product-experience-2.mjs";
      return data;
    });
  },
  async checks(ctx) {
    await ctx.check("npm --workspace apps/pfotentechnik run test:product-experience-2", "Product Experience Unit-Tests");
    await ctx.check("npm --workspace apps/pfotentechnik run audit:product-experience-2", "Product Experience Architektur-Audit");
    await ctx.check("npm run build:pfotentechnik", "PfotenTechnik Build nach Product Experience 2.0");
  }
};
