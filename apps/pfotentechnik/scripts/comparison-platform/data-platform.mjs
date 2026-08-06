export const normalizeKey = (value) =>
  String(value ?? "")
    .toLocaleLowerCase("de-DE")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]/g, "");

// Spiegel der zentralen Berechnung in src/domain/productScore.ts.
// Der Regressionstest vergleicht beide Implementierungen, damit Skript-Audits
// und gerenderte Vergleichsseiten dieselben Werte verwenden.
const clampScoreValue = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const positiveScoreNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const productCriterionValues = (ratings) =>
  Object.values(ratings ?? {})
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 5);

export const calculateProductScore = (input = {}) => {
  const explicitScore = positiveScoreNumber(input.score);
  if (explicitScore !== null) {
    const score = Math.round(clampScoreValue(explicitScore <= 5 ? explicitScore * 20 : explicitScore, 0, 100));
    return {
      score,
      rating: Math.round((score / 20 + Number.EPSILON) * 10) / 10,
      criteriaCount: productCriterionValues(input.ratings).length,
      source: "score"
    };
  }

  const criteria = productCriterionValues(input.ratings);
  if (criteria.length > 0) {
    const average = criteria.reduce((sum, value) => sum + value, 0) / criteria.length;
    return {
      score: Math.round((average + Number.EPSILON) * 20),
      rating: Math.round((average + Number.EPSILON) * 10) / 10,
      criteriaCount: criteria.length,
      source: "criteria"
    };
  }

  const explicitRating = positiveScoreNumber(input.rating);
  if (explicitRating !== null) {
    const rating = clampScoreValue(explicitRating, 0, 5);
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

const aliases = {
  profil: ["profil", "einordnung", "einsatzprofil"],
  futterart: ["futterart", "foodtype", "food"],
  portionierung: ["portionierung", "ausgabemenge", "portion", "portiongrams", "portionml"],
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
  bewertung: ["bewertung", "rating"],

  mindestportion: ["mindestportion","realemindestportion","portionsgroesse","portionsgrosse","portiongrams","portionml"],
  krokettengroesse: ["krokettengroesse","krokettengrosse","kibblemaxmm"],
  napfergonomie: ["napfergonomie","napf","napfmaterial","schale"],
  standfestigkeit: ["standfestigkeit","stabilitaet","standsicherheit"],
  offlinezeitplan: ["offlinezeitplan","notstrom","stromreserve","backuppower","batterie"],
  stromreserve: ["stromreserve","notstrom","backuppower","batterie"],
  kontrollierbarkeit: ["kontrollierbarkeit","app","kamera","zugang","statusmeldungen"],
  tiertrennung: ["tiertrennung","zugangskontrolle","mikrochip","multipet"],
  zugangskontrolle: ["zugangskontrolle","zugang","mikrochip","access"],
  futterkammern: ["futterkammern","kammern","futterfaecher","mealcount"],
  napfkonzept: ["napfkonzept","napf","schale","napfmaterial"],
  napfundreinigung: ["napfundreinigung","napf","reinigung","cleaning"],
  geraeusch: ["geraeusch","lautstaerke","noise"],
  maximaleausgabe: ["maximaleausgabe","maxmealgrams","maxmealml"],
  geeignetehundegroesse: ["geeignetehundegroesse","hundegroesse","petsize","tiergroesse"],
  zeitplaene: ["zeitplaene","zeitplane","mahlzeiten","mealcount"],
  stoerungsmeldungen: ["stoerungsmeldungen","statusmeldungen","app"],
  vorrat: ["vorrat","kapazitaet","reservoirliters"],
};

const comparisonAliasCandidates = (normalized, label) => {
  const seeds = new Set([normalized, normalizeKey(label)]);
  const result = new Set(seeds);

  for (const [group, values] of Object.entries(aliases)) {
    const normalizedGroup = normalizeKey(group);
    const normalizedValues = values.map(normalizeKey);
    if (
      seeds.has(normalizedGroup) ||
      normalizedValues.some((value) => seeds.has(value))
    ) {
      result.add(normalizedGroup);
      normalizedValues.forEach((value) => result.add(value));
    }
  }

  return result;
};

const asRecord = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const findRecordValue = (record, candidates) => {
  if (!record) return undefined;
  return Object.entries(record).find(([key]) => candidates.has(normalizeKey(key)))?.[1];
};

const readPath = (value, source) => {
  let current = value;
  for (const segment of source.split(".").filter(Boolean)) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    current = current[segment];
  }
  return current;
};

const flatten = (value, result = new Map(), prefix = "") => {
  if (value === undefined || value === null) return result;
  if (Array.isArray(value) || typeof value !== "object") {
    if (prefix) {
      result.set(normalizeKey(prefix), value);
      const leaf = prefix.split(".").at(-1);
      if (leaf) result.set(normalizeKey(leaf), value);
    }
    return result;
  }
  for (const [key, child] of Object.entries(value)) {
    flatten(child, result, prefix ? `${prefix}.${key}` : key);
  }
  return result;
};

const formatValue = (value, criterion = {}) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (criterion.format === "boolean") return value ? "Ja" : "Nein";
  if (Array.isArray(value)) return value.filter(Boolean).map(String).join(", ") || undefined;
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (typeof value === "number") {
    const formatted = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(value);
    return criterion.unit ? `${formatted} ${criterion.unit}` : formatted;
  }
  return String(value).trim() || undefined;
};

