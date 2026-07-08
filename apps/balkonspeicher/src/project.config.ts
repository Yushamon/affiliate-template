import { projectConfig as editorialConfig } from "./data/projectConfig";
import { siteMeta } from "./data/siteMeta";
import { site } from "./utils/site";

export { site, siteMeta };

export const projectConfig = {
  ...editorialConfig,
  domain: site.domain,
  description: site.siteDescription,
  defaultOgImage: "/images/generated/home-hero.webp",
  categoryPath: "/balkonspeicher",
  decisionUseCases: [
    {
      label: "Möglichst einfach starten",
      tag: "einsteiger",
      fallbackTitle: "Einsteiger"
    },
    {
      label: "Bestehendes Balkonkraftwerk nachrüsten",
      tag: "nachruesten",
      fallbackTitle: "Nachrüstung"
    },
    {
      label: "Später erweitern",
      tag: "erweiterbar",
      fallbackTitle: "Erweiterbarkeit"
    },
    {
      label: "Gutes Preis-Leistungs-Verhältnis",
      tag: "preisleistung",
      fallbackTitle: "Preis-Leistung"
    },
    {
      label: "Komfortable App und Bedienung",
      tag: "app",
      fallbackTitle: "Komfort"
    },
    {
      label: "Familie oder höherer Verbrauch",
      tag: "familie",
      fallbackTitle: "Familie"
    }
  ],
  headerLinks: [
    { label: "Ratgeber", href: "/balkonspeicher" },
    { label: "Beste Speicher", href: "/beste-balkonspeicher" },
    { label: "Rechner", href: "/balkonspeicher-groesse-berechnen" },
    { label: "Hersteller", href: "/hersteller" }
  ],
  footer: {
    description:
      "Unabhängige Kaufberatung rund um Balkonspeicher, Balkonkraftwerke und Stromspeicher.",
    columns: [
      {
        title: "Ratgeber",
        links: [
          { label: "Balkonspeicher", href: "/balkonspeicher" },
          { label: "Balkonkraftwerk Speicher", href: "/balkonkraftwerk-speicher" },
          { label: "Beste Balkonspeicher", href: "/beste-balkonspeicher" },
          { label: "Balkonspeicher Vergleich", href: "/balkonspeicher-vergleich" },
          { label: "Balkonspeicher Test", href: "/balkonspeicher-test" }
        ]
      },
      {
        title: "Hersteller",
        links: [
          { label: "EcoFlow", href: "/hersteller/ecoflow" },
          { label: "Anker", href: "/hersteller/anker" },
          { label: "Zendure", href: "/hersteller/zendure" },
          { label: "Solakon", href: "/hersteller/solakon" }
        ]
      },
      {
        title: "Unternehmen",
        links: [
          { label: "Über uns", href: "/ueber-uns" },
          { label: "Redaktion", href: "/redaktion" },
          { label: "Bewertungsmethodik", href: "/bewertungsmethodik" },
          { label: "Datenschutz", href: "/datenschutz" },
          { label: "Impressum", href: "/impressum" }
        ]
      }
    ],
    transparency:
      "Unsere Empfehlungen entstehen unabhängig auf Basis technischer Daten, Funktionsumfang, Alltagstauglichkeit und Marktvergleich. Affiliate-Links können zu einer Provision führen, beeinflussen jedoch nicht unsere Bewertungen."
  }
};
