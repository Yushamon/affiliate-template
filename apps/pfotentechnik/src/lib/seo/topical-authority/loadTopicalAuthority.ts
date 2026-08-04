import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateClusterJourney,
  journeyOpportunityReason,
  type JourneyCompletion,
} from "./journey-completion.ts";

export type DocumentType = "page" | "comparison" | "product" | "manufacturer";
export type ClusterStatus = "strong" | "developing" | "gap";
export type Priority = "high" | "medium" | "low";

type DocumentRecord = {
  type: DocumentType;
  slug: string;
  title: string;
  description: string;
  manufacturer: string;
  categoryKey: string;
  body: string;
  route: string;
  filePath: string;
  links: string[];
};

type ClusterDefinition = {
  id: string;
  label: string;
  description: string;
  slugPatterns: RegExp[];
  titlePatterns: RegExp[];
  descriptionPatterns: RegExp[];
  bodyPatterns: RegExp[];
  excludePatterns: RegExp[];
  hubPatterns: RegExp[];
  manufacturerPatterns?: RegExp[];
  targets: {
    pages: number;
    comparisons: number;
    products: number;
    manufacturers: number;
  };
  strategy: string;
  expansion?: boolean;
};

export type Cluster = {
  id: string;
  label: string;
  description: string;
  score: number;
  status: ClusterStatus;
  priority: Priority;
  counts: {
    pages: number;
    comparisons: number;
    products: number;
    manufacturers: number;
    total: number;
  };
  coverage: {
    hub: boolean;
    guides: boolean;
    comparisons: boolean;
    products: boolean;
    manufacturers: boolean;
    journey: boolean;
  };
  linkCoverage: number;
  journeyCompletion?: JourneyCompletion;
  gaps: string[];
  nextAction: string;
  documents: Array<{
    type: DocumentType;
    title: string;
    route: string;
    filePath: string;
  }>;
};

export type Opportunity = {
  id: string;
  title: string;
  cluster: string;
  priority: Priority;
  impact: number;
  effort: "niedrig" | "mittel" | "hoch";
  reason: string;
  action: string;
};

export type TopicalAuthorityData = {
  generatedAt: string;
  authorityScore: number;
  summary: {
    documents: number;
    clusters: number;
    strong: number;
    developing: number;
    gaps: number;
    opportunities: number;
    orphanCandidates: number;
  };
  inventory: {
    page: number;
    comparison: number;
    product: number;
    manufacturer: number;
    pages: number;
    comparisons: number;
    products: number;
    manufacturers: number;
  };
  clusters: Cluster[];
  opportunities: Opportunity[];
  orphanCandidates: TopicalAuthorityData["orphans"];
  orphans: Array<{
    type: DocumentType;
    title: string;
    route: string;
    filePath: string;
  }>;
};

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const contentRoot = path.join(appRoot, "src", "content");

