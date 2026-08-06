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
    url: "https://pfotentechnik.de/redaktion/"
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
    {
      label: "Vergleiche",
      href: "/vergleiche/",
      mobileGroup: "Orientierung",
      navCode: "01",
      description: "Modelle und Systeme nach denselben Kriterien vergleichen."
    },
    {
      label: "Kaufberatung",
      href: "/kaufberatung/",
      mobileGroup: "Orientierung",
      mobileEmphasis: true,
      navCode: "02",
      description: "Vom Bedarf zur passenden Geräteklasse."
    },
    {
      label: "Futterautomaten",
      href: "/smarte-futterautomaten/",
      mobileGroup: "Produktwelten",
      navCode: "FA",
      description: "Portionen, Futterarten, App und Ausfallsicherheit."
    },
    {
      label: "Trinkbrunnen",
      href: "/trinkbrunnen/",
      mobileGroup: "Produktwelten",
      navCode: "TB",
      description: "Material, Reinigung, Filter und Trinkfläche."
    },
    {
      label: "GPS-Tracker",
      href: "/gps-tracker/",
      mobileGroup: "Produktwelten",
      navCode: "GPS",
      description: "Ortung, Gewicht, Akku und laufende Kosten."
    },
    {
      label: "Katzenklappen",
      href: "/katzenklappen/",
      mobileGroup: "Produktwelten",
      navCode: "KK",
      description: "Mikrochip, App, Beuteerkennung und Einbau."
    },
    {
      label: "Haustierkameras",
      href: "/haustierkameras/",
      mobileGroup: "Produktwelten",
      navCode: "CAM",
      description: "Feste Kameras, Interaktion und mobile Roboter."
    },
    {
      label: "Automatische Katzentoiletten",
      href: "/automatische-katzentoiletten/",
      mobileGroup: "Produktwelten",
      navCode: "KLO",
      description: "Sicherheit, Bauform, Streu und Folgekosten."
    },
    {
      label: "Wissen & Ratgeber",
      href: "/wissen/",
      mobileGroup: "Mehr entdecken",
      navCode: "W",
      description: "Praxisfragen verständlich und unabhängig klären."
    },
    {
      label: "Hersteller",
      href: "/hersteller/",
      mobileGroup: "Mehr entdecken",
      navCode: "H",
      description: "Marken, Modellreihen und Systemgrenzen einordnen."
    }
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
          title: "Futterautomaten",
          text: "Portionierung, Futterart, App und Ausfallsicherheit passend zum Alltag wählen.",
          anchor: "futterautomaten",
          href: "/smarte-futterautomaten/",
          productCategory: "futterautomat"
        },
        {
          code: "02",
          title: "Trinkbrunnen",
          text: "Material, Reinigung, Filterkosten und Trinkfläche realistisch einordnen.",
          anchor: "trinkbrunnen",
          href: "/trinkbrunnen/",
          productCategory: "trinkbrunnen"
        },
        {
          code: "03",
          title: "GPS-Tracker",
          text: "Ortung, Gewicht, Akkulaufzeit, Abdeckung und Abo vergleichen.",
          anchor: "gps-tracker",
          href: "/gps-tracker/",
          productCategory: "gps-tracker"
        },
        {
          code: "04",
          title: "Katzenklappen",
          text: "Mikrochip-Zugang, App, Beuteerkennung, Passform und Einbau klären.",
          anchor: "katzenklappen",
          href: "/katzenklappen/",
          productCategory: "katzenklappen"
        },
        {
          code: "05",
          title: "Haustierkameras",
          text: "Feste Kameras, Interaktionsmodelle und mobile Roboter bewusst auswählen.",
          anchor: "haustierkameras",
          href: "/haustierkameras/",
          productCategory: "haustierkameras"
        },
        {
          code: "06",
          title: "Automatische Katzentoiletten",
          text: "Sicherheitsgrenzen, Bauform, Streu, Gewöhnung und Folgekosten prüfen.",
          anchor: "automatische-katzentoiletten",
          href: "/automatische-katzentoiletten/",
          productCategory: "automatische-katzentoiletten"
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
        { label: "Hunde · GPS-Tracker", href: "/vergleiche/beste-gps-tracker-fuer-hunde/" },
        { label: "Katzen · GPS-Tracker", href: "/vergleiche/beste-gps-tracker-fuer-katzen/" },
        { label: "Nassfutter", href: "/vergleiche/beste-futterautomaten-fuer-nassfutter/" },
        { label: "Mehrere Katzen", href: "/vergleiche/beste-futterautomaten-fuer-zwei-katzen/" },
        { label: "Ohne WLAN", href: "/vergleiche/beste-futterautomaten-ohne-wlan/" },
        { label: "Mit Kamera", href: "/vergleiche/beste-futterautomaten-mit-kamera/" }
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
      "Unabhängige Kaufberatung für smarte Haustiertechnik. Wir trennen belegte Produktdaten, redaktionelle Einordnung und offene Fragen.",
    columns: [
      {
        title: "Entscheiden",
        links: [
          { label: "Alle Vergleiche", href: "/vergleiche/" },
          { label: "Kaufberatung", href: "/kaufberatung/" },
          { label: "So bewerten wir", href: "/so-bewerten-wir/" },
          { label: "Redaktion & Unabhängigkeit", href: "/redaktion/" }
        ]
      },
      {
        title: "Wissen & Marken",
        links: [
          { label: "Wissen & Ratgeber", href: "/wissen/" },
          { label: "Smarte Haustiertechnik", href: "/smarte-haustiertechnik/" },
          { label: "Hersteller", href: "/hersteller/" },
          { label: "Kontakt", href: "/kontakt/" }
        ]
      },
      {
        title: "Service & Recht",
        links: [
          { label: "Affiliate-Hinweis", href: "/affiliate-hinweis/" },
          { label: "Impressum", href: "/impressum/" },
          { label: "Datenschutz", href: "/datenschutz/" }
        ]
      }
    ],
    transparency:
      "Redaktionelle Bewertungen werden nicht durch Provisionen verändert. Herstellerangaben, externe Erfahrungen und eigene redaktionelle Schlüsse werden getrennt ausgewiesen."
  }
};
