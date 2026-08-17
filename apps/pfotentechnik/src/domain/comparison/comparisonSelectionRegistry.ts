export type ComparisonSelectionMode =
  | "ready"
  | "needs-data"
  | "backlink-transition";

export type ComparisonSelectionRule = {
  slug: string;
  category: string;
  mode: ComparisonSelectionMode;
  require?: Record<string, unknown>;
  requiredProductFields?: string[];
  note?: string;
};

/**
 * Comparison Selection Registry 32.6.1
 *
 * Ziel:
 * - eine zentrale maschinenlesbare Definition der Vergleichsintents
 * - noch KEINE produktive Änderung an buildComparisonViewModel()
 * - bestehende items[] bleiben bis zur Datenmigration autoritativ
 *
 * Hintergrund:
 * comparisonFilters sind im aktuellen Bestand teilweise unvollständig.
 * product.comparisons[] ist deshalb während der Migration ein wichtiges
 * redaktionelles Signal, darf aber langfristig nicht die einzige Wahrheit sein.
 */
export const comparisonSelectionRegistry: ComparisonSelectionRule[] = [
  {
    slug: "beste-automatische-katzentoiletten",
    category: "katzentoiletten",
    mode: "backlink-transition",
    require: { automaticCleaning: true },
    requiredProductFields: ["comparisonProfile.automaticCleaning"],
    note: "Kategorie/Slug-Mapping im Bestand prüfen; Neakasa M1 Plus ist bereits per comparisons[] verknüpft."
  },
  {
    slug: "beste-futterautomaten-fuer-berufstaetige",
    category: "futterautomaten",
    mode: "needs-data",
    require: { unattendedUseFit: true },
    requiredProductFields: [
      "comparisonProfile.unattendedUseFit",
      "comparisonProfile.schedulePersistence"
    ]
  },
  {
    slug: "beste-futterautomaten-fuer-hunde",
    category: "futterautomaten",
    mode: "needs-data",
    require: { animal: "dog" },
    requiredProductFields: ["comparisonFilters.animal"],
    note: "Aktueller Bestand zeigt viele comparisons[]-Backlinks, aber kaum gepflegte animal-Filter."
  },
  {
    slug: "beste-futterautomaten-fuer-katzen",
    category: "futterautomaten",
    mode: "needs-data",
    require: { animal: "cat" },
    requiredProductFields: ["comparisonFilters.animal"]
  },
  {
    slug: "beste-futterautomaten-fuer-kleine-hunde",
    category: "futterautomaten",
    mode: "needs-data",
    require: { animal: "dog", petSize: "small" },
    requiredProductFields: ["comparisonFilters.animal", "comparisonFilters.petSize"]
  },
  {
    slug: "beste-futterautomaten-fuer-mehrtierhaushalte",
    category: "futterautomaten",
    mode: "needs-data",
    require: { multiPetFit: true },
    requiredProductFields: [
      "comparisonProfile.multiPetFit",
      "comparisonProfile.individualAccess",
      "comparisonProfile.bowlCount"
    ]
  },
  {
    slug: "beste-futterautomaten-fuer-nassfutter",
    category: "futterautomaten",
    mode: "needs-data",
    require: { foodType: "wet" },
    requiredProductFields: ["comparisonFilters.foodType"],
    note: "Die redaktionellen Kandidaten sind vorhanden, foodType ist jedoch bei ihnen nicht konsistent gepflegt."
  },
  {
    slug: "beste-futterautomaten-fuer-seniorenkatzen",
    category: "futterautomaten",
    mode: "needs-data",
    require: { animal: "cat", seniorPetFit: true },
    requiredProductFields: [
      "comparisonFilters.animal",
      "comparisonProfile.seniorPetFit"
    ]
  },
  {
    slug: "beste-futterautomaten-fuer-welpen",
    category: "futterautomaten",
    mode: "needs-data",
    require: { animal: "dog", puppyFit: true },
    requiredProductFields: [
      "comparisonFilters.animal",
      "comparisonProfile.puppyFit"
    ]
  },
  {
    slug: "beste-futterautomaten-fuer-zwei-katzen",
    category: "futterautomaten",
    mode: "needs-data",
    require: { animal: "cat", twoCatFit: true },
    requiredProductFields: [
      "comparisonFilters.animal",
      "comparisonProfile.twoCatFit"
    ]
  },
  {
    slug: "beste-futterautomaten-mit-akku",
    category: "futterautomaten",
    mode: "needs-data",
    require: { backupPower: true },
    requiredProductFields: ["comparisonFilters.backupPower"],
    note: "Aktuelle Filterwerte widersprechen der kuratierten Liste; erst Produktdaten korrigieren."
  },
  {
    slug: "beste-futterautomaten-mit-edelstahl-napf",
    category: "futterautomaten",
    mode: "needs-data",
    require: { bowlMaterial: "stainless-steel" },
    requiredProductFields: ["comparisonProfile.bowlMaterial"]
  },
  {
    slug: "beste-futterautomaten-mit-kamera",
    category: "futterautomaten",
    mode: "needs-data",
    require: { camera: true },
    requiredProductFields: ["comparisonFilters.camera"],
    note: "Catit PIXI Vision, PETKIT YumShare Solo 2 und PETLIBRO Granary 2 Vision sind bereits Backlink-Kandidaten; bestehende Kamera-Felder sind nicht vollständig."
  },
  {
    slug: "beste-futterautomaten-ohne-wlan",
    category: "futterautomaten",
    mode: "needs-data",
    require: { wifi: false },
    requiredProductFields: ["comparisonProfile.wifi"],
    note: "Nicht mit app=false gleichsetzen."
  },
  {
    slug: "beste-futterautomaten-unter-100-euro",
    category: "futterautomaten",
    mode: "needs-data",
    require: { priceMaxEur: 100 },
    requiredProductFields: ["price.current"],
    note: "Dynamischer Preisvergleich benötigt eine definierte Preisquelle und Fallback-Regel."
  },
  {
    slug: "beste-gps-tracker-fuer-hunde",
    category: "gps-tracker",
    mode: "needs-data",
    require: { animal: "dog" },
    requiredProductFields: ["gps.animal"]
  },
  {
    slug: "beste-gps-tracker-fuer-katzen",
    category: "gps-tracker",
    mode: "needs-data",
    require: { animal: "cat" },
    requiredProductFields: ["gps.animal"]
  },
  {
    slug: "beste-haustierkameras",
    category: "haustierkameras",
    mode: "ready",
    require: {},
    note: "Kategorie ist ausreichend. Furbo 360 und Enabot EBO Air 2 werden aktuell nur durch items[] unterdrückt."
  },
  {
    slug: "beste-mikrochip-katzenklappen",
    category: "katzenklappen",
    mode: "needs-data",
    require: { access: "microchip" },
    requiredProductFields: ["comparisonFilters.access"]
  },
  {
    slug: "beste-trinkbrunnen-fuer-hunde",
    category: "trinkbrunnen",
    mode: "needs-data",
    require: { animal: "dog" },
    requiredProductFields: ["comparisonFilters.animal"]
  },
  {
    slug: "beste-trinkbrunnen-fuer-katzen",
    category: "trinkbrunnen",
    mode: "needs-data",
    require: { animal: "cat" },
    requiredProductFields: ["comparisonFilters.animal"]
  },
  {
    slug: "futterautomat-fuer-grosse-hunde",
    category: "futterautomaten",
    mode: "needs-data",
    require: { animal: "dog", petSize: "large" },
    requiredProductFields: [
      "comparisonFilters.animal",
      "comparisonFilters.petSize",
      "comparisonFilters.largeDogFit"
    ]
  },
  {
    slug: "futterautomat-gegen-schlingen",
    category: "futterautomaten",
    mode: "needs-data",
    require: { antiGulpFit: true },
    requiredProductFields: ["comparisonProfile.antiGulpFit"]
  },
  {
    slug: "futterautomat-mit-app",
    category: "futterautomaten",
    mode: "needs-data",
    require: { app: true },
    requiredProductFields: ["comparisonFilters.app"]
  },
  {
    slug: "gps-tracker-mit-langer-akkulaufzeit",
    category: "gps-tracker",
    mode: "needs-data",
    require: { batteryDaysMin: "comparison-threshold" },
    requiredProductFields: ["gps.batteryMaxDays"],
    note: "Schwellenwert muss im Vergleich explizit definiert werden."
  },
  {
    slug: "gps-tracker-ohne-abo",
    category: "gps-tracker",
    mode: "needs-data",
    require: { subscriptionRequired: false },
    requiredProductFields: ["gps.subscriptionRequired"]
  },
  {
    slug: "katzenklappen-mit-app-und-beuteerkennung",
    category: "katzenklappen",
    mode: "needs-data",
    require: { anyOf: ["appControl", "preyDetection"] },
    requiredProductFields: [
      "comparisonProfile.appControl",
      "comparisonProfile.preyDetection"
    ],
    note: "Intent muss klären, ob App ODER Beuteerkennung genügt oder beides erforderlich ist."
  },
  {
    slug: "kleine-gps-tracker-fuer-katzen",
    category: "gps-tracker",
    mode: "needs-data",
    require: { animal: "cat", maxWeightGrams: 35 },
    requiredProductFields: ["gps.animal", "gps.deviceWeightGrams"]
  }
];

export const getComparisonSelectionRule = (slug: string) =>
  comparisonSelectionRegistry.find((rule) => rule.slug === slug);
