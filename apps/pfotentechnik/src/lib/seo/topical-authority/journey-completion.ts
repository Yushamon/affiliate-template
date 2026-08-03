export type JourneyDocument = {
  route: string;
  links: string[];
};

export type JourneyRequirement = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type JourneyCompletion = {
  clusterId: string;
  applicable: boolean;
  complete: boolean;
  completedEdges: string[];
  missingEdges: string[];
  requiredEdges: number;
  completedCount: number;
};

const REQUIREMENTS: Record<string, JourneyRequirement[]> = {
  trinkbrunnen: [
    {
      id: "hub-to-material",
      source: "/trinkbrunnen/",
      target: "/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/",
      label: "Hub → Materialratgeber",
    },
    {
      id: "hub-to-cleaning",
      source: "/trinkbrunnen/",
      target: "/katzentrinkbrunnen-richtig-reinigen/",
      label: "Hub → Reinigungsratgeber",
    },
    {
      id: "hub-to-filter",
      source: "/trinkbrunnen/",
      target: "/filter-im-katzentrinkbrunnen-wechseln/",
      label: "Hub → Filterratgeber",
    },
    {
      id: "hub-to-comparison",
      source: "/trinkbrunnen/",
      target: "/vergleiche/beste-trinkbrunnen-fuer-katzen/",
      label: "Hub → Katzenvergleich",
    },
    {
      id: "material-to-comparison",
      source: "/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/",
      target: "/vergleiche/beste-trinkbrunnen-fuer-katzen/",
      label: "Materialratgeber → Katzenvergleich",
    },
    {
      id: "cleaning-to-comparison",
      source: "/katzentrinkbrunnen-richtig-reinigen/",
      target: "/vergleiche/beste-trinkbrunnen-fuer-katzen/",
      label: "Reinigungsratgeber → Katzenvergleich",
    },
    {
      id: "filter-to-comparison",
      source: "/filter-im-katzentrinkbrunnen-wechseln/",
      target: "/vergleiche/beste-trinkbrunnen-fuer-katzen/",
      label: "Filterratgeber → Katzenvergleich",
    },
    {
      id: "comparison-to-material",
      source: "/vergleiche/beste-trinkbrunnen-fuer-katzen/",
      target: "/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/",
      label: "Katzenvergleich → Materialratgeber",
    },
    {
      id: "comparison-to-cleaning",
      source: "/vergleiche/beste-trinkbrunnen-fuer-katzen/",
      target: "/katzentrinkbrunnen-richtig-reinigen/",
      label: "Katzenvergleich → Reinigungsratgeber",
    },
    {
      id: "comparison-to-filter",
      source: "/vergleiche/beste-trinkbrunnen-fuer-katzen/",
      target: "/filter-im-katzentrinkbrunnen-wechseln/",
      label: "Katzenvergleich → Filterratgeber",
    },
  ],
};

const normalizeRoute = (value: string): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const withoutHash = raw.split("#", 1)[0]?.split("?", 1)[0] ?? "";
  if (!withoutHash.startsWith("/")) return withoutHash;
  return withoutHash.endsWith("/") ? withoutHash : `${withoutHash}/`;
};

export function getJourneyRequirements(clusterId: string): JourneyRequirement[] {
  return REQUIREMENTS[clusterId] ?? [];
}

export function evaluateClusterJourney(
  clusterId: string,
  documents: JourneyDocument[],
): JourneyCompletion {
  const requirements = getJourneyRequirements(clusterId);

  if (requirements.length === 0) {
    return {
      clusterId,
      applicable: false,
      complete: false,
      completedEdges: [],
      missingEdges: [],
      requiredEdges: 0,
      completedCount: 0,
    };
  }

  const graph = new Map<string, Set<string>>();

  for (const document of documents) {
    const route = normalizeRoute(document.route);
    if (!route) continue;

    const targets = graph.get(route) ?? new Set<string>();
    for (const link of document.links ?? []) {
      const normalized = normalizeRoute(link);
      if (normalized && normalized !== route) targets.add(normalized);
    }
    graph.set(route, targets);
  }

  const completedEdges: string[] = [];
  const missingEdges: string[] = [];

  for (const requirement of requirements) {
    const source = normalizeRoute(requirement.source);
    const target = normalizeRoute(requirement.target);
    const present = graph.get(source)?.has(target) ?? false;

    if (present) completedEdges.push(requirement.label);
    else missingEdges.push(requirement.label);
  }

  return {
    clusterId,
    applicable: true,
    complete: missingEdges.length === 0,
    completedEdges,
    missingEdges,
    requiredEdges: requirements.length,
    completedCount: completedEdges.length,
  };
}

export function journeyOpportunityReason(
  completion: JourneyCompletion | undefined,
  fallback: string,
): string {
  if (!completion?.applicable) return fallback;
  if (completion.complete) {
    return `Alle ${completion.requiredEdges} kaufnahen Pflichtkanten sind vorhanden.`;
  }

  return `${completion.completedCount}/${completion.requiredEdges} kaufnahe Pflichtkanten vorhanden. Fehlend: ${completion.missingEdges.join(", ")}.`;
}