const specValue = (product, candidates) =>
  product?.specs?.find((spec) => candidates.has(normalizeKey(spec.label)))?.value;

const mapList = (values, kind) => (values ?? []).map((value) => {
  if (kind === "animal") return value === "dog" ? "Hund" : value === "cat" ? "Katze" : value;
  if (kind === "size") return value === "small" ? "Klein" : value === "medium" ? "Mittel" : value === "large" ? "Groß" : value;
  if (kind === "food") return value === "dry" ? "Trockenfutter" : value === "wet" ? "Nassfutter" : value;
  return value;
}).join(", ");

const knownValue = (product, item, normalized) => {
  const filters = product?.comparisonFilters ?? {};
  const gps = product?.gps;
  switch (normalized) {
    case "profil": return item?.recommendation ?? product?.recommendation;
    case "hersteller": return product?.manufacturer?.name;
    case "futterart": return filters.foodType?.length ? mapList(filters.foodType, "food") : undefined;
    case "tier":
    case "eignung": return filters.animal?.length ? mapList(filters.animal, "animal") : gps?.animal?.length ? mapList(gps.animal, "animal") : undefined;
    case "tiergroesse": return filters.petSize?.length ? mapList(filters.petSize, "size") : undefined;
    case "kapazitaet": return product?.capacity ?? (filters.reservoirLiters ? `${filters.reservoirLiters} Liter` : undefined);
    case "app": return typeof filters.app === "boolean" ? filters.app : undefined;
    case "kamera": return typeof filters.camera === "boolean" ? filters.camera : undefined;
    case "zugang": return filters.access === "microchip" ? "Mikrochipgesteuert" : filters.access === "open" ? "Freier Zugang" : undefined;
    case "ausfallsicherheit":
    case "notstrom": return typeof filters.backupPower === "boolean" ? (filters.backupPower ? "Mit Batterie-Backup" : "Ohne Batterie-Backup") : undefined;
    case "mindestportion":
    case "realemindestportion":
    case "portionsgroesse":
      return filters.portionGrams
        ? `${filters.portionGrams} g je Einheit`
        : filters.portionMl
          ? `${filters.portionMl} ml je Einheit`
          : undefined;
    case "krokettengroesse":
      return filters.kibbleMaxMm ? `Bis ${filters.kibbleMaxMm} mm` : undefined;
    case "maximaleausgabe":
      return filters.maxMealGrams
        ? `Bis ${filters.maxMealGrams} g je Mahlzeit`
        : filters.maxMealMl
          ? `Bis ${filters.maxMealMl} ml je Mahlzeit`
          : undefined;
    case "geeignetehundegroesse":
      return filters.petSize?.length ? mapList(filters.petSize, "size") : undefined;
    case "stromreserve":
    case "offlinezeitplan":
      return typeof filters.backupPower === "boolean"
        ? filters.backupPower
          ? "Zeitplan mit Batterie-Backup"
          : "Keine bestätigte Stromreserve"
        : undefined;
    case "kontrollierbarkeit": {
      const controls = [
        filters.app ? "App" : undefined,
        filters.camera ? "Kamera" : undefined,
        filters.access === "microchip" ? "Mikrochip-Zugang" : undefined
      ].filter(Boolean);
      return controls.length ? controls.join(", ") : undefined;
    }
    case "preisklasse": return filters.priceTier ?? product?.priceCategory;
    case "score": return calculateProductScore(product).score ?? undefined;
    case "bewertung": return calculateProductScore(product).rating ?? undefined;
    case "ortung": return gps ? "GPS-Ortung" : undefined;
    case "uebertragung": return gps?.transmission;
    case "abo": return typeof gps?.subscriptionRequired === "boolean" ? (gps.subscriptionRequired ? "Abo erforderlich" : "Kein Mobilfunkabo erforderlich") : undefined;
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

export function resolveComparisonValue({ product, item = {}, criterion }) {
  const normalized = normalizeKey(criterion.key);
  const candidates = comparisonAliasCandidates(normalized, criterion.label);
  const isScoreCriterion = candidates.has("score") || candidates.has("editorialscore");
  const isRatingCriterion = candidates.has("bewertung") || candidates.has("rating");

  if (product && (isScoreCriterion || isRatingCriterion)) {
    const calculated = calculateProductScore(product);
    const canonicalValue = isScoreCriterion ? calculated.score : calculated.rating;
    const formatted = formatValue(canonicalValue ?? undefined, criterion);
    if (formatted !== undefined) return formatted;
  }

  for (const record of [item.overrides, item.values]) {
    const value = formatValue(findRecordValue(record, candidates), criterion);
    if (value !== undefined) return value;
  }

  if (!product) return criterion.fallback ?? "–";

  if (criterion.source) {
    const value = formatValue(readPath(product, criterion.source), criterion);
    if (value !== undefined) return value;
  }

  const comparisonData = asRecord(product.comparisonData);
  const custom = asRecord(comparisonData.custom);
  const customValue = formatValue(findRecordValue(custom, candidates), criterion);
  if (customValue !== undefined) return customValue;

  const flattened = flatten(comparisonData);
  for (const candidate of candidates) {
    const value = formatValue(flattened.get(candidate), criterion);
    if (value !== undefined) return value;
  }

  const known = formatValue(knownValue(product, item, normalized), criterion);
  if (known !== undefined) return known;

  const spec = formatValue(specValue(product, candidates), criterion);
  if (spec !== undefined) return spec;

  return criterion.fallback ?? "–";
}