export const CLUSTER_DEFINITIONS: ClusterDefinition[] = [
  {
    id: "futterautomaten",
    label: "Futterautomaten",
    description:
      "Automatische Fütterung, Portionierung, Nassfutter, App und Nutzungssituationen.",
    slugPatterns: [
      /(?:^|-)futterautomat(?:en)?(?:-|$)/i,
      /(?:^|-)futterspender(?:-|$)/i,
      /(?:^|-)futterstation(?:-|$)/i,
      /hund-frisst-zu-schnell/i,
      /futterautomat-fuer-/i,
    ],
    titlePatterns: [
      /\bfutterautomat(?:en)?\b/i,
      /\bautomatische(?:r|s)? futter/i,
      /\bfutterspender\b/i,
    ],
    descriptionPatterns: [
      /\bfutterautomat(?:en)?\b/i,
      /\bportion(?:en|ierung)?\b.*\bfütter/i,
    ],
    bodyPatterns: [
      /\bfutterautomat(?:en)?\b/i,
      /\bportionierung\b/i,
      /\bnassfutterautomat\b/i,
    ],
    excludePatterns: [
      /\btrinkbrunnen\b/i,
      /\bkatzentoilette\b/i,
      /\bkatzenklappe\b/i,
      /\bgps[- ]tracker\b/i,
    ],
    hubPatterns: [/^futterautomat(?:en)?$/i, /^smarte-futterautomaten$/i],
    manufacturerPatterns: [
      /petlibro/i,
      /wopet/i,
      /oneisall/i,
      /voluas/i,
      /imipaw/i,
      /petkit/i,
      /xiaomi/i,
      /aqara/i,
      /cat mate/i,
      /surefeed/i,
      /balimo/i,
      /arf pets/i,
      /dogness/i,
      /casfuy/i,
    ],
    targets: { pages: 6, comparisons: 4, products: 8, manufacturers: 3 },
    strategy:
      "Intents schärfen und die Journey Ratgeber → Vergleich → Produkt → Hersteller schließen.",
  },
  {
    id: "trinkbrunnen",
    label: "Trinkbrunnen",
    description:
      "Trinkverhalten, Hygiene, Filter, Materialien und Brunnen für Hunde und Katzen.",
    slugPatterns: [
      /(?:^|-)trinkbrunnen(?:-|$)/i,
      /(?:^|-)katzentrinkbrunnen(?:-|$)/i,
      /hund-trinkt-/i,
      /katze-trinkt-/i,
    ],
    titlePatterns: [
      /\btrinkbrunnen\b/i,
      /\bkatzenbrunnen\b/i,
      /\b(?:hund|katze) trinkt\b/i,
    ],
    descriptionPatterns: [
      /\btrinkbrunnen\b/i,
      /\btrinkmenge\b/i,
      /\bwasseraufnahme\b/i,
    ],
    bodyPatterns: [
      /\btrinkbrunnen\b/i,
      /\bbiofilm\b/i,
      /\bfilterwechsel\b/i,
    ],
    excludePatterns: [
      /\bfutterautomat\b/i,
      /\bkatzentoilette\b/i,
      /\bkatzenklappe\b/i,
      /\bgps[- ]tracker\b/i,
    ],
    hubPatterns: [/^trinkbrunnen$/i],
    manufacturerPatterns: [
      /petlibro/i,
      /petkit/i,
      /catit/i,
      /pioneer pet/i,
      /drinkwell/i,
      /uahpet/i,
      /miaustore/i,
    ],
    targets: { pages: 6, comparisons: 2, products: 6, manufacturers: 2 },
    strategy:
      "Kaufnahe Intentionen mit Hygiene-, Filter- und Materialratgebern verbinden.",
  },
  {
    id: "gps-tracker",
    label: "GPS-Tracker",
    description:
      "Ortung, Reichweite, Akkulaufzeit, Abo, Datenschutz und Nutzung.",
    slugPatterns: [
      /(?:^|-)gps(?:-|$)/i,
      /(?:^|-)tracker(?:-|$)/i,
      /bluetooth-tag/i,
      /hund-entlaufen/i,
      /katze-entlaufen/i,
    ],
    titlePatterns: [
      /\bgps[- ]tracker\b/i,
      /\bbluetooth[- ]tag\b/i,
      /\bortung\b/i,
    ],
    descriptionPatterns: [
      /\bgps\b/i,
      /\bgeofence\b/i,
      /\bortung\b/i,
    ],
    bodyPatterns: [
      /\bgps[- ]tracker\b/i,
      /\bgeofencing\b/i,
      /\bmobilfunknetz\b/i,
    ],
    excludePatterns: [
      /\bfutterautomat\b/i,
      /\btrinkbrunnen\b/i,
      /\bkatzentoilette\b/i,
      /\bkatzenklappe\b/i,
    ],
    hubPatterns: [/^gps-tracker$/i],
    manufacturerPatterns: [/tractive/i, /pawfit/i, /weenect/i, /tractive/i],
    targets: { pages: 6, comparisons: 3, products: 6, manufacturers: 2 },
    strategy:
      "Restlücken wie Ausland, Roaming und Funkgrenzen nur mit klarem Information Gain ergänzen.",
  },
  {
    id: "katzenklappen",
    label: "Katzenklappen",
    description:
      "Mikrochip-, App- und selektive Katzenklappen inklusive Einbau und Mehrkatzenhaushalt.",
    slugPatterns: [
      /(?:^|-)katzenklappe(?:n)?(?:-|$)/i,
      /microchip.*flap/i,
      /mikrochip.*klappe/i,
      /zeromouse/i,
    ],
    titlePatterns: [
      /\bkatzenklappe(?:n)?\b/i,
      /\bmikrochip[- ]klappe\b/i,
      /\bzero\s?mouse\b/i,
    ],
    descriptionPatterns: [
      /\bkatzenklappe\b/i,
      /\bmikrochip\b.*\bklappe\b/i,
    ],
    bodyPatterns: [
      /\bkatzenklappe\b/i,
      /\bselektiver zugang\b/i,
      /\beinbauadapter\b/i,
    ],
    excludePatterns: [
      /\bfutterautomat\b/i,
      /\btrinkbrunnen\b/i,
      /\bkatzentoilette\b/i,
      /\bgps[- ]tracker\b/i,
    ],
    hubPatterns: [/^katzenklappen?$/i, /^smarte-katzenklappen$/i],
    manufacturerPatterns: [/sureflap/i, /cat mate/i, /zeromouse/i],
    targets: { pages: 4, comparisons: 2, products: 4, manufacturers: 2 },
    strategy:
      "Hub, Mikrochip-/App-Vergleiche und differenzierte Praxisratgeber ausbauen.",
  },
  {
    id: "haustierkameras",
    label: "Haustierkameras",
    description:
      "Beobachtung, Kommunikation und Aktivitätskontrolle.",
    slugPatterns: [
      /haustierkamera/i,
      /tierkamera/i,
      /pet-camera/i,
      /kamera-fuer-hund/i,
      /kamera-fuer-katze/i,
    ],
    titlePatterns: [
      /\bhaustierkamera\b/i,
      /\btierkamera\b/i,
      /\bkamera für (?:hund|katze)\b/i,
    ],
    descriptionPatterns: [/\bhaustierkamera\b/i, /\btierbeobachtung\b/i],
    bodyPatterns: [/\bhaustierkamera\b/i, /\b2-wege-audio\b/i],
    excludePatterns: [
      /\bfutterautomat\b/i,
      /\btrinkbrunnen\b/i,
      /\bkatzentoilette\b/i,
      /\bkatzenklappe\b/i,
      /\bgps[- ]tracker\b/i,
    ],
    hubPatterns: [/^haustierkameras?$/i],
    manufacturerPatterns: [],
    targets: { pages: 3, comparisons: 1, products: 5, manufacturers: 2 },
    strategy:
      "Vor dem Ausbau Nachfrage, Produktbreite, Primärquellen und Affiliate-Abdeckung validieren.",
    expansion: true,
  },
  {
    id: "katzentoiletten",
    label: "Automatische Katzentoiletten",
    description:
      "Selbstreinigung, Hygiene, Sicherheit und laufende Kosten.",
    slugPatterns: [
      /(?:^|-)katzentoilette(?:n)?(?:-|$)/i,
      /(?:^|-)katzenklo(?:s)?(?:-|$)/i,
      /litter-robot/i,
      /selbstreinigende-katzentoilette/i,
    ],
    titlePatterns: [
      /\bautomatische katzentoilette(?:n)?\b/i,
      /\bselbstreinigende(?:s|r)? katzenklo\b/i,
      /\blitter[- ]robot\b/i,
    ],
    descriptionPatterns: [
      /\bautomatische katzentoilette\b/i,
      /\bselbstreinigendes katzenklo\b/i,
    ],
    bodyPatterns: [
      /\bautomatische katzentoilette\b/i,
      /\blitter[- ]robot\b/i,
      /\bselbstreinigendes katzenklo\b/i,
    ],
    excludePatterns: [
      /\bfutterautomat\b/i,
      /\btrinkbrunnen\b/i,
      /\bkatzenklappe\b/i,
      /\bgps[- ]tracker\b/i,
    ],
    hubPatterns: [/^automatische-katzentoiletten$/i],
    manufacturerPatterns: [/litter-robot/i],
    targets: { pages: 3, comparisons: 1, products: 5, manufacturers: 2 },
    strategy:
      "Nur nach Sicherheits-, Produkt- und Quellenprüfung als Expansion freigeben.",
    expansion: true,
  },
];

