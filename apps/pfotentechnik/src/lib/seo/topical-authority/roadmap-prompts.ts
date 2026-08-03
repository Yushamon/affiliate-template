import type {
  Cluster,
  Opportunity,
} from "./loadTopicalAuthority.ts";

export const TOPICAL_AUTHORITY_ROADMAP_PROMPTS_VERSION = "1.1.1";

type RoadmapMode = "consolidate" | "journey" | "expand" | "validate";

type RoadmapProfile = {
  mode: RoadmapMode;
  rule: string;
};

export type TopicalAuthorityRoadmapPromptPair = {
  chatgpt: string;
  codex: string;
};

const ROADMAP_PROFILES: RoadmapProfile[] = [
  {
    mode: "consolidate",
    rule:
      "Bestehende Intent-Owner, Überschneidungen und Kannibalisierungsrisiken zuerst klären. Konsolidieren und schärfen hat Vorrang vor neuen Seiten.",
  },
  {
    mode: "journey",
    rule:
      "Die Nutzerreise innerhalb des Clusters prüfen und nur fachlich natürliche Übergänge zwischen Hub, Ratgeber, Vergleich, Produkt und Hersteller ergänzen.",
  },
  {
    mode: "expand",
    rule:
      "Neue Seiten nur bei eigenständiger Suchintention, klarer Nutzeraufgabe und nachgewiesenem Information Gain vorsehen.",
  },
  {
    mode: "validate",
    rule:
      "Zuerst Go/No-Go anhand strategischer Nähe, belastbarer Nachfrage- und Repository-Signale, Produktbreite, Sicherheit und kommerzieller Eignung entscheiden.",
  },
];

const unique = (values: string[], max = 50): string[] =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, max);

const profileForOpportunity = (opportunity: Opportunity): RoadmapProfile => {
  const text = `${opportunity.id} ${opportunity.title}`.toLowerCase();

  if (
    opportunity.id.startsWith("link-") ||
    /journey|kaufnah|commercial/.test(text)
  ) {
    return ROADMAP_PROFILES.find((profile) => profile.mode === "journey")!;
  }

  if (opportunity.id.startsWith("validate-")) {
    return ROADMAP_PROFILES.find((profile) => profile.mode === "validate")!;
  }

  if (/consolidate|konsolidier/.test(text)) {
    return ROADMAP_PROFILES.find((profile) => profile.mode === "consolidate")!;
  }

  return ROADMAP_PROFILES.find((profile) => profile.mode === "expand")!;
};

const listDocuments = (
  cluster: Cluster | undefined,
  type?: Cluster["documents"][number]["type"],
): string[] =>
  (cluster?.documents ?? [])
    .filter((document) => !type || document.type === type)
    .map((document) => `${document.title} – ${document.route}`)
    .slice(0, 40);

const section = (
  title: string,
  values: string[],
  fallback = "Keine",
): string =>
  `${title}:\n${
    values.length
      ? values.map((value) => `- ${value}`).join("\n")
      : `- ${fallback}`
  }`;

