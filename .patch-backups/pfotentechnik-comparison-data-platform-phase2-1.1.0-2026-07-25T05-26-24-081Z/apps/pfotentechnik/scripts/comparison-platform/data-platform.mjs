export const normalizeKey = (value) =>
  String(value ?? "")
    .toLocaleLowerCase("de-DE")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]/g, "");

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
  bewertung: ["bewertung", "rating"]
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
    case "preisklasse": return filters.priceTier ?? product?.priceCategory;
    case "score": return product?.score ?? (typeof product?.rating === "number" ? Math.round(product.rating * 20) : undefined);
    case "bewertung": return product?.rating;
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
  const candidates = new Set([normalized, normalizeKey(criterion.label), ...(aliases[normalized] ?? [])]);

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
