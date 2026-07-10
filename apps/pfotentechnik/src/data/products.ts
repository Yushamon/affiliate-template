import type { ProductAffiliateData } from "@affiliate-core/affiliate/types";
import { projectImages } from "./projectImages";

export type ProductSpec = { label: string; value: string };
export type ProductRatings = Record<string, number>;
export type ProductImages = {
  hero?: string;
  thumbnail?: string;
  comparison?: string;
  gallery?: string[];
};
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
  images: ProductImages;
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

const productImage = projectImages.pfotentechnik.product;

type FeederInput = Omit<PetTechProduct,
  | "category"
  | "image"
  | "images"
  | "recommendationTags"
  | "ratingCategories"
  | "expandable"
  | "bestFor"
  | "notFor"
  | "ourOpinion"
  | "review"
> & {
  images?: Partial<ProductImages>;
};

const createFeeder = (
  product: FeederInput
): PetTechProduct => {
  const images: Required<Pick<ProductImages, "hero" | "thumbnail" | "comparison">> &
    Pick<ProductImages, "gallery"> = {
    hero: product.images?.hero ?? productImage,
    thumbnail: product.images?.thumbnail ?? productImage,
    comparison: product.images?.comparison ?? productImage,
    gallery: product.images?.gallery
  };

  return {
    ...product,
    category: "futterautomat",
    images,
    image: images.thumbnail,
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
  };
};

