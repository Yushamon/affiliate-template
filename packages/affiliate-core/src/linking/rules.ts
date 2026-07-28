import type { InternalLinkGroup } from "./types.ts";

export interface InternalLinkRule {
  sourceGroup?: InternalLinkGroup;
  targetGroup: InternalLinkGroup;
  weight: number;
  maxLinks: number;
  allowSelfLink?: boolean;
}

export interface InternalLinkRuleContext {
  sourcePath?: string;
  sourceGroup?: InternalLinkGroup;
  targetPath: string;
  targetGroup?: InternalLinkGroup;
}

/**
 * Ein einziges Funnel-Regelwerk für Inline-Links, Related Content,
 * Next Steps und Audits. Höhere Werte werden bevorzugt.
 */
export const internalLinkRules: InternalLinkRule[] = [
  { sourceGroup: "knowledge", targetGroup: "hub", weight: 100, maxLinks: 2 },
  { sourceGroup: "knowledge", targetGroup: "comparison", weight: 90, maxLinks: 2 },
  { sourceGroup: "knowledge", targetGroup: "knowledge", weight: 65, maxLinks: 3 },
  { sourceGroup: "knowledge", targetGroup: "product", weight: 45, maxLinks: 2 },
  { sourceGroup: "knowledge", targetGroup: "manufacturer", weight: 25, maxLinks: 1 },

  { sourceGroup: "hub", targetGroup: "comparison", weight: 100, maxLinks: 3 },
  { sourceGroup: "hub", targetGroup: "knowledge", weight: 85, maxLinks: 3 },
  { sourceGroup: "hub", targetGroup: "product", weight: 60, maxLinks: 2 },
  { sourceGroup: "hub", targetGroup: "manufacturer", weight: 35, maxLinks: 1 },
  { sourceGroup: "hub", targetGroup: "hub", weight: 10, maxLinks: 1 },

  { sourceGroup: "comparison", targetGroup: "product", weight: 100, maxLinks: 4 },
  { sourceGroup: "comparison", targetGroup: "manufacturer", weight: 70, maxLinks: 2 },
  { sourceGroup: "comparison", targetGroup: "knowledge", weight: 65, maxLinks: 2 },
  { sourceGroup: "comparison", targetGroup: "hub", weight: 55, maxLinks: 1 },
  { sourceGroup: "comparison", targetGroup: "comparison", weight: 0, maxLinks: 0 },

  { sourceGroup: "product", targetGroup: "manufacturer", weight: 100, maxLinks: 1 },
  { sourceGroup: "product", targetGroup: "comparison", weight: 90, maxLinks: 2 },
  { sourceGroup: "product", targetGroup: "knowledge", weight: 75, maxLinks: 2 },
  { sourceGroup: "product", targetGroup: "hub", weight: 55, maxLinks: 1 },
  { sourceGroup: "product", targetGroup: "product", weight: 0, maxLinks: 0 },

  { sourceGroup: "manufacturer", targetGroup: "product", weight: 100, maxLinks: 5 },
  { sourceGroup: "manufacturer", targetGroup: "comparison", weight: 80, maxLinks: 2 },
  { sourceGroup: "manufacturer", targetGroup: "knowledge", weight: 55, maxLinks: 2 },
  { sourceGroup: "manufacturer", targetGroup: "hub", weight: 40, maxLinks: 1 },
  { sourceGroup: "manufacturer", targetGroup: "manufacturer", weight: 0, maxLinks: 0 },

  { targetGroup: "hub", weight: 50, maxLinks: 1 },
  { targetGroup: "comparison", weight: 45, maxLinks: 2 },
  { targetGroup: "knowledge", weight: 35, maxLinks: 3 },
  { targetGroup: "product", weight: 25, maxLinks: 3 },
  { targetGroup: "manufacturer", weight: 20, maxLinks: 1 }
];

const normalizePath = (value?: string) => {
  if (!value) return "";
  const path = value.split("#")[0].split("?")[0];
  const leading = path.startsWith("/") ? path : `/${path}`;
  return leading.endsWith("/") ? leading : `${leading}/`;
};

export const isSelfLink = (sourcePath: string | undefined, targetPath: string) =>
  Boolean(sourcePath) && normalizePath(sourcePath) === normalizePath(targetPath);

export const getInternalLinkRule = (context: InternalLinkRuleContext) =>
  internalLinkRules.find(
    (rule) =>
      rule.sourceGroup === context.sourceGroup &&
      rule.targetGroup === context.targetGroup
  ) ??
  internalLinkRules.find(
    (rule) => !rule.sourceGroup && rule.targetGroup === context.targetGroup
  );

export const getInternalLinkRuleWeight = (context: InternalLinkRuleContext) => {
  if (isSelfLink(context.sourcePath, context.targetPath)) {
    return Number.NEGATIVE_INFINITY;
  }
  return getInternalLinkRule(context)?.weight ?? 0;
};

export const getInternalLinkGroupLimit = (context: InternalLinkRuleContext) =>
  getInternalLinkRule(context)?.maxLinks ?? 0;

export const getDefaultPageLinkBudget = (
  sourceGroup?: InternalLinkGroup,
  requested?: number
) => {
  const defaults: Record<InternalLinkGroup, number> = {
    hub: 8,
    knowledge: 7,
    comparison: 6,
    product: 5,
    manufacturer: 6
  };
  const fallback = sourceGroup ? defaults[sourceGroup] : 7;
  return Math.min(requested ?? fallback, fallback);
};
