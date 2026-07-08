import type { Product } from "./product-data/types";

import ecoflowStreamUltra from "./product-data/ecoflow-stream-ultra";
import ankerSolixSolarbank3Pro from "./product-data/anker-solix-solarbank-3-pro";
import zendureSolarflow from "./product-data/zendure-solarflow";
import solakonOne from "./product-data/solakon-one";

export type ProductSpec = { label: string; value: string };
export type ProductRatings = Record<string, number>;
export type ProductRanking = {
  overall: number;
  beginner: number;
  premium: number;
  retrofit: number;
  value: number;
};

export type GenericProductFields = {
  specs: ProductSpec[];
  useCases: string[];
  ratings: ProductRatings;
  ranking: ProductRanking;
  review: { summary: string; verdict: string };
};

export type AffiliateProduct = Product & GenericProductFields;

const withGenericFields = (
  product: Product & Partial<GenericProductFields>
): AffiliateProduct => {
  const defaultScore = Math.round(product.rating * 20);

  return {
    ...product,
    specs: product.specs ?? [
      { label: "Kapazität", value: product.capacity },
      { label: "Erweiterbar", value: product.expandable },
      { label: "Einsatzbereich", value: product.useCase }
    ],
    useCases: product.useCases ?? product.recommendationTags,
    ratings: product.ratings ?? product.ratingCategories,
    ranking: product.ranking ?? {
      overall: defaultScore,
      beginner: defaultScore,
      premium: defaultScore,
      retrofit: defaultScore,
      value: defaultScore
    },
    review: product.review ?? {
      summary: product.recommendation,
      verdict: product.verdict
    }
  };
};

type NewProductInput = Pick<Product,
  "name" | "brand" | "manufacturer" | "manufacturerLabel" | "badge" |
  "recommendation" | "productUrl" | "rating" | "capacity" | "expandable" |
  "useCase" | "highlights" | "priority"
> & GenericProductFields & {
  pros: string[];
  cons: string[];
  solarInput?: string;
  app?: string;
  affiliateUrl?: string;
  amazonUrl?: string;
  asin?: string;
  merchantLinks?: Product["merchantLinks"];
};

const createProduct = (input: NewProductInput): AffiliateProduct =>
  withGenericFields({
    ...input,
    category: "Balkonspeicher",
    image: "/images/balkonspeicher/product.webp",
    recommendationTags: Array.from(new Set([
      ...input.useCases,
      "beste-balkonspeicher"
    ])),
    batteryType: "LiFePO4",
    warranty: "Aktuelle Herstellerbedingungen prüfen",
    verdict: input.review.verdict,
    bestFor: input.useCases.map((item) => item.replace(/-/g, " ")),
    notFor: ["Haushalte mit abweichenden technischen Anforderungen"],
    ourOpinion: input.review.summary,
    ratingCategories: {
      installation: input.ratings.installation,
      app: input.ratings.app,
      flexibility: input.ratings.flexibility,
      pricePerformance: input.ratings.pricePerformance,
      expandability: input.ratings.expandability
    }
  });

