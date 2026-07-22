import type { AdvisorEffect, AdvisorEffort, AdvisorPriority } from "./types";

export type PriorityScoreInput = {
  impact: number;
  confidence: number;
  effort: number;
  visibilityFactor?: number;
  strategicFactor?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const calculatePriorityScore = ({
  impact,
  confidence,
  effort,
  visibilityFactor = 1,
  strategicFactor = 1,
}: PriorityScoreInput): number => {
  const base = (clamp(impact, 1, 5) * clamp(confidence, 0, 1)) / clamp(effort, 1, 5);
  return Math.round(clamp(base * 20 * clamp(visibilityFactor, 0.8, 1.2) * clamp(strategicFactor, 0.9, 1.15), 0, 100));
};

export const priorityFromScore = (score: number): AdvisorPriority =>
  score >= 70 ? "high" : score >= 45 ? "medium" : "low";

export const effortLabel = (effort: number): AdvisorEffort =>
  effort <= 2 ? "niedrig" : effort <= 3.5 ? "mittel" : "hoch";

export const effectFromScore = (score: number): AdvisorEffect =>
  score >= 70 ? "hoch" : score >= 45 ? "mittel" : "niedrig";