function walk(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolutePath);
    return /\.mdx?$/i.test(entry.name) ? [absolutePath] : [];
  });
}

function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const output: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^([A-Za-z][\w-]*):\s*(.+)$/);
    if (!item) continue;
    output[item[1]] = item[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return output;
}

function parseNestedFrontmatterValue(
  raw: string,
  section: string,
  key: string,
): string {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return "";

  const lines = match[1].split(/\r?\n/);
  let inSection = false;
  let sectionIndent = -1;

  for (const line of lines) {
    const sectionMatch = line.match(/^(\s*)([A-Za-z][\w-]*):\s*$/);

    if (sectionMatch) {
      const indent = sectionMatch[1].length;
      const name = sectionMatch[2];

      if (inSection && indent <= sectionIndent) {
        inSection = false;
      }

      if (name === section) {
        inSection = true;
        sectionIndent = indent;
        continue;
      }
    }

    if (!inSection) continue;

    const valuePattern =
      "^\\s{" +
      String(sectionIndent + 2) +
      ",}" +
      key +
      ":\\s*(.+)$";
    const valueMatch = line.match(new RegExp(valuePattern));

    if (valueMatch) {
      return valueMatch[1].trim().replace(/^['"]|['"]$/g, "");
    }

    const indent = line.length - line.trimStart().length;
    if (line.trim() && indent <= sectionIndent) {
      inSection = false;
    }
  }

  return "";
}

function normalizeRoute(value: string): string {
  const route = value.startsWith("/") ? value : `/${value}`;
  return route.endsWith("/") ? route : `${route}/`;
}

function extractLinks(raw: string): string[] {
  const output = new Set<string>();

  for (const match of raw.matchAll(/\]\((\/[^)\s#?]+)[^)]*\)/g)) {
    output.add(normalizeRoute(match[1]));
  }
  for (const match of raw.matchAll(/href=["'](\/[^"'#?]+)[^"']*["']/g)) {
    output.add(normalizeRoute(match[1]));
  }

  return [...output];
}

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\s*\r?\n[\s\S]*?\r?\n---/, "").trim();
}

function loadCollection(
  type: DocumentType,
  directory: string,
  prefix = "",
): DocumentRecord[] {
  return walk(directory).map((file) => {
    const raw = fs.readFileSync(file, "utf8");
    const data = parseFrontmatter(raw);
    const slug = path.basename(file).replace(/\.mdx?$/i, "");
    return {
      type,
      slug,
      title: String(data.title || data.name || slug.replace(/-/g, " ")),
      description: String(data.description || data.excerpt || ""),
      manufacturer: String(data.manufacturer || data.brand || ""),
      categoryKey:
        type === "product"
          ? parseNestedFrontmatterValue(raw, "category", "key")
          : "",
      body: stripFrontmatter(raw),
      route: normalizeRoute(`${prefix}${slug}`),
      filePath: path.relative(appRoot, file).split(path.sep).join("/"),
      links: extractLinks(raw),
    };
  });
}

const documents: DocumentRecord[] = [
  ...loadCollection("page", path.join(contentRoot, "pages")),
  ...loadCollection(
    "comparison",
    path.join(contentRoot, "comparisons"),
    "/vergleiche/",
  ),
  ...loadCollection("product", path.join(contentRoot, "products"), "/produkt/"),
  ...loadCollection(
    "manufacturer",
    path.join(contentRoot, "manufacturers"),
    "/hersteller/",
  ),
];

function matches(patterns: RegExp[], value: string): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function normalizeText(value: string): string {
  return value.toLocaleLowerCase("de-DE");
}

const PRODUCT_CATEGORY_CLUSTER_MAP: Record<string, string> = {
  futterautomaten: "futterautomaten",
  futterautomat: "futterautomaten",
  trinkbrunnen: "trinkbrunnen",
  "gps-tracker": "gps-tracker",
  gps: "gps-tracker",
  katzenklappen: "katzenklappen",
  katzenklappe: "katzenklappen",
  haustierkameras: "haustierkameras",
  haustierkamera: "haustierkameras",
  katzentoiletten: "katzentoiletten",
  "automatische-katzentoiletten": "katzentoiletten",
};

function productClusterFromCategory(document: DocumentRecord): string | null {
  const categoryKey = normalizeText(document.categoryKey).trim();
  if (!categoryKey) return null;
  return PRODUCT_CATEGORY_CLUSTER_MAP[categoryKey] ?? null;
}

export function belongsToCluster(
  document: DocumentRecord,
  definition: ClusterDefinition,
): boolean {
  const slug = normalizeText(document.slug);
  const title = normalizeText(document.title);
  const description = normalizeText(document.description);
  const body = normalizeText(document.body.slice(0, 12000));
  const manufacturer = normalizeText(document.manufacturer);

  const slugEvidence = matches(definition.slugPatterns, slug);
  const titleEvidence = matches(definition.titlePatterns, title);
  const descriptionEvidence = matches(
    definition.descriptionPatterns,
    description,
  );
  const bodyEvidence = matches(definition.bodyPatterns, body);
  const primaryEvidence = slugEvidence || titleEvidence || descriptionEvidence;
  const manufacturerEvidence =
    matches(definition.manufacturerPatterns ?? [], slug) ||
    matches(definition.manufacturerPatterns ?? [], title) ||
    matches(definition.manufacturerPatterns ?? [], manufacturer);

  const exclusionText = `${slug} ${title} ${description}`;
  const excluded =
    !primaryEvidence && matches(definition.excludePatterns, exclusionText);

  if (excluded) return false;

  if (document.type === "manufacturer") {
    // Herstellerseiten sind meist kategorienübergreifend. Eine beiläufige
    // Produktnennung im Body reicht daher ausdrücklich nicht aus.
    return manufacturerEvidence;
  }

  if (document.type === "product") {
    const categoryCluster = productClusterFromCategory(document);

    // Produkt-MDs werden ausschließlich über die strukturierte category.key
    // zugeordnet. Fehlende oder unbekannte Kategorien werden nicht geraten.
    return categoryCluster === definition.id;
  }

  if (primaryEvidence) return true;

  // Ratgeber und Vergleiche dürfen nur über den Body zugeordnet werden, wenn
  // mindestens zwei eigenständige Fachsignale vorkommen.
  const bodySignalCount = definition.bodyPatterns.filter((pattern) =>
    pattern.test(body),
  ).length;

  if (document.type === "page") {
    return bodyEvidence && bodySignalCount >= 1;
  }

  return bodyEvidence && bodySignalCount >= 2;
}

const clamp = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

const ratio = (actual: number, target: number): number =>
  Math.min(1, actual / Math.max(1, target));

export function calculateLinkCoverage(
  members: DocumentRecord[],
): number {
  if (members.length <= 1) return 0;
  const routes = new Set(members.map((member) => member.route));
  const linked = members.filter((member) =>
    member.links.some(
      (link) => routes.has(link) && link !== member.route,
    ),
  ).length;
  return clamp((linked / members.length) * 100);
}

function buildCluster(definition: ClusterDefinition): Cluster {
  const members = documents.filter((document) =>
    belongsToCluster(document, definition),
  );

  const counts = {
    pages: members.filter((item) => item.type === "page").length,
    comparisons: members.filter((item) => item.type === "comparison").length,
    products: members.filter((item) => item.type === "product").length,
    manufacturers: members.filter((item) => item.type === "manufacturer").length,
    total: members.length,
  };

  const hub = members.some(
    (item) =>
      item.type === "page" &&
      matches(definition.hubPatterns, item.slug),
  );
  const linkCoverage = calculateLinkCoverage(members);
  const journeyCompletion = evaluateClusterJourney(definition.id, members);
  const targets = definition.targets;

  const coverage = {
    hub,
    guides: counts.pages >= targets.pages,
    comparisons: counts.comparisons >= targets.comparisons,
    products: counts.products >= targets.products,
    manufacturers: counts.manufacturers >= targets.manufacturers,
    journey: false,
  };

  coverage.journey =
    hub &&
    coverage.comparisons &&
    coverage.products &&
    (journeyCompletion.applicable
      ? journeyCompletion.complete
      : linkCoverage >= 55);

  const score =
    members.length === 0
      ? 0
      : clamp(
          (hub ? 18 : 0) +
            ratio(counts.pages, targets.pages) * 18 +
            ratio(counts.comparisons, targets.comparisons) * 20 +
            ratio(counts.products, targets.products) * 18 +
            ratio(counts.manufacturers, targets.manufacturers) * 10 +
            linkCoverage * 0.16,
        );

  const status: ClusterStatus =
    score >= 78 ? "strong" : score >= 42 ? "developing" : "gap";

  const gaps = [
    !hub ? "Cornerstone-Hub fehlt" : "",
    !coverage.guides
      ? `Ratgeber ${counts.pages}/${targets.pages}`
      : "",
    !coverage.comparisons
      ? `Vergleiche ${counts.comparisons}/${targets.comparisons}`
      : "",
    !coverage.products
      ? `Produkte ${counts.products}/${targets.products}`
      : "",
    !coverage.manufacturers
      ? `Hersteller ${counts.manufacturers}/${targets.manufacturers}`
      : "",
    members.length > 1 &&
    linkCoverage < 55 &&
    !journeyCompletion.complete
      ? journeyCompletion.applicable
        ? `Kaufnahe Journey unvollständig: ${journeyCompletion.missingEdges.join(", ")}`
        : `Interne Linkabdeckung nur ${linkCoverage} %`
      : "",
  ].filter(Boolean);

  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    score,
    status,
    priority:
      definition.id === "katzenklappen" && score < 65
        ? "high"
        : status === "strong"
          ? "low"
          : definition.expansion
            ? "low"
            : "medium",
    counts,
    coverage,
    linkCoverage,
    journeyCompletion,
    gaps,
    nextAction: definition.strategy,
    documents: members
      .map((document) => ({
        type: document.type,
        title: document.title,
        route: document.route,
        filePath: document.filePath,
      }))
      .sort(
        (a, b) =>
          a.type.localeCompare(b.type) ||
          a.title.localeCompare(b.title, "de"),
      ),
  };
}

const clusters = CLUSTER_DEFINITIONS.map(buildCluster).sort(
  (a, b) => b.score - a.score,
);


function documentContainsMarker(route: string, marker: string): boolean {
  const document = documents.find((item) => item.route === route);
  return Boolean(document?.body.includes(marker));
}

function feederConsolidationResolved(): boolean {
  return (
    documentContainsMarker(
      "/smarte-futterautomaten/",
      "feeder-intent-owner: cluster-hub",
    ) &&
    documentContainsMarker(
      "/welcher-futterautomat-ist-der-richtige/",
      "feeder-intent-owner: compact-chooser",
    )
  );
}

function pushCoverageOpportunities(
  output: Opportunity[],
  cluster: Cluster,
): void {
  const missing = [
    !cluster.coverage.hub
      ? {
          suffix: "hub",
          title: `${cluster.label}: zentralen Hub klären`,
          impact: 82,
          reason: "Für den Cluster ist noch kein eindeutiger Cornerstone-Hub erkannt.",
          action:
            "Bestehende Inhalte auf Hub-Eignung prüfen und nur bei klarer Lücke einen zentralen Owner festlegen.",
        }
      : null,
    !cluster.coverage.guides
      ? {
          suffix: "guides",
          title: `${cluster.label}: Ratgeberabdeckung gezielt schließen`,
          impact: 72,
          reason: `Die fachliche Ratgeberabdeckung liegt bei ${cluster.counts.pages} Inhalten und unter dem definierten Mindestniveau.`,
          action:
            "Bestehende Ratgeber auf fehlende Nutzerfragen prüfen; nur belegte, eigenständige Intents ergänzen.",
        }
      : null,
    !cluster.coverage.comparisons
      ? {
          suffix: "comparisons",
          title: `${cluster.label}: kaufnahe Vergleiche prüfen`,
          impact: 78,
          reason: `Der Cluster besitzt erst ${cluster.counts.comparisons} eindeutig zugeordnete Vergleiche.`,
          action:
            "Prüfen, ob eine eigenständige kommerzielle Suchintention fehlt oder bestehende Vergleiche nur falsch zugeordnet sind.",
        }
      : null,
    !cluster.coverage.products
      ? {
          suffix: "products",
          title: `${cluster.label}: Produktabdeckung validieren`,
          impact: 68,
          reason: `Der Cluster enthält ${cluster.counts.products} eindeutig kategorisierte Produkte.`,
          action:
            "Produktbestand, Kategorisierung und tatsächliche Vergleichsrelevanz prüfen; keine Produkte nur zur Sollzahlerfüllung anlegen.",
        }
      : null,
    !cluster.coverage.manufacturers
      ? {
          suffix: "manufacturers",
          title: `${cluster.label}: Herstellerabdeckung prüfen`,
          impact: 60,
          reason: `Der Cluster enthält ${cluster.counts.manufacturers} fachlich zugeordnete Herstellerseiten.`,
          action:
            "Vorhandene Herstellerzuordnung prüfen und nur strategisch relevante Hersteller ergänzen.",
        }
      : null,
  ].filter(Boolean) as Array<{
    suffix: string;
    title: string;
    impact: number;
    reason: string;
    action: string;
  }>;

  for (const item of missing) {
    output.push({
      id: `coverage-${cluster.id}-${item.suffix}`,
      title: item.title,
      cluster: cluster.label,
      priority: cluster.priority === "high" ? "high" : "medium",
      impact: item.impact,
      effort: "mittel",
      reason: item.reason,
      action: item.action,
    });
  }
}

export function buildOpportunities(): Opportunity[] {
  const byId = Object.fromEntries(
    clusters.map((cluster) => [cluster.id, cluster]),
  ) as Record<string, Cluster>;
  const output: Opportunity[] = [];

  if (byId.katzenklappen.score < 65) {
    output.push({
      id: "katzenklappen-core",
      title: "Katzenklappen als nächsten Kerncluster aufbauen",
      cluster: "Katzenklappen",
      priority: "high",
      impact: 96,
      effort: "hoch",
      reason:
        "Die Kategorie passt zur Positionierung, ist aber schwächer als die etablierten Kerncluster.",
      action:
        "Cornerstone, Mikrochip-Vergleich, App-Vergleich und differenzierte Praxisratgeber planen.",
    });
  }

  if (
    !byId.trinkbrunnen.coverage.comparisons ||
    !byId.trinkbrunnen.journeyCompletion?.complete
  ) {
    output.push({
      id: "trinkbrunnen-commercial",
      title: "Trinkbrunnen um kaufnahe Intentionen ergänzen",
      cluster: "Trinkbrunnen",
      priority: "high",
      impact: 90,
      effort: "mittel",
      reason: journeyOpportunityReason(
        byId.trinkbrunnen.journeyCompletion,
        "Wissensabdeckung und Kaufentscheidung sind noch nicht gleich stark verbunden.",
      ),
      action:
        "Material-, Hygiene- und Filterintentionen mit passenden Vergleichen verbinden.",
    });
  }

  if (byId.futterautomaten.counts.total >= 20 && !feederConsolidationResolved()) {
    output.push({
      id: "futterautomaten-consolidate",
      title: "Futterautomaten konsolidieren statt weiter verbreitern",
      cluster: "Futterautomaten",
      priority: "high",
      impact: 91,
      effort: "mittel",
      reason:
        "Der breite Cluster erhöht ohne Intent-Steuerung das Risiko von Überschneidungen.",
      action:
        "Intent-Matrix erstellen, Zielseiten schärfen und Journey-Verlinkung ausbauen.",
    });
  }

  for (const cluster of clusters.filter(
    (item) =>
      item.documents.length > 2 &&
      item.linkCoverage < 55 &&
      !item.journeyCompletion?.complete,
  )) {
    output.push({
      id: `link-${cluster.id}`,
      title: `Interne Journey für ${cluster.label} schließen`,
      cluster: cluster.label,
      priority: cluster.priority === "high" ? "high" : "medium",
      impact: Math.max(60, 85 - cluster.linkCoverage),
      effort: "mittel",
      reason: `Nur ${cluster.linkCoverage} % der erkannten Inhalte verlinken im eigenen Cluster.`,
      action:
        "Hub, Ratgeber, Vergleiche, Produkte und Hersteller entscheidungsorientiert verbinden.",
    });
  }

  for (const cluster of clusters) {
    pushCoverageOpportunities(output, cluster);
  }


  for (const definition of CLUSTER_DEFINITIONS.filter(
    (item) => item.expansion,
  )) {
    const cluster = byId[definition.id];
    if (cluster.counts.total === 0) {
      output.push({
        id: `validate-${definition.id}`,
        title: `${definition.label} als Expansion validieren`,
        cluster: definition.label,
        priority: "low",
        impact: definition.id === "haustierkameras" ? 70 : 62,
        effort: "hoch",
        reason:
          "Für diesen Cluster gibt es derzeit keine ausreichend eindeutigen Projektinhalte.",
        action:
          "Markt, Produktbreite, Primärquellen, Sicherheit und kommerzielle Eignung prüfen; danach Go/No-Go dokumentieren.",
      });
    }
  }

  const priorityWeight: Record<Priority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const deduplicated = [
    ...new Map(output.map((opportunity) => [opportunity.id, opportunity])).values(),
  ];

  return deduplicated.sort(
    (a, b) =>
      priorityWeight[b.priority] - priorityWeight[a.priority] ||
      b.impact - a.impact ||
      a.title.localeCompare(b.title, "de"),
  );
}

export function detectOrphans() {
  const inbound = new Map(
    documents.map((document) => [document.route, 0]),
  );

  for (const document of documents) {
    for (const link of document.links) {
      if (inbound.has(link) && link !== document.route) {
        inbound.set(link, (inbound.get(link) ?? 0) + 1);
      }
    }
  }

  return documents
    .filter(
      (document) =>
        (inbound.get(document.route) ?? 0) === 0 &&
        document.type !== "manufacturer",
    )
    .slice(0, 50)
    .map((document) => ({
      type: document.type,
      title: document.title,
      route: document.route,
      filePath: document.filePath,
    }));
}

export function loadTopicalAuthority(): TopicalAuthorityData {
  const opportunities = buildOpportunities();
  const orphans = detectOrphans();
  const establishedClusters = clusters.filter(
    (cluster) =>
      cluster.counts.total > 0 ||
      !CLUSTER_DEFINITIONS.find(
        (definition) => definition.id === cluster.id,
      )?.expansion,
  );

  const authorityScore = clamp(
    establishedClusters.reduce(
      (sum, cluster) => sum + cluster.score,
      0,
    ) / Math.max(1, establishedClusters.length),
  );

  const inventory = {
    page: documents.filter((document) => document.type === "page").length,
    comparison: documents.filter(
      (document) => document.type === "comparison",
    ).length,
    product: documents.filter(
      (document) => document.type === "product",
    ).length,
    manufacturer: documents.filter(
      (document) => document.type === "manufacturer",
    ).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    authorityScore,
    summary: {
      documents: documents.length,
      clusters: clusters.length,
      strong: clusters.filter((cluster) => cluster.status === "strong").length,
      developing: clusters.filter(
        (cluster) => cluster.status === "developing",
      ).length,
      gaps: clusters.filter((cluster) => cluster.status === "gap").length,
      opportunities: opportunities.length,
      orphanCandidates: orphans.length,
    },
    inventory: {
      ...inventory,
      pages: inventory.page,
      comparisons: inventory.comparison,
      products: inventory.product,
      manufacturers: inventory.manufacturer,
    },
    clusters,
    opportunities,
    orphanCandidates: orphans,
    orphans,
  };
}
