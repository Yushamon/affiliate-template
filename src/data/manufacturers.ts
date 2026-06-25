export const manufacturers = {
  ecoflow: {
    slug: "ecoflow",
    label: "EcoFlow",
    title: "EcoFlow Balkonspeicher",
    description:
      "EcoFlow gehört zu den bekanntesten Herstellern für moderne Balkonspeicher und flexible Energiesysteme.",
    shortAnswer:
      "EcoFlow eignet sich besonders für Nutzer, die ein modernes, erweiterbares Speichersystem mit starker App-Steuerung und langfristigem Ausbaupotenzial suchen.",
    intro:
      "EcoFlow ist vor allem durch mobile Powerstations bekannt geworden und hat sein Angebot inzwischen stark in Richtung Balkonkraftwerk-Speicher erweitert. Die Systeme richten sich an Haushalte, die mehr Solarstrom selbst nutzen und ihr Setup später flexibel erweitern möchten.",
    strengths: [
      "Starkes Energie-Ökosystem",
      "Moderne App-Steuerung",
      "Gute Erweiterbarkeit",
      "Interessant für größere Haushalte"
    ],
    suitableFor: [
      "Familien",
      "Haushalte mit höherem Abendverbrauch",
      "Nutzer mit Erweiterungsplänen",
      "Technikaffine Käufer"
    ],
    alternatives: [
      {
        label: "Anker",
        href: "/hersteller/anker"
      },
      {
        label: "Zendure",
        href: "/hersteller/zendure"
      },
      {
        label: "Solakon",
        href: "/hersteller/solakon"
      }
    ]
  },

  anker: {
    slug: "anker",
    label: "Anker",
    title: "Anker Balkonspeicher",
    description:
      "Anker bietet mit der SOLIX Solarbank moderne Balkonspeicher für einfache Nutzung und flexible Erweiterung.",
    shortAnswer:
      "Anker eignet sich besonders für Nutzer, die ein unkompliziertes Komplettsystem mit guter App, einfacher Bedienung und bekannter Marke suchen.",
    intro:
      "Anker ist vielen Nutzern bereits durch Ladegeräte, Powerbanks und mobile Stromspeicher bekannt. Mit der SOLIX Solarbank richtet sich der Hersteller gezielt an Haushalte mit Balkonkraftwerk.",
    strengths: [
      "Einfache Bedienung",
      "Starke Markenbekanntheit",
      "Gute App-Integration",
      "Interessant für Einsteiger"
    ],
    suitableFor: [
      "Einsteiger",
      "Paare",
      "Familien",
      "Nutzer mit Fokus auf Komfort"
    ],
    alternatives: [
      {
        label: "EcoFlow",
        href: "/hersteller/ecoflow"
      },
      {
        label: "Zendure",
        href: "/hersteller/zendure"
      },
      {
        label: "Solakon",
        href: "/hersteller/solakon"
      }
    ]
  },

  zendure: {
    slug: "zendure",
    label: "Zendure",
    title: "Zendure Balkonspeicher",
    description:
      "Zendure steht für flexible und modulare Balkonspeicher, die sich besonders für Nachrüstung und Erweiterung eignen.",
    shortAnswer:
      "Zendure eignet sich besonders für Nutzer, die ein modulares Speichersystem suchen und später flexibel erweitern möchten.",
    intro:
      "Zendure gehört zu den bekannten Anbietern im Bereich Balkonspeicher. Die Systeme richten sich vor allem an Nutzer, die flexibel starten und ihr Balkonkraftwerk später ausbauen möchten.",
    strengths: [
      "Modularer Aufbau",
      "Flexible Erweiterbarkeit",
      "Gut für Nachrüstung geeignet",
      "Verschiedene Speichergrößen möglich"
    ],
    suitableFor: [
      "Nutzer mit bestehendem Balkonkraftwerk",
      "Haushalte mit Ausbauplänen",
      "Technikinteressierte",
      "Flexible Setups"
    ],
    alternatives: [
      {
        label: "EcoFlow",
        href: "/hersteller/ecoflow"
      },
      {
        label: "Anker",
        href: "/hersteller/anker"
      },
      {
        label: "Solakon",
        href: "/hersteller/solakon"
      }
    ]
  },

  solakon: {
    slug: "solakon",
    label: "Solakon",
    title: "Solakon Balkonspeicher",
    description:
      "Solakon bietet einsteigerfreundliche Lösungen für Balkonkraftwerke und Speicher.",
    shortAnswer:
      "Solakon eignet sich besonders für Nutzer, die eine einfache und verständliche Einstiegslösung für ihr Balkonkraftwerk suchen.",
    intro:
      "Solakon richtet sich stark an Einsteiger, die ein möglichst unkompliziertes Balkonkraftwerk-Setup suchen. Der Fokus liegt weniger auf maximaler Komplexität und stärker auf Alltagstauglichkeit.",
    strengths: [
      "Einsteigerfreundlich",
      "Verständliche Komplettlösungen",
      "Guter Einstieg in Balkonkraftwerke",
      "Interessant für kleinere Haushalte"
    ],
    suitableFor: [
      "Einsteiger",
      "Mieter",
      "Singles",
      "Kleine Haushalte"
    ],
    alternatives: [
      {
        label: "EcoFlow",
        href: "/hersteller/ecoflow"
      },
      {
        label: "Anker",
        href: "/hersteller/anker"
      },
      {
        label: "Zendure",
        href: "/hersteller/zendure"
      }
    ]
  }
};

export type ManufacturerKey = keyof typeof manufacturers;