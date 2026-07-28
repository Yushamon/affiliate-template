export type InternalLinkGroup =
  | "hub"
  | "knowledge"
  | "decision"
  | "manufacturer"
  | "product"
  | string;

export interface InternalLinkRule {
  sourceGroup?: InternalLinkGroup;
  targetGroup: InternalLinkGroup;

  /**
   * Höhere Werte haben Vorrang.
   */
  weight: number;

  /**
   * Maximale Anzahl Links
   * dieser Zielgruppe pro Seite.
   */
  maxLinks?: number;

  /**
   * Darf auf sich selbst verlinken?
   */
  allowSelfLink?: boolean;
}

export interface InternalLinkRuleContext {
  sourcePath?: string;
  sourceGroup?: InternalLinkGroup;

  targetPath: string;
  targetGroup?: InternalLinkGroup;
}

export const internalLinkRules: InternalLinkRule[] = [
  // Knowledge

  {
    sourceGroup: "knowledge",
    targetGroup: "hub",
    weight: 100,
    maxLinks: 1
  },

  {
    sourceGroup: "knowledge",
    targetGroup: "decision",
    weight: 90,
    maxLinks: 3
  },

  {
    sourceGroup: "knowledge",
    targetGroup: "manufacturer",
    weight: 80,
    maxLinks: 2
  },

  {
    sourceGroup: "knowledge",
    targetGroup: "product",
    weight: 70,
    maxLinks: 3
  },

  // Decision

  {
    sourceGroup: "decision",
    targetGroup: "hub",
    weight: 100,
    maxLinks: 1
  },

  {
    sourceGroup: "decision",
    targetGroup: "manufacturer",
    weight: 90,
    maxLinks: 2
  },

  {
    sourceGroup: "decision",
    targetGroup: "product",
    weight: 80,
    maxLinks: 4
  },

  {
    sourceGroup: "decision",
    targetGroup: "knowledge",
    weight: 70,
    maxLinks: 2
  },

  // Manufacturer

  {
    sourceGroup: "manufacturer",
    targetGroup: "product",
    weight: 100,
    maxLinks: 6
  },

  {
    sourceGroup: "manufacturer",
    targetGroup: "decision",
    weight: 80,
    maxLinks: 2
  },

  {
    sourceGroup: "manufacturer",
    targetGroup: "knowledge",
    weight: 60,
    maxLinks: 2
  },

  // Product

  {
    sourceGroup: "product",
    targetGroup: "manufacturer",
    weight: 100,
    maxLinks: 1
  },

  {
    sourceGroup: "product",
    targetGroup: "decision",
    weight: 90,
    maxLinks: 3
  },

  {
    sourceGroup: "product",
    targetGroup: "knowledge",
    weight: 80,
    maxLinks: 2
  },

  // Fallback

  {
    targetGroup: "hub",
    weight: 50,
    maxLinks: 1
  },

  {
    targetGroup: "decision",
    weight: 40,
    maxLinks: 3
  },

  {
    targetGroup: "manufacturer",
    weight: 30,
    maxLinks: 2
  },

  {
    targetGroup: "product",
    weight: 20,
    maxLinks: 3
  },

  {
    targetGroup: "knowledge",
    weight: 10,
    maxLinks: 2
  }
];

const normalizePath = (path?: string) => {
  if (!path) {
    return "";
  }

  const normalized = path
    .split("#")[0]
    .split("?")[0];

  return normalized.endsWith("/")
    ? normalized
    : `${normalized}/`;
};

export const isSelfLink = (
  sourcePath: string | undefined,
  targetPath: string
) => {
  if (!sourcePath) {
    return false;
  }

  return (
    normalizePath(sourcePath) ===
    normalizePath(targetPath)
  );
};

export const getInternalLinkRule = (
  context: InternalLinkRuleContext
) => {
  const exactRule = internalLinkRules.find(
    (rule) =>
      rule.sourceGroup === context.sourceGroup &&
      rule.targetGroup === context.targetGroup
  );

  if (exactRule) {
    return exactRule;
  }

  return internalLinkRules.find(
    (rule) =>
      !rule.sourceGroup &&
      rule.targetGroup === context.targetGroup
  );
};

export const getInternalLinkRuleWeight = (
  context: InternalLinkRuleContext
) => {
  if (
    isSelfLink(
      context.sourcePath,
      context.targetPath
    )
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  return getInternalLinkRule(context)?.weight ?? 0;
};

export const getInternalLinkGroupLimit = (
  context: InternalLinkRuleContext
) =>
  getInternalLinkRule(context)?.maxLinks;