const catalogV2 = {
  "anker-solix-solarbank-2-pro": createProduct({
    name: "Anker SOLIX Solarbank 2 E1600 Pro", brand: "Anker SOLIX",
    manufacturer: "anker", manufacturerLabel: "Anker", badge: "Einsteiger-Tipp",
    recommendation: "Bewährtes, kompaktes System mit einfacher Einrichtung und sehr guter App.",
    productUrl: "/produkt/anker-solix-solarbank-2-pro", rating: 4.5,
    capacity: "1,6 kWh", expandable: "bis 9,6 kWh", solarInput: "bis 2.400 W", app: "Anker App",
    useCase: "Für Einsteiger und kleinere Haushalte, die ein bewährtes System suchen",
    highlights: ["Einfache Einrichtung", "Sehr gute App", "Bewährtes System", "Kompakte Bauweise"],
    useCases: ["einsteiger", "preisleistung", "kleiner-haushalt"], priority: 6,
    specs: [{ label: "Kapazität", value: "1,6 kWh" }, { label: "Erweiterbar", value: "bis 9,6 kWh" }, { label: "PV-Eingang", value: "bis 2.400 W" }],
    ranking: { overall: 89, beginner: 95, premium: 82, retrofit: 84, value: 88 },
    ratings: { app: 5, installation: 5, flexibility: 4, pricePerformance: 4, expandability: 5 },
    pros: ["Einfache Einrichtung", "Sehr gute App", "Modular erweiterbar"],
    cons: ["Nicht die neueste Solarbank-Generation", "Zusatzakkus für größere Kapazität nötig"],
    review: { summary: "Eine ausgereifte Solarbank für einen unkomplizierten Einstieg.", verdict: "Besonders passend für kleine Haushalte und Käufer mit Fokus auf Komfort." }
  }),
  "ecoflow-stream-pro": createProduct({
    name: "EcoFlow STREAM Pro", brand: "EcoFlow", manufacturer: "ecoflow", manufacturerLabel: "EcoFlow", badge: "Premium-Tipp",
    recommendation: "Leistungsfähiger Speicher für das EcoFlow-Ökosystem mit hoher Erweiterbarkeit und starker App.",
    productUrl: "/produkt/ecoflow-stream-pro", rating: 4.6,
    capacity: "1,92 kWh", expandable: "im STREAM-System bis 11,52 kWh", solarInput: "bis 1.500 W", app: "EcoFlow App",
    useCase: "Für Familien und Smart-Home-Nutzer mit langfristigen Ausbauplänen",
    highlights: ["EcoFlow Ökosystem", "Hohe Erweiterbarkeit", "Sehr gute App", "Modernes Design"],
    useCases: ["premium", "smart-home", "familie"], priority: 5,
    specs: [{ label: "Kapazität", value: "1,92 kWh" }, { label: "Erweiterbar", value: "bis 11,52 kWh im System" }, { label: "PV-Eingang", value: "bis 1.500 W" }],
    ranking: { overall: 92, beginner: 87, premium: 95, retrofit: 86, value: 82 },
    ratings: { app: 5, installation: 4, flexibility: 5, pricePerformance: 4, expandability: 5 },
    pros: ["Starkes Energie-Ökosystem", "Sehr gute App", "Hohe Erweiterbarkeit"],
    cons: ["Vorteile vor allem im EcoFlow-System", "Komplexer als einfache Einstiegslösungen"],
    review: { summary: "Eine moderne Premium-Option für vernetzte Energiesysteme.", verdict: "Empfehlenswert für Haushalte, die App, Smart Home und Ausbau gemeinsam planen." }
  }),
  "zendure-hyper-2000": createProduct({
    name: "Zendure Hyper 2000", brand: "Zendure", manufacturer: "zendure", manufacturerLabel: "Zendure", badge: "Nachrüst-Tipp",
    recommendation: "Sehr modulares Hybrid-System für Nachrüstung, hohe Ladeleistung und flexible Batteriekonfigurationen.",
    productUrl: "/produkt/zendure-hyper-2000", rating: 4.5,
    capacity: "0,96 bis 7,68 kWh je System", expandable: "mit AB1000- und AB2000-Batterien", solarInput: "bis 1.800 W nominal", app: "Zendure App",
    useCase: "Für flexible Nachrüstung und Familien mit modularen Ausbauplänen",
    highlights: ["Sehr modular", "Hohe Ladeleistung", "Erweiterbar", "Gute Kompatibilität"],
    useCases: ["nachruestung", "nachruesten", "modular", "familie"], priority: 7,
    specs: [{ label: "Kapazität", value: "0,96 bis 7,68 kWh" }, { label: "Konzept", value: "AC/DC-Hybrid" }, { label: "PV-Eingang", value: "bis 1.800 W nominal" }],
    ranking: { overall: 89, beginner: 78, premium: 88, retrofit: 96, value: 91 },
    ratings: { app: 4, installation: 4, flexibility: 5, pricePerformance: 5, expandability: 5 },
    pros: ["Sehr modular", "Stark bei Nachrüstung", "Bidirektionale AC-Kopplung"],
    cons: ["Batteriemodule separat erforderlich", "Mehr Planungsaufwand als bei All-in-one-Systemen"],
    review: { summary: "Eine flexible Systemzentrale für bestehende Balkonkraftwerke.", verdict: "Besonders stark für Nachrüstung und frei kombinierbare Zendure-Batterien." }
  }),
  "growatt-noah-2000": createProduct({
    name: "Growatt NOAH 2000", brand: "Growatt", manufacturer: "growatt", manufacturerLabel: "Growatt", badge: "Preis-Leistungs-Tipp",
    recommendation: "Großer, modularer DC-Speicher mit attraktiver Grundkapazität und einfacher Erweiterung.",
    productUrl: "/produkt/growatt-noah-2000", rating: 4.4,
    capacity: "2,048 kWh", expandable: "bis 8,192 kWh", solarInput: "bis 1.800 W", app: "ShinePhone App",
    useCase: "Für Familien und preisbewusste Käufer mit modularen Ausbauplänen",
    highlights: ["Großer Speicher", "Attraktiver Preis", "Modulares Konzept", "Einfache Erweiterung"],
    useCases: ["preisleistung", "familie", "modular"], priority: 8,
    specs: [{ label: "Kapazität", value: "2,048 kWh" }, { label: "Erweiterbar", value: "bis 8,192 kWh" }, { label: "Konzept", value: "DC-gekoppelt" }],
    ranking: { overall: 87, beginner: 86, premium: 79, retrofit: 90, value: 93 },
    ratings: { app: 4, installation: 4, flexibility: 5, pricePerformance: 5, expandability: 5 },
    pros: ["Gute Grundkapazität", "Einfach stapelbar", "Starkes Preis-Leistungs-Potenzial"],
    cons: ["Vorgängergeneration zum NEXA 2000", "Kompatibilität vorab prüfen"],
    review: { summary: "Ein etablierter DC-Speicher mit viel Kapazität pro Modul.", verdict: "Sinnvoll, wenn Modularität wichtiger ist als ein Premium-App-Ökosystem." }
  }),
  "marstek-jupiter-c": createProduct({
    name: "Marstek Jupiter C", brand: "Marstek", manufacturer: "marstek", manufacturerLabel: "Marstek", badge: "Kompakt-Tipp",
    recommendation: "Kompaktes All-in-one-System mit LiFePO4-Akku und Fokus auf hohen Eigenverbrauch.",
    productUrl: "/produkt/marstek-jupiter-c", rating: 4.3,
    capacity: "2,56 kWh", expandable: "C Plus ist die aktuelle erweiterbare Generation", app: "Marstek App",
    useCase: "Für Einsteiger, die eine kompakte All-in-one-Lösung suchen",
    highlights: ["Sehr gutes Preis-Leistungs-Verhältnis", "LiFePO4", "Kompakt", "Hoher Eigenverbrauch"],
    useCases: ["preisleistung", "einsteiger"], priority: 9,
    specs: [{ label: "Kapazität", value: "2,56 kWh" }, { label: "Bauform", value: "All-in-one" }, { label: "Akku", value: "LiFePO4" }],
    ranking: { overall: 84, beginner: 90, premium: 76, retrofit: 82, value: 90 },
    ratings: { app: 4, installation: 5, flexibility: 3, pricePerformance: 5, expandability: 2 },
    pros: ["Kompakte Bauweise", "Hohe Grundkapazität", "Einfache Produktlogik"],
    cons: ["Aktuell durch Jupiter C Plus abgelöst", "Begrenzte Erweiterbarkeit der ursprünglichen Generation"],
    review: { summary: "Ein kompakter Vorgänger mit hoher Grundkapazität; aktuell ist vor allem der Jupiter C Plus relevant.", verdict: "Bei guter Verfügbarkeit interessant, für Neuanschaffungen sollte auch der C Plus geprüft werden." }
  }),
  "hoymiles-ms-a2": createProduct({
    name: "Hoymiles MS-A2", brand: "Hoymiles", manufacturer: "hoymiles", manufacturerLabel: "Hoymiles", badge: "Smart-Home-Tipp",
    recommendation: "AC-gekoppelter Speicher mit sehr guter Wechselrichter-Kompatibilität und moderner Steuerung.",
    productUrl: "/produkt/hoymiles-ms-a2", rating: 4.4,
    capacity: "2,24 kWh", expandable: "mit zwei Geräten bis 4,48 kWh", app: "S-Miles Home App",
    useCase: "Für Smart Home und unkomplizierte Nachrüstung vorhandener Balkonkraftwerke",
    highlights: ["Sehr gute Kompatibilität", "Hoymiles Ökosystem", "Moderne Steuerung", "Hohe Effizienz"],
    useCases: ["smart-home", "nachruestung", "nachruesten"], priority: 10,
    specs: [{ label: "Kapazität", value: "2,24 kWh" }, { label: "Erweiterbar", value: "bis 4,48 kWh" }, { label: "Konzept", value: "AC-gekoppelt" }],
    ranking: { overall: 88, beginner: 92, premium: 81, retrofit: 96, value: 88 },
    ratings: { app: 4, installation: 5, flexibility: 5, pricePerformance: 4, expandability: 4 },
    pros: ["Sehr einfache AC-Nachrüstung", "Breite Wechselrichter-Kompatibilität", "Smart-Meter-Unterstützung"],
    cons: ["AC-Wandlung verursacht zusätzliche Verluste", "Maximal zwei Geräte vorgesehen"],
    review: { summary: "Eine flexible AC-Speicherlösung für bestehende Balkonsolaranlagen.", verdict: "Stark, wenn Mikrowechselrichter und PV-Aufbau unverändert bleiben sollen." }
  })
};

