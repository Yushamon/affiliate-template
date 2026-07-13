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
  categoryPath: "/smarte-gadgets-fuer-hunde-und-katzen/",
  headerLinks: [
    { label: "Futterautomaten", href: "/smarte-futterautomaten/" },
    { label: "Trinkbrunnen", href: "/trinkbrunnen/" },
    { label: "Vergleiche", href: "/vergleiche/" },
    { label: "Hersteller", href: "/hersteller/" },
    { label: "Wissen", href: "/wissen/" },
  ],
  home: {
    seo: {
      title: "Smarte Haustier-Technik im Vergleich | PfotenTechnik",
      description:
        "Unabhängige Kaufberatung, verständliche Vergleiche und praxisnahe Empfehlungen für Futterautomaten, Trinkbrunnen und weitere Haustier-Technik.",
      publishedAt: "2026-07-08",
      updatedAt: "2026-07-09"
    },
    hero: {
      eyebrow: "Unabhängige Pet-Tech-Kaufberatung",
      title: "Smarte Technik, die im Tieralltag wirklich hilft",
      text:
        "Wir vergleichen Funktionen, Bedienung und Alltagstauglichkeit moderner Haustier-Gadgets – transparent und ohne künstlichen Kaufdruck.",
      primaryAction: {
        label: "Produktwelten entdecken",
        href: "/#produktwelten"
      },
      secondaryAction: {
        label: "Wissen entdecken",
        href: "/wissen/"
      },
      imageAlt:
        "Katze und Hund in einem hellen Zuhause neben einem Futterautomaten und einem Trinkbrunnen",
      imageKey: "petTechHero",
      signals: [
        "15 Modelle eingeordnet",
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
          anchor: "gps-tracker",
          href: "/#produkte",
          productCategory: "gps-tracker"
        },
        {
          code: "02",
          title: "Futterautomaten",
          text: "Fütterungszeiten zuverlässig planen und Portionen kontrollieren.",
          anchor: "futterautomaten",
          href: "/smarte-futterautomaten/",
          productCategory: "futterautomat"
        },
        {
          code: "03",
          title: "Trinkbrunnen",
          text: "Material, Reinigung und Filterkosten realistisch einordnen.",
          anchor: "trinkbrunnen",
          href: "/trinkbrunnen/",
          productCategory: "trinkbrunnen"
        },
        {
          code: "04",
          title: "Futterautomaten mit Kamera",
          text: "Livebild, Zwei-Wege-Audio und App-Steuerung im Vergleich.",
          anchor: "futterautomaten-mit-kamera",
          href: "/futterautomat-mit-kamera/",
          productUseCase: "kamera"
        }
      ]
    },
    intents: {
      label: "Direkt nach Tier oder Bedarf",
      items: [
        { label: "Katzen · Futterautomaten", href: "/futterautomat-katze/" },
        { label: "Hunde · Futterautomaten", href: "/futterautomat-hund/" },
        { label: "Katzen · Trinkbrunnen", href: "/trinkbrunnen/#katzen" },
        { label: "Hunde · Trinkbrunnen", href: "/trinkbrunnen/#hunde" },
        { label: "Nassfutter", href: "/futterautomat-nassfutter/" },
        { label: "Mehrere Katzen", href: "/futterautomat-fuer-zwei-katzen/" },
        { label: "Ohne WLAN", href: "/futterautomat-ohne-wlan/" },
        { label: "Mit Kamera", href: "/futterautomat-mit-kamera/" }
      ]
    },
    values: {
      eyebrow: "Warum PfotenTechnik",
      title: "Weniger Marketing. Mehr Orientierung.",
      text:
        "Wir betrachten Technik aus Sicht von Tier und Alltag – nachvollziehbar, ruhig und ohne künstlichen Kaufdruck.",
      methodologyAction: {
        label: "Unsere Bewertungsmethodik ansehen",
        href: "/so-bewerten-wir/"
      },
      items: [
        {
          number: "01",
          title: "Unabhängige Kaufberatung",
          text: "Empfehlungen entstehen aus nachvollziehbaren Kriterien statt aus Werbeversprechen."
        },
        {
          number: "02",
          title: "Aktuelle Einordnungen",
          text: "Funktionen, Apps, Folgekosten und dokumentierte Praxiserfahrungen werden regelmäßig neu geprüft."
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
    },
    manufacturers: {
      eyebrow: "Markenübersicht",
      title: "Hersteller im Vergleich",
      text: "Fokus, Stärken, Grenzen und die eingeordneten Modelle der wichtigsten Anbieter.",
      items: [
        { code: "01", title: "Petlibro", text: "App-, Kamera- und kompakte Vorratsautomaten.", href: "/hersteller/petlibro/" },
        { code: "02", title: "PETKIT", text: "Pet-Tech-Ökosystem mit Kamera- und Dual-Hopper-Modellen.", href: "/hersteller/petkit/" },
        { code: "03", title: "Cat Mate", text: "Fachautomaten und Lösungen für vorbereitete Mahlzeiten.", href: "/hersteller/cat-mate/" },
        { code: "04", title: "SureFeed", text: "Mikrochipgesteuerter Zugang für Mehrtierhaushalte.", href: "/hersteller/surefeed/" }
      ]
    }
  },
  footer: {
    description:
      "Unabhängige Kaufberatung rund um smarte Technik für Hunde und Katzen.",
    columns: [
      {
        title: "Produktwelten",
        links: [
          { label: "Futterautomaten", href: "/smarte-futterautomaten/" },
          { label: "Trinkbrunnen", href: "/trinkbrunnen/" },
          { label: "Futterautomaten mit App", href: "/futterautomat-mit-app/" },
          { label: "Futterautomaten mit Kamera", href: "/futterautomat-mit-kamera/" }
        ]
      },
      {
        title: "Nach Tier & Bedarf",
        links: [
          { label: "Futterautomaten für Katzen", href: "/futterautomat-katze/" },
          { label: "Futterautomaten für Hunde", href: "/futterautomat-hund/" },
          { label: "Trinkbrunnen für Katzen", href: "/trinkbrunnen/#katzen" },
          { label: "Trinkbrunnen für Hunde", href: "/trinkbrunnen/#hunde" },
          { label: "Für mehrere Katzen", href: "/futterautomat-fuer-zwei-katzen/" }
        ]
      },
      {
        title: "Orientierung",
        links: [
          { label: "Vergleiche", href: "/vergleiche/" },
          { label: "Hersteller", href: "/hersteller/" },
          { label: "Wissen", href: "/wissen/" },
          { label: "So bewerten wir", href: "/so-bewerten-wir/" }
        ]
      },
      {
        title: "Rechtliches",
        links: [
          { label: "Impressum", href: "/impressum/" },
          { label: "Datenschutz", href: "/datenschutz/" },
          { label: "Affiliate-Hinweis", href: "/affiliate-hinweis/" },
          { label: "Kontakt", href: "/kontakt/" }
        ]
      }
    ],
    transparency:
      "Redaktionelle Empfehlungen werden nachvollziehbar recherchiert. Mögliche Affiliate-Partnerschaften verändern nicht die Bewertung eines Produkts."
  }
};
