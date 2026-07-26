const LEADING_DECORATION = /^[\s✓✔☑✕✖×•·▪▫►▶→–—-]+/u;

export const cleanTextItem = (value: unknown): string =>
  String(value ?? "")
    .replace(LEADING_DECORATION, "")
    .replace(/\s+/g, " ")
    .trim();

export const textItemKey = (value: unknown): string =>
  cleanTextItem(value)
    .toLocaleLowerCase("de-DE")
    .replaceAll("ß", "ss")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();

export const uniqueTextItems = (
  values: readonly unknown[],
  options: { exclude?: readonly unknown[]; limit?: number } = {}
): string[] => {
  const excluded = new Set((options.exclude ?? []).map(textItemKey).filter(Boolean));
  const seen = new Set<string>();
  const limit = Number.isFinite(options.limit)
    ? Math.max(0, Number(options.limit))
    : Number.POSITIVE_INFINITY;
  const output: string[] = [];

  for (const value of values) {
    const cleaned = cleanTextItem(value);
    const key = textItemKey(cleaned);
    if (!cleaned || !key || excluded.has(key) || seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
    if (output.length >= limit) break;
  }

  return output;
};
