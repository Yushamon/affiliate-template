export type ProductRelationship =
  | "identical"
  | "alias"
  | "variant"
  | "successor"
  | "separate"
  | "uncertain";

const STOP_WORDS = new Set([
  "smart",
  "pet",
  "automatic",
  "automatisch",
  "feeder",
  "futterautomat",
  "fountain",
  "trinkbrunnen",
  "gps",
  "tracker",
]);

export const normalizeProductIdentity = (value: string) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("de")
    .replace(/&/g, " und ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokens = (value: string) =>
  normalizeProductIdentity(value)
    .split(/\s+/)
    .filter(Boolean);

const distinctiveTokens = (value: string) =>
  tokens(value).filter((token) => !STOP_WORDS.has(token));

const modelTokens = (values: string[]) =>
  new Set(values.flatMap(tokens).filter((token) => /[a-z]+\d|\d+[a-z]|^\d{2,}$/.test(token)));

const overlap = (left: string[], right: string[]) => {
  const a = new Set(left);
  const b = new Set(right);
  const shared = [...a].filter((token) => b.has(token)).length;
  return shared / Math.max(1, Math.max(a.size, b.size));
};

export const compareProductIdentity = (
  candidate: {
    name: string;
    brand?: string;
    aliases?: string[];
    modelNumbers?: string[];
    variant?: string;
    successorOf?: string;
  },
  existing: {
    name: string;
    brand?: string;
    aliases?: string[];
    modelNumbers?: string[];
    variant?: string;
    slug?: string;
  },
): { relationship: ProductRelationship; confidence: number; rationale: string } => {
  const brandA = normalizeProductIdentity(candidate.brand ?? "");
  const brandB = normalizeProductIdentity(existing.brand ?? "");
  if (brandA && brandB && brandA !== brandB) {
    return { relationship: "separate", confidence: 0.96, rationale: "Abweichende Hersteller- oder Markenidentität." };
  }

  const namesA = [candidate.name, ...(candidate.aliases ?? [])].map(normalizeProductIdentity);
  const namesB = [existing.name, ...(existing.aliases ?? [])].map(normalizeProductIdentity);
  if (namesA.some((name) => namesB.includes(name))) {
    return {
      relationship: normalizeProductIdentity(candidate.name) === normalizeProductIdentity(existing.name) ? "identical" : "alias",
      confidence: 0.98,
      rationale: "Normalisierte Modellbezeichnung oder expliziter Alias stimmt überein.",
    };
  }

  const modelsA = modelTokens(candidate.modelNumbers ?? []);
  const modelsB = modelTokens(existing.modelNumbers ?? []);
  const sharedModels = [...modelsA].filter((model) => modelsB.has(model));
  if (sharedModels.length) {
    const variantsDiffer =
      candidate.variant &&
      existing.variant &&
      normalizeProductIdentity(candidate.variant) !== normalizeProductIdentity(existing.variant);
    return {
      relationship: variantsDiffer ? "variant" : "alias",
      confidence: variantsDiffer ? 0.9 : 0.96,
      rationale: variantsDiffer
        ? `Gemeinsame Modellnummer ${sharedModels[0]}, aber unterschiedliche Varianten.`
        : `Gemeinsame Modellnummer ${sharedModels[0]}.`,
    };
  }

  if (
    candidate.successorOf &&
    [existing.name, existing.slug ?? "", ...(existing.aliases ?? [])]
      .map(normalizeProductIdentity)
      .includes(normalizeProductIdentity(candidate.successorOf))
  ) {
    return { relationship: "successor", confidence: 0.94, rationale: "Der Kandidat bezeichnet das vorhandene Produkt explizit als Vorgänger." };
  }

  const similarity = overlap(distinctiveTokens(candidate.name), distinctiveTokens(existing.name));
  if (similarity >= 0.8) {
    return {
      relationship: candidate.variant || existing.variant ? "variant" : "uncertain",
      confidence: candidate.variant || existing.variant ? 0.82 : 0.66,
      rationale: "Hohe Überschneidung der unterscheidungskräftigen Modellbegriffe; manuelle Variantenprüfung nötig.",
    };
  }
  return {
    relationship: similarity <= 0.25 ? "separate" : "uncertain",
    confidence: similarity <= 0.25 ? 0.82 : 0.52,
    rationale: similarity <= 0.25 ? "Keine relevante Modellüberschneidung erkannt." : "Teilweise Namensüberschneidung ohne eindeutige Modellnummer.",
  };
};
