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
  defaultOgImage: "/images/project/pfotentechnik/feeder-hero.webp",
  categoryPath: "/smarte-gadgets-fuer-hunde-und-katzen",
  headerLinks: [
    { label: "Futterautomaten", href: "/smarte-futterautomaten" },
    { label: "Für Katzen", href: "/futterautomat-katze" },
    { label: "Für Hunde", href: "/futterautomat-hund" },
    { label: "Vergleiche", href: "/#vergleiche" },
    { label: "Ratgeber", href: "/#ratgeber" },
    { label: "Über uns", href: "/#ueber-uns" }
  ],
  home: {
    seo: {
      title: "Smarte Haustier-Technik im Vergleich | PfotenTechnik",
      description:
        "Unabhängige Kaufberatung, verständliche Vergleiche und praxisnahe Empfehlungen für smarte Haustier-Technik – aktuell mit Fokus auf Futterautomaten.",
      publishedAt: "2026-07-08",
      updatedAt: "2026-07-09"
    },
    hero: {
      eyebrow: "Unabhängige Pet-Tech-Kaufberatung",
      title: "Smarte Technik, die im Tieralltag wirklich hilft",
      text:
        "Wir vergleichen Funktionen, Bedienung und Alltagstauglichkeit moderner Haustier-Gadgets – transparent und ohne künstlichen Kaufdruck.",
      primaryAction: {
        label: "Futterautomaten vergleichen",
        href: "/smarte-futterautomaten"
      },
      secondaryAction: {
        label: "Ratgeber lesen",
        href: "#ratgeber"
      },
      imageAlt:
        "Katze und Hund in einem hellen Zuhause neben einem modernen Futterautomaten",
      imageKey: "feederHero",
      signals: [
        "6 Modelle eingeordnet",
        "Nach Alltagsszenarien bewertet",
        "Ohne statische Preise"
      ]
    },
    categories: {
      eyebrow: "Produktwelten",
      title: "Technik für einen entspannteren Alltag",
      text:
        "Nur Produktbereiche mit bereits geprüften Modellen werden angezeigt.",
      items: [
        {
          code: "01",
          title: "GPS Tracker",
          text: "Ortung, Akkulaufzeit und Abdeckung verständlich vergleichen.",
          anchor: "hunde",
          href: "/#produkte",
          productCategory: "gps-tracker"
        },
        {
          code: "02",
          title: "Futterautomaten",
          text: "Fütterungszeiten zuverlässig planen und Portionen kontrollieren.",
          anchor: "katzen",
          href: "/smarte-futterautomaten",
          productCategory: "futterautomat"
        },
        {
          code: "03",
          title: "Trinkbrunnen",
          text: "Material, Reinigung und Filterkosten realistisch einordnen.",
          anchor: "trinkbrunnen",
          href: "/#produkte",
          productCategory: "trinkbrunnen"
        },
        {
          code: "04",
          title: "Haustierkameras",
          text: "Bildqualität, Datenschutz und Benachrichtigungen bewerten.",
          anchor: "kameras",
          href: "/futterautomat-mit-kamera",
          productUseCase: "kamera"
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
        "Die aktuell stärksten Empfehlungen aus unserem Katalog – kompakt mit Bewertung, Kriterien und Testbericht."
    }
  },
  footer: {
    description:
      "Unabhängige Kaufberatung rund um smarte Technik für Hunde und Katzen.",
    columns: [
      {
        title: "Entdecken",
        links: [
          { label: "Futterautomaten", href: "/smarte-futterautomaten" },
          { label: "Für Katzen", href: "/futterautomat-katze" },
          { label: "Für Hunde", href: "/futterautomat-hund" },
          { label: "Vergleiche", href: "/#vergleiche" },
          { label: "Ratgeber", href: "/#ratgeber" }
        ]
      },
      {
        title: "Produktwelten",
        links: [
          { label: "Smarte Futterautomaten", href: "/smarte-futterautomaten" },
          { label: "Futterautomaten mit App", href: "/futterautomat-mit-app" },
          { label: "Futterautomaten mit Kamera", href: "/futterautomat-mit-kamera" },
          { label: "Futterautomaten für Nassfutter", href: "/futterautomat-nassfutter" }
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
