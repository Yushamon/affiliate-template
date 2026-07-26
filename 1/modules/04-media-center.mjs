function patchLayout(source) {
  let next = source;
  if (!next.includes('"media"')) {
    const typeAnchor = 'active?: "overview" | "cockpit" | "advisor" | "tasks" | "history" | "prompts" | "prices";';
    if (!next.includes(typeAnchor)) throw new Error("Anker nicht gefunden: SEO Admin Active Type");
    next = next.replace(typeAnchor, 'active?: "overview" | "cockpit" | "advisor" | "tasks" | "history" | "prompts" | "prices" | "media";');
    const navAnchor = '  ["prices", "/admin/seo/prices/", "Preise"],';
    if (!next.includes(navAnchor)) throw new Error("Anker nicht gefunden: Preisnavigation");
    next = next.replace(navAnchor, `${navAnchor}\n  ["media", "/admin/seo/media/", "Media"],`);
  }
  return next;
}

function patchIndex(source) {
  if (source.includes('href: "/admin/seo/media/"')) return source;
  const anchor = '  { href: "/admin/seo/prices/", title: "Preise", text: "Aktuelle Händlerpreise prüfen und automatisch innerhalb vergleichbarer Produktkategorien einordnen." },';
  if (!source.includes(anchor)) throw new Error("Anker nicht gefunden: Preisbereich im SEO Workspace");
  return source.replace(anchor, `${anchor}\n  { href: "/admin/seo/media/", title: "Media Center", text: "Referenzbilder sammeln, Werbung filtern, Prompts verwalten, WebP bauen und Produktmedien freigeben." },`);
}

export default {
  id: "04-media-center",
  dependsOn: "03-media-factory",
  title: "Media Center im SEO Cockpit",
  async apply(ctx) {
    await ctx.copyPayload("apps/pfotentechnik/src/pages/admin/seo/media.astro");
    await ctx.copyPayload("apps/pfotentechnik/src/lib/admin/operations-router.mjs");
    await ctx.edit("apps/pfotentechnik/src/layouts/SeoAdminLayout.astro", patchLayout);
    await ctx.edit("apps/pfotentechnik/src/pages/admin/seo/index.astro", patchIndex);
  },
  async checks(ctx) {
    await ctx.check("npm --workspace apps/pfotentechnik run test:media-center", "Media Center Unit-Tests");
    await ctx.check("npm --workspace apps/pfotentechnik run price:audit", "Finaler Preis-Audit");
    await ctx.check("npm --workspace apps/pfotentechnik run media:audit", "Finaler Medien-Audit");
    await ctx.check("npm --workspace apps/pfotentechnik run audit:product-experience-2", "Finaler Product Experience Audit");
    await ctx.check("npm --workspace apps/pfotentechnik run audit:repository", "Repository-Audit");
    await ctx.check("npm run build:pfotentechnik", "Finaler PfotenTechnik Build");
  }
};
