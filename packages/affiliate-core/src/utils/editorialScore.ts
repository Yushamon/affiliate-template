export type EditorialScoreScale = 5 | 10 | 100;

export const toEditorialScore = (
  value: number,
  scale: EditorialScoreScale = 100,
): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized =
    scale === 5 ? value * 20 : scale === 10 ? value * 10 : value;

  return Math.max(0, Math.min(100, Math.round(normalized)));
};

export const getEditorialScoreLabel = (scoreValue: number): string => {
  const score = toEditorialScore(scoreValue);

  if (score >= 90) return "Hervorragend";
  if (score >= 80) return "Sehr gut";
  if (score >= 70) return "Gut";
  if (score >= 60) return "Solide";
  if (score >= 50) return "Mit Einschränkungen";
  return "Nicht empfohlen";
};