export const products = {
  "ecoflow-stream-ultra": withGenericFields({ ...ecoflowStreamUltra, ranking: { overall: 94, beginner: 85, premium: 96, retrofit: 88, value: 78 } }),
  "anker-solix-solarbank-3-pro": withGenericFields({ ...ankerSolixSolarbank3Pro, ranking: { overall: 93, beginner: 96, premium: 92, retrofit: 82, value: 80 } }),
  "ecoflow-stream-pro": catalogV2["ecoflow-stream-pro"],
  "zendure-hyper-2000": catalogV2["zendure-hyper-2000"],
  "hoymiles-ms-a2": catalogV2["hoymiles-ms-a2"],
  "zendure-solarflow": withGenericFields({ ...zendureSolarflow, ranking: { overall: 88, beginner: 75, premium: 86, retrofit: 95, value: 90 } }),
  "growatt-noah-2000": catalogV2["growatt-noah-2000"],
  "anker-solix-solarbank-2-pro": catalogV2["anker-solix-solarbank-2-pro"],
  "marstek-jupiter-c": catalogV2["marstek-jupiter-c"],
  "solakon-one": withGenericFields({ ...solakonOne, ranking: { overall: 84, beginner: 92, premium: 74, retrofit: 72, value: 91 } })
} satisfies Record<string, AffiliateProduct>;

export type ProductKey = keyof typeof products;

export function getProductsByUseCase(tag: string, limit = 4) {
  return Object.entries(products)
    .filter(([, product]) => product.useCases.includes(tag))
    .sort(([, a], [, b]) => b.ranking.overall - a.ranking.overall)
    .slice(0, limit)
    .map(([key, product]) => ({ key: key as ProductKey, product }));
}

export function getProductsByTag(tag: string, limit = 4) {
  return getProductsByUseCase(tag, limit);
}

export function getProductsByManufacturer(manufacturer: Product["manufacturer"]) {
  return Object.entries(products)
    .filter(([, product]) => product.manufacturer === manufacturer)
    .sort(([, a], [, b]) => b.ranking.overall - a.ranking.overall)
    .map(([key, product]) => ({ key: key as ProductKey, product }));
}
