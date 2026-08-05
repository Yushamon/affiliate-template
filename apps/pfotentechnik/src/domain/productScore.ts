export type ProductScoreSource = "score" | "criteria" | "rating" | "unrated";

export type ProductScoreResult = {
  score: number | null;
  rating: number | null;
  criteriaCount: number;
  source: ProductScoreSource;
};

type ProductScoreInput = {
  score?: unknown;
  rating?: unknown;
  ratings?: Record<string, unknown> | null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const positiveNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const criterionValues = (ratings: ProductScoreInput["ratings"]): number[] =>
  Object.values(ratings ?? {})
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 5);

export const calculateProductScore = (input: ProductScoreInput): ProductScoreResult => {
  const explicitScore = positiveNumber(input.score);
  if (explicitScore !== null) {
    const score = Math.round(clamp(explicitScore <= 5 ? explicitScore * 20 : explicitScore, 0, 100));
    return {
      score,
      rating: Math.round((score / 20 + Number.EPSILON) * 10) / 10,
      criteriaCount: criterionValues(input.ratings).length,
      source: "score"
    };
  }

  const criteria = criterionValues(input.ratings);
  if (criteria.length > 0) {
    const average = criteria.reduce((sum, value) => sum + value, 0) / criteria.length;
    return {
      score: Math.round((average + Number.EPSILON) * 20),
      rating: Math.round((average + Number.EPSILON) * 10) / 10,
      criteriaCount: criteria.length,
      source: "criteria"
    };
  }

  const explicitRating = positiveNumber(input.rating);
  if (explicitRating !== null) {
    const rating = clamp(explicitRating, 0, 5);
    return {
      score: Math.round(rating * 20),
      rating: Math.round((rating + Number.EPSILON) * 10) / 10,
      criteriaCount: 0,
      source: "rating"
    };
  }

  return {
    score: null,
    rating: null,
    criteriaCount: 0,
    source: "unrated"
  };
};
