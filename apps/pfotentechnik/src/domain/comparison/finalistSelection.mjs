/**
 * Deterministic finalist selection for comparison experiences.
 *
 * This module intentionally has no Astro/content imports so it can be used by
 * migration tests and by any future comparison renderer. It ranks only the
 * candidates supplied by the comparison dataset; it never invents products
 * and it never hides the remaining technical field.
 */

const asArray = (value) => Array.isArray(value) ? value : [];
const asText = (value) => typeof value === "string" ? value.trim() : "";
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const tokensFrom = (candidate) => {
  const filters = candidate.comparisonFilters ?? {};
  const values = [
    ...Object.entries(filters).flatMap(([key, value]) => {
      const entries = Array.isArray(value) ? value : [value];
      return entries.map((entry) => `${key}:${entry}`);
    }),
    ...asArray(candidate.features),
    ...asArray(candidate.bestFor),
    ...asArray(candidate.failureModes)
  ];
  return new Set(
    values
      .flatMap((value) => String(value ?? "").toLocaleLowerCase("de").split(/[^a-z0-9äöüß]+/u))
      .map((token) => token.replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss"))
      .filter((token) => token.length >= 4)
  );
};

const completenessOf = (candidate) => {
  const checks = [
    asText(candidate.title),
    asText(candidate.href),
    asText(candidate.recommendation),
    asArray(candidate.features).length || asArray(candidate.strengths).length,
    asArray(candidate.bestFor).length || asArray(candidate.failureModes).length,
    Object.keys(candidate.comparisonFilters ?? {}).length,
    asArray(candidate.evidence).length || asText(candidate.testStatus)
  ];
  return checks.filter(Boolean).length / checks.length;
};

const evidenceOf = (candidate) => {
  const status = asText(candidate.testStatus).toLocaleLowerCase("de");
  if (/editorial|hands|verified|geprüft|geprueft/.test(status)) return 3;
  if (/manufacturer|hersteller/.test(status)) return 2;
  if (status) return 1;
  return asArray(candidate.evidence).length > 0 ? 1 : 0;
};

const scoreOf = (candidate) => {
  const rawValue = candidate.score ?? (candidate.rating == null ? 0 : Number(candidate.rating) * 20);
  const raw = Number(rawValue);
  return Number.isFinite(raw) ? clamp(raw, 0, 100) : 0;
};

const stableSort = (left, right) =>
  right.rank - left.rank ||
  right.score - left.score ||
  right.completeness - left.completeness ||
  right.evidence - left.evidence ||
  left.slug.localeCompare(right.slug, "de");

const overlap = (left, right) => {
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
};

const reasonFor = (candidate) =>
  asText(candidate.recommendation) ||
  asArray(candidate.strengths)[0] ||
  asArray(candidate.features)[0] ||
  "Eigenständiger, im Vergleich dokumentierter Schwerpunkt.";

/**
 * @param {{ candidates: Array<Record<string, any>>, limit?: number, alternativeLimit?: number, override?: string[], selectionOverride?: { finalists?: string[], reason?: string } }} input
 */
export function selectComparisonFinalists({
  candidates,
  limit = 2,
  alternativeLimit = 3,
  override = [],
  selectionOverride
}) {
  const unique = new Map();
  for (const candidate of asArray(candidates)) {
    const slug = asText(candidate?.slug);
    if (!slug || unique.has(slug)) continue;
    const status = asText(candidate.productStatus).toLocaleLowerCase("de");
    if (/discontinued|archived|inactive|nicht-verfügbar|nicht-verfuegbar/.test(status)) continue;
    const score = scoreOf(candidate);
    const completeness = completenessOf(candidate);
    const evidence = evidenceOf(candidate);
    const tokens = tokensFrom(candidate);
    unique.set(slug, {
      candidate,
      slug,
      score,
      completeness,
      evidence,
      tokens,
      rank: score * 0.62 + completeness * 18 + evidence * 3
    });
  }

  const ranked = [...unique.values()].sort(stableSort);
  if (!ranked.length) {
    return {
      finalists: [], alternatives: [], technical: [], reasons: {}, selectionReasons: {},
      alternativeReasons: {}, confidence: 0, overrideUsed: false,
      overrideReason: selectionOverride?.reason
    };
  }

  const requestedOverride = selectionOverride?.finalists ?? override;
  const validOverride = asArray(requestedOverride)
    .map((slug) => unique.get(slug))
    .filter(Boolean)
    .slice(0, limit);
  const finalists = validOverride.length === limit
    ? validOverride
    : [ranked[0], ...ranked.slice(1)
      .sort((left, right) => {
        const diversity = overlap(ranked[0].tokens, left.tokens) - overlap(ranked[0].tokens, right.tokens);
        return diversity || stableSort(left, right);
      })
      .sort((left, right) => {
        // Distinct documented capability is deliberately weighted above a
        // small score delta; this is what makes the pair useful for a
        // decision rather than merely a leaderboard slice.
        const leftValue = left.rank + (1 - overlap(ranked[0].tokens, left.tokens)) * 18;
        const rightValue = right.rank + (1 - overlap(ranked[0].tokens, right.tokens)) * 18;
        return rightValue - leftValue || stableSort(left, right);
      })
      .slice(0, Math.max(0, limit - 1))];

  const finalistSlugs = new Set(finalists.map((entry) => entry.slug));
  const finalistTokens = new Set(finalists.flatMap((entry) => [...entry.tokens]));
  const alternatives = ranked
    .filter((entry) => !finalistSlugs.has(entry.slug))
    .map((entry) => ({ entry, distinct: 1 - overlap(finalistTokens, entry.tokens) }))
    .filter(({ entry, distinct }) => entry.completeness >= 0.45 && (entry.score >= 55 || distinct >= 0.35))
    .sort((left, right) => right.distinct - left.distinct || stableSort(left.entry, right.entry))
    .slice(0, alternativeLimit)
    .map(({ entry }) => entry);

  const alternativeSlugs = new Set(alternatives.map((entry) => entry.slug));
  const technical = ranked
    .filter((entry) => !finalistSlugs.has(entry.slug) && !alternativeSlugs.has(entry.slug))
    .map((entry) => entry.candidate);
  const reasons = Object.fromEntries(finalists.map((entry) => [entry.slug, reasonFor(entry.candidate)]));
  const alternativeReasons = Object.fromEntries(alternatives.map((entry) => [entry.slug, reasonFor(entry.candidate)]));
  const confidence = finalists.length
    ? Math.round(finalists.reduce((sum, entry) => sum + (entry.score / 100) * 0.65 + entry.completeness * 0.35, 0) / finalists.length * 100)
    : 0;

  return {
    finalists: finalists.map((entry) => entry.candidate),
    alternatives: alternatives.map((entry) => entry.candidate),
    technical,
    reasons,
    selectionReasons: reasons,
    alternativeReasons,
    confidence,
    overrideUsed: validOverride.length === limit,
    overrideReason: selectionOverride?.reason
  };
}
