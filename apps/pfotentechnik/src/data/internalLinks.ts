import type { InternalLinkDictionary } from "@affiliate-core/linking/types";
import {
  generateInternalLinkDefinitions,
  generateInternalLinkDictionary
} from "@affiliate-core/linking/generator";

import { products } from "./products";
import { manufacturers } from "./manufacturers";
import { decisionRules } from "./decisionRules";

const manualLinks: InternalLinkDictionary = {
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
    group: "hub",
    preventNestedLinks: true
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
    title: "Smarte Futterautomaten im Vergleich",
    group: "knowledge",
    preventNestedLinks: true
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
    group: "knowledge",
    preventNestedLinks: true
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
    group: "knowledge",
    preventNestedLinks: true
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
    group: "knowledge",
    preventNestedLinks: true
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
    group: "knowledge",
    preventNestedLinks: true
  }
};

const generatorInput = {
  products,
  manufacturers,
  decisionRules,
  manualLinks
};

export const internalLinks =
  generateInternalLinkDictionary(generatorInput);

export const internalLinkDefinitions =
  generateInternalLinkDefinitions(generatorInput);