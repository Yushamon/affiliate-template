export const site = {
  siteName: "PfotenTechnik",
  siteDescription:
    "Kaufberatung, Vergleiche und unabhängige Empfehlungen für moderne Haustier-Gadgets.",
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
  affiliate: {
    amazon: {
      trackingId: "yusha0f-21"
    }
  },
  defaultOgImage: "/images/project/pfotentechnik/hero.webp",
  categoryPath: "/smarte-gadgets-fuer-hunde-und-katzen",
  headerLinks: [
    { label: "Hunde", href: "/#hunde" },
    { label: "Katzen", href: "/#katzen" },
    { label: "Vergleiche", href: "/#vergleiche" },
    { label: "Ratgeber", href: "/#ratgeber" },
    { label: "Über uns", href: "/#ueber-uns" }
  ],
  home: {
    seo: {
      title: "Smarte Technik für Hunde und Katzen | PfotenTechnik",
      description:
        "Unabhängige Kaufberatung, verständliche Vergleiche und praxisnahe Empfehlungen für GPS-Tracker, Futterautomaten, Trinkbrunnen und Haustierkameras.",
      publishedAt: "2026-07-08",
      updatedAt: "2026-07-08"
    },
    hero: {
      eyebrow: "Unabhängige Pet-Tech Kaufberatung",
      title: "Smarte Technik für Hunde und Katzen",
      text:
        "Kaufberatung, Vergleiche und unabhängige Empfehlungen für moderne Haustier-Gadgets.",
      primaryAction: {
        label: "Produkte entdecken",
        href: "#produkte"
      },
      secondaryAction: {
        label: "Ratgeber lesen",
        href: "#ratgeber"
      },
      imageAlt:
        "Hund und Katze in einem hellen Zuhause mit smarten Haustier-Geräten",
      signals: [
        "Unabhängig eingeordnet",
        "Praxisnah verglichen",
        "Verständlich erklärt"
      ]
    },
    categories: {
      eyebrow: "Produktwelten",
      title: "Technik für einen entspannteren Alltag",
      text:
        "Vier Bereiche, in denen gute Technik Orientierung, Komfort und Sicherheit schaffen kann.",
      items: [
        {
          code: "01",
          title: "GPS Tracker",
          text: "Ortung, Akkulaufzeit und Abdeckung verständlich vergleichen.",
          anchor: "hunde"
        },
        {
          code: "02",
          title: "Futterautomaten",
          text: "Fütterungszeiten zuverlässig planen und Portionen kontrollieren.",
          anchor: "katzen"
        },
        {
          code: "03",
          title: "Trinkbrunnen",
          text: "Material, Reinigung und Filterkosten realistisch einordnen.",
          anchor: "trinkbrunnen"
        },
        {
          code: "04",
          title: "Haustierkameras",
          text: "Bildqualität, Datenschutz und Benachrichtigungen bewerten.",
          anchor: "kameras"
        }
      ]
    },
    values: {
      eyebrow: "Warum PfotenTechnik",
      title: "Weniger Marketing. Mehr Orientierung.",
      text:
        "Wir betrachten Technik aus Sicht von Tier und Alltag – nachvollziehbar, ruhig und ohne künstlichen Kaufdruck.",
      items: [
        {
          number: "01",
          title: "Unabhängige Kaufberatung",
          text: "Empfehlungen entstehen aus nachvollziehbaren Kriterien statt aus Werbeversprechen."
        },
        {
          number: "02",
          title: "Aktuelle Produkttests",
          text: "Funktionen, Apps und Folgekosten werden regelmäßig neu eingeordnet."
        },
        {
          number: "03",
          title: "Praxisnahe Empfehlungen",
          text: "Entscheidend ist, was im Alltag mit Hund oder Katze wirklich hilfreich ist."
        }
      ]
    },
    guides: {
      eyebrow: "Wissen",
      title: "Beliebte Ratgeber",
      text:
        "Kompakte Grundlagen und klare Entscheidungshilfen für den Einstieg in moderne Haustier-Technik.",
      cardLabel: "Ratgeber",
      cardAction: "Ratgeber lesen"
    },
    products: {
      eyebrow: "Auswahl",
      title: "Beliebte Produkte",
      text:
        "Unsere Produktbereiche sind bereits für strukturierte Vergleiche vorbereitet – mit Fokus auf Nutzen, Bedienung und Alltagstauglichkeit.",
      cardAction: "Auswahl ansehen",
      items: [
        {
          badge: "Unterwegs",
          title: "GPS-Tracker für Hunde",
          text: "Für mehr Orientierung bei Spaziergängen, Reisen und Ausflügen.",
          imageKey: "category",
          imageAlt: "Hund mit kompaktem GPS-Tracker am Halsband",
          href: "#hunde",
          criteria: ["Ortungsqualität", "Akkulaufzeit", "Abo-Kosten"]
        },
        {
          badge: "Versorgung",
          title: "Futterautomaten & Trinkbrunnen",
          text: "Smarte Helfer für verlässliche Routinen und eine einfache Pflege.",
          imageKey: "product",
          imageAlt: "Katze an einem automatischen Futterspender und Trinkbrunnen",
          href: "#katzen",
          criteria: ["Reinigung", "Ausfallsicherheit", "Folgekosten"]
        },
        {
          badge: "Zuhause",
          title: "Haustierkameras",
          text: "Für einen ruhigen Blick auf das Zuhause – mit Datenschutz im Fokus.",
          imageKey: "comparison",
          imageAlt: "Haustierkamera mit Hund und Katze in einem modernen Wohnzimmer",
          href: "#kameras",
          criteria: ["Bildqualität", "App", "Datenschutz"]
        }
      ]
    }
  },
  footer: {
    description:
      "Unabhängige Kaufberatung rund um smarte Technik für Hunde und Katzen.",
    columns: [
      {
        title: "Entdecken",
        links: [
          { label: "Hunde", href: "/#hunde" },
          { label: "Katzen", href: "/#katzen" },
          { label: "Vergleiche", href: "/#vergleiche" },
          { label: "Ratgeber", href: "/#ratgeber" }
        ]
      },
      {
        title: "Produktwelten",
        links: [
          { label: "GPS Tracker", href: "/#hunde" },
          { label: "Futterautomaten", href: "/#katzen" },
          { label: "Trinkbrunnen", href: "/#trinkbrunnen" },
          { label: "Haustierkameras", href: "/#kameras" }
        ]
      },
      {
        title: "Unternehmen",
        links: [
          { label: "Über uns", href: "/#ueber-uns" },
          { label: "Datenschutz", href: "/datenschutz" },
          { label: "Impressum", href: "/impressum" }
        ]
      }
    ],
    transparency:
      "Redaktionelle Empfehlungen werden nachvollziehbar recherchiert. Mögliche Affiliate-Partnerschaften verändern nicht die Bewertung eines Produkts."
  }
};
