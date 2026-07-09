import type { ProductAffiliateData } from "@affiliate-core/affiliate/types";

export type ProductSpec = { label: string; value: string };
export type ProductRatings = Record<string, number>;
export type ProductRanking = {
  overall: number;
  beginner: number;
  premium: number;
  retrofit: number;
  value: number;
};

export type PetTechProduct = ProductAffiliateData & {
  name: string;
  brand: string;
  manufacturer: string;
  manufacturerLabel: string;
  category: "futterautomat";
  productUrl: string;
  image: string;
  badge: string;
  recommendation: string;
  rating: number;
  capacity: string;
  expandable: string;
  useCase: string;
  highlights: string[];
  pros: string[];
  cons: string[];
  specs: ProductSpec[];
  useCases: string[];
  recommendationTags: string[];
  ratings: ProductRatings;
  ratingCategories: ProductRatings;
  ranking: ProductRanking;
  priority: number;
  verdict: string;
  bestFor: string[];
  notFor: string[];
  ourOpinion: string;
  review: {
    summary: string;
    verdict: string;
  };
};

const productImage = "/images/project/pfotentechnik/product.webp";

const createFeeder = (
  product: Omit<PetTechProduct,
    | "category"
    | "image"
    | "recommendationTags"
    | "ratingCategories"
    | "expandable"
    | "bestFor"
    | "notFor"
    | "ourOpinion"
    | "review"
  >
): PetTechProduct => ({
  ...product,
  category: "futterautomat",
  image: productImage,
  expandable: "Nicht vorgesehen",
  recommendationTags: Array.from(new Set([
    ...product.useCases,
    "smarte-futterautomaten"
  ])),
  ratingCategories: product.ratings,
  bestFor: product.useCases,
  notFor: product.cons,
  ourOpinion: product.recommendation,
  review: {
    summary: product.recommendation,
    verdict: product.verdict
  }
});

