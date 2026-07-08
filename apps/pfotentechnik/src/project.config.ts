export const site = {
  siteName: "PfotenTechnik",
  siteDescription:
    "Unabhängige Orientierung zu smarten Haustier-Gadgets für Hunde und Katzen.",
  domain: "https://pfotentechnik.de"
};

export const siteMeta = {
  defaultAuthor: {
    name: "PfotenTechnik Redaktion",
    role: "Redaktion",
    url: "https://pfotentechnik.de/"
  },
  publisher: {
    name: "PfotenTechnik",
    logo: "https://pfotentechnik.de/favicon.svg"
  },
  articleDefaults: {
    publishedAt: "2026-07-08",
    updatedAt: "2026-07-08"
  }
};

export const projectConfig = {
  projectName: "PfotenTechnik",
  domain: site.domain,
  niche: "pet-tech",
  productTypeLabel: "smarte Haustier-Gadgets",
  audienceLabel: "Hunde- und Katzenhalter",
  description: site.siteDescription,
  defaultOgImage: "/favicon.svg",
  categoryPath: "/smarte-gadgets-fuer-hunde-und-katzen",
  headerLinks: [
    { label: "Startseite", href: "/" },
    {
      label: "Smarte Gadgets",
      href: "/smarte-gadgets-fuer-hunde-und-katzen"
    }
  ],
  footer: {
    description:
      "Verständliche Orientierung zu vernetzter Technik für den Alltag mit Hund und Katze.",
    columns: [
      {
        title: "Ratgeber",
        links: [
          {
            label: "Smarte Gadgets",
            href: "/smarte-gadgets-fuer-hunde-und-katzen"
          }
        ]
      },
      {
        title: "Rechtliches",
        links: [
          { label: "Datenschutz", href: "/datenschutz" },
          { label: "Impressum", href: "/impressum" }
        ]
      }
    ],
    transparency:
      "Redaktionelle Empfehlungen werden nachvollziehbar recherchiert. Mögliche Affiliate-Partnerschaften verändern nicht die Bewertung eines Produkts."
  }
};
