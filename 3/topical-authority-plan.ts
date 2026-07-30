import type { AdvisorOpportunity } from "./types";

const forecast = {
  ctrPotential: 0,
  positionPotential: 0,
  clickPotential: 0,
  trafficPotential: 0,
  confidence: 0.45,
  assumptions: [
    "Priorisierung basiert auf der aktuellen Repository-Abdeckung.",
    "Search-Daten müssen vor der finalen Veröffentlichung gegengeprüft werden.",
  ],
  dataBasis: "Repository-Abgleich der vorhandenen Ratgeber, Vergleiche, Produkte und Hersteller.",
};

const task = (
  input: Omit<AdvisorOpportunity, "forecast" | "rangeKey" | "lowData" | "prompt" | "codexPrompt" | "dataBasis">
): AdvisorOpportunity => ({
  ...input,
  forecast,
  rangeKey: "topical-authority",
  lowData: true,
  dataBasis: {
    note: "Repository-basierter Topical-Authority-Plan. Vor Umsetzung mit aktuellen GSC-Daten validieren.",
  },
  prompt: "",
  codexPrompt: [
    "Du arbeitest im Repository Yushamon/affiliate-template im Projekt apps/pfotentechnik.",
    input.nextAction,
    "Prüfe vor jeder neuen Seite, ob eine passende Zielseite bereits existiert oder erweitert werden sollte.",
    "Keine Fülltexte, keine Keyword-Seiten ohne eigenständigen Nutzwert.",
    "Interne Verlinkung nach User Journey und Kaufentscheidung aufbauen.",
    "Nach der Umsetzung Content-, Link- und Release-Audits ausführen.",
  ].join("\n"),
});