const buildSharedRoadmapPrompt = (
  opportunity: Opportunity,
  cluster: Cluster | undefined,
): string => {
  const profile = profileForOpportunity(opportunity);
  const clusterLabel = cluster?.label ?? opportunity.cluster;
  const gaps = cluster?.gaps ?? [];

  const facts = unique([
    `Roadmap-Chance: ${opportunity.title}`,
    `Themencluster: ${clusterLabel}`,
    `Priorität: ${opportunity.priority}`,
    `Impact: ${opportunity.impact}/100`,
    `Geschätzter Aufwand: ${opportunity.effort}`,
    `Begründung: ${opportunity.reason}`,
    `Vorgeschlagene Aktion: ${opportunity.action}`,
    cluster
      ? `Cluster-Stand: Score ${cluster.score}/100, Status ${cluster.status}, Linkabdeckung ${cluster.linkCoverage} %.`
      : "Cluster-Detaildaten vor der Arbeit aus dem Repository neu laden.",
    cluster
      ? `Bestand: ${cluster.counts.pages} Ratgeber/Hubs, ${cluster.counts.comparisons} Vergleiche, ${cluster.counts.products} Produkte, ${cluster.counts.manufacturers} Hersteller.`
      : "",
    `Strategische Regel: ${profile.rule}`,
    ...gaps.map((gap) => `Offene Cluster-Lücke: ${gap}`),
  ]);

  const routeMatrixInstruction = [
    "Erstelle für jede tatsächlich relevante Route eine kompakte Intent-Matrix mit:",
    "- Route oder Repository-Datei",
    "- aktuelle Nutzer- und Suchintention",
    "- Soll-Intent",
    "- aktueller Intent-Owner",
    "- Überschneidung oder Kannibalisierungsrisiko",
    "- Entscheidung: behalten, schärfen, zusammenführen, Journey neu ordnen, neu anlegen oder verwerfen",
    "- konkrete Änderung",
    "- Abhängigkeiten",
    "- objektives Akzeptanzkriterium",
  ];

  return [
    "Projekt: Yushamon/affiliate-template",
    "Projektpfad: apps/pfotentechnik",
    "",
    "TOPICAL-AUTHORITY-ROADMAP",
    "",
    "AUFGABE",
    `Topical-Authority-Roadmap für „${opportunity.title}“`,
    "",
    "ZIEL",
    "Prüfe den aktuellen Repository-Bestand, kläre Intent-Ownership und leite eine kleine, entscheidungsreife Roadmap ab. Keine generische Produktrecherche und keine automatische Seitenerweiterung.",
    "",
    section("Bestätigter Repository-Kontext", facts),
    section("Vorhandene Ratgeber und Hubs", listDocuments(cluster, "page")),
    section("Vorhandene Vergleiche", listDocuments(cluster, "comparison")),
    section("Vorhandene Produkte", listDocuments(cluster, "product")),
    section("Vorhandene Hersteller", listDocuments(cluster, "manufacturer")),
    "",
    "PRÜFREIHENFOLGE",
    "1. Aktuellen Repository-Stand und vorhandene Search-Daten prüfen.",
    "2. Tatsächliche Intent-Owner und Überschneidungen bestimmen.",
    "3. Zwischen aktualisieren, konsolidieren, Journey schließen, neu anlegen und bewusst verwerfen unterscheiden.",
    "4. Abhängigkeiten und Reihenfolge festlegen.",
    "5. Maximal drei einfache naheliegende Verbesserungen im selben Cluster aufnehmen.",
    "",
    ...routeMatrixInstruction,
    "",
    "GRENZEN",
    "- Keine schematische Produktprüfung ohne konkrete betroffene Produktseite.",
    "- Keine externe Produkt- oder Marktprüfung ohne konkrete offene Produktfrage.",
    "- Keine Bildanforderungen.",
    "- Keine neue Seite nur wegen Sollzahlen, Keyword-Nähe oder formaler Cluster-Lücke.",
    "- Keine künstlichen internen Links.",
    "- Unsichere Punkte als offene Frage markieren.",
    "",
    "VALIDIERUNG",
    "- npm --workspace apps/pfotentechnik run audit:topical-authority:strict",
    "- npm --workspace apps/pfotentechnik run audit:decision-journeys:strict",
    "- npm --workspace apps/pfotentechnik run audit:internal-link-health:strict",
    "- npm --workspace apps/pfotentechnik run audit:content-quality:strict",
    "- npm --workspace apps/pfotentechnik run build",
  ].join("\n");
};

const buildChatGptPrompt = (
  opportunity: Opportunity,
  cluster: Cluster | undefined,
): string => [
  buildSharedRoadmapPrompt(opportunity, cluster),
  "",
  "AUSGABE FÜR CHATGPT",
  "Liefere ausschließlich die Analyse und eine entscheidungsreife Roadmap.",
  "Ändere keine Dateien.",
  "Ordne die Maßnahmen in Phase 1 bis Phase 4.",
  "Begründe ausdrücklich, welche Seiten nicht verändert oder nicht neu angelegt werden sollten.",
  "Nenne für jede Maßnahme Nutzerproblem, Zielroute oder Datei, Abhängigkeit und prüfbares Ergebnis.",
].join("\n");

const buildCodexPrompt = (
  opportunity: Opportunity,
  cluster: Cluster | undefined,
): string => [
  buildSharedRoadmapPrompt(opportunity, cluster),
  "",
  "AUSGABE FÜR CODEX",
  "Arbeite die bestätigte Roadmap direkt im Repository ab.",
  "Erstelle einen konfliktarmen, wiederholbaren Installer-Patch im Ordner 3.",
  "Behebe Ursachen zentral und verwende bestehende Komponenten, Datenmodelle und Journey-Logik.",
  "Ändere nur Dateien, die aus der Intent-Matrix und der bestätigten Roadmap folgen.",
  "Führe alle genannten Prüfungen und den Build aus.",
  "Dokumentiere geänderte Dateien, Intent-Entscheidungen, zusammengeführte oder bewusst unveränderte Seiten und verbleibende Grenzen.",
].join("\n");

export const buildTopicalAuthorityRoadmapPrompts = (
  opportunity: Opportunity,
  cluster?: Cluster,
): TopicalAuthorityRoadmapPromptPair => ({
  chatgpt: buildChatGptPrompt(opportunity, cluster),
  codex: buildCodexPrompt(opportunity, cluster),
});
