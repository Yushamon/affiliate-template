import { products, type ProductKey } from "./products";

export interface Manufacturer {
  key: string;
  name: string;
  slug: string;
  description: string;
  website: string;
  focus: string[];
  productCategories: string[];
  strengths: string[];
  limitations: string[];
  country?: string;
  products: ProductKey[];
}

type ManufacturerInput = Omit<Manufacturer, "products">;

const createManufacturer = (manufacturer: ManufacturerInput): Manufacturer => ({
  ...manufacturer,
  products: (Object.entries(products) as Array<[ProductKey, (typeof products)[ProductKey]]>)
    .filter(([, product]) => product.manufacturer === manufacturer.key)
    .sort(([, a], [, b]) => b.ranking.overall - a.ranking.overall)
    .map(([key]) => key)
});

export const manufacturers = [
  createManufacturer({
    key: "petlibro", name: "Petlibro", slug: "petlibro",
    description: "Petlibro bietet vernetzte und klassische Futterautomaten für Trockenfutter sowie Modelle mit Kamera. Im Katalog stehen vor allem App-Bedienung und unterschiedliche Haushaltsgrößen im Fokus.",
    website: "https://petlibro.com", focus: ["App-Futterautomaten", "Kamera-Modelle", "Kompakte Vorratsautomaten"],
    productCategories: ["Futterautomaten"], strengths: ["Breite Modellauswahl", "Klare Abstufung zwischen Basis- und Kamera-Modellen", "Zeitpläne und Protokolle bei vernetzten Geräten"],
    limitations: ["App- und Modellversionen können regional abweichen", "Viele Modelle sind auf Trockenfutter begrenzt"]
  }),
  createManufacturer({
    key: "petkit", name: "PETKIT", slug: "petkit",
    description: "PETKIT verbindet Futterautomaten mit einem größeren Pet-Tech-Ökosystem. Die Modelle reichen von kompakten Vorratsautomaten bis zu Kamera- und Dual-Hopper-Lösungen.",
    website: "https://petkit.com", focus: ["Pet-Tech-Ökosystem", "App-Steuerung", "Kamera und Mehrkammer-Systeme"],
    productCategories: ["Futterautomaten", "Trinkbrunnen", "Weitere Pet-Tech-Geräte"], strengths: ["Verschiedene Baugrößen", "App-Integration", "Modelle für spezielle Trockenfutter-Szenarien"],
    limitations: ["Funktionsumfang unterscheidet sich deutlich je Modell", "Cloud- und App-Funktionen erhöhen die Komplexität"]
  }),
  createManufacturer({
    key: "cat-mate", name: "Cat Mate / Closer Pets", slug: "cat-mate", country: "Vereinigtes Königreich",
    description: "Cat Mate ist eine Marke von Closer Pets und konzentriert sich unter anderem auf zeitgesteuerte Fachautomaten. Der C500 ist besonders für vorbereitete Nass- oder Mischfütterung relevant.",
    website: "https://closerpets.com", focus: ["Fachautomaten", "Nassfutter", "Lokale Timer ohne App"],
    productCategories: ["Futterautomaten", "Trinkbrunnen", "Haustierklappen"], strengths: ["Einfache lokale Bedienung", "Fächer statt Trockenfutter-Förderkanal", "Ersatzteile und Zubehör im Sortiment"],
    limitations: ["Weniger Fernfunktionen", "Kühlakkus ersetzen keine aktive Kühlung"]
  }),
  createManufacturer({
    key: "xiaomi", name: "Xiaomi", slug: "xiaomi", country: "China",
    description: "Xiaomi ordnet Futterautomaten in das Xiaomi-Home-Ökosystem ein. Relevant sind App-Steuerung, Sensorik und eine auf Trockenfutter ausgerichtete Produktlogik.",
    website: "https://www.mi.com/de", focus: ["Smart Home", "App-Steuerung", "Trockenfutter-Automation"],
    productCategories: ["Futterautomaten", "Smart-Home-Geräte"], strengths: ["Einbindung in Xiaomi Home", "Status- und Füllstandsfunktionen", "Breite europäische Markenpräsenz"],
    limitations: ["Region und App-Kompatibilität müssen zusammenpassen", "Nicht für jede Tiergröße oder Futterform geeignet"]
  }),
  createManufacturer({
    key: "surefeed", name: "SureFeed / Sure Petcare", slug: "surefeed", country: "Vereinigtes Königreich",
    description: "SureFeed konzentriert sich auf mikrochipgesteuerten Futterzugang. Die Systeme sind besonders für Mehrtierhaushalte und getrennte Rationen gedacht, nicht primär als zeitgesteuerte Vorratsautomaten.",
    website: "https://www.surepetcare.com/de-de/futterautomat", focus: ["Mikrochip-Erkennung", "Mehrtierhaushalte", "Nass- und Trockenfutter"],
    productCategories: ["Mikrochip-Futterautomaten", "Haustierklappen"], strengths: ["Individueller Futterzugang", "App-Auswertung beim Connect-Modell", "Batteriebetrieb"],
    limitations: ["Connect-Funktionen benötigen einen separaten Hub", "Keine automatische Vorratsdosierung"]
  }),
  createManufacturer({
    key: "honeyguardian", name: "HoneyGuardian", slug: "honeyguardian",
    description: "HoneyGuardian führt klassische und vernetzte Vorratsautomaten in mehreren Größen. Beim Kauf ist die konkrete Modellnummer wichtiger als ein allgemeiner Produktname.",
    website: "https://www.honeyguardian.com", focus: ["Vorratsautomaten", "App-Modelle", "Preis-Leistung"],
    productCategories: ["Futterautomaten", "Trinkbrunnen", "Katzentoiletten"], strengths: ["Mehrere Behältergrößen", "Modelle mit Edelstahl-Napf", "Basis- und App-Varianten"],
    limitations: ["Modellbezeichnungen im Handel sind nicht immer einheitlich", "Deutsche Verfügbarkeit kann schwanken"]
  }),
  createManufacturer({
    key: "wopet", name: "WOPET", slug: "wopet",
    description: "WOPET bietet große Trockenfutterautomaten mit App, Zeitplänen und teilweise Kamera an. Der Patrol F07 Pro steht für den klassischen 6-Liter-WLAN-Ansatz.",
    website: "https://wopet.com", focus: ["Große Vorratsautomaten", "WLAN-Steuerung", "Modelle mit Kamera"],
    productCategories: ["Futterautomaten"], strengths: ["Großer Vorrat", "Viele planbare Mahlzeiten", "Breiter Portionsbereich"],
    limitations: ["Modellvarianten und Apps sorgfältig abgleichen", "EU-Verfügbarkeit ist nicht bei allen Ausführungen stabil"]
  }),
  createManufacturer({
    key: "oneisall", name: "oneisall", slug: "oneisall",
    description: "oneisall führt Futterautomaten für ein oder zwei Tiere und betreibt einen europäischen Shop. Im Fokus stehen große Vorräte und Varianten mit Doppelschale.",
    website: "https://de.oneisall.com", focus: ["Zwei-Katzen-Lösungen", "Vorratsautomaten", "App-Varianten"],
    productCategories: ["Futterautomaten", "Pflegegeräte", "Weitere Pet-Tech-Produkte"], strengths: ["EU-Shop", "Modelle mit zwei Futterplätzen", "Große Behälter"],
    limitations: ["Doppelschalen bieten keine individuelle Zugangskontrolle", "Varianten mit und ohne App müssen unterschieden werden"]
  }),
  createManufacturer({
    key: "imipaw", name: "IMIPAW", slug: "imipaw",
    description: "IMIPAW konzentriert sich auf einfache programmierbare Futterautomaten. Die Modelle sind vor allem als lokale Timer-Lösungen ohne umfangreiches Ökosystem interessant.",
    website: "https://imipaw.com", focus: ["Lokale Timer", "Kompakte Automaten", "Batteriebetrieb"],
    productCategories: ["Futterautomaten"], strengths: ["Einfache Grundfunktion", "Ohne WLAN nutzbare Modelle", "Kompakte Bauformen"],
    limitations: ["Modellnamen im Handel können variieren", "Weniger App- und Support-Infrastruktur"]
  }),
  createManufacturer({
    key: "pawbby", name: "PAWBBY", slug: "pawbby",
    description: "PAWBBY entwickelt verschiedene Pet-Tech-Produkte und führt Futterautomaten im Smart-Home-Umfeld. Regionale Modell- und App-Kompatibilität sollte besonders genau geprüft werden.",
    website: "https://pawbby.com/de", focus: ["Smart Home", "App-Futterautomaten", "Weitere Pet-Tech-Kategorien"],
    productCategories: ["Futterautomaten", "Katzentoiletten", "Haustierpflege"], strengths: ["Breites Pet-Tech-Themenspektrum", "Vernetzte Produktvarianten", "Smart-Home-Ausrichtung"],
    limitations: ["Deutsche Produktverfügbarkeit schwankt", "Modellnummer und App-Region sind vor dem Kauf abzugleichen"]
  })
] as const satisfies readonly Manufacturer[];

export type ManufacturerSlug = (typeof manufacturers)[number]["slug"];

export function getManufacturerBySlug(slug: string) {
  return manufacturers.find((manufacturer) => manufacturer.slug === slug);
}
