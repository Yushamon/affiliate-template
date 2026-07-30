export type DecisionStage =
  | "orientation"
  | "problem"
  | "evaluation"
  | "decision"
  | "support";

export type JourneyDocumentType = "page" | "comparison" | "product";

export type JourneyEntry = {
  route: string;
  type: JourneyDocumentType;
  slug: string;
  title: string;
  description?: string;
  cluster?: string;
  categoryKey?: string;
  manufacturer?: string;
  score?: number;
  relatedTags?: string[];
  explicit?: {
    stage?: DecisionStage;
    intent?: string;
    primaryQuestion?: string;
    next?: string[];
    fallback?: string[];
  };
};

export type JourneyStep = {
  href: string;
  kind: "Ratgeber" | "Vergleich" | "Produkt";
  label: string;
};

export type DecisionJourney = {
  cluster: string;
  stage: DecisionStage;
  intent: string;
  question: string;
  source: "frontmatter" | "derived";
  steps: JourneyStep[];
};

export const CLUSTER_DEFINITIONS = [
  {
    id: "futterautomaten",
    patterns: [/futterautomat/i, /futterspender/i, /nassfutterautomat/i],
    hubs: ["/smarte-futterautomaten/"],
  },
  {
    id: "trinkbrunnen",
    patterns: [/trinkbrunnen/i, /katzenbrunnen/i, /wasserbrunnen/i],
    hubs: ["/smarte-trinkbrunnen/", "/katzenbrunnen/"],
  },
  {
    id: "gps-tracker",
    patterns: [/gps-tracker/i, /gps tracker/i, /bluetooth-tag/i, /ortung/i],
    hubs: ["/gps-tracker-hund/", "/gps-tracker-katze/"],
  },
  {
    id: "katzenklappen",
    patterns: [/katzenklappe/i, /mikrochipklappe/i],
    hubs: ["/smarte-katzenklappen/", "/katzenklappe-mit-chip/"],
  },
] as const;

const STAGE_LABELS: Record<DecisionStage, string> = {
  orientation: "Orientierung",
  problem: "Problem klären",
  evaluation: "Optionen bewerten",
  decision: "Entscheidung",
  support: "Nutzung und Support",
};

export function normalizeRoute(value: string): string {
  const route = value.startsWith("/") ? value : `/${value}`;
  return route.endsWith("/") ? route : `${route}/`;
}

export function inferCluster(entry: JourneyEntry): string | null {
  if (entry.explicit?.intent && entry.cluster) return entry.cluster;
  if (entry.categoryKey) return entry.categoryKey;

  const haystack = `${entry.slug} ${entry.title} ${entry.description ?? ""}`;
  return (
    CLUSTER_DEFINITIONS.find((cluster) =>
      cluster.patterns.some((pattern) => pattern.test(haystack)),
    )?.id ?? null
  );
}

export function inferStage(entry: JourneyEntry): DecisionStage {
  if (entry.explicit?.stage) return entry.explicit.stage;
  if (entry.type === "product") return "decision";
  if (entry.type === "comparison") return "evaluation";

  const haystack = `${entry.slug} ${entry.title}`.toLowerCase();
  if (/(reinigen|pflege|wartung|akku|abo|kosten|laut|reichweite|gewöhn)/.test(haystack)) {
    return "support";
  }
  if (/(oder|problem|frisst|trinkt|urlaub|beruf|verloren|entlaufen|zu wenig|zu viel)/.test(haystack)) {
    return "problem";
  }
  if (/(beste|vergleich|kaufen|empfehlung|für hunde|für katzen)/.test(haystack)) {
    return "evaluation";
  }
  return "orientation";
}

export function inferQuestion(entry: JourneyEntry, stage: DecisionStage): string {
  if (entry.explicit?.primaryQuestion) return entry.explicit.primaryQuestion;
  const cluster = inferCluster(entry) ?? "Thema";

  if (stage === "problem") return `Welche Lösung passt zu diesem konkreten Problem im Bereich ${cluster}?`;
  if (stage === "evaluation") return `Welche Optionen unterscheiden sich für diesen Anwendungsfall wirklich?`;
  if (stage === "decision") return `Passt dieses Produkt – oder ist eine Alternative sinnvoller?`;
  if (stage === "support") return `Wie lässt sich die Technik zuverlässig und sinnvoll nutzen?`;
  return `Wie lässt sich das Thema ${cluster} sinnvoll einordnen?`;
}

function labelFor(entry: JourneyEntry): string {
  if (entry.type === "comparison") return `${entry.title} vergleichen`;
  if (entry.type === "product") return `${entry.title} im Detail prüfen`;
  return entry.title;
}

function stepKind(entry: JourneyEntry): JourneyStep["kind"] {
  if (entry.type === "comparison") return "Vergleich";
  if (entry.type === "product") return "Produkt";
  return "Ratgeber";
}

export function buildDecisionJourney(
  current: JourneyEntry,
  allEntries: JourneyEntry[],
): DecisionJourney | null {
  const cluster = inferCluster(current);
  if (!cluster) return null;

  const stage = inferStage(current);
  const route = normalizeRoute(current.route);
  const sameCluster = allEntries.filter(
    (entry) =>
      normalizeRoute(entry.route) !== route &&
      inferCluster(entry) === cluster,
  );

  const byRoute = new Map(
    allEntries.map((entry) => [normalizeRoute(entry.route), entry]),
  );

  const explicitRoutes = [
    ...(current.explicit?.next ?? []),
    ...(current.explicit?.fallback ?? []),
  ]
    .map(normalizeRoute)
    .map((target) => byRoute.get(target))
    .filter((entry): entry is JourneyEntry => Boolean(entry));

  const comparisons = sameCluster
    .filter((entry) => entry.type === "comparison")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const products = sameCluster
    .filter((entry) => entry.type === "product")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const pages = sameCluster.filter((entry) => entry.type === "page");

  const candidates =
    current.type === "page"
      ? [...explicitRoutes, ...comparisons, ...products, ...pages]
      : current.type === "comparison"
        ? [...explicitRoutes, ...products, ...pages, ...comparisons]
        : [...explicitRoutes, ...comparisons, ...products, ...pages];

  const seen = new Set<string>();
  const steps = candidates
    .filter((entry) => {
      const target = normalizeRoute(entry.route);
      if (target === route || seen.has(target)) return false;
      seen.add(target);
      return true;
    })
    .map((entry) => ({
      href: normalizeRoute(entry.route),
      kind: stepKind(entry),
      label: labelFor(entry),
    }))
    .slice(0, 3);

  if (steps.length === 0) return null;

  return {
    cluster,
    stage,
    intent: current.explicit?.intent ?? `${cluster}:${stage}`,
    question: inferQuestion(current, stage),
    source: current.explicit ? "frontmatter" : "derived",
    steps,
  };
}

export function getStageLabel(stage: DecisionStage): string {
  return STAGE_LABELS[stage];
}
