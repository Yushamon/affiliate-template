import type {
  SeoDashboardPayload,
  SeoMetricValues,
  SeoRange,
} from "../loadDashboard";

export type AdvisorCategory =
  | "ranking"
  | "ctr"
  | "content-gap"
  | "cannibalization"
  | "internal-link"
  | "eeat"
  | "technical";

export type AdvisorPriority = "high" | "medium" | "low";
export type AdvisorEffort = "niedrig" | "mittel" | "hoch";
export type AdvisorEffect = "niedrig" | "mittel" | "hoch";
export type AdvisorTaskStatus = "offen" | "geplant" | "in-arbeit" | "erledigt" | "verworfen";

export type ContentDocument = {
  id: string;
  collection: "pages" | "products" | "manufacturers" | "comparisons";
  route: string;
  slug: string;
  title: string;
  description: string;
  filePath: string;
  pageType: string;
  cluster: string;
  topics: string[];
  body: string;
  authorPresent: boolean;
  authorVisible: boolean;
  publishedAt: string;
  updatedAt: string;
  hasEditorialReview: boolean;
  hasMethodology: boolean;
  hasProductDataSource: boolean;
};

export type ContentGraphNode = {
  id: string;
  slug: string;
  route: string;
  title: string;
  description?: string;
  type: string;
  cluster?: string;
  topics?: string[];
  priority?: number;
  cornerstone?: boolean;
};

export type ContentGraphEdge = {
  source: string;
  target: string;
  type: string;
  score: number;
  explicit?: boolean;
};

export type ContentGraphData = {
  version: number;
  generatedAt: string;
  nodes: ContentGraphNode[];
  edges: ContentGraphEdge[];
};

export type AdvisorDataBasis = {
  impressions?: number;
  clicks?: number;
  ctr?: number;
  position?: number;
  metrics?: SeoMetricValues;
  note?: string;
};

export type AdvisorOpportunity = {
  id: string;
  title: string;
  description: string;
  category: AdvisorCategory;
  priority: AdvisorPriority;
  impact: number;
  effortValue: number;
  effort: AdvisorEffort;
  confidence: number;
  score: number;
  estimatedMinutes: number;
  forecast: AdvisorForecast;
  url?: string;
  query?: string;
  rationale: string;
  nextAction: string;
  source: string;
  rangeKey: string;
  lowData: boolean;
  expectedBenefit: AdvisorEffect;
  steps: string[];
  pageType: string;
  affectedFile?: string;
  dataBasis: AdvisorDataBasis;
  prompt: string;
  codexPrompt?: string;
};

export type AdvisorForecast = {
  ctrPotential: number;
  positionPotential: number;
  clickPotential: number;
  trafficPotential: number;
  confidence: number;
  assumptions: string[];
  dataBasis: string;
};

export type GraphGapFinding = {
  id: string;
  kind: "fehlender-cluster" | "fehlender-cornerstone" | "verwaiste-seite" | "schwache-verlinkung";
  route?: string;
  cluster?: string;
  evidence: string;
  recommendation: string;
  priority: AdvisorPriority;
};

export type EditorialCalendarItem = {
  id: string;
  route: string;
  title: string;
  reason: string;
  due: "überfällig" | "diesen-monat" | "beobachten";
  ageDays?: number;
  priority: AdvisorPriority;
};

export type ConversionInsight = {
  id: string;
  route: string;
  impressions: number;
  clicks: number;
  missingSignals: string[];
  evidence: string;
  recommendation: string;
  confidence: number;
};

export type EeatFinding = {
  id: string;
  route: string;
  filePath: string;
  title: string;
  score: number;
  missingSignals: string[];
  recommendation: string;
  priority: AdvisorPriority;
  evidence: string[];
};

export type ContentGapFinding = {
  id: string;
  query: string;
  impressions: number;
  position: number;
  matchedRoute?: string;
  matchStrength: "keine" | "schwach" | "passend";
  kind: "fehlende-zielseite" | "intent-mismatch" | "abschnitt-ausbauen" | "beobachten";
  rationale: string;
  recommendation: string;
  lowData: boolean;
};

export type CannibalizationFinding = {
  id: string;
  routes: string[];
  intent: string;
  evidence: string;
  risk: "niedrig" | "mittel" | "hoch";
  kind: "technische-url-dublette" | "inhaltliche-ueberschneidung" | "sinnvolle-hierarchie" | "geringe-datenbasis";
  recommendation: string;
};

export type LinkRecommendation = {
  id: string;
  sourceRoute: string;
  sourceFile: string;
  targetRoute: string;
  anchorText: string;
  context: string;
  rationale: string;
  priority: AdvisorPriority;
};

export type AdvisorHistory = {
  hasComparison: boolean;
  message: string;
  snapshots: Array<{ generatedAt: string; rangeKey: string; metrics: SeoMetricValues }>;
};

export type SeoAdvisorInput = {
  payload: SeoDashboardPayload;
  range: SeoRange;
  documents: ContentDocument[];
  graph: ContentGraphData;
};

export type SeoAdvisorResult = {
  range: SeoRange;
  dataConfidence: "gering" | "mittel" | "hoch";
  dataNotice: string;
  opportunities: AdvisorOpportunity[];
  topTasks: AdvisorOpportunity[];
  quickWins: AdvisorOpportunity[];
  trafficWin?: AdvisorOpportunity;
  eeat: EeatFinding[];
  contentGaps: ContentGapFinding[];
  cannibalization: CannibalizationFinding[];
  linkRecommendations: LinkRecommendation[];
  graphGaps: GraphGapFinding[];
  editorialCalendar: EditorialCalendarItem[];
  conversionInsights: ConversionInsight[];
  history: AdvisorHistory;
};