export const topicalAuthorityOpportunities: AdvisorOpportunity[] = [
  task({
    id: "topical-authority|katzenklappen-cluster",
    title: "Katzenklappen-Cluster als neue Kernkategorie aufbauen",
    description:
      "Im Repository existieren einzelne Katzenklappen-nahe Produkte und Hersteller, aber kein belastbarer redaktioneller Cluster mit Hub, Vergleichen und Entscheidungsratgebern.",
    category: "content-gap",
    priority: "high",
    impact: 4.9,
    effortValue: 4.5,
    effort: "hoch",
    confidence: 0.95,
    score: 96,
    estimatedMinutes: 720,
    rationale:
      "Die Kategorie passt eng zur Positionierung von PfotenTechnik, ist transaktional und kann vorhandene Hersteller wie SureFeed, Cat Mate und PetSafe nutzen.",
    nextAction:
      "Erstelle zuerst einen Cornerstone-Hub zu smarten Katzenklappen. Ergänze danach priorisiert Vergleiche für Mikrochip-Katzenklappen und Katzenklappen mit App sowie Ratgeber zu Einbau, Mehrkatzenhaushalt, Sicherheit, Stromausfall und Glas-/Türmontage. Prüfe vorhandene Produkte und Hersteller, bevor neue Datensätze angelegt werden.",
    source: "topical-authority-repository-audit",
    expectedBenefit: "hoch",
    steps: [
      "Bestehende Produkte und Hersteller auf Katzenklappen-Abdeckung inventarisieren.",
      "Cornerstone-Hub und Informationsarchitektur definieren.",
      "Zwei kaufnahe Vergleiche und vier bis sechs unterstützende Ratgeber planen.",
      "Hub, Vergleiche, Produkte und Hersteller bidirektional verlinken.",
    ],
    pageType: "Cluster",
  }),
  task({
    id: "topical-authority|trinkbrunnen-kaufintents",
    title: "Trinkbrunnen-Cluster um fehlende Kaufintentionen ergänzen",
    description:
      "Der Wissenscluster ist bereits stark, während kaufnahe Vergleiche für kabellose Modelle und Materialentscheidungen noch fehlen.",
    category: "content-gap",
    priority: "high",
    impact: 4.6,
    effortValue: 3.0,
    effort: "mittel",
    confidence: 0.9,
    score: 90,
    estimatedMinutes: 360,
    rationale:
      "Viele vorhandene Wissensseiten zu Reinigung, Biofilm, Filter und Nutzung können gezielt auf neue Vergleichsseiten einzahlen.",
    nextAction:
      "Prüfe und erstelle bei echter Produktabdeckung Vergleiche für kabellose Trinkbrunnen sowie Edelstahl-Trinkbrunnen. Ergänze einen Ratgeber Edelstahl vs. Kunststoff und verknüpfe bestehende Reinigungs-, Filter- und Mehrkatzen-Ratgeber mit den passenden Vergleichen.",
    source: "topical-authority-repository-audit",
    expectedBenefit: "hoch",
    steps: [
      "Produktbestand nach Akku, Kabelbetrieb und Material klassifizieren.",
      "Vergleichsseiten nur bei ausreichender Produktauswahl erstellen.",
      "Bestehende Wissensseiten als unterstützenden Cluster anbinden.",
      "Kannibalisierung mit allgemeinen Trinkbrunnen-Vergleichen prüfen.",
    ],
    pageType: "Vergleich",
  }),
  task({
    id: "topical-authority|gps-international-offline",
    title: "GPS-Cluster um Ausland und Funkgrenzen erweitern",
    description:
      "Der GPS-Cluster deckt Grundlagen, Reichweite, Datenschutz, Befestigung, Genauigkeit und GPS vs. Bluetooth bereits ab. Echte Restlücken liegen bei Auslandseinsatz, Roaming und der Abgrenzung zu Lösungen ohne Mobilfunk.",
    category: "content-gap",
    priority: "high",
    impact: 4.3,
    effortValue: 2.5,
    effort: "mittel",
    confidence: 0.88,
    score: 86,
    estimatedMinutes: 240,
    rationale:
      "Die Ergänzungen schließen konkrete Vor-dem-Kauf-Fragen, ohne vorhandene GPS-Seiten zu duplizieren.",
    nextAction:
      "Erstelle einen Ratgeber zum GPS-Tracker im Ausland mit Roaming-, Netz- und Tarifgrenzen. Prüfe zusätzlich, ob das Thema GPS ohne Mobilfunk als eigener Ratgeber echten Mehrwert bietet oder besser als Abschnitt in bestehenden Grundlagen- und Ohne-Abo-Seiten integriert wird.",
    source: "topical-authority-repository-audit",
    expectedBenefit: "hoch",
    steps: [
      "Bestehende GPS-Seiten auf Überschneidungen prüfen.",
      "Auslandsnutzung als eigenständige Suchintention validieren.",
      "Ohne Mobilfunk nur bei klarer Abgrenzung zu ohne Abo ausbauen.",
      "Von GPS-Grundlagen, Reichweite und Ohne-Abo-Vergleich intern verlinken.",
    ],
    pageType: "Ratgeber",
  }),
  task({
    id: "topical-authority|futterautomaten-content-consolidation",
    title: "Futterautomaten-Cluster konsolidieren statt weiter verbreitern",
    description:
      "Der Futterautomaten-Cluster ist bereits sehr breit. Der nächste Hebel liegt in Qualitätssteigerung, Intent-Abgrenzung und Journey-Verlinkung statt in weiteren ähnlichen Seiten.",
    category: "internal-link",
    priority: "high",
    impact: 4.5,
    effortValue: 3.2,
    effort: "mittel",
    confidence: 0.96,
    score: 91,
    estimatedMinutes: 420,
    rationale:
      "Viele vorhandene Vergleiche adressieren ähnliche Tier-, Größen- und Nutzungssituationen. Zusätzliche Seiten erhöhen eher das Kannibalisierungsrisiko.",
    nextAction:
      "Erstelle eine Intent-Matrix aller Futterautomaten-Ratgeber und -Vergleiche. Führe doppelte oder schwach differenzierte Inhalte zusammen, schärfe eindeutige Entscheidungskriterien und baue die Journey Ratgeber → Vergleich → Produkt → Hersteller konsequent aus.",
    source: "topical-authority-repository-audit",
    expectedBenefit: "hoch",
    steps: [
      "Alle Futterautomaten-Seiten nach Suchintention gruppieren.",
      "Überschneidungen und dünne Varianten markieren.",
      "Beste Zielseite je Intent festlegen.",
      "Interne Links und CTA-Ziele entlang der Kaufentscheidung korrigieren.",
    ],
    pageType: "Cluster",
  }),
  task({
    id: "topical-authority|glossary-system",
    title: "Glossar als begrenztes Support-System aufbauen",
    description:
      "Ein strukturiertes Glossar fehlt. Einzelne Begriffserklärungen sollten jedoch nur entstehen, wenn sie mehrere bestehende Inhalte unterstützen.",
    category: "content-gap",
    priority: "medium",
    impact: 3.4,
    effortValue: 2.8,
    effort: "mittel",
    confidence: 0.85,
    score: 70,
    estimatedMinutes: 300,
    rationale:
      "Begriffe wie Geofencing, RFID, Mikrochip, UV-C, Aktivkohlefilter und Portionierung können mehrere Cluster stärken, bergen aber bei isolierten Kurzseiten Thin-Content-Risiken.",
    nextAction:
      "Implementiere zunächst eine Glossar-Hubseite und nur die Begriffe mit hoher interner Wiederverwendung: Geofencing, RFID/Mikrochip, GPS/LTE, UV-C, Aktivkohlefilter, Biofilm, Portionierung und Futterkapazität. Vermeide Ein-Satz-Seiten und verlinke Begriffe kontextuell.",
    source: "topical-authority-repository-audit",
    expectedBenefit: "mittel",
    steps: [
      "Begriffsvorkommen im Repository zählen.",
      "Nur mehrfach relevante Begriffe auswählen.",
      "Glossar-Template mit Definition, Praxisrelevanz und Verweisen entwickeln.",
      "Keine automatische Überverlinkung jedes Vorkommens.",
    ],
    pageType: "Glossar",
  }),
  task({
    id: "topical-authority|manufacturer-coverage",
    title: "Herstellerabdeckung an Produkt- und Clusterlücken koppeln",
    description:
      "Viele zentrale Hersteller sind bereits vorhanden. Neue Herstellerseiten sollten nicht losgelöst, sondern nur zusammen mit belastbaren Produkten und Vergleichen entstehen.",
    category: "content-gap",
    priority: "medium",
    impact: 3.6,
    effortValue: 2.5,
    effort: "mittel",
    confidence: 0.9,
    score: 74,
    estimatedMinutes: 240,
    rationale:
      "Leere oder schwach angebundene Herstellerseiten erzeugen wenig Mehrwert. Die größte sinnvolle Erweiterung folgt dem Katzenklappen- und Trinkbrunnen-Ausbau.",
    nextAction:
      "Prüfe fehlende Hersteller erst nach der Produktinventur der neuen Cluster. Priorisiere nur Marken mit mindestens einem relevanten Produkt, belastbaren Primärquellen und einer realen Rolle in mindestens einem Vergleich. Kandidaten wie Ferplast oder Pioneer Pet nicht ungeprüft anlegen.",
    source: "topical-authority-repository-audit",
    expectedBenefit: "mittel",
    steps: [
      "Produkte ohne Herstellerseite ermitteln.",
      "Hersteller ohne Produkt- oder Vergleichsverknüpfung markieren.",
      "Neue Hersteller nur mit Primärquellen und Produktabdeckung anlegen.",
      "Herstellerseiten mit passenden Vergleichen und Ratgebern verbinden.",
    ],
    pageType: "Hersteller",
  }),
  task({
    id: "topical-authority|pet-cameras-expansion",
    title: "Haustierkameras nur als validierten Expansionscluster vorbereiten",
    description:
      "Haustierkameras fehlen vollständig, liegen aber thematisch weiter von den derzeit stärksten Clustern entfernt.",
    category: "content-gap",
    priority: "medium",
    impact: 3.7,
    effortValue: 4.4,
    effort: "hoch",
    confidence: 0.78,
    score: 72,
    estimatedMinutes: 600,
    rationale:
      "Die Kategorie passt zur Marke, sollte aber erst nach dem Ausbau der bestehenden Autorität und einer belastbaren Produkt- und Nachfrageprüfung starten.",
    nextAction:
      "Erstelle vorerst keinen großen Content-Cluster. Prüfe Nachfrage, Wettbewerb, Affiliate-Verfügbarkeit und mindestens acht belastbare Produkte. Bei positivem Ergebnis einen Hub, einen Hauptvergleich und drei klar differenzierte Ratgeber planen.",
    source: "topical-authority-repository-audit",
    expectedBenefit: "mittel",
    steps: [
      "Markt- und Affiliate-Abdeckung validieren.",
      "Produkte und Hersteller mit Primärquellen prüfen.",
      "Cluster nur bei ausreichender Differenzierung freigeben.",
      "Start mit Hub, Hauptvergleich und wenigen Support-Ratgebern.",
    ],
    pageType: "Expansion",
  }),
  task({
    id: "topical-authority|automatic-litter-boxes-expansion",
    title: "Automatische Katzentoiletten als spätere Expansion bewerten",
    description:
      "Der Cluster fehlt vollständig und wäre kommerziell interessant, ist aber redaktionell und produktspezifisch aufwendig.",
    category: "content-gap",
    priority: "low",
    impact: 3.3,
    effortValue: 4.8,
    effort: "hoch",
    confidence: 0.72,
    score: 61,
    estimatedMinutes: 720,
    rationale:
      "Hoher Kaufwert steht hohen Anforderungen an Sicherheit, Hygiene, Produkttests und belastbare Herstellerdaten gegenüber.",
    nextAction:
      "Nur eine Opportunity-Prüfung anlegen. Vor Content-Produktion Sicherheitsrisiken, Rückrufhistorie, Reinigungsaufwand, Produktverfügbarkeit und Affiliate-Eignung untersuchen. Erst danach über Hub und Vergleich entscheiden.",
    source: "topical-authority-repository-audit",
    expectedBenefit: "mittel",
    steps: [
      "Kategorie- und Sicherheitsrisiken erfassen.",
      "Marktbreite und verfügbare Produkte prüfen.",
      "Test- und Quellenstandard definieren.",
      "Go/No-Go-Entscheidung dokumentieren.",
    ],
    pageType: "Expansion",
  }),
];
