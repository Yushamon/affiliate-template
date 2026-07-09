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
  },
  "beste-futterautomaten-mit-kamera": {
    seoTitle: "Beste Futterautomaten mit Kamera im Vergleich",
    seoDescription: "Kamera-Futterautomaten von Petlibro, PETKIT und WOPET nach Video, App, Portionierung und Datenschutz verglichen."
  },
  "beste-futterautomaten-ohne-wlan": {
    seoTitle: "Beste Futterautomaten ohne WLAN im Vergleich",
    seoDescription: "Futterautomaten ohne WLAN nach Timer, Batterie, Futterart und kontrolliertem Zugang vergleichen."
  },
  "beste-futterautomaten-fuer-zwei-katzen": {
    seoTitle: "Beste Futterautomaten für zwei Katzen",
    seoDescription: "Futterautomaten für zwei Katzen mit Mikrochip, Doppelschale oder getrennten Vorräten im Vergleich."
  },
  "beste-futterautomaten-fuer-nassfutter": {
    seoTitle: "Beste Futterautomaten für Nassfutter",
    seoDescription: "Nassfutterautomaten nach Fachsystem, Kühlakku, Mikrochip-Zugang und Reinigung vergleichen."
  },
  "beste-futterautomaten-fuer-hunde": {
    seoTitle: "Beste Futterautomaten für Hunde im Vergleich",
    seoDescription: "Futterautomaten für Hunde nach Ausgabemenge, Krokettengröße, Stabilität und Notstrom vergleichen."
  },
  "beste-futterautomaten-fuer-katzen": {
    seoTitle: "Beste Futterautomaten für Katzen im Vergleich",
    seoDescription: "Futterautomaten für Katzen nach Trockenfutter, Nassfutter, App und Mehrkatzen-Eignung vergleichen."
  }
} as const;

export type SeoOverrideKey = keyof typeof seoOverrides;

export function getSeoOverride(slug: string) {
  return seoOverrides[slug as SeoOverrideKey];
}
