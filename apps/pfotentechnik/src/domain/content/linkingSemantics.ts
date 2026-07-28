export const setOverlap = <T>(left: Iterable<T>, right: Iterable<T>) => {
  const rightSet = right instanceof Set ? right : new Set(right);
  return [...(left instanceof Set ? left : new Set(left))].filter((value) => rightSet.has(value));
};

export const hasThematicProximity = ({
  sharedTopics = [],
  exactTagMatches = 0,
  sharedHubs = 0,
  semanticSimilarity = 0,
  explicit = false
}: {
  sharedTopics?: string[];
  exactTagMatches?: number;
  sharedHubs?: number;
  semanticSimilarity?: number;
  explicit?: boolean;
}) => Boolean(explicit || sharedTopics.length || exactTagMatches || sharedHubs || semanticSimilarity >= 0.18);

export const scoreMultiTopicContext = ({
  sourceTopics = [],
  candidateTopics = [],
  sourceIntents = [],
  candidateIntents = [],
  tokenOverlap = 0
}: {
  sourceTopics?: string[];
  candidateTopics?: string[];
  sourceIntents?: string[];
  candidateIntents?: string[];
  tokenOverlap?: number;
}) => {
  const topicOverlap = setOverlap(sourceTopics, candidateTopics).length;
  const intentOverlap = setOverlap(sourceIntents, candidateIntents).length;
  let score = topicOverlap * 22 + intentOverlap * 5 + Math.min(tokenOverlap, 8);
  if (sourceTopics.length && candidateTopics.length && topicOverlap === 0) score -= 30;
  return { score, topicOverlap, intentOverlap };
};
