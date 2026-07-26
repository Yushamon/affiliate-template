const files = [
  "apps/pfotentechnik/src/lib/media-center/network.mjs",
  "apps/pfotentechnik/src/lib/media-center/product-identity.mjs",
  "apps/pfotentechnik/src/lib/media-center/filter.mjs",
  "apps/pfotentechnik/src/lib/media-center/image-evaluator.mjs",
  "apps/pfotentechnik/src/lib/media-center/markdown-images.mjs",
  "apps/pfotentechnik/src/lib/media-center/service.mjs",
  "apps/pfotentechnik/scripts/media-center/audit.mjs",
  "apps/pfotentechnik/test/media-center.test.mjs"
];

export default {
  id: "03-media-factory",
  dependsOn: "02-price-intelligence",
  title: "Media Factory 2.0",
  async apply(ctx) {
    for (const file of files) await ctx.copyPayload(file);
    await ctx.edit(".gitignore", (source) => source.includes("apps/pfotentechnik/.media-center/") ? source : `${source.replace(/\s*$/, "")}\napps/pfotentechnik/.media-center/\n`);
    await ctx.updateJson("apps/pfotentechnik/package.json", (data) => {
      data.scripts = data.scripts ?? {};
      data.scripts["test:media-center"] = "node --test test/media-center.test.mjs";
      data.scripts["media:audit"] = "node scripts/media-center/audit.mjs";
      return data;
    });
  },
  async checks(ctx) {
    await ctx.check("npm --workspace apps/pfotentechnik run test:media-center", "Media Filter Unit-Tests");
    await ctx.check("npm --workspace apps/pfotentechnik run media:audit", "Media Factory Audit");
    await ctx.check("npm run build:pfotentechnik", "PfotenTechnik Build nach Media Factory 2.0");
  }
};
