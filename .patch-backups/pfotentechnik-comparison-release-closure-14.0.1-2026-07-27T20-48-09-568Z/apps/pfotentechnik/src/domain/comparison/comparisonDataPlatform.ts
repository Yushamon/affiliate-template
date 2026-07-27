import type { CollectionEntry } from "astro:content";

type ProductEntry = CollectionEntry<"products">;

type ComparisonItemLike = {
  slug: string;
  recommendation?: string;
  overrides?: Record<string, unknown>;
  values?: Record<string, unknown>;
};

type CriterionLike = {
  key: string;
  label: string;
  source?: string;
  format?: "auto" | "text" | "boolean" | "number" | "list";
  unit?: string;
  fallback?: string;
};

type ResolveInput = {
  product?: ProductEntry;
  item: ComparisonItemLike;
  criterion: CriterionLike;
};

const normalizeKey = (value: unknown) =>
  String(value ?? "")
    .toLocaleLowerCase("de-DE")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]/g, "");

const aliases: Record<string, string[]> = {
  profil: ["profil", "einordnung", "einsatzprofil"],
  futterart: ["futterart", "foodtype", "food"],
  portionierung: ["portionierung", "ausgabemenge", "portion", "portiongrams", "portionml", "maxmealgrams", "maxmealml"],
  mahlzeiten: ["mahlzeiten", "mahlzeitenzahl", "mealcount", "maxportionspermeal"],
  kapazitaet: ["kapazitaet", "volumen", "reservoirliters", "capacity"],
  zugang: ["zugang", "access", "zugangskontrolle", "mikrochip"],
  mehrkatzen: ["mehrkatzen", "mehrtiereignung", "multipet"],
  app: ["app", "appsteuerung", "steuerung", "wifi", "wlan"],
  kamera: ["kamera", "camera", "video"],
  ausfallsicherheit: ["ausfallsicherheit", "notstrom", "strombackup", "backuppower"],
  stromversorgung: ["stromversorgung", "power", "batterie", "akku"],
  reinigung: ["reinigung", "pflege", "cleaning"],
  kuehlung: ["kuehlung", "kuehlprinzip", "cooling", "coolingtype"],
  material: ["material", "werkstoff"],
  lautstaerke: ["lautstaerke", "geraeusch", "noise"],
  filter: ["filter", "filtersystem"],
  besonderheit: ["besonderheit", "wichtigstervorteil"],
  grenze: ["grenze", "einschraenkung", "attention"],
  ortung: ["ortung", "gps", "satellitensysteme"],
  uebertragung: ["uebertragung", "transmission", "mobilfunk", "funksystem"],
  reichweite: ["reichweite", "range", "funkreichweite"],
  abo: ["abo", "subscription", "abonnement", "laufendekosten"],
  akkulaufzeit: ["akkulaufzeit", "batterymaxdays", "akku"],
  gewicht: ["gewicht", "deviceweightgrams", "totalweightgrams"],
  abmessungen: ["abmessungen", "masse", "groesse"],
  wasserschutz: ["wasserschutz", "waterproofrating", "ipschutz"],
  befestigung: ["befestigung", "attachmenttype", "halsband"],
  tier: ["tier", "animal", "geeignetetiere"],
  tiergroesse: ["tiergroesse", "petsize"],
  preisklasse: ["preisklasse", "pricetier", "pricecategory"],
  score: ["score", "editorialscore"],
  bewertung: ["bewertung", "rating"]
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const findRecordValue = (
  record: Record<string, unknown> | undefined,
  candidates: Set<string>
) => {
  if (!record) return undefined;
  return Object.entries(record).find(([key]) =>
    candidates.has(normalizeKey(key))
  )?.[1];
};

const readPath = (value: unknown, source: string): unknown => {
  let current: unknown = value;
  for (const segment of source.split(".").filter(Boolean)) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
};

const flatten = (
  value: unknown,
  result = new Map<string, unknown>(),
  prefix = ""
) => {
  if (value === undefined || value === null) return result;
  if (Array.isArray(value) || typeof value !== "object") {
    if (prefix) {
      result.set(normalizeKey(prefix), value);
      const leaf = prefix.split(".").at(-1);
      if (leaf) result.set(normalizeKey(leaf), value);
    }
    return result;
  }
  Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
    flatten(child, result, prefix ? `${prefix}.${key}` : key);
  });
  return result;
};

// PT_COMPARISON_VALUE_SEMANTICS_1_0_1
const formatSemanticComparisonValue = (
  value: string,
  criterion: CriterionLike
): string => {
  const normalizedCriterion = normalizeKey(criterion.key);
  const trimmed = value.trim();

  if (!trimmed) return trimmed;

  const plainNumber = trimmed.match(/^\d+(?:[.,]\d+)?$/);

  if (plainNumber) {
    const formattedNumber = new Intl.NumberFormat("de-DE", {
      maximumFractionDigits: 2
    }).format(Number(trimmed.replace(",", ".")));

    if (normalizedCriterion === "akkulaufzeit") {
      return `${formattedNumber} Tage`;
    }

    if (normalizedCriterion === "gewicht") {
      return `${formattedNumber} g`;
    }
  }

  if (
    normalizedCriterion === "uebertragung" &&
    /^(lte|4g|5g|vhf|gsm)$/i.test(trimmed)
  ) {
    return trimmed.toLocaleUpperCase("de-DE");
  }

  if (
    normalizedCriterion === "filter" &&
    /^f(?:ü|ue)nfstufig$/i.test(trimmed)
  ) {
    return "5-stufige Wasserfilterung";
  }

  return trimmed;
};

