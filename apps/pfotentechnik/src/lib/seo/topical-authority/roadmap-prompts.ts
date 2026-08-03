import {
  buildChatGptPrompt,
  buildCodexPrompt,
} from "../../seo-copilot/prompts.ts";
import type { PromptKind } from "../../seo-copilot/types.ts";
import type { PromptTemplateId } from "../../seo-copilot/prompt-registry.ts";
import type {
  Cluster,
  Opportunity,
} from "./loadTopicalAuthority.ts";

export const TOPICAL_AUTHORITY_ROADMAP_PROMPTS_VERSION = "1.0.1";

type RoadmapPromptProfile = {
  kind: PromptKind;
  templateId: PromptTemplateId;
  mode: "consolidate" | "journey" | "expand" | "validate";
};

export type TopicalAuthorityRoadmapPromptPair = {
  chatgpt: string;
  codex: string;
};

const profileForOpportunity = (
  opportunity: Opportunity,
): RoadmapPromptProfile => {
  if (opportunity.id.startsWith("link-")) {
    return {
      kind: "internal-link",
      templateId: "internal-linking-improve",
      mode: "journey",
    };
  }

  if (opportunity.id.startsWith("validate-")) {
    return {
      kind: "niche-opportunity",
      templateId: "validate-niche",
      mode: "validate",
    };
  }

  if (/consolidate|konsolidier/i.test(opportunity.id + opportunity.title)) {
    return {
      kind: "content-gap",
      templateId: "close-content-gap",
      mode: "consolidate",
    };
  }

  if (/commercial|journey|kaufnah/i.test(opportunity.id + opportunity.title)) {
    return {
      kind: "decision-journey",
      templateId: "decision-journey",
      mode: "journey",
    };
  }

  return {
    kind: "content-gap",
    templateId: "plan-topic-cluster",
    mode: "expand",
  };
};

const listDocuments = (
  cluster: Cluster | undefined,
  type?: Cluster["documents"][number]["type"],
): string[] =>
  (cluster?.documents ?? [])
    .filter((document) => !type || document.type === type)
    .map((document) => `${document.title} – ${document.route}`)
    .slice(0, 30);

const roadmapSpecificContext = (
  opportunity: Opportunity,
  cluster: Cluster | undefined,
) => {
  const profile = profileForOpportunity(opportunity);
  const clusterLabel = cluster?.label ?? opportunity.cluster;
  const gaps = cluster?.gaps ?? [];
  const documents = listDocuments(cluster);

  const modeRule: Record<RoadmapPromptProfile["mode"], string> = {
    consolidate:
      "Bestehende Intent-Owner, Überschneidungen und Kannibalisierungsrisiken zuerst klären. Konsolidieren und schärfen hat Vorrang vor neuen Seiten.",
    journey:
      "Die Nutzerreise innerhalb des Clusters prüfen und nur fachlich natürliche Übergänge zwischen Hub, Ratgeber, Vergleich, Produkt und Hersteller ergänzen.",
    expand:
      "Neue Seiten nur bei eigenständiger Suchintention, klarer Nutzeraufgabe und nachgewiesenem Information Gain vorsehen.",
    validate:
      "Zuerst Go/No-Go anhand strategischer Nähe, belastbarer Quellen, Produktbreite, Sicherheit und kommerzieller Eignung entscheiden. Ohne belastbare Grundlage nichts anlegen.",
  };

  return {
    profile,
    clusterLabel,
    documents,
    problems: [
      opportunity.reason,
      ...gaps.map((gap) => `Offene Cluster-Lücke: ${gap}`),
    ],
    existingData: [
      `Roadmap-Chance: ${opportunity.title}`,
      `Cluster: ${clusterLabel}`,
      `Priorität: ${opportunity.priority}`,
      `Impact: ${opportunity.impact}/100`,
      `Geschätzter Aufwand: ${opportunity.effort}`,
      `Vorgeschlagene Aktion: ${opportunity.action}`,
      cluster
        ? `Cluster-Stand: Score ${cluster.score}/100, Status ${cluster.status}, Linkabdeckung ${cluster.linkCoverage} %.`
        : "Cluster-Detaildaten vor der Arbeit aus dem Repository neu laden.",
      cluster
        ? `Bestand: ${cluster.counts.pages} Ratgeber/Hubs, ${cluster.counts.comparisons} Vergleiche, ${cluster.counts.products} Produkte, ${cluster.counts.manufacturers} Hersteller.`
        : "",
      `Strategische Regel: ${modeRule[profile.mode]}`,
      ...documents.map((document) => `Vorhandener Inhalt: ${document}`),
    ].filter(Boolean),
    missingData: [
      "Aktuellen Repository-Stand und die tatsächlichen Intent-Owner des Clusters prüfen.",
      "Zwischen Update, Konsolidierung, interner Journey, neuer Seite und bewusstem Nichtstun unterscheiden.",
      "Abhängigkeiten, Reihenfolge, Zielrouten oder Zieldateien und objektive Fertig-Kriterien festlegen.",
      "Maximal drei einfache naheliegende Verbesserungen im selben Cluster mitnehmen, wenn sie ohne zusätzliche Recherche, neue Architektur oder künstliche Links eindeutig sinnvoll sind.",
      "Keine Roadmap-Punkte nur aus Sollzahlen oder Keyword-Nähe ableiten.",
    ],
    validationCommands: [
      "npm --workspace apps/pfotentechnik run audit:topical-authority:strict",
      "npm --workspace apps/pfotentechnik run audit:decision-journeys:strict",
      "npm --workspace apps/pfotentechnik run audit:internal-link-health:strict",
      "npm --workspace apps/pfotentechnik run audit:content-quality:strict",
      "npm --workspace apps/pfotentechnik run build",
    ],
    acceptanceCriteria: [
      `Die Roadmap-Chance „${opportunity.title}“ ist anhand des aktuellen Repository-Stands bestätigt, präzisiert oder begründet verworfen.`,
      "Jeder Umsetzungsschritt nennt Nutzerproblem, Zielroute oder Datei, Abhängigkeit und prüfbares Ergebnis.",
      "Neue Seiten werden nur bei eigenständiger Suchintention und echtem Information Gain vorgesehen.",
      "Naheliegende Zusatzverbesserungen bleiben auf maximal drei kleine Maßnahmen im selben Cluster begrenzt.",
      "Topical-Authority-, Journey-, Internal-Link- und Content-Quality-Prüfungen sind nach der Umsetzung dokumentiert.",
    ],
  };
};

