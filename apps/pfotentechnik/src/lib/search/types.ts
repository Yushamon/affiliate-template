export type SearchProviderId = "google" | "bing";
export type SearchProviderHealth = "connected" | "needs-auth" | "not-configured" | "degraded" | "unavailable";
export type SearchActionName = "google.setup" | "google.test" | "google.sync" | "google.report" | "bing.test" | "bing.sync" | "bing.report" | "search.test" | "search.sync" | "search.report" | "advisor.rebuild" | "seo.audit" | "contentGraph.build" | "copilot.prompt" | "copilot.task.complete" | "product.draft.create" | "product.images.prompts" | "product.images.pack";
export type SearchActionStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface SearchMetricValues {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export type SearchMetricChange = SearchMetricValues;
export interface SearchPageRow extends SearchMetricValues { page: string; }
export interface SearchQueryRow extends SearchMetricValues { query: string; }
export interface SearchTrendRow extends SearchMetricValues { date: string; }

export interface SearchRecommendation {
  priority: "high" | "medium" | "low";
  type: string;
  title: string;
  page: string;
  query?: string;
  reason: string;
  action: string;
}

export interface SearchRange {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  comparisonStartDate: string;
  comparisonEndDate: string;
  dataState: string;
  partial: boolean;
  lowData: boolean;
  metrics: { current: SearchMetricValues; previous: SearchMetricValues; change: SearchMetricChange };
  pages: SearchPageRow[];
  queries: SearchQueryRow[];
  trend: SearchTrendRow[];
  recommendations: SearchRecommendation[];
}

export interface SearchDashboardPayload {
  schemaVersion: number;
  generatedAt: string;
  property: string;
  provider: SearchProviderId | "combined";
  defaultRange: string;
  ranges: Record<string, SearchRange>;
}

export interface SearchProviderError {
  code: string;
  message: string;
  nextAction: string;
  retryable: boolean;
}

export interface SearchProviderConfig {
  provider: SearchProviderId;
  property?: string;
  configuredAt?: string;
}

export interface SearchProviderStatus {
  provider: SearchProviderId;
  label: string;
  health: SearchProviderHealth;
  connected: boolean;
  configured: boolean;
  property: string | null;
  lastAttemptAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastTestAt: string | null;
  lastReportAt: string | null;
  lastDurationMs: number | null;
  lastError: SearchProviderError | null;
  pagesCount: number;
  queriesCount: number;
}

export interface SetupOptions { force?: boolean; clientFile?: string; }
export interface SyncOptions { ranges?: string[]; }
export interface ReportOptions { range?: string; }
export interface SetupResult { connected: boolean; property: string; message: string; }
export interface TestResult { ok: boolean; property: string; tokenRefresh: boolean; dataAccess: boolean; message: string; }
export interface SyncResult { ok: boolean; generatedAt: string; property: string; ranges: string[]; pagesCount: number; queriesCount: number; durationMs: number; }
export interface ReportResult { ok: boolean; markdownFile: string; jsonFile: string; generatedAt: string; }

export interface SearchProvider {
  id: SearchProviderId;
  label: string;
  getStatus(): Promise<SearchProviderStatus>;
  setup(options?: SetupOptions): Promise<SetupResult>;
  test(): Promise<TestResult>;
  sync(options?: SyncOptions): Promise<SyncResult>;
  report(options?: ReportOptions): Promise<ReportResult>;
}

export interface SearchActionProgress {
  step: string;
  current?: number;
  total?: number;
  message: string;
}

export interface SearchActionResult {
  id: string;
  action: SearchActionName;
  status: SearchActionStatus;
  progress: SearchActionProgress | null;
  queuedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  result: unknown;
  error: SearchProviderError | null;
}
