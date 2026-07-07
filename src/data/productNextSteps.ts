import { products, type ProductKey } from "./products";

export type ProductNextStep = {
  title: string;
  text: string;
  href: string;
  button: string;
};

export function getProductNextStep(productKey: ProductKey): ProductNextStep {
  const product = products[productKey];
  const tags = product.recommendationTags ?? [];

  if (tags.includes("einsteiger")) {
    return {
      title: "Mit Alternativen vergleichen",
      text: "Dieses System ist besonders einsteigerfreundlich. Vergleiche es jetzt mit flexibleren Lösungen für Nachrüstung und Ausbau.",
      href: "/anker-vs-zendure",
      button: "Zum Vergleich"
    };
  }

  if (tags.includes("nachruesten")) {
    return {
      title: "Nachrüstung richtig planen",
      text: "Dieses System eignet sich besonders für bestehende Balkonkraftwerke. Prüfe jetzt, worauf es bei der Nachrüstung ankommt.",
      href: "/speicher-fuer-balkonkraftwerk-nachruesten",
      button: "Nachrüstung prüfen"
    };
  }

  if (tags.includes("premium") || tags.includes("erweiterbar")) {
    return {
      title: "Mit anderen Premium-Speichern vergleichen",
      text: "Dieses System ist stark für langfristige Ausbaupläne. Vergleiche es jetzt mit weiteren hochwertigen Balkonspeichern.",
      href: "/ecoflow-vs-zendure",
      button: "Zum Vergleich"
    };
  }

  if (tags.includes("preisleistung") || tags.includes("budget")) {
    return {
      title: "Preis-Leistung richtig bewerten",
      text: "Ein günstiger Einstieg ist attraktiv. Prüfe jetzt, wann sich ein Balkonspeicher wirtschaftlich wirklich lohnt.",
      href: "/balkonspeicher-wirtschaftlichkeit",
      button: "Wirtschaftlichkeit prüfen"
    };
  }

  return {
    title: "Weitere Balkonspeicher vergleichen",
    text: "Vergleiche jetzt weitere Systeme und finde heraus, welcher Speicher am besten zu deinem Haushalt passt.",
    href: "/beste-balkonspeicher",
    button: "Speicher vergleichen"
  };
}