const appendChatGptRoadmapInstructions = (
  prompt: string,
  opportunity: Opportunity,
  clusterLabel: string,
): string =>
  [
    prompt,
    "",
    "TOPICAL-AUTHORITY-ROADMAP",
    `Roadmap-Chance: ${opportunity.title}`,
    `Themencluster: ${clusterLabel}`,
    "",
    "Liefere eine entscheidungsreife Roadmap mit:",
    "1. Bestätigter Nutzer- und Suchintention.",
    "2. Aktuellem Intent-Owner und möglicher Kannibalisierung.",
    "3. Entscheidung: aktualisieren, konsolidieren, Journey schließen, neu anlegen oder verwerfen.",
    "4. Priorisierter Reihenfolge mit Abhängigkeiten.",
    "5. Konkreten Zielrouten oder Repository-Dateien, soweit aus dem Bestand belegbar.",
    "6. Information Gain und Nutzen für den Leser.",
    "7. Objektiven Akzeptanzkriterien und passenden Audits.",
    "8. Maximal drei kleinen naheliegenden Verbesserungen im selben Cluster.",
    "",
    "Keine Dateien ändern. Keine Seiten oder Produktdaten erfinden. Unsichere Punkte als offene Recherchefrage markieren.",
  ].join("\n");

const appendCodexRoadmapInstructions = (
  prompt: string,
  opportunity: Opportunity,
  clusterLabel: string,
): string =>
  [
    prompt,
    "",
    "TOPICAL-AUTHORITY-ROADMAP UMSETZEN",
    `Roadmap-Chance: ${opportunity.title}`,
    `Themencluster: ${clusterLabel}`,
    "",
    "Arbeite die bestätigte Roadmap vollständig im Repository ab.",
    "Erstelle einen konfliktarmen, wiederholbaren Installer-Patch im Ordner 3.",
    "Behebe Ursachen zentral und erweitere vorhandene Komponenten, Datenmodelle und Journey-Logik statt Sonderregeln aufzubauen.",
    "Das konkrete Roadmap-Ziel ist Pflicht. Nimm maximal drei einfache naheliegende Verbesserungen im selben Cluster mit, wenn sie ohne neue Recherche, CSS-Änderung, Architekturumbau oder künstliche Links eindeutig sinnvoll sind.",
    "Lege keine neue Seite allein wegen Sollzahlen oder Keyword-Nähe an.",
    "Führe die angegebenen Audits und den Build aus. Dokumentiere geänderte Dateien, Entscheidungen, bewusst nicht umgesetzte Punkte und verbleibende Grenzen.",
  ].join("\n");

export const buildTopicalAuthorityRoadmapPrompts = (
  opportunity: Opportunity,
  cluster?: Cluster,
): TopicalAuthorityRoadmapPromptPair => {
  const context = roadmapSpecificContext(opportunity, cluster);
  const guides = listDocuments(cluster, "page");
  const comparisons = listDocuments(cluster, "comparison");

  const input = {
    kind: context.profile.kind,
    title: `Topical-Authority-Roadmap: ${opportunity.title}`,
    category: context.clusterLabel,
    problems: context.problems,
    existingData: context.existingData,
    missingData: context.missingData,
    guides,
    comparisons,
    imageRequirements: [],
    validationCommands: context.validationCommands,
    acceptanceCriteria: context.acceptanceCriteria,
  };

  const chatgpt = buildChatGptPrompt(input, {
    templateId: context.profile.templateId,
  });
  const codex = buildCodexPrompt(input, {
    templateId: context.profile.templateId,
  });

  return {
    chatgpt: appendChatGptRoadmapInstructions(
      chatgpt.prompt,
      opportunity,
      context.clusterLabel,
    ),
    codex: appendCodexRoadmapInstructions(
      codex.prompt,
      opportunity,
      context.clusterLabel,
    ),
  };
};
