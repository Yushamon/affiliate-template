export const seoOverrides = {
  "smarte-futterautomaten": {
    seoTitle: "Smarte Futterautomaten für Hunde und Katzen im Vergleich",
    seoDescription:
      "Welche smarten Futterautomaten lohnen sich? Vergleich für Hunde und Katzen mit App, Kamera, Portionierung und Empfehlungen."
  },
  "futterautomat-katze": {
    seoTitle: "Futterautomat für Katzen: Modelle, Portionen und Empfehlungen",
    seoDescription:
      "Futterautomaten für Katzen im Vergleich: App-Steuerung, Portionierung, Mehrkatzenhaushalt und geeignete Modelle für Trocken- oder Nassfutter."
  },
  "futterautomat-hund": {
    seoTitle: "Futterautomat für Hunde: Was im Alltag wirklich funktioniert",
    seoDescription:
      "Welche Futterautomaten eignen sich für Hunde? Kaufberatung zu Größe, Portionierung, Stromausfall, Trockenfutter und zuverlässigen Zeitplänen."
  },
  "futterautomat-mit-kamera": {
    seoTitle: "Futterautomat mit Kamera: Kontrolle und Fütterung per App",
    seoDescription:
      "Futterautomaten mit Kamera vergleichen: Livebild, Nachtsicht, Zwei-Wege-Audio, Datenschutz und sinnvolle Funktionen für unterwegs."
  },
  "futterautomat-mit-app": {
    seoTitle: "Futterautomat mit App: Zeitpläne und Portionen aus der Ferne",
    seoDescription:
      "Futterautomaten mit App im Vergleich: Fütterungspläne, Protokolle, Benachrichtigungen, Offline-Betrieb und zuverlässige Portionierung."
  },
  "futterautomat-nassfutter": {
    seoTitle: "Futterautomat für Nassfutter: Kühlung, Hygiene und Grenzen",
    seoDescription:
      "Welche Futterautomaten eignen sich für Nassfutter? Vergleich von Timer-Modellen, Kühlakkus, Hygiene, Fächern und sicheren Einsatzzeiten."
  }
} as const;

export type SeoOverrideKey = keyof typeof seoOverrides;

export function getSeoOverride(slug: string) {
  return seoOverrides[slug as SeoOverrideKey];
}