const formatValue = (
  value: unknown,
  criterion: CriterionLike
): string | undefined => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  if (criterion.format === "boolean") {
    return value ? "Ja" : "Nein";
  }

  if (Array.isArray(value)) {
    const list = value
      .filter(
        (item) =>
          item !== undefined &&
          item !== null &&
          item !== ""
      )
      .map(String);

    if (!list.length) return undefined;

    return formatSemanticComparisonValue(
      list.join(", "),
      criterion
    );
  }

  if (typeof value === "boolean") {
    return value ? "Ja" : "Nein";
  }

  if (typeof value === "number") {
    const formatted = new Intl.NumberFormat("de-DE", {
      maximumFractionDigits: 2
    }).format(value);

    const withUnit = criterion.unit
      ? `${formatted} ${criterion.unit}`
      : formatted;

    return formatSemanticComparisonValue(
      withUnit,
      criterion
    );
  }

  const formatted = formatSemanticComparisonValue(
    String(value),
    criterion
  );

  return formatted || undefined;
};

const specValue = (product: ProductEntry, candidates: Set<string>) =>
  product.data.specs.find((spec) =>
    candidates.has(normalizeKey(spec.label))
  )?.value;

const animalLabels = (values: string[]) => values.map((value) =>
  value === "dog" ? "Hund" : value === "cat" ? "Katze" : value
).join(", ");

const sizeLabels = (values: string[]) => values.map((value) =>
  value === "small" ? "Klein" : value === "medium" ? "Mittel" : value === "large" ? "Groß" : value
).join(", ");

const foodLabels = (values: string[]) => values.map((value) =>
  value === "dry" ? "Trockenfutter" : value === "wet" ? "Nassfutter" : value
).join(", ");

const deriveKnownValue = (
  product: ProductEntry,
  item: ComparisonItemLike,
  normalized: string
): unknown => {
  const data = product.data;
  const filters = data.comparisonFilters;
  const gps = data.gps;

  switch (normalized) {
    case "profil": return item.recommendation ?? data.recommendation;
    case "hersteller": return data.manufacturer.name;
    case "futterart": return filters?.foodType?.length ? foodLabels(filters.foodType) : undefined;
    case "tier":
    case "eignung": return filters?.animal?.length
      ? animalLabels(filters.animal)
      : gps?.animal?.length ? animalLabels(gps.animal) : undefined;
    case "tiergroesse": return filters?.petSize?.length ? sizeLabels(filters.petSize) : undefined;
    case "kapazitaet": return data.capacity ?? (filters?.reservoirLiters ? `${filters.reservoirLiters} Liter` : undefined);
    case "app": return typeof filters?.app === "boolean" ? filters.app : undefined;
    case "kamera": return typeof filters?.camera === "boolean" ? filters.camera : undefined;
    case "zugang": return filters?.access === "microchip" ? "Mikrochipgesteuert" : filters?.access === "open" ? "Freier Zugang" : undefined;
    case "ausfallsicherheit":
    case "notstrom": return typeof filters?.backupPower === "boolean"
      ? filters.backupPower ? "Mit Batterie-Backup" : "Ohne Batterie-Backup"
      : undefined;
    case "preisklasse": return filters?.priceTier ?? data.priceCategory;
    case "score": return data.score ?? Math.round(data.rating * 20);
    case "bewertung": return data.rating;
    case "ortung": return gps ? "GPS-Ortung" : undefined;
    case "uebertragung": return gps?.transmission;
    case "abo": return typeof gps?.subscriptionRequired === "boolean"
      ? gps.subscriptionRequired ? "Abo erforderlich" : "Kein Mobilfunkabo erforderlich"
      : undefined;
    case "akkulaufzeit": return gps?.batteryMaxDays ? `Bis zu ${gps.batteryMaxDays} Tage` : undefined;
    case "gewicht": {
      const grams = gps?.deviceWeightGrams ?? gps?.totalWeightGrams;
      return grams ? `${grams} g` : undefined;
    }
    case "wasserschutz": return gps?.waterproofRating;
    case "befestigung": return gps?.attachmentType;
    default: return undefined;
  }
};

export function resolveComparisonValue({
  product,
  item,
  criterion
}: ResolveInput): string {
  const normalized = normalizeKey(criterion.key);
  const candidates = new Set([
    normalized,
    normalizeKey(criterion.label),
    ...(aliases[normalized] ?? [])
  ]);

  for (const record of [item.overrides, item.values]) {
    const value = formatValue(findRecordValue(record, candidates), criterion);
    if (value !== undefined) return value;
  }

  if (!product) return criterion.fallback ?? "–";

  if (criterion.source) {
    const value = formatValue(readPath(product.data, criterion.source), criterion);
    if (value !== undefined) return value;
  }

  const comparisonData = asRecord(product.data.comparisonData);
  const custom = asRecord(comparisonData.custom);
  const customValue = formatValue(findRecordValue(custom, candidates), criterion);
  if (customValue !== undefined) return customValue;

  const flattened = flatten(comparisonData);
  for (const candidate of candidates) {
    const value = formatValue(flattened.get(candidate), criterion);
    if (value !== undefined) return value;
  }

  const known = formatValue(deriveKnownValue(product, item, normalized), criterion);
  if (known !== undefined) return known;

  const spec = formatValue(specValue(product, candidates), criterion);
  if (spec !== undefined) return spec;

  return criterion.fallback ?? "–";
}
