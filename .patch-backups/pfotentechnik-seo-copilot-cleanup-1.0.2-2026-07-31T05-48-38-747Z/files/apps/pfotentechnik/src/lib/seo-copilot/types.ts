export type Confidence = "low" | "medium" | "high";
export type CommercialPotential = "low" | "medium" | "high";
export type ProductCandidateStatus =
  | "discovered"
  | "validating"
  | "awaiting-review"
  | "blocked"
  | "approved"
  | "drafted"
  | "created"
  | "ignored";

export type CopilotJobStatus =
  | "pending"
  | "running"
  | "awaiting-review"
  | "blocked"
  | "completed"
  | "failed"
  | "cancelled";

export type SourceType =
  | "manufacturer"
  | "manual"
  | "datasheet"
  | "press-release"
  | "app-store"
  | "established-retailer"
  | "independent-test"
  | "community"
  | "unknown";

export type MarketSignalType =
  | "verified-review-count"
  | "bestseller-rank"
  | "retailer-coverage"
  | "search-interest"
  | "visibility"
  | "independent-mentions"
  | "manufacturer-units"
  | "app-downloads"
  | "market-coverage";

export interface SourceEvidence {
  url: string;
  domain: string;
  sourceType: SourceType;
  title: string;
  observedAt: string;
  supports: string[];
  confidence: number;
}

export interface MarketSignal {
  type: MarketSignalType;
  value: string | number;
  unit?: string;
  source: SourceEvidence;
  observedAt: string;
  confidence: number;
  limitation: string;
}

export interface ExistingCoverage {
  productSlug?: string;
  manufacturerSlug?: string;
  mentionedIn: string[];
  comparisons: string[];
  guides: string[];
  images: string[];
  relationship:
    | "identical"
    | "alias"
    | "variant"
    | "successor"
    | "separate"
    | "uncertain"
    | "new";
  rationale: string;
}

export interface ProductCandidate {
  id: string;
  name: string;
  brand: string;
  manufacturer: string;
  aliases: string[];
  modelNumbers: string[];
  category: string;
  subcategory?: string;
  targetAnimals: Array<"dog" | "cat" | "other">;
  targetSizes: Array<"small" | "medium" | "large" | "unknown">;
  productUrl?: string;
  manufacturerUrl?: string;
  discoveredAt: string;
  validatedAt?: string;
  validationScore: number;
  contentGapScore: number;
  nicheFitScore?: number;
  commercialPotential: CommercialPotential;
  commercialRationale: string;
  confidence: Confidence;
  marketSignals: MarketSignal[];
  sources: SourceEvidence[];
  existingCoverage: ExistingCoverage;
  missingData: string[];
  risks: string[];
  status: ProductCandidateStatus;
}

export interface ProductPreflightResult {
  passed: boolean;
  blockers: string[];
  warnings: string[];
  existingProduct?: string;
  possibleDuplicates: Array<{
    slug: string;
    relationship: ExistingCoverage["relationship"];
    confidence: number;
    rationale: string;
  }>;
  requiredFields: string[];
  missingFields: string[];
  schemaVersion: string;
  schemaPath: string;
  targetPaths: string[];
  recommendedComparisons: string[];
  checkedAt: string;
}

export interface ProductDraft {
  id: string;
  candidateId: string;
  productData: Record<string, unknown>;
  content: string;
  frontmatter: Record<string, unknown>;
  sources: SourceEvidence[];
  imagePrompts: Array<{ role: string; target: string; prompt: string }>;
  proposedFiles: string[];
  missingData: string[];
  warnings: string[];
  preflight: ProductPreflightResult;
  status: "awaiting-review" | "blocked" | "approved" | "created";
  generatedAt: string;
  approvedAt?: string;
}

export interface PromptContext {
  kind:
    | "product-health"
    | "content-gap"
    | "product-discovery"
    | "niche-opportunity"
    | "product-research"
    | "product-creation"
    | "manufacturer"
    | "comparison"
    | "internal-link"
    | "content-health";
  projectPath: "apps/pfotentechnik";
  affectedFile?: string;
  slug?: string;
  title: string;
  manufacturer?: string;
  category?: string;
  problems: string[];
  existingData: string[];
  missingData: string[];
  comparisons: string[];
  guides: string[];
  imageRequirements: string[];
  schemaPath?: string;
  sources: SourceEvidence[];
  validationCommands: string[];
  acceptanceCriteria: string[];
}

export interface PromptResult {
  type: "chatgpt" | "codex";
  title: string;
  prompt: string;
  context: PromptContext;
  generatedAt: string;
}

export interface ContentGap {
  id: string;
  type:
    | "missing-product"
    | "missing-manufacturer"
    | "missing-product-page"
    | "missing-comparison"
    | "outdated-product"
    | "successor"
    | "missing-feature"
    | "missing-audience"
    | "missing-price-tier"
    | "missing-special-use";
  title: string;
  description: string;
  rationale: string;
  sources: SourceEvidence[];
  expectedPageType: "product" | "manufacturer" | "comparison" | "guide";
  userNeed: string;
  commercialPotential: CommercialPotential;
  editorialEffort: "low" | "medium" | "high";
  competition: "low" | "medium" | "high" | "unknown";
  confidence: Confidence;
  score: number;
  recommendedAction: string;
}

export interface NicheOpportunity {
  id: string;
  title: string;
  rationale: string;
  targetAudienceOverlap: number;
  internalLinkability: number;
  productAvailability: number;
  searchPotential: number;
  commercialPotential: number;
  editorialCredibility: number;
  score: number;
  confidence: Confidence;
  risks: string[];
  sources: SourceEvidence[];
  status: "candidate" | "awaiting-review" | "validated" | "rejected";
}

export interface CopilotJob {
  id: string;
  action: string;
  status: CopilotJobStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  progress: number;
  currentStep: string;
  result?: unknown;
  error?: { code: string; message: string };
  generatedFiles: string[];
  changedFiles: string[];
  warnings: string[];
  sources: SourceEvidence[];
  approval: {
    required: boolean;
    granted: boolean;
    grantedAt?: string;
  };
}

export interface CopilotAuditEntry {
  id: string;
  occurredAt: string;
  action: string;
  entity?: string;
  statusBefore?: string;
  statusAfter: string;
  sources: Array<Pick<SourceEvidence, "url" | "sourceType" | "observedAt">>;
  generatedFiles: string[];
  changedFiles: string[];
  warnings: string[];
  error?: { code: string; message: string };
  buildResult?: "not-run" | "passed" | "failed";
  userApproval: boolean;
}
