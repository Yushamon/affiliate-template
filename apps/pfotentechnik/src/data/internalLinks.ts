import type { InternalLinkDictionary } from "@affiliate-core/linking/types";

export const internalLinks: InternalLinkDictionary = {
  wissen: {
    id: "wissen",
    keywords: [
      "PfotenTechnik Wissen",
      "Wissensbereich"
    ],
    href: "/wissen/",
    priority: "low",
    maxOccurrences: 1,
    title: "PfotenTechnik Wissen",
    group: "hub"
  },

  smarteFutterautomaten: {
    id: "smarte-futterautomaten",
    keywords: [
      "smarte Futterautomaten",
      "automatische Futterautomaten",
      "Futterautomaten im Vergleich"
    ],
    href: "/smarte-futterautomaten/",
    priority: "high",
    maxOccurrences: 1,
    title: "Smarte Futterautomaten",
    group: "knowledge"
  },

  futterautomatHund: {
    id: "futterautomat-hund",
    keywords: [
      "Futterautomat für Hunde",
      "Futterautomaten für Hunde"
    ],
    href: "/futterautomat-hund/",
    priority: "high",
    maxOccurrences: 1,
    title: "Futterautomaten für Hunde",
    group: "knowledge"
  },

  futterautomatKatze: {
    id: "futterautomat-katze",
    keywords: [
      "Futterautomat für Katzen",
      "Futterautomaten für Katzen"
    ],
    href: "/futterautomat-katze/",
    priority: "high",
    maxOccurrences: 1,
    title: "Futterautomaten für Katzen",
    group: "knowledge"
  },

  futterautomatMitApp: {
    id: "futterautomat-mit-app",
    keywords: [
      "Futterautomat mit App",
      "Futterautomaten mit App",
      "App-Steuerung"
    ],
    href: "/futterautomat-mit-app/",
    priority: "normal",
    maxOccurrences: 1,
    title: "Futterautomaten mit App",
    group: "knowledge"
  },

  futterautomatMitKamera: {
    id: "futterautomat-mit-kamera",
    keywords: [
      "Futterautomat mit Kamera",
      "Futterautomaten mit Kamera"
    ],
    href: "/futterautomat-mit-kamera/",
    priority: "normal",
    maxOccurrences: 1,
    title: "Futterautomaten mit Kamera",
    group: "knowledge"
  },

  welpen: {
    id: "welpen",
    keywords: [
      "Welpen",
      "Futterautomat für Welpen",
      "Futterautomaten für Welpen"
    ],
    href: "/beste-futterautomaten-fuer-welpen/",
    priority: "high",
    maxOccurrences: 1,
    title: "Beste Futterautomaten für Welpen",
    group: "decision"
  },

  kleineHunde: {
    id: "kleine-hunde",
    keywords: [
      "kleine Hunde",
      "Futterautomat für kleine Hunde"
    ],
    href: "/beste-futterautomaten-fuer-kleine-hunde/",
    priority: "normal",
    maxOccurrences: 1,
    title: "Beste Futterautomaten für kleine Hunde",
    group: "decision"
  },

  berufstaetige: {
    id: "berufstaetige",
    keywords: [
      "Berufstätige",
      "Futterautomat für Berufstätige"
    ],
    href: "/beste-futterautomaten-fuer-berufstaetige/",
    priority: "normal",
    maxOccurrences: 1,
    title: "Beste Futterautomaten für Berufstätige",
    group: "decision"
  },

  petlibro: {
    id: "petlibro",
    keywords: [
      "Petlibro"
    ],
    href: "/hersteller/petlibro/",
    priority: "high",
    maxOccurrences: 1,
    title: "Petlibro",
    group: "manufacturer"
  },

  petkit: {
    id: "petkit",
    keywords: [
      "PETKIT",
      "Petkit"
    ],
    href: "/hersteller/petkit/",
    priority: "high",
    maxOccurrences: 1,
    title: "PETKIT",
    group: "manufacturer"
  },

  catMate: {
    id: "cat-mate",
    keywords: [
      "Cat Mate"
    ],
    href: "/hersteller/cat-mate/",
    priority: "high",
    maxOccurrences: 1,
    title: "Cat Mate",
    group: "manufacturer"
  },

  xiaomi: {
    id: "xiaomi",
    keywords: [
      "Xiaomi"
    ],
    href: "/hersteller/xiaomi/",
    priority: "high",
    maxOccurrences: 1,
    title: "Xiaomi",
    group: "manufacturer"
  }
};

export const internalLinkDefinitions =
  Object.values(internalLinks);