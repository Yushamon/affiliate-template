import type { AdvisorGuide } from "./types";

export const advisorGuides: AdvisorGuide[] = [
  {
    title: "Smarte Futterautomaten richtig auswählen",
    href: "/smarte-futterautomaten/",
    description:
      "Bauarten, Funktionen, Offline-Betrieb und Kaufkriterien im Überblick.",
    when: () => true
  },
  {
    title: "Futterautomaten für mehrere Katzen",
    href: "/futterautomat-fuer-zwei-katzen/",
    description:
      "Zugangskontrolle, Futterneid und getrennte Fütterung verständlich erklärt.",
    when: (answers) => answers.petCount === "multiple"
  },
  {
    title: "Futterautomaten für Nassfutter",
    href: "/futterautomat-nassfutter/",
    description:
      "Kühlung, Fächerlösungen und Hygiene bei Nassfutter.",
    when: (answers) =>
      answers.food === "wet" || answers.food === "mixed"
  },
  {
    title: "Futterautomaten ohne WLAN",
    href: "/futterautomat-ohne-wlan/",
    description:
      "Welche Modelle auch ohne dauerhafte Cloud-Verbindung sinnvoll sind.",
    when: (answers) =>
      answers.priorities.includes("offline")
  },
  {
    title: "Futterautomaten mit Kamera",
    href: "/futterautomat-mit-kamera/",
    description:
      "Kameraqualität, App-Funktionen und Datenschutz einordnen.",
    when: (answers) =>
      answers.priorities.includes("camera")
  },
  {
    title: "Futterautomat richtig reinigen",
    href: "/futterautomat-richtig-reinigen/",
    description:
      "Hygiene, Förderschacht, Rotor und häufig vergessene Stellen.",
    when: () => true
  }
];