export const products = {
  "petlibro-granary-wifi": createFeeder({
    name: "Petlibro Granary WiFi Feeder",
    brand: "Petlibro",
    manufacturer: "petlibro",
    manufacturerLabel: "Petlibro",
    productUrl: "/produkt/petlibro-granary-wifi-feeder",
    images: {
      hero: "/images/products/petlibro-granary-wifi-feeder/hero.webp",
      thumbnail: "/images/products/petlibro-granary-wifi-feeder/thumbnail.webp",
      comparison: "/images/products/petlibro-granary-wifi-feeder/comparison.webp",
      gallery: [
        "/images/products/petlibro-granary-wifi-feeder/gallery-1.webp",
        "/images/products/petlibro-granary-wifi-feeder/gallery-2.webp",
        "/images/products/petlibro-granary-wifi-feeder/gallery-3.webp"
      ]
    },
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
"petlibro-polar-wet-food-feeder": createFeeder({
  name: "PETLIBRO Polar Wet Food Feeder",
  brand: "Petlibro",
  manufacturer: "petlibro",
  manufacturerLabel: "Petlibro",
  productUrl: "/produkt/petlibro-polar-wet-food-feeder",
  images: {
    hero: "/images/products/petlibro-polar-wet-food-feeder/hero.webp",
    thumbnail: "/images/products/petlibro-polar-wet-food-feeder/thumbnail.webp",
    comparison: "/images/products/petlibro-polar-wet-food-feeder/comparison.webp",
    gallery: [
      "/images/products/petlibro-polar-wet-food-feeder/gallery-1.webp",
      "/images/products/petlibro-polar-wet-food-feeder/gallery-2.webp",
      "/images/products/petlibro-polar-wet-food-feeder/gallery-3.webp"
    ]
  },
  badge: "Beste Wahl für gekühltes Nassfutter",
  recommendation:
    "Der PETLIBRO Polar hält Nassfutter aktiv gekühlt und eignet sich besonders für Katzen, die regelmäßig frische Mahlzeiten erhalten sollen.",
  rating: 4.8,
  capacity: "3 Mahlzeiten à bis zu 200 ml",
  useCase:
    "Für Katzen und kleine Hunde mit Nassfutter oder rehydriertem Gefriertrockenfutter",
  highlights: [
    "Thermoelektrische Kühlung bis zu 72 Stunden",
    "App-Steuerung über WLAN",
    "Edelstahl-Napf mit PawShield-Abdeckung"
  ],
  pros: [
    "Aktive Kühlung ohne Kühlakkus",
    "Ideal für Nassfutter",
    "App mit Zeitplänen und manueller Fütterung"
  ],
  cons: [
    "Nur drei Mahlzeiten verfügbar",
    "Kein Batteriebetrieb",
    "Nicht für Rohfleisch empfohlen"
  ],
  specs: [
    { label: "Futterart", value: "Nassfutter, rehydriertes Gefriertrockenfutter" },
    { label: "App-Steuerung", value: "Ja" },
    { label: "Kamera", value: "Nein" },
    { label: "Kapazität", value: "3 Mahlzeiten à 200 ml" },
    { label: "Kühlung", value: "Thermoelektrisch bis zu 72 Stunden" },
    { label: "Stromversorgung", value: "Netzbetrieb" },
    { label: "Geeignet für", value: "Katzen, kleine Hunde" }
  ],
  useCases: [
    "katze",
    "hund",
    "app",
    "nassfutter",
    "premium",
    "portionierung"
  ],
  ratings: {
    app: 4.5,
    portionierung: 5,
    reinigung: 4.5,
    zuverlaessigkeit: 4.5,
    sicherheit: 5,
    preisleistung: 4
  },
  ranking: {
    overall: 95,
    beginner: 82,
    premium: 98,
    retrofit: 78,
    value: 86
  },
  priority: 2,
  verdict:
    "Aktuell eine der überzeugendsten Lösungen für automatische Nassfutterfütterung mit echter Kühlung.",
  merchantLinks: {
    amazon: {
      searchQuery: "PETLIBRO Polar Wet Food Feeder"
    }
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
  "petlibro-one-rfid-smart-feeder": createFeeder({
  name: "PETLIBRO One RFID Smart Feeder",
  brand: "Petlibro",
  manufacturer: "petlibro",
  manufacturerLabel: "Petlibro",
  productUrl: "/produkt/petlibro-one-rfid-smart-feeder",
  images: {
    hero: "/images/products/petlibro-one-rfid-smart-feeder/hero.webp",
    thumbnail: "/images/products/petlibro-one-rfid-smart-feeder/thumbnail.webp",
    comparison: "/images/products/petlibro-one-rfid-smart-feeder/comparison.webp",
    gallery: [
      "/images/products/petlibro-one-rfid-smart-feeder/gallery-1.webp",
      "/images/products/petlibro-one-rfid-smart-feeder/gallery-2.webp",
      "/images/products/petlibro-one-rfid-smart-feeder/gallery-3.webp"
    ]
  },
  badge: "Beste Wahl gegen Futterdiebstahl",
  recommendation:
    "Der PETLIBRO One RFID Smart Feeder kombiniert automatische Fütterung mit einem geschützten Napfzugang und eignet sich ideal für Mehrkatzenhaushalte.",
  rating: 4.7,
  capacity: "3 Liter",
  useCase:
    "Für Katzen in Mehrtierhaushalten mit individuellen Futterplänen oder Futterneid",
  highlights: [
    "RFID-Zugang über Halsbandanhänger",
    "App-Steuerung mit Fütterungsprotokollen",
    "Automatische Portionierung mit geschütztem Napf"
  ],
  pros: [
    "Verhindert Futterdiebstahl zuverlässig",
    "Automatische Portionierung und Zugangskontrolle kombiniert",
    "Unterstützt 2,4- und 5-GHz-WLAN"
  ],
  cons: [
    "Nur für Trockenfutter geeignet",
    "Verwendet RFID-Halsbandanhänger statt implantiertem Mikrochip",
    "Je Automat erhält nur ein Tier exklusiven Zugang"
  ],
  specs: [
    { label: "Futterart", value: "Trockenfutter (ca. 2 bis 15 mm)" },
    { label: "App-Steuerung", value: "Ja" },
    { label: "Kamera", value: "Nein" },
    { label: "Kapazität", value: "3 Liter" },
    { label: "Portionierung", value: "Bis zu 10 Mahlzeiten täglich" },
    { label: "Zugangskontrolle", value: "RFID-Halsbandanhänger" },
    { label: "WLAN", value: "2,4 GHz und 5 GHz" },
    { label: "Stromversorgung", value: "Netzteil mit Batterie-Backup" },
    { label: "Geeignet für", value: "Katzen in Mehrtierhaushalten" }
  ],
  useCases: [
    "katze",
    "mehrere-tiere",
    "app",
    "portionierung",
    "trockenfutter",
    "premium",
    "chip-erkennung",
    "batteriebetrieb"
  ],
  ratings: {
    app: 4.5,
    portionierung: 4.5,
    reinigung: 4.5,
    zuverlaessigkeit: 4.5,
    sicherheit: 5,
    preisleistung: 4
  },
  ranking: {
    overall: 93,
    beginner: 82,
    premium: 97,
    retrofit: 88,
    value: 82
  },
  priority: 3,
  verdict:
    "Eine der besten Lösungen für Mehrkatzenhaushalte, wenn jedes Tier zuverlässig nur sein eigenes Futter erhalten soll.",
  merchantLinks: {
    amazon: {
      searchQuery: "PETLIBRO One RFID Smart Feeder"
    }
  }
}),
"petkit-fresh-element-infinity": createFeeder({
  name: "PETKIT Fresh Element Infinity",
  brand: "PETKIT",
  manufacturer: "petkit",
  manufacturerLabel: "PETKIT",
  productUrl: "/produkt/petkit-fresh-element-infinity",
  images: {
    hero: "/images/products/petkit-fresh-element-infinity/hero.webp",
    thumbnail:
      "/images/products/petkit-fresh-element-infinity/thumbnail.webp",
    comparison:
      "/images/products/petkit-fresh-element-infinity/comparison.webp",
    gallery: [
      "/images/products/petkit-fresh-element-infinity/gallery-1.webp",
      "/images/products/petkit-fresh-element-infinity/gallery-2.webp",
      "/images/products/petkit-fresh-element-infinity/gallery-3.webp"
    ]
  },
  badge: "Großer PETKIT Vorrats-Tipp",
  recommendation:
    "Der PETKIT Fresh Element Infinity richtet sich an Haushalte, die einen größeren Trockenfuttervorrat, App-Steuerung und eine integrierte Napfwaage ohne Kamera benötigen.",
  rating: 4.5,
  capacity: "5 Liter",
  useCase:
    "Für Katzen und kleine Hunde mit regelmäßigem Trockenfutterbedarf und Wunsch nach größerem Vorrat",
  highlights: [
    "5-Liter-Vorratsbehälter",
    "PETKIT-App mit Fütterungsplänen und Statusmeldungen",
    "Edelstahlnapf mit integrierter Gewichtserfassung"
  ],
  pros: [
    "Größerer Vorrat als beim Fresh Element Solo",
    "App-Steuerung und Fütterungsprotokolle",
    "Integrierter Akku überbrückt kurze Stromausfälle"
  ],
  cons: [
    "Nur für Trockenfutter geeignet",
    "Keine Kamera",
    "Größer und schwerer als kompakte 3-Liter-Modelle"
  ],
  specs: [
    {
      label: "Futterart",
      value: "Trockenfutter"
    },
    {
      label: "App-Steuerung",
      value: "Ja"
    },
    {
      label: "Kamera",
      value: "Nein"
    },
    {
      label: "Kapazität",
      value: "5 Liter"
    },
    {
      label: "Napf",
      value: "Edelstahl mit Gewichtserfassung"
    },
    {
      label: "Stromversorgung",
      value: "Netzteil mit integriertem Akku"
    },
    {
      label: "Geeignet für",
      value: "Katzen und kleine Hunde"
    }
  ],
  useCases: [
    "katze",
    "hund",
    "app",
    "urlaub",
    "portionierung",
    "trockenfutter",
    "premium"
  ],
  ratings: {
    app: 4.5,
    portionierung: 4.5,
    reinigung: 4.5,
    zuverlaessigkeit: 4.5,
    sicherheit: 4.5,
    preisleistung: 4
  },
  ranking: {
    overall: 90,
    beginner: 88,
    premium: 90,
    retrofit: 86,
    value: 84
  },
  priority: 4,
  verdict:
    "Eine sinnvolle PETKIT Alternative für größere Trockenfuttervorräte, wenn Kamera und Doppelkammersystem nicht benötigt werden.",
  merchantLinks: {
    amazon: {
      searchQuery: "PETKIT Fresh Element Infinity 5L Futterautomat"
    }
  }
}),
"petkit-yumshare-solo-2": createFeeder({
  name: "PETKIT YumShare Solo 2",
  brand: "PETKIT",
  manufacturer: "petkit",
  manufacturerLabel: "PETKIT",
  productUrl: "/produkt/petkit-yumshare-solo-2",
  images: {
    hero: "/images/products/petkit-yumshare-solo-2/hero.webp",
    thumbnail: "/images/products/petkit-yumshare-solo-2/thumbnail.webp",
    comparison: "/images/products/petkit-yumshare-solo-2/comparison.webp",
    gallery: [
      "/images/products/petkit-yumshare-solo-2/gallery-1.webp",
      "/images/products/petkit-yumshare-solo-2/gallery-2.webp",
      "/images/products/petkit-yumshare-solo-2/gallery-3.webp"
    ]
  },
  badge: "Top Empfehlung mit Kamera",
  recommendation:
    "Der PETKIT YumShare Solo 2 kombiniert einen zuverlässigen Futterautomaten mit integrierter Kamera und App-Steuerung. Ideal für Katzen und kleine Hunde.",
  rating: 4.8,
  capacity: "3 Liter",
  useCase:
    "Für Katzen und kleine Hunde mit regelmäßigen Fütterungszeiten und Wunsch nach Live-Überwachung.",
  highlights: [
    "HD-Kamera mit Livebild",
    "App-Steuerung über WLAN",
    "Bis zu 10 Mahlzeiten pro Tag"
  ],
  pros: [
    "Sehr gute Kameraqualität",
    "Einfache Bedienung per App",
    "Großer 3-Liter-Vorratsbehälter"
  ],
  cons: [
    "Nur für Trockenfutter geeignet",
    "Cloud-Funktionen teilweise kostenpflichtig",
    "Kamera funktioniert im Batteriebetrieb nicht"
  ],
  specs: [
    { label: "Futterart", value: "Trockenfutter bis 12 mm, gefriergetrocknete Snacks bis 9 mm" },
    { label: "App-Steuerung", value: "Ja" },
    { label: "Kamera", value: "Ja" },
    { label: "Kapazität", value: "3 Liter" },
    { label: "Mahlzeiten", value: "1 bis 10 pro Tag" },
    { label: "Portionen", value: "1 bis 5 pro Mahlzeit" },
    { label: "WLAN", value: "2,4 GHz und 5 GHz" },
    { label: "Stromversorgung", value: "Netzteil mit Batterie-Backup" },
    { label: "Geeignet für", value: "Katzen und kleine Hunde" }
  ],
  useCases: [
    "katze",
    "hund",
    "kamera",
    "app",
    "trockenfutter",
    "premium",
    "portionierung",
    "batteriebetrieb"
  ],
  ratings: {
    app: 4.8,
    portionierung: 4.7,
    reinigung: 4.5,
    zuverlaessigkeit: 4.7,
    sicherheit: 4.7,
    preisleistung: 4.4
  },
  ranking: {
    overall: 94,
    beginner: 88,
    premium: 96,
    retrofit: 86,
    value: 88
  },
  priority: 2,
  verdict:
    "Der YumShare Solo 2 gehört aktuell zu den besten smarten Futterautomaten mit Kamera und überzeugt durch zuverlässige Portionierung sowie eine sehr gute App.",
  merchantLinks: {
    amazon: {
      searchQuery: "PETKIT YumShare Solo 2"
    }
  }
}),
"cat-mate-c200": createFeeder({
  name: "Cat Mate C200",
  brand: "Cat Mate",
  manufacturer: "closer-pets",
  manufacturerLabel: "Closer Pets / Cat Mate",
  productUrl: "/produkt/cat-mate-c200",
  images: {
    hero: "/images/products/cat-mate-c200/hero.webp",
    thumbnail: "/images/products/cat-mate-c200/thumbnail.webp",
    comparison: "/images/products/cat-mate-c200/comparison.webp",
    gallery: [
      "/images/products/cat-mate-c200/gallery-1.webp",
      "/images/products/cat-mate-c200/gallery-2.webp",
      "/images/products/cat-mate-c200/gallery-3.webp"
    ]
  },
  badge: "Einfacher Nassfutter-Tipp",
  recommendation:
    "Der Cat Mate C200 ist eine unkomplizierte Lösung für zwei zeitgesteuerte Mahlzeiten mit Nass- oder Trockenfutter und funktioniert vollständig ohne App oder WLAN.",
  rating: 4.3,
  capacity: "2 Mahlzeiten mit je bis zu 400 g",
  useCase:
    "Für Katzen und kleine Hunde, die innerhalb von bis zu 48 Stunden zwei vorbereitete Mahlzeiten erhalten sollen",
  highlights: [
    "Zwei separat programmierbare 48-Stunden-Timer",
    "Für Nass- und Trockenfutter geeignet",
    "Kühlakku unter den Futterschalen"
  ],
  pros: [
    "Keine App oder WLAN-Verbindung erforderlich",
    "Schalen und Deckel sind herausnehmbar und spülmaschinengeeignet",
    "Bis zu zwölf Monate Batterielaufzeit mit einer AA-Batterie"
  ],
  cons: [
    "Nur zwei Mahlzeiten planbar",
    "Keine aktive Kühlung",
    "Mechanische Timer sind weniger exakt als digitale Zeitpläne"
  ],
  specs: [
    {
      label: "Futterart",
      value: "Nass- und Trockenfutter"
    },
    {
      label: "App-Steuerung",
      value: "Nein"
    },
    {
      label: "Kamera",
      value: "Nein"
    },
    {
      label: "Kapazität",
      value: "2 Schalen mit je bis zu 400 g"
    },
    {
      label: "Timer",
      value: "Zwei separate Timer, bis zu 48 Stunden"
    },
    {
      label: "Kühlung",
      value: "Kühlakku, keine aktive Kühlung"
    },
    {
      label: "Stromversorgung",
      value: "1 AA-Batterie"
    },
    {
      label: "Geeignet für",
      value: "Katzen und kleine Hunde"
    }
  ],
  useCases: [
    "katze",
    "hund",
    "nassfutter",
    "trockenfutter",
    "portionierung",
    "ohne-wlan",
    "batteriebetrieb",
    "preisleistung"
  ],
  ratings: {
    app: 1,
    portionierung: 4,
    reinigung: 4.5,
    zuverlaessigkeit: 4,
    sicherheit: 4,
    preisleistung: 4.5
  },
  ranking: {
    overall: 84,
    beginner: 94,
    premium: 58,
    retrofit: 93,
    value: 92
  },
  priority: 6,
  verdict:
    "Eine preiswerte und einfache Wahl für zwei vorbereitete Mahlzeiten, wenn App-Steuerung und aktive Kühlung nicht benötigt werden.",
  merchantLinks: {
    amazon: {
      searchQuery: "Cat Mate C200 Futterautomat"
    }
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
  }),
  "surefeed-microchip-pet-feeder-connect": createFeeder({
    name: "SureFeed Microchip Pet Feeder Connect", brand: "SureFeed",
    manufacturer: "surefeed", manufacturerLabel: "Sure Petcare",
    productUrl: "/produkt/surefeed-microchip-pet-feeder-connect", badge: "Chip-Komfort-Tipp",
    recommendation: "App-gestützter Mikrochip-Napf für getrennte Fütterung und nachvollziehbare Fressgewohnheiten im Mehrtierhaushalt.",
    rating: 4.6, capacity: "400 ml", useCase: "Für Katzen und kleine Hunde mit individuellem Futterzugang",
    highlights: ["Mikrochip-Zugang", "Integrierte Portionswaage", "Für Nass- und Trockenfutter"],
    pros: ["Kontrollierter Zugang im Mehrtierhaushalt", "App-Auswertung über Sure Petcare Hub", "Herausnehmbare Schale"],
    cons: ["Hub für App-Funktionen erforderlich", "Keine zeitgesteuerte Vorratsausgabe", "Begrenztes Schalenvolumen"],
    specs: [
      { label: "Futterart", value: "Nass- und Trockenfutter" }, { label: "App-Steuerung", value: "Ja, mit Sure Petcare Hub" },
      { label: "Kamera", value: "Nein" }, { label: "Kapazität", value: "400 ml" },
      { label: "Stromversorgung", value: "4 C-Batterien" }, { label: "Geeignet für", value: "Katzen, kleine Hunde" },
      { label: "Besonderheit", value: "Mikrochip-Zugang und Portionswaage" }
    ],
    useCases: ["katze", "mehrere-tiere", "app", "portionierung", "nassfutter", "trockenfutter", "premium", "chip-erkennung", "batteriebetrieb"],
    ratings: { app: 4.5, portionierung: 5, reinigung: 4.5, zuverlaessigkeit: 4.5, sicherheit: 5, preisleistung: 3.5 },
    ranking: { overall: 91, beginner: 82, premium: 95, retrofit: 88, value: 74 }, priority: 7,
    verdict: "Eine spezialisierte Premium-Lösung, wenn Futterzugang und Dokumentation wichtiger sind als automatische Vorratsausgabe.",
    merchantLinks: { amazon: { searchQuery: "SureFeed Microchip Pet Feeder Connect" } }
  }),
  "surefeed-microchip-pet-feeder": createFeeder({
    name: "SureFeed Microchip Pet Feeder", brand: "SureFeed",
    manufacturer: "surefeed", manufacturerLabel: "Sure Petcare",
    productUrl: "/produkt/surefeed-microchip-pet-feeder", badge: "Mehrkatzen-Tipp",
    recommendation: "Batteriebetriebener Mikrochip-Napf ohne App für getrennte Rationen und unterschiedliche Futtersorten.",
    rating: 4.5, capacity: "400 ml", useCase: "Für Mehrtierhaushalte mit Futterdiebstahl oder getrennten Rationen",
    highlights: ["Zugang per Mikrochip oder RFID-Anhänger", "Bis zu 32 Chipnummern", "Ohne WLAN nutzbar"],
    pros: ["Nass- und Trockenfutter geeignet", "Keine Cloud-Abhängigkeit", "Trainingsmodus für die Gewöhnung"],
    cons: ["Keine App-Auswertung", "Keine automatische Mahlzeitenplanung", "Für jedes getrennt zu fütternde Tier meist eigener Napf nötig"],
    specs: [
      { label: "Futterart", value: "Nass- und Trockenfutter" }, { label: "App-Steuerung", value: "Nein" },
      { label: "Kamera", value: "Nein" }, { label: "Kapazität", value: "400 ml" },
      { label: "Stromversorgung", value: "4 C-Batterien" }, { label: "Geeignet für", value: "Katzen, kleine Hunde" },
      { label: "Besonderheit", value: "Mikrochipgesteuerter Deckel" }
    ],
    useCases: ["katze", "mehrere-tiere", "nassfutter", "trockenfutter", "ohne-wlan", "chip-erkennung", "batteriebetrieb"],
    ratings: { app: 1, portionierung: 4, reinigung: 4.5, zuverlaessigkeit: 4.5, sicherheit: 5, preisleistung: 4 },
    ranking: { overall: 89, beginner: 86, premium: 88, retrofit: 94, value: 82 }, priority: 8,
    verdict: "Die klare Wahl für kontrollierten Futterzugang ohne App, aber kein klassischer zeitgesteuerter Vorratsautomat.",
    merchantLinks: { amazon: { searchQuery: "SureFeed Microchip Pet Feeder" } }
  }),
  "honeyguardian-smart-pet-feeder-s305d": createFeeder({
    name: "HoneyGuardian Smart Pet Feeder S305D", brand: "HoneyGuardian",
    manufacturer: "honeyguardian", manufacturerLabel: "HoneyGuardian",
    productUrl: "/produkt/honeyguardian-smart-pet-feeder-s305d", badge: "Preis-Leistungs-Alternative",
    recommendation: "Vernetzter 5-Liter-Trockenfutterautomat mit App-Zeitplänen und Edelstahl-Napf.",
    rating: 4.2, capacity: "5 Liter", useCase: "Für preisbewusste Haushalte mit Katze oder kleinem Hund",
    highlights: ["5-Liter-Vorrat", "App-Steuerung", "Edelstahl-Napf"],
    pros: ["Großer Vorrat", "Mehrere Mahlzeiten planbar", "Netz- und Reservebetrieb"],
    cons: ["Nur Trockenfutter", "Modellvarianten im Handel genau prüfen", "Weniger etabliertes App-Ökosystem"],
    specs: [
      { label: "Futterart", value: "Trockenfutter" }, { label: "App-Steuerung", value: "Ja" },
      { label: "Kamera", value: "Nein" }, { label: "Kapazität", value: "5 Liter" },
      { label: "Stromversorgung", value: "Netzteil, Batteriereserve" }, { label: "Geeignet für", value: "Katzen, kleine Hunde" },
      { label: "Besonderheit", value: "Edelstahl-Napf" }
    ],
    useCases: ["katze", "hund", "app", "urlaub", "portionierung", "trockenfutter", "preisleistung"],
    ratings: { app: 4, portionierung: 4, reinigung: 4.5, zuverlaessigkeit: 4, sicherheit: 4, preisleistung: 4.5 },
    ranking: { overall: 84, beginner: 88, premium: 70, retrofit: 86, value: 92 }, priority: 11,
    verdict: "Eine funktionale Alternative, sofern die konkrete S305D-Variante und App-Kompatibilität beim Händler eindeutig ausgewiesen sind.",
    merchantLinks: { amazon: { searchQuery: "HoneyGuardian S305D 5L Smart Pet Feeder" } }
  }),
  "wopet-patrol-f07-pro": createFeeder({
    name: "WOPET Patrol F07 Pro", brand: "WOPET", manufacturer: "wopet", manufacturerLabel: "WOPET",
    productUrl: "/produkt/wopet-patrol-f07-pro", badge: "Großer-Vorrat-Tipp",
    recommendation: "6-Liter-WLAN-Automat mit bis zu 15 Mahlzeiten und breitem Portionsbereich für Trockenfutter.",
    rating: 4.3, capacity: "6 Liter", useCase: "Für Katzen und kleine bis mittelgroße Hunde mit hohem Vorratsbedarf",
    highlights: ["Bis zu 15 Mahlzeiten täglich", "App über 2,4-GHz-WLAN", "Batterie-Backup"],
    pros: ["Großer Behälter", "Breiter Portionsbereich", "Füllstandsmeldung per App"],
    cons: ["Nur Trockenfutter", "App-Funktionen benötigen Netzbetrieb", "Deutsche Modellverfügbarkeit schwankt"],
    specs: [
      { label: "Futterart", value: "Trockenfutter, etwa 5–15 mm" }, { label: "App-Steuerung", value: "Ja" },
      { label: "Kamera", value: "Nein" }, { label: "Kapazität", value: "6 Liter" },
      { label: "Stromversorgung", value: "Netzteil, 3 D-Batterien als Backup" }, { label: "Geeignet für", value: "Katzen, kleine bis mittelgroße Hunde" },
      { label: "Besonderheit", value: "Bis zu 15 Mahlzeiten" }
    ],
    useCases: ["katze", "hund", "app", "urlaub", "portionierung", "trockenfutter"],
    ratings: { app: 4, portionierung: 4.5, reinigung: 4, zuverlaessigkeit: 4, sicherheit: 4, preisleistung: 4.5 },
    ranking: { overall: 86, beginner: 85, premium: 78, retrofit: 86, value: 90 }, priority: 10,
    verdict: "Ein vielseitiger Vorratsautomat, dessen konkrete F07-Pro-Ausführung beim Händler geprüft werden sollte.",
    merchantLinks: { amazon: { searchQuery: "WOPET Patrol F07 Pro 6L Futterautomat" } }
  }),
  "wopet-heritage-view-camera-feeder": createFeeder({
    name: "WOPET Heritage View Camera Feeder", brand: "WOPET", manufacturer: "wopet", manufacturerLabel: "WOPET",
    productUrl: "/produkt/wopet-heritage-view-camera-feeder", badge: "Kamera-Alternative",
    recommendation: "6-Liter-Futterautomat mit Kamera, App und Zwei-Wege-Audio für die Sichtkontrolle am Futterplatz.",
    rating: 4.2, capacity: "6 Liter", useCase: "Für Tierhalter mit großem Trockenfuttervorrat und Kamera-Wunsch",
    highlights: ["Kamera am Futterplatz", "App-Steuerung", "Großer Vorrat"],
    pros: ["Video und Fütterungsplan kombiniert", "Für Katzen und kleinere Hunde", "Zwei-Wege-Audio"],
    cons: ["Nur Trockenfutter", "Datenschutz und App-Abhängigkeit beachten", "Regionale Verfügbarkeit schwankt"],
    specs: [
      { label: "Futterart", value: "Trockenfutter" }, { label: "App-Steuerung", value: "Ja" },
      { label: "Kamera", value: "Ja" }, { label: "Kapazität", value: "6 Liter" },
      { label: "Stromversorgung", value: "Netzteil, modellabhängig Backup" }, { label: "Geeignet für", value: "Katzen, kleine bis mittelgroße Hunde" },
      { label: "Besonderheit", value: "Kamera und Zwei-Wege-Audio" }
    ],
    useCases: ["katze", "hund", "kamera", "app", "urlaub", "portionierung", "trockenfutter"],
    ratings: { app: 4, portionierung: 4, reinigung: 4, zuverlaessigkeit: 4, sicherheit: 4, preisleistung: 4 },
    ranking: { overall: 83, beginner: 78, premium: 84, retrofit: 80, value: 83 }, priority: 13,
    verdict: "Eine Kamera-Alternative für große Vorräte, sofern die konkrete Heritage-View-Version in Deutschland verfügbar ist.",
    merchantLinks: { amazon: { searchQuery: "WOPET Heritage View Camera Feeder 6L" } }
  }),
  "oneisall-5l-automatic-cat-feeder": createFeeder({
    name: "oneisall 5L Automatic Cat Feeder", brand: "oneisall", manufacturer: "oneisall", manufacturerLabel: "oneisall",
    productUrl: "/produkt/oneisall-5l-automatic-cat-feeder", badge: "Zwei-Katzen-Tipp",
    recommendation: "5-Liter-Trockenfutterautomat mit zwei Schalen und optionaler App-Steuerung für zwei Katzen.",
    rating: 4.3, capacity: "5 Liter", useCase: "Für zwei Katzen mit ähnlichem Futter- und Mengenbedarf",
    highlights: ["Zwei Futterplätze", "5-Liter-Vorrat", "App-Variante erhältlich"],
    pros: ["Breite Futterverteilung", "Großer Vorrat", "Offizieller EU-Shop vorhanden"],
    cons: ["Keine individuelle Zugangskontrolle", "Nur Trockenfutter", "Varianten mit und ohne App unterscheiden"],
    specs: [
      { label: "Futterart", value: "Trockenfutter" }, { label: "App-Steuerung", value: "Je nach Variante" },
      { label: "Kamera", value: "Nein" }, { label: "Kapazität", value: "5 Liter" },
      { label: "Stromversorgung", value: "Netzteil, je nach Variante Batterie-Backup" }, { label: "Geeignet für", value: "Ein bis zwei Katzen" },
      { label: "Besonderheit", value: "Doppelschale" }
    ],
    useCases: ["katze", "mehrere-tiere", "app", "urlaub", "portionierung", "trockenfutter", "preisleistung"],
    ratings: { app: 4, portionierung: 4, reinigung: 4, zuverlaessigkeit: 4, sicherheit: 3.5, preisleistung: 4.5 },
    ranking: { overall: 85, beginner: 88, premium: 72, retrofit: 85, value: 91 }, priority: 12,
    verdict: "Sinnvoll für zwei friedlich fressende Katzen, aber kein Ersatz für getrennten Mikrochip-Zugang.",
    merchantLinks: { amazon: { searchQuery: "oneisall 5L Futterautomat zwei Katzen" } }
  }),
  "imipaw-3l-automatic-cat-feeder": createFeeder({
    name: "IMIPAW 3L Automatic Cat Feeder", brand: "IMIPAW", manufacturer: "imipaw", manufacturerLabel: "IMIPAW",
    productUrl: "/produkt/imipaw-3l-automatic-cat-feeder", badge: "Einfacher Timer-Tipp",
    recommendation: "Kompakter 3-Liter-Trockenfutterautomat mit lokaler Zeitsteuerung und Batterieoption.",
    rating: 4.1, capacity: "3 Liter", useCase: "Für einzelne Katzen mit einfachem, lokalem Fütterungsplan",
    highlights: ["Kompaktes Format", "Lokale Programmierung", "Batteriebetrieb möglich"],
    pros: ["Ohne WLAN nutzbar", "Mehrere Mahlzeiten programmierbar", "Kleiner Platzbedarf"],
    cons: ["Keine App", "Nur Trockenfutter", "Modellbezeichnung im Handel nicht immer eindeutig"],
    specs: [
      { label: "Futterart", value: "Trockenfutter" }, { label: "App-Steuerung", value: "Nein" },
      { label: "Kamera", value: "Nein" }, { label: "Kapazität", value: "3 Liter" },
      { label: "Stromversorgung", value: "Netzteil oder Batterien, modellabhängig" }, { label: "Geeignet für", value: "Katzen, kleine Hunde" },
      { label: "Besonderheit", value: "Lokaler Timer" }
    ],
    useCases: ["katze", "urlaub", "portionierung", "trockenfutter", "preisleistung", "ohne-wlan", "batteriebetrieb"],
    ratings: { app: 1, portionierung: 4, reinigung: 4, zuverlaessigkeit: 4, sicherheit: 4, preisleistung: 4.5 },
    ranking: { overall: 81, beginner: 90, premium: 58, retrofit: 88, value: 92 }, priority: 14,
    verdict: "Eine einfache Offline-Option, wenn lokale Zeitsteuerung wichtiger ist als App und Fernzugriff.",
    merchantLinks: { amazon: { searchQuery: "IMIPAW 3L Automatic Cat Feeder" } }
  }),
  "pawbby-smart-pet-feeder": createFeeder({
    name: "PAWBBY Smart Pet Feeder", brand: "PAWBBY", manufacturer: "pawbby", manufacturerLabel: "PAWBBY",
    productUrl: "/produkt/pawbby-smart-pet-feeder", badge: "Xiaomi-Home-Alternative",
    recommendation: "Vernetzter Trockenfutterautomat aus dem PAWBBY-Umfeld mit Xiaomi-Home-Anbindung je nach Modellversion.",
    rating: 4.1, capacity: "Modellabhängig, häufig 3,6 Liter", useCase: "Für Smart-Home-Nutzer, die eine kompatible Modellvariante finden",
    highlights: ["App-Steuerung", "Zeitpläne", "Smart-Home-Fokus"],
    pros: ["Vernetzte Bedienung", "Kompakte Bauform", "Zeitgesteuerte Portionierung"],
    cons: ["Varianten und regionale App-Kompatibilität prüfen", "Nur Trockenfutter", "Verfügbarkeit in Deutschland schwankt"],
    specs: [
      { label: "Futterart", value: "Trockenfutter" }, { label: "App-Steuerung", value: "Ja, modellabhängig" },
      { label: "Kamera", value: "Je nach Variante" }, { label: "Kapazität", value: "häufig 3,6 Liter" },
      { label: "Stromversorgung", value: "Netzteil, modellabhängig Backup" }, { label: "Geeignet für", value: "Katzen, kleine Hunde" },
      { label: "Besonderheit", value: "Xiaomi-Home-Umfeld" }
    ],
    useCases: ["katze", "hund", "app", "urlaub", "portionierung", "trockenfutter", "preisleistung"],
    ratings: { app: 4, portionierung: 4, reinigung: 4, zuverlaessigkeit: 3.5, sicherheit: 4, preisleistung: 4 },
    ranking: { overall: 80, beginner: 80, premium: 70, retrofit: 78, value: 84 }, priority: 15,
    verdict: "Nur empfehlenswert, wenn Modellnummer, App-Region und Händlerangaben eindeutig zusammenpassen.",
    merchantLinks: { amazon: { searchQuery: "PAWBBY Smart Pet Feeder" } }
  }),
  "petlibro-air-wifi-feeder": createFeeder({
    name: "PETLIBRO Air WiFi Feeder", brand: "Petlibro", manufacturer: "petlibro", manufacturerLabel: "Petlibro",
    productUrl: "/produkt/petlibro-air-wifi-feeder", badge: "Kompakter App-Tipp",
    recommendation: "Schlanker 2-Liter-App-Automat für einzelne Katzen und kleine Trockenfutterrationen.",
    rating: 4.4, capacity: "2 Liter", useCase: "Für einzelne Katzen in kleinen Haushalten mit App-Wunsch",
    highlights: ["Kompakter 2-Liter-Behälter", "App-Zeitpläne", "Kleine Stellfläche"],
    pros: ["Übersichtliche Grundfunktionen", "Gut für kleine Haushalte", "Petlibro-App-Ökosystem"],
    cons: ["Kleiner Vorrat", "Nur Trockenfutter", "Air-Varianten mit und ohne WLAN unterscheiden"],
    specs: [
      { label: "Futterart", value: "Trockenfutter" }, { label: "App-Steuerung", value: "Ja" },
      { label: "Kamera", value: "Nein" }, { label: "Kapazität", value: "2 Liter" },
      { label: "Stromversorgung", value: "Netzteil, modellabhängig Batterie" }, { label: "Geeignet für", value: "Katzen, kleine Hunde" },
      { label: "Besonderheit", value: "Kompakte Air-Bauform" }
    ],
    useCases: ["katze", "app", "urlaub", "portionierung", "trockenfutter", "preisleistung"],
    ratings: { app: 4.5, portionierung: 4.5, reinigung: 4.5, zuverlaessigkeit: 4, sicherheit: 4, preisleistung: 4.5 },
    ranking: { overall: 88, beginner: 94, premium: 76, retrofit: 90, value: 91 }, priority: 9,
    verdict: "Eine kompakte Petlibro-Alternative für App-Steuerung ohne Kamera und großen Vorrat.",
    merchantLinks: { amazon: { searchQuery: "PETLIBRO Air WiFi Feeder 2L" } }
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
