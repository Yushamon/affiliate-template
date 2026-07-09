export interface DecisionRule {
  requiredUseCases?: string[];
  excludedUseCases?: string[];
  weights: Record<string, number>;
  limit?: number;
}

export interface DecisionProduct {
  key: string;
  name?: string;
  useCases?: string[];
  ratings?: Record<string, number>;
  rating?: number;
}

export interface ScoredDecisionProduct<TProduct extends DecisionProduct> {
  key: string;
  product: TProduct;
  score: number;
}

const normalizeScore = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
};

const getRatingValue = (
  product: DecisionProduct,
  criterion: string
) => {
  const ratings = product.ratings ?? {};

  const directValue = ratings[criterion];

  if (typeof directValue === "number") {
    return directValue <= 5
      ? directValue * 20
      : directValue;
  }

  return typeof product.rating === "number"
    ? product.rating * 20
    : 0;
};

const matchesRequiredUseCases = (
  product: DecisionProduct,
  requiredUseCases?: string[]
) => {
  if (!requiredUseCases || requiredUseCases.length === 0) {
    return true;
  }

  const productUseCases = product.useCases ?? [];

  return requiredUseCases.some((useCase) =>
    productUseCases.includes(useCase)
  );
};

const matchesExcludedUseCases = (
  product: DecisionProduct,
  excludedUseCases?: string[]
) => {
  if (!excludedUseCases || excludedUseCases.length === 0) {
    return true;
  }

  const productUseCases = product.useCases ?? [];

  return !excludedUseCases.some((useCase) =>
    productUseCases.includes(useCase)
  );
};

export const getDecisionScore = (
  product: DecisionProduct,
  rule: DecisionRule
) => {
  if (!matchesRequiredUseCases(product, rule.requiredUseCases)) {
    return 0;
  }

  if (!matchesExcludedUseCases(product, rule.excludedUseCases)) {
    return 0;
  }

  const entries = Object.entries(rule.weights);

  if (entries.length === 0) {
    return normalizeScore(
      typeof product.rating === "number"
        ? product.rating * 20
        : 0
    );
  }

  const totalWeight = entries.reduce(
    (sum, [, weight]) => sum + Math.max(0, weight),
    0
  );

  if (totalWeight <= 0) {
    return 0;
  }

  const weightedScore = entries.reduce((sum, [criterion, weight]) => {
    const ratingValue = getRatingValue(product, criterion);

    return sum + ratingValue * Math.max(0, weight);
  }, 0);

  return Math.round(normalizeScore(weightedScore / totalWeight));
};

export const getDecisionProducts = <
  TProduct extends DecisionProduct
>(
  products: Record<string, TProduct>,
  rule: DecisionRule
): Array<ScoredDecisionProduct<TProduct>> => {
  return Object.entries(products)
    .map(([key, product]) => ({
      key,
      product,
      score: getDecisionScore(
        {
          ...product,
          key
        },
        rule
      )
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, rule.limit ?? 3);
};