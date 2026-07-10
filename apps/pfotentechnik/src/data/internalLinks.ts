import type { InternalLinkDictionary } from "@affiliate-core/linking/types";
import {
  generateInternalLinkDefinitions,
  generateInternalLinkDictionary,
  type LinkGeneratorInput
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
  },
    futterautomatWelpenAlias: {
    id: "futterautomat-welpen-alias",
    keywords: [
      "Welpen",
      "Welpe"
    ],
    href: "/beste-futterautomaten-fuer-welpen/",
    priority: "normal",
    maxOccurrences: 1,
    title: "Futterautomaten für Welpen",
    group: "decision",
    preventNestedLinks: true,
    contexts: ["futterautomaten"]
  },

  futterautomatKleineHundeAlias: {
    id: "futterautomat-kleine-hunde-alias",
    keywords: [
      "kleine Hunde",
      "kleiner Hund"
    ],
    href: "/beste-futterautomaten-fuer-kleine-hunde/",
    priority: "normal",
    maxOccurrences: 1,
    title: "Futterautomaten für kleine Hunde",
    group: "decision",
    preventNestedLinks: true,
    contexts: ["futterautomaten"]
  },

  futterautomatBerufstaetigeAlias: {
    id: "futterautomat-berufstaetige-alias",
    keywords: [
      "Berufstätige",
      "berufstätige Hundehalter"
    ],
    href: "/beste-futterautomaten-fuer-berufstaetige/",
    priority: "normal",
    maxOccurrences: 1,
    title: "Futterautomaten für Berufstätige",
    group: "decision",
    preventNestedLinks: true,
    contexts: ["futterautomaten"]
  },

  futterautomatMehrtierAlias: {
    id: "futterautomat-mehrtier-alias",
    keywords: [
      "Mehrtierhaushalte",
      "Mehrtierhaushalt",
      "mehrere Tiere"
    ],
    href: "/beste-futterautomaten-fuer-mehrtierhaushalte/",
    priority: "normal",
    maxOccurrences: 1,
    title: "Futterautomaten für Mehrtierhaushalte",
    group: "decision",
    preventNestedLinks: true,
    contexts: ["futterautomaten"]
  },

  futterautomatAkkuAlias: {
    id: "futterautomat-akku-alias",
    keywords: [
      "Akku",
      "Batterie-Backup",
      "Notstromversorgung"
    ],
    href: "/beste-futterautomaten-mit-akku/",
    priority: "normal",
    maxOccurrences: 1,
    title: "Futterautomaten mit Akku",
    group: "decision",
    preventNestedLinks: true,
    contexts: ["futterautomaten"]
  },
};

const manufacturerRecord = Object.fromEntries(
  manufacturers.map((manufacturer) => [
    manufacturer.key ?? manufacturer.slug ?? manufacturer.name,
    manufacturer
  ])
);

const generatorInput: LinkGeneratorInput = {
  products: products as LinkGeneratorInput["products"],
  manufacturers:
    manufacturerRecord as LinkGeneratorInput["manufacturers"],
  decisionRules:
    decisionRules as LinkGeneratorInput["decisionRules"],
  manualLinks
};

export const internalLinks =
  generateInternalLinkDictionary(generatorInput);

export const internalLinkDefinitions =
  generateInternalLinkDefinitions(generatorInput);