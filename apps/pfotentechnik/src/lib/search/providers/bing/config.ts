export interface BingSearchConfig {
  apiKey: string;
  siteUrl: string;
}

export interface BingFreshness {
  status: "current" | "stale" | "unknown";
  ageDays: number | null;
  note: string;
}