export const products = {
  "petlibro-granary-wifi": createFeeder({
    name: "Petlibro Granary WiFi Feeder",
    brand: "Petlibro",
    manufacturer: "petlibro",
    manufacturerLabel: "Petlibro",
    productUrl: "/produkt/petlibro-granary-wifi-feeder",
    badge: "Beste Gesamtwahl",
    recommendation:
      "Ausgewogener 5-Liter-Automat mit App, flexiblen Zeitplänen und verständlicher Bedienung.",
    rating: 4.7,
    capacity: "5 Liter",
    useCase: "Für Katzen und kleine bis mittelgroße Hunde mit Trockenfutter",
    highlights: [
      "Bis zu zehn Mahlzeiten täglich planbar",
      "App-Steuerung und Fütterungsprotokoll",
      "Batterie-Backup für gespeicherte Zeitpläne"
    ],
    pros: [
      "Großer Vorratsbehälter",
      "Übersichtliche App-Funktionen",
      "Einzel- oder Doppelschale erhältlich"
    ],
    cons: [
      "Nur für Trockenfutter",
      "Keine Kamera",
      "Portionsgewicht hängt von der Krokettengröße ab"
    ],
    specs: [
      { label: "Futterart", value: "Trockenfutter" },
      { label: "App-Steuerung", value: "Ja" },
      { label: "Kamera", value: "Nein" },
      { label: "Kapazität", value: "5 Liter" },
      { label: "Stromversorgung", value: "Netzteil, Batterie-Backup" },
      { label: "Geeignet für", value: "Katze, kleine bis mittelgroße Hunde" },
      { label: "Portionierung", value: "Bis zu 10 Mahlzeiten täglich" }
    ],
    useCases: ["katze", "hund", "app", "urlaub", "portionierung", "trockenfutter"],
    ratings: {
      app: 5,
      portionierung: 5,
      reinigung: 4,
      zuverlaessigkeit: 4.5,
      sicherheit: 4.5,
      preisleistung: 4.5
    },
    ranking: { overall: 94, beginner: 95, premium: 87, retrofit: 90, value: 92 },
    priority: 1,
    verdict:
      "Die stärkste Allround-Empfehlung für planbare Trockenfütterung ohne Kamera-Aufpreis.",
    merchantLinks: {
      amazon: { searchQuery: "Petlibro Granary WiFi Futterautomat 5L" }
    }
  }),
  "petlibro-granary-camera": createFeeder({
    name: "Petlibro Granary Camera Feeder",
    brand: "Petlibro",
    manufacturer: "petlibro",
    manufacturerLabel: "Petlibro",
    productUrl: "/produkt/petlibro-granary-camera-feeder",
    badge: "Beste Wahl mit Kamera",
    recommendation:
      "Futterautomat und Haustierkamera in einem, mit 1080p-Video, Nachtsicht und Zwei-Wege-Audio.",
    rating: 4.6,
    capacity: "5 Liter",
    useCase: "Für Tierhalter, die Fütterung und Sichtkontrolle verbinden möchten",
    highlights: [
      "1080p-Kamera mit 145°-Weitwinkel",
      "Nachtsicht und Zwei-Wege-Audio",
      "App-Warnungen bei wenig Futter oder Stau"
    ],
    pros: [
      "Gute Sicht auf den Futterplatz",
      "App-Steuerung und Video in einem Gerät",
      "Großer 5-Liter-Behälter"
    ],
    cons: [
      "Nur Trockenfutter",
      "Höherer Preis als Modelle ohne Kamera",
      "Cloud-Speicher kann Zusatzkosten verursachen"
    ],
    specs: [
      { label: "Futterart", value: "Trockenfutter" },
      { label: "App-Steuerung", value: "Ja" },
      { label: "Kamera", value: "1080p, Nachtsicht" },
      { label: "Kapazität", value: "5 Liter" },
      { label: "Stromversorgung", value: "Netzteil, Batterie-Backup" },
      { label: "Geeignet für", value: "Katze, kleine bis mittelgroße Hunde" },
      { label: "Audio", value: "Zwei-Wege-Audio" }
    ],
    useCases: ["katze", "hund", "kamera", "app", "urlaub", "premium", "trockenfutter"],
    ratings: {
      app: 4.5,
      portionierung: 4.5,
      reinigung: 4,
      zuverlaessigkeit: 4.5,
      sicherheit: 4.5,
      preisleistung: 4
    },
    ranking: { overall: 92, beginner: 88, premium: 95, retrofit: 88, value: 82 },
    priority: 2,
    verdict:
      "Eine überzeugende Premium-Lösung, wenn Livebild und Kommunikation wichtiger sind als ein niedriger Einstiegspreis.",
    merchantLinks: {
      amazon: { searchQuery: "Petlibro Granary Camera Futterautomat 5L" }
    }
  }),
  "petkit-fresh-element-solo": createFeeder({
    name: "PETKIT Fresh Element Solo",
    brand: "PETKIT",
    manufacturer: "petkit",
    manufacturerLabel: "PETKIT",
    productUrl: "/produkt/petkit-fresh-element-solo",
    badge: "Kompakt-Tipp",
    recommendation:
      "Schlanker 3-Liter-Automat für Katzen und kleine Hunde mit PETKIT-App und Edelstahl-Napf.",
    rating: 4.5,
    capacity: "3 Liter",
    useCase: "Für einen kleinen Haushalt mit Katze oder kleinem Hund",
    highlights: [
      "Kompakte Stellfläche",
      "PETKIT-App mit Statusmeldungen",
      "Trocken- und passendes gefriergetrocknetes Futter"
    ],
    pros: [
      "Leicht zu platzieren",
      "Edelstahlnapf und gut zerlegbare Teile",
      "Zeitpläne laufen bei Netzausfall mit Batterien weiter"
    ],
    cons: [
      "Nur 3 Liter Kapazität",
      "Nur 2,4-GHz-WLAN",
      "Nicht für große Hunde gedacht"
    ],
    specs: [
      { label: "Futterart", value: "Trockenfutter, begrenzt Freeze-dried" },
      { label: "App-Steuerung", value: "Ja" },
      { label: "Kamera", value: "Nein" },
      { label: "Kapazität", value: "3 Liter" },
      { label: "Stromversorgung", value: "USB, 5 AAA als Backup" },
      { label: "Geeignet für", value: "Katzen, kleine Hunde" },
      { label: "Portionierung", value: "1 bis 5 Portionen je Mahlzeit" }
    ],
    useCases: ["katze", "app", "portionierung", "trockenfutter", "preisleistung"],
    ratings: {
      app: 4.5,
      portionierung: 4.5,
      reinigung: 4.5,
      zuverlaessigkeit: 4.5,
      sicherheit: 4.5,
      preisleistung: 4.5
    },
    ranking: { overall: 90, beginner: 94, premium: 80, retrofit: 91, value: 94 },
    priority: 3,
    verdict:
      "Besonders sinnvoll für Katzenhalter, die eine kompakte und preislich ausgewogene App-Lösung suchen.",
    merchantLinks: {
      amazon: { searchQuery: "PETKIT Fresh Element Solo Futterautomat" }
    }
  }),
  "petkit-yumshare-dual-hopper-2": createFeeder({
    name: "PETKIT YumShare Dual-Hopper 2",
    brand: "PETKIT",
    manufacturer: "petkit",
    manufacturerLabel: "PETKIT",
    productUrl: "/produkt/petkit-yumshare-dual-hopper",
    badge: "Premium für mehrere Tiere",
    recommendation:
      "Zwei getrennte Futterkammern, Kamera und Tiererkennung für anspruchsvolle Mehrkatzenhaushalte.",
    rating: 4.6,
    capacity: "5 Liter",
    useCase: "Für mehrere Katzen und unterschiedliche Trockenfuttersorten",
    highlights: [
      "Zwei getrennte Vorratskammern",
      "Kamera mit Tiererkennung",
      "2,4- und 5-GHz-WLAN"
    ],
    pros: [
      "Flexible Mischung zweier Futtersorten",
      "Für Mehrtierhaushalte konzipiert",
      "Umfangreiche App- und Kamera-Funktionen"
    ],
    cons: [
      "Nur Trockenfutter",
      "Großes Gehäuse",
      "Premium-Preis und komplexere Einrichtung"
    ],
    specs: [
      { label: "Futterart", value: "Trockenfutter" },
      { label: "App-Steuerung", value: "Ja" },
      { label: "Kamera", value: "Ja, Tiererkennung" },
      { label: "Kapazität", value: "5 Liter, zwei Kammern" },
      { label: "Stromversorgung", value: "Netzteil, 4 D-Batterien als Backup" },
      { label: "Geeignet für", value: "Katzen, kleine Hunde, mehrere Tiere" },
      { label: "Portionierung", value: "1 bis 10 Portionen je Kammer" }
    ],
    useCases: ["katze", "mehrere-tiere", "kamera", "app", "portionierung", "premium", "trockenfutter"],
    ratings: {
      app: 4.5,
      portionierung: 5,
      reinigung: 4,
      zuverlaessigkeit: 4.5,
      sicherheit: 4.5,
      preisleistung: 3.5
    },
    ranking: { overall: 91, beginner: 77, premium: 97, retrofit: 84, value: 76 },
    priority: 4,
    verdict:
      "Die funktionsreichste Wahl für mehrere Katzen, wenn zwei Futtersorten und Kameraüberwachung tatsächlich gebraucht werden.",
    merchantLinks: {
      amazon: { searchQuery: "PETKIT YumShare Dual Hopper 2 Futterautomat" }
    }
  }),
  "cat-mate-c500": createFeeder({
    name: "Cat Mate C500",
    brand: "Cat Mate",
    manufacturer: "closer-pets",
    manufacturerLabel: "Closer Pets / Cat Mate",
    productUrl: "/produkt/cat-mate-c500",
    badge: "Beste Wahl für Nassfutter",
    recommendation:
      "Fünf zeitgesteuerte Fächer und Kühlakkus machen den C500 zur pragmatischen Nassfutter-Lösung.",
    rating: 4.4,
    capacity: "5 Mahlzeitenfächer",
    useCase: "Für Katzen und kleine Hunde mit Nass- oder Mischfütterung",
    highlights: [
      "Fünf separat getaktete Mahlzeiten",
      "Für Nass- und Trockenfutter",
      "Kühlakkus unter den Futterschalen"
    ],
    pros: [
      "Keine App oder WLAN-Verbindung nötig",
      "Spülmaschinengeeignete Schalen",
      "Geeignet für Nassfutter"
    ],
    cons: [
      "Keine aktive Kühlung",
      "Nur lokale Timer-Bedienung",
      "Kühlleistung hängt von Raumtemperatur und Vorbereitung ab"
    ],
    specs: [
      { label: "Futterart", value: "Nass- und Trockenfutter" },
      { label: "App-Steuerung", value: "Nein" },
      { label: "Kamera", value: "Nein" },
      { label: "Kapazität", value: "5 Mahlzeiten" },
      { label: "Stromversorgung", value: "Batteriebetrieb" },
      { label: "Geeignet für", value: "Katzen, kleine Hunde" },
      { label: "Kühlung", value: "Kühlakkus, nicht aktiv gekühlt" }
    ],
    useCases: ["katze", "hund", "urlaub", "portionierung", "nassfutter", "preisleistung"],
    ratings: {
      app: 1,
      portionierung: 4.5,
      reinigung: 4.5,
      zuverlaessigkeit: 4.5,
      sicherheit: 4,
      preisleistung: 4.5
    },
    ranking: { overall: 86, beginner: 90, premium: 60, retrofit: 92, value: 91 },
    priority: 5,
    verdict:
      "Nicht smart im App-Sinn, aber für zeitgesteuertes Nassfutter deutlich geeigneter als klassische Vorratsautomaten.",
    merchantLinks: {
      amazon: { searchQuery: "Cat Mate C500 Futterautomat" }
    }
  }),
  "xiaomi-smart-pet-food-feeder-2": createFeeder({
    name: "Xiaomi Smart Pet Food Feeder 2",
    brand: "Xiaomi",
    manufacturer: "xiaomi",
    manufacturerLabel: "Xiaomi",
    productUrl: "/produkt/xiaomi-smart-pet-food-feeder-2",
    badge: "Smart-Home-Tipp",
    recommendation:
      "Moderner 5-Liter-Automat mit Xiaomi-Home-App, Wiegenapf und automatischer Entblockung.",
    rating: 4.5,
    capacity: "5 Liter",
    useCase: "Für Xiaomi-Home-Nutzer mit Katze oder kleinem bis mittelgroßem Hund",
    highlights: [
      "Wiegenapf misst verbleibendes Futter",
      "Automatische Entblockung",
      "LED-Display und Xiaomi-Home-App"
    ],
    pros: [
      "Großer 5-Liter-Behälter",
      "Gute Statusübersicht am Gerät und in der App",
      "Batterie-Backup für Zeitpläne"
    ],
    cons: [
      "Nur Trockenfutter",
      "Nur 2,4-GHz-WLAN",
      "Nicht für große Hunde vorgesehen"
    ],
    specs: [
      { label: "Futterart", value: "Trockenfutter bis 12 mm" },
      { label: "App-Steuerung", value: "Xiaomi Home" },
      { label: "Kamera", value: "Nein" },
      { label: "Kapazität", value: "5 Liter" },
      { label: "Stromversorgung", value: "Netzteil, 4 AA als Backup" },
      { label: "Geeignet für", value: "Katzen, kleine bis mittelgroße Hunde" },
      { label: "Besonderheit", value: "Wiegenapf und LED-Display" }
    ],
    useCases: ["katze", "hund", "app", "urlaub", "portionierung", "trockenfutter", "preisleistung"],
    ratings: {
      app: 4.5,
      portionierung: 4.5,
      reinigung: 4.5,
      zuverlaessigkeit: 4.5,
      sicherheit: 4.5,
      preisleistung: 4.5
    },
    ranking: { overall: 90, beginner: 91, premium: 88, retrofit: 90, value: 93 },
    priority: 6,
    verdict:
      "Eine starke Smart-Home-Alternative mit sinnvoller Füllstands- und Napfüberwachung.",
    merchantLinks: {
      amazon: { searchQuery: "Xiaomi Smart Pet Food Feeder 2" }
    }
  })
} satisfies Record<string, PetTechProduct>;

export type ProductKey = keyof typeof products;

export function getProductsByUseCase(tag: string, limit = 6) {
  return Object.entries(products)
    .filter(([, product]) => product.useCases.includes(tag))
    .sort(([, a], [, b]) => b.ranking.overall - a.ranking.overall)
    .slice(0, limit)
    .map(([key, product]) => ({ key: key as ProductKey, product }));
}

export function getProductsByTag(tag: string, limit = 6) {
  return getProductsByUseCase(tag, limit);
}

export function getProductsByManufacturer(manufacturer: string) {
  return Object.entries(products)
    .filter(([, product]) => product.manufacturer === manufacturer)
    .sort(([, a], [, b]) => b.ranking.overall - a.ranking.overall)
    .map(([key, product]) => ({ key: key as ProductKey, product }));
